import re
from detoxify import Detoxify

# Load AI model once
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

        # keyword filter
        for word in blocked_words:
            if word in s_lower:
                flagged_sentences.append(
                    {
                        "sentence": sentence,
                        "reason": f"Blocked word detected: {word}"
                    }
                )
                break

        # AI toxicity detection
        result = model.predict(sentence)

        if result["toxicity"] > 0.6:
            flagged_sentences.append(
                {
                    "sentence": sentence,
                    "reason": "AI toxicity detected"
                }
            )

    if not flagged_sentences:
        return {
            "approved": True
        }

    # If small issue → admin review
    if len(flagged_sentences) <= 2:
        return {
            "approved": False,
            "flagged": True,
            "reason": flagged_sentences
        }

    # If many issues → reject
    return {
        "approved": False,
        "flagged": False,
        "reason": flagged_sentences
    }