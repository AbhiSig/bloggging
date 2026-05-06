import io
import re
import sys
import logging
from pathlib import Path

import torch
import torchvision.transforms as transforms
from PIL import Image
from detoxify import Detoxify

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────
# TEXT MODERATION
# ─────────────────────────────────────────────────────────────

model = Detoxify("original")


def load_blocked_words():
    with open("spam.txt", "r", encoding="utf-8") as f:
        return [line.strip().lower() for line in f if line.strip()]


blocked_words = load_blocked_words()


def split_sentences(text):
    sentences = re.split(r"[.!?]", text)
    return [s.strip() for s in sentences if s.strip()]


def moderate_content(text: str):
    sentences = split_sentences(text)
    flagged_sentences = []

    for sentence in sentences:
        s_lower = sentence.lower()
        reason = None

        # Check blocked words first
        for word in blocked_words:
            if word in s_lower:
                reason = f"Blocked word detected: {word}"
                break

        # Check AI toxicity
        result = model.predict(sentence)
        if result["toxicity"] > 0.6:
            # ✅ FIX: only add toxicity reason if blocked-word didn't already flag
            # this sentence — avoids double-counting the same sentence
            if reason is None:
                reason = "AI toxicity detected"

        if reason:
            flagged_sentences.append({"sentence": sentence, "reason": reason})

    if not flagged_sentences:
        return {"approved": True}

    # 1-2 bad sentences → PENDING (admin review)
    # 3+  bad sentences → REJECTED outright
    if len(flagged_sentences) <= 2:
        return {"approved": False, "flagged": True, "reason": flagged_sentences}

    return {"approved": False, "flagged": False, "reason": flagged_sentences}


# ─────────────────────────────────────────────────────────────
# IMAGE MODERATION
# ─────────────────────────────────────────────────────────────

MODEL_PATH = Path(__file__).resolve().parents[2] / "ml" / "output" / "best_model.pt"
ML_DIR     = Path(__file__).resolve().parents[2] / "ml"

CONFIDENCE_THRESHOLD = 0.60


class _ImageModerator:

    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.net, self.class_names = self._load()
        self.transform = transforms.Compose(
            [
                transforms.Resize((224, 224)),
                transforms.ToTensor(),
                transforms.Normalize(
                    mean=[0.485, 0.456, 0.406],
                    std=[0.229, 0.224, 0.225],
                ),
            ]
        )
        logger.info(
            "ImageModerator ready | device=%s | classes=%s",
            self.device,
            self.class_names,
        )

    def _load(self):
        if not MODEL_PATH.exists():
            raise FileNotFoundError(
                f"Model weights not found at {MODEL_PATH}. "
                "Run  python ml/train.py  first."
            )

        ml_dir_str = str(ML_DIR)
        if ml_dir_str not in sys.path:
            sys.path.insert(0, ml_dir_str)

        from model import build_model, CLASS_NAMES

        checkpoint  = torch.load(MODEL_PATH, map_location=self.device)
        state_dict  = checkpoint["model"]
        class_names = checkpoint.get("classes", CLASS_NAMES)

        net = build_model(num_classes=len(class_names), dropout=0.5).to(self.device)
        net.load_state_dict(state_dict)
        net.eval()

        return net, class_names

    def classify(self, image_bytes: bytes) -> dict:
        try:
            img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        except Exception as exc:
            logger.warning("Image decode failed during moderation: %s", exc)
            return {"safe": True, "label": "safe", "confidence": 1.0, "scores": {}}

        tensor = self.transform(img).unsqueeze(0).to(self.device)

        with torch.no_grad():
            probs = torch.softmax(self.net(tensor), dim=1).squeeze().cpu().tolist()

        scores     = dict(zip(self.class_names, probs))
        top_label  = max(scores, key=scores.__getitem__)
        confidence = scores[top_label]

        # ✅ Image is safe if:
        #    - model's top prediction IS "safe", OR
        #    - model isn't confident enough (below threshold) to call it unsafe
        is_safe = (top_label == "safe") or (confidence < CONFIDENCE_THRESHOLD)

        return {
            "safe":       is_safe,
            "label":      top_label,
            "confidence": round(confidence, 4),
            "scores":     {k: round(v, 4) for k, v in scores.items()},
        }


_image_moderator: _ImageModerator | None = None


def moderate_image(image_bytes: bytes) -> dict:
    global _image_moderator
    if _image_moderator is None:
        _image_moderator = _ImageModerator()
    return _image_moderator.classify(image_bytes)