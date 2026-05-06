"""
Dataset & DataLoader
Expected folder structure:
    dataset/
        train/
            safe/          ← safe images
            nsfw_explicit/ ← explicit/adult images
            violence_gore/ ← violent/gory images
        val/
            safe/
            nsfw_explicit/
            violence_gore/
        test/
            safe/
            nsfw_explicit/
            violence_gore/
"""

import os
from pathlib import Path

import torch
from torch.utils.data import Dataset, DataLoader, WeightedRandomSampler
from torchvision import transforms
from PIL import Image, UnidentifiedImageError


# ── Transforms ────────────────────────────────────────────────────────────────

IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD  = [0.229, 0.224, 0.225]

train_transform = transforms.Compose([
    transforms.Resize((256, 256)),
    transforms.RandomCrop(224),
    transforms.RandomHorizontalFlip(p=0.5),
    transforms.RandomVerticalFlip(p=0.1),
    transforms.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.2, hue=0.05),
    transforms.RandomRotation(15),
    transforms.RandomGrayscale(p=0.05),
    transforms.RandomPerspective(distortion_scale=0.2, p=0.3),
    transforms.ToTensor(),
    transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD),
    transforms.RandomErasing(p=0.2, scale=(0.02, 0.15)),
])

val_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(IMAGENET_MEAN, IMAGENET_STD),
])


# ── Dataset ────────────────────────────────────────────────────────────────────

SUPPORTED_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".gif"}

CLASS_TO_IDX = {
    "safe":           0,
    "nsfw_explicit":  1,
    "violence_gore":  2,
}


class ContentDataset(Dataset):
    def __init__(self, root_dir: str, split: str = "train", transform=None):
        """
        Args:
            root_dir : path to dataset/ folder
            split    : 'train' | 'val' | 'test'
            transform: torchvision transform pipeline
        """
        self.root = Path(root_dir) / split
        self.transform = transform or (train_transform if split == "train" else val_transform)
        self.samples = []   # list of (path, label_idx)
        self.class_counts = {cls: 0 for cls in CLASS_TO_IDX}

        for class_name, idx in CLASS_TO_IDX.items():
            class_dir = self.root / class_name
            if not class_dir.exists():
                print(f"[WARN] Missing class folder: {class_dir}")
                continue
            for fpath in class_dir.iterdir():
                if fpath.suffix.lower() in SUPPORTED_EXTS:
                    self.samples.append((str(fpath), idx))
                    self.class_counts[class_name] += 1

        if not self.samples:
            raise RuntimeError(f"No images found in {self.root}. Check folder structure.")

        print(f"[{split.upper()}] Loaded {len(self.samples)} images — "
              + " | ".join(f"{k}: {v}" for k, v in self.class_counts.items()))

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        path, label = self.samples[idx]
        try:
            img = Image.open(path).convert("RGB")
        except (UnidentifiedImageError, OSError):
            # Corrupted image: return a black placeholder
            img = Image.new("RGB", (224, 224), (0, 0, 0))
        return self.transform(img), label

    def get_sampler(self):
        """WeightedRandomSampler to handle class imbalance during training"""
        counts = list(self.class_counts.values())
        total = sum(counts)
        class_weights = [total / (len(counts) * max(c, 1)) for c in counts]
        sample_weights = [class_weights[label] for _, label in self.samples]
        return WeightedRandomSampler(
            weights=sample_weights,
            num_samples=len(sample_weights),
            replacement=True,
        )


# ── DataLoader factory ────────────────────────────────────────────────────────

def get_dataloaders(dataset_dir: str, batch_size: int = 32, num_workers: int = 4):
    train_ds = ContentDataset(dataset_dir, "train")
    val_ds   = ContentDataset(dataset_dir, "val",  transform=val_transform)
    test_ds  = ContentDataset(dataset_dir, "test", transform=val_transform)

    train_loader = DataLoader(
        train_ds,
        batch_size=batch_size,
        sampler=train_ds.get_sampler(),   # balanced sampling
        num_workers=num_workers,
        pin_memory=True,
        persistent_workers=num_workers > 0,
    )
    val_loader = DataLoader(
        val_ds,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=True,
    )
    test_loader = DataLoader(
        test_ds,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=True,
    )
    return train_loader, val_loader, test_loader