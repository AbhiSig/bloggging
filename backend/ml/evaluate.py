"""
Evaluation utilities — confusion matrix, per-class metrics, ROC-AUC
"""

import numpy as np
import torch
import torch.nn.functional as F
from torch.cuda.amp import autocast


def compute_metrics(model, loader, device, class_names):
    """
    Runs inference on loader, prints:
      - Accuracy
      - Per-class Precision / Recall / F1
      - Confusion matrix
    """
    model.eval()
    all_preds, all_labels, all_probs = [], [], []

    with torch.no_grad():
        for imgs, labels in loader:
            imgs = imgs.to(device)
            with autocast():
                logits = model(imgs)
            probs  = F.softmax(logits, dim=1).cpu().numpy()
            preds  = logits.argmax(dim=1).cpu().numpy()
            all_preds.extend(preds)
            all_labels.extend(labels.numpy())
            all_probs.extend(probs)

    all_preds  = np.array(all_preds)
    all_labels = np.array(all_labels)
    all_probs  = np.array(all_probs)
    num_classes = len(class_names)

    # ── Accuracy ──────────────────────────────────────────────────
    accuracy = (all_preds == all_labels).mean()
    print(f"\nOverall Accuracy: {accuracy:.2%}\n")

    # ── Per-class metrics ─────────────────────────────────────────
    print(f"{'Class':<20} {'Precision':>10} {'Recall':>10} {'F1':>10} {'Support':>10}")
    print("─" * 62)

    for i, cls in enumerate(class_names):
        tp = ((all_preds == i) & (all_labels == i)).sum()
        fp = ((all_preds == i) & (all_labels != i)).sum()
        fn = ((all_preds != i) & (all_labels == i)).sum()

        precision = tp / (tp + fp + 1e-9)
        recall    = tp / (tp + fn + 1e-9)
        f1        = 2 * precision * recall / (precision + recall + 1e-9)
        support   = (all_labels == i).sum()

        print(f"{cls:<20} {precision:>10.3f} {recall:>10.3f} {f1:>10.3f} {support:>10}")

    # ── Confusion matrix ──────────────────────────────────────────
    print(f"\nConfusion Matrix (rows=actual, cols=predicted):")
    print(f"{'':>20} " + "  ".join(f"{c[:8]:>8}" for c in class_names))
    cm = np.zeros((num_classes, num_classes), dtype=int)
    for true, pred in zip(all_labels, all_preds):
        cm[true][pred] += 1
    for i, cls in enumerate(class_names):
        row = "  ".join(f"{cm[i][j]:>8}" for j in range(num_classes))
        print(f"{cls:<20} {row}")

    return {
        "accuracy": float(accuracy),
        "confusion_matrix": cm.tolist(),
        "predictions": all_preds.tolist(),
        "labels": all_labels.tolist(),
        "probabilities": all_probs.tolist(),
    }


def find_optimal_threshold(probs, labels, class_idx, steps=50):
    """
    Find the confidence threshold that maximises F1 for a given class.
    Use this to tune the moderation_service threshold.
    """
    best_thresh, best_f1 = 0.5, 0.0
    for thresh in np.linspace(0.1, 0.95, steps):
        preds = (probs[:, class_idx] >= thresh).astype(int)
        true  = (labels == class_idx).astype(int)
        tp = ((preds == 1) & (true == 1)).sum()
        fp = ((preds == 1) & (true == 0)).sum()
        fn = ((preds == 0) & (true == 1)).sum()
        p  = tp / (tp + fp + 1e-9)
        r  = tp / (tp + fn + 1e-9)
        f1 = 2 * p * r / (p + r + 1e-9)
        if f1 > best_f1:
            best_f1, best_thresh = f1, thresh
    print(f"Class '{class_idx}' optimal threshold: {best_thresh:.2f} (F1={best_f1:.3f})")
    return best_thresh