"""
Custom CNN Image Classifier — Built from Scratch
Detects: NSFW/Explicit Content, Violence/Gore, Safe
Architecture: Deep CNN with Batch Normalization + Dropout
"""

import torch
import torch.nn as nn
import torch.nn.functional as F


class ConvBlock(nn.Module):
    """Reusable Conv → BN → ReLU → MaxPool block"""
    def __init__(self, in_channels, out_channels, pool=True):
        super().__init__()
        layers = [
            nn.Conv2d(in_channels, out_channels, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_channels, out_channels, kernel_size=3, padding=1, bias=False),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True),
        ]
        if pool:
            layers.append(nn.MaxPool2d(2, 2))
        self.block = nn.Sequential(*layers)

    def forward(self, x):
        return self.block(x)


class ContentClassifier(nn.Module):
    """
    Deep CNN for content moderation.
    Input:  (B, 3, 224, 224)
    Output: (B, num_classes) — raw logits

    Classes:
        0 → safe
        1 → nsfw_explicit
        2 → violence_gore
    """
    def __init__(self, num_classes=3, dropout=0.5):
        super().__init__()

        # ── Feature extractor ──────────────────────────────────────
        # Block 1: 224x224 → 112x112
        self.block1 = ConvBlock(3, 32)

        # Block 2: 112x112 → 56x56
        self.block2 = ConvBlock(32, 64)

        # Block 3: 56x56 → 28x28
        self.block3 = ConvBlock(64, 128)

        # Block 4: 28x28 → 14x14
        self.block4 = ConvBlock(128, 256)

        # Block 5: 14x14 → 7x7
        self.block5 = ConvBlock(256, 512)

        # Attention gate — channel-wise squeeze & excite
        self.se = SqueezeExcitation(512, reduction=16)

        # Global Average Pooling: 7x7 → 1x1
        self.gap = nn.AdaptiveAvgPool2d(1)

        # ── Classifier head ────────────────────────────────────────
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Linear(512, 256),
            nn.ReLU(inplace=True),
            nn.Dropout(dropout),
            nn.Linear(256, 128),
            nn.ReLU(inplace=True),
            nn.Dropout(dropout * 0.6),
            nn.Linear(128, num_classes),
        )

        self._init_weights()

    def _init_weights(self):
        for m in self.modules():
            if isinstance(m, nn.Conv2d):
                nn.init.kaiming_normal_(m.weight, mode="fan_out", nonlinearity="relu")
            elif isinstance(m, nn.BatchNorm2d):
                nn.init.ones_(m.weight)
                if m.bias is not None:
                 nn.init.zeros_(m.bias)
            elif isinstance(m, nn.Linear):
                nn.init.xavier_uniform_(m.weight)
                if m.bias is not None:
                 nn.init.zeros_(m.bias)

    def forward(self, x):
        x = self.block1(x)
        x = self.block2(x)
        x = self.block3(x)
        x = self.block4(x)
        x = self.block5(x)
        x = self.se(x)
        x = self.gap(x)
        return self.classifier(x)

    def predict_proba(self, x):
        """Returns class probabilities (softmax applied)"""
        with torch.no_grad():
            logits = self.forward(x)
            return F.softmax(logits, dim=1)


class SqueezeExcitation(nn.Module):
    """Channel attention — lets the model focus on relevant feature maps"""
    def __init__(self, channels, reduction=16):
        super().__init__()
        self.se = nn.Sequential(
            nn.AdaptiveAvgPool2d(1),
            nn.Flatten(),
            nn.Linear(channels, channels // reduction, bias=False),
            nn.ReLU(inplace=True),
            nn.Linear(channels // reduction, channels, bias=False),
            nn.Sigmoid(),
        )

    def forward(self, x):
        scale = self.se(x).view(x.size(0), x.size(1), 1, 1)
        return x * scale


CLASS_NAMES = ["safe", "nsfw_explicit", "violence_gore"]
CLASS_WEIGHTS = torch.tensor([1.0, 2.5, 2.5])   # up-weight harmful classes


def build_model(num_classes=3, dropout=0.5):
    return ContentClassifier(num_classes=num_classes, dropout=dropout)


if __name__ == "__main__":
    model = build_model()
    dummy = torch.randn(2, 3, 224, 224)
    out = model(dummy)
    print(f"Model output shape : {out.shape}")
    print(f"Trainable params   : {sum(p.numel() for p in model.parameters() if p.requires_grad):,}")