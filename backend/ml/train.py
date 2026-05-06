"""
Training Script
Run:  python train.py --dataset ./dataset --epochs 50 --batch 32
"""

import argparse
import json
import time
from pathlib import Path

import torch
import torch.nn as nn
from torch.optim import AdamW
from torch.optim.lr_scheduler import OneCycleLR
from torch.amp import GradScaler, autocast

from model import build_model, CLASS_NAMES, CLASS_WEIGHTS
from dataset import get_dataloaders
from evaluate import compute_metrics


# ── Argument parser ───────────────────────────────────────────────────────────

def parse_args():
    p = argparse.ArgumentParser(description="Train content moderation classifier")
    p.add_argument("--dataset",    type=str,   default="./dataset",  help="Path to dataset root")
    p.add_argument("--output",     type=str,   default="./output",   help="Where to save checkpoints")
    p.add_argument("--epochs",     type=int,   default=50)
    p.add_argument("--batch",      type=int,   default=32)
    p.add_argument("--lr",         type=float, default=3e-4)
    p.add_argument("--workers",    type=int,   default=0)
    p.add_argument("--dropout",    type=float, default=0.5)
    p.add_argument("--patience",   type=int,   default=10,           help="Early stopping patience")
    p.add_argument("--resume",     type=str,   default=None,         help="Path to checkpoint to resume from")
    return p.parse_args()


# ── Training utilities ────────────────────────────────────────────────────────

class EarlyStopping:
    def __init__(self, patience=10, min_delta=0.001):
        self.patience    = patience
        self.min_delta   = min_delta
        self.best_loss   = float("inf")
        self.counter     = 0
        self.should_stop = False

    def step(self, val_loss):
        if val_loss < self.best_loss - self.min_delta:
            self.best_loss = val_loss
            self.counter   = 0
        else:
            self.counter += 1
            if self.counter >= self.patience:
                self.should_stop = True
        return self.should_stop


def get_autocast_ctx(device):
    """Return the right context manager for mixed precision."""
    if device.type == "cuda":
        return autocast("cuda")
    return torch.no_grad()


def train_one_epoch(model, loader, criterion, optimizer, scaler, scheduler, device):
    model.train()
    total_loss, correct, total = 0.0, 0, 0

    for imgs, labels in loader:
        imgs, labels = imgs.to(device), labels.to(device)
        optimizer.zero_grad(set_to_none=True)

        if scaler is not None:
            # GPU path: mixed-precision forward
            with autocast("cuda"):
                logits = model(imgs)
                loss   = criterion(logits, labels)
            scaler.scale(loss).backward()
            scaler.unscale_(optimizer)
            nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            scaler.step(optimizer)
            scaler.update()
        else:
            # CPU path: standard forward
            logits = model(imgs)
            loss   = criterion(logits, labels)
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            optimizer.step()

        scheduler.step()

        total_loss += loss.item() * imgs.size(0)
        preds       = logits.argmax(dim=1)
        correct    += (preds == labels).sum().item()
        total      += imgs.size(0)

    return total_loss / total, correct / total


@torch.no_grad()
def validate(model, loader, criterion, device):
    model.eval()
    total_loss, correct, total = 0.0, 0, 0

    for imgs, labels in loader:
        imgs, labels = imgs.to(device), labels.to(device)

        if device.type == "cuda":
            with autocast("cuda"):
                logits = model(imgs)
                loss   = criterion(logits, labels)
        else:
            logits = model(imgs)
            loss   = criterion(logits, labels)

        total_loss += loss.item() * imgs.size(0)
        preds       = logits.argmax(dim=1)
        correct    += (preds == labels).sum().item()
        total      += imgs.size(0)

    return total_loss / total, correct / total


# ── Main training loop ────────────────────────────────────────────────────────

def main():
    args   = parse_args()
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")

    out_dir = Path(args.output)
    out_dir.mkdir(parents=True, exist_ok=True)

    # Data
    train_loader, val_loader, test_loader = get_dataloaders(
        args.dataset,
        batch_size=args.batch,
        num_workers=args.workers,
    )

    # Model
    model = build_model(num_classes=3, dropout=args.dropout).to(device)
    print(f"Params: {sum(p.numel() for p in model.parameters() if p.requires_grad):,}")

    # Loss — weighted CrossEntropy to penalise harmful class misses more
    weights   = CLASS_WEIGHTS.to(device)
    criterion = nn.CrossEntropyLoss(weight=weights, label_smoothing=0.1)

    # Optimiser + scheduler (1-cycle for fast convergence)
    optimizer = AdamW(model.parameters(), lr=args.lr, weight_decay=1e-4)
    scheduler = OneCycleLR(
        optimizer,
        max_lr=args.lr,
        steps_per_epoch=len(train_loader),
        epochs=args.epochs,
        pct_start=0.1,
        anneal_strategy="cos",
    )

    # Scaler only makes sense on GPU
    scaler = GradScaler("cuda") if device.type == "cuda" else None

    # Resume from checkpoint
    start_epoch = 0
    if args.resume:
        ckpt = torch.load(args.resume, map_location=device)
        model.load_state_dict(ckpt["model"])
        optimizer.load_state_dict(ckpt["optimizer"])
        start_epoch = ckpt["epoch"] + 1
        print(f"Resumed from epoch {start_epoch}")

    early_stop   = EarlyStopping(patience=args.patience)
    history      = {"train_loss": [], "train_acc": [], "val_loss": [], "val_acc": []}
    best_val_acc = 0.0

    print(f"\n{'Epoch':>6}  {'Train Loss':>10}  {'Train Acc':>10}  "
          f"{'Val Loss':>10}  {'Val Acc':>10}  {'Time':>6}")
    print("─" * 65)

    for epoch in range(start_epoch, args.epochs):
        t0 = time.time()

        train_loss, train_acc = train_one_epoch(
            model, train_loader, criterion, optimizer, scaler, scheduler, device
        )
        val_loss, val_acc = validate(model, val_loader, criterion, device)

        history["train_loss"].append(train_loss)
        history["train_acc"].append(train_acc)
        history["val_loss"].append(val_loss)
        history["val_acc"].append(val_acc)

        elapsed = time.time() - t0
        print(f"{epoch+1:>6}  {train_loss:>10.4f}  {train_acc:>9.2%}  "
              f"{val_loss:>10.4f}  {val_acc:>9.2%}  {elapsed:>5.1f}s")

        # Save best model
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save({
                "epoch":     epoch,
                "model":     model.state_dict(),
                "optimizer": optimizer.state_dict(),
                "val_acc":   val_acc,
                "classes":   CLASS_NAMES,
            }, out_dir / "best_model.pt")
            print(f"         -> Saved best model (val_acc={val_acc:.2%})")

        # Save periodic checkpoint every 10 epochs
        if (epoch + 1) % 10 == 0:
            torch.save({
                "epoch": epoch,
                "model": model.state_dict(),
            }, out_dir / f"checkpoint_epoch{epoch+1}.pt")

        if early_stop.step(val_loss):
            print(f"\nEarly stopping at epoch {epoch+1}")
            break

    # Save training history
    with open(out_dir / "history.json", "w") as f:
        json.dump(history, f, indent=2)

    # Final evaluation on test set
    print("\n── Test set evaluation ──────────────────────────────")
    best_ckpt = torch.load(out_dir / "best_model.pt", map_location=device)
    model.load_state_dict(best_ckpt["model"])
    compute_metrics(model, test_loader, device, CLASS_NAMES)

    print(f"\nBest val accuracy : {best_val_acc:.2%}")
    print(f"Checkpoints saved : {out_dir}")


if __name__ == "__main__":
    main()