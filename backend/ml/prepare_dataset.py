"""
Dataset Preparation Script — Reliable COCO download
Usage:
    python prepare_dataset.py --download-safe
    python prepare_dataset.py --from-staging
    python prepare_dataset.py --download-safe --from-staging
"""

import os
import shutil
import random
import urllib.request
import urllib.error
import json
import zipfile
import io
from pathlib import Path
from PIL import Image, UnidentifiedImageError

CLASSES        = ["safe", "nsfw_explicit", "violence_gore"]
SPLITS         = {"train": 0.70, "val": 0.15, "test": 0.15}
MIN_IMGS       = 500
SUPPORTED_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}


def create_structure(root: Path):
    for split in SPLITS:
        for cls in CLASSES:
            (root / split / cls).mkdir(parents=True, exist_ok=True)
    for cls in CLASSES:
        (Path("staging") / cls).mkdir(parents=True, exist_ok=True)
    print(f"[OK] Folder structure created at {root}")


def validate_images(folder: Path):
    removed = 0
    for fpath in folder.rglob("*"):
        if fpath.suffix.lower() not in SUPPORTED_EXTS:
            continue
        try:
            with Image.open(fpath) as img:
                img.verify()
            with Image.open(fpath) as img:
                if img.size[0] < 32 or img.size[1] < 32:
                    fpath.unlink(); removed += 1
        except Exception:
            try: fpath.unlink()
            except: pass
            removed += 1
    if removed:
        print(f"  [CLEAN] Removed {removed} corrupt/tiny images")


def split_class_images(source_dir: Path, dest_root: Path, class_name: str, seed=42):
    imgs = [f for f in source_dir.iterdir() if f.suffix.lower() in SUPPORTED_EXTS]
    if not imgs:
        print(f"  [SKIP] No images in {source_dir}")
        return 0
    random.seed(seed)
    random.shuffle(imgs)
    n      = len(imgs)
    n_val  = int(n * SPLITS["val"])
    n_test = int(n * SPLITS["test"])
    splits_map = {
        "train": imgs[n_val + n_test:],
        "val":   imgs[:n_val],
        "test":  imgs[n_val: n_val + n_test],
    }
    for split, files in splits_map.items():
        dest = dest_root / split / class_name
        for f in files:
            shutil.copy2(f, dest / f.name)
    print(f"  [SPLIT] {class_name}: " + " | ".join(f"{s}={len(v)}" for s, v in splits_map.items()))
    return n


def count_images(folder: Path) -> int:
    if not folder.exists():
        return 0
    return sum(1 for f in folder.rglob("*") if f.suffix.lower() in SUPPORTED_EXTS)


def get_real_coco_ids(num_images: int) -> list:
    """
    Downloads official COCO instances_val2017.json from the annotations ZIP
    and extracts real image IDs. Caches to coco_ids.json after first run.
    """
    cache = Path("coco_ids.json")

    if cache.exists():
        print("  [CACHE] Using cached COCO image IDs")
        with open(cache) as f:
            ids = json.load(f)
        print(f"  Found {len(ids)} cached IDs")
        return ids[:num_images]

    ann_zip_url = "http://images.cocodataset.org/annotations/annotations_trainval2017.zip"
    print(f"  Downloading COCO annotations ZIP (~240 MB) to get real image IDs...")
    print(f"  This is a one-time download — IDs will be cached to coco_ids.json")

    try:
        req = urllib.request.Request(ann_zip_url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=180) as response:
            total = int(response.headers.get("Content-Length", 0))
            downloaded_bytes = 0
            chunks = []
            chunk_size = 1024 * 1024

            while True:
                chunk = response.read(chunk_size)
                if not chunk:
                    break
                chunks.append(chunk)
                downloaded_bytes += len(chunk)
                if total:
                    pct = downloaded_bytes / total * 100
                    mb  = downloaded_bytes / 1024 / 1024
                    print(f"\r  {mb:.1f} MB / {total/1024/1024:.1f} MB ({pct:.0f}%)", end="", flush=True)

            print()
            data = b"".join(chunks)

        print("  Extracting instances_val2017.json...")
        with zipfile.ZipFile(io.BytesIO(data)) as zf:
            with zf.open("annotations/instances_val2017.json") as f:
                ann = json.load(f)

        ids = [img["id"] for img in ann["images"]]
        random.shuffle(ids)

        with open(cache, "w") as f:
            json.dump(ids, f)
        print(f"  Cached {len(ids)} real COCO val2017 image IDs -> coco_ids.json")
        return ids[:num_images]

    except Exception as e:
        print(f"\n  [WARN] Annotations ZIP failed: {e}")
        return None


def download_via_unsplash(dest_dir: Path, num_images: int) -> int:
    """
    Fallback: downloads safe images from Unsplash Source (no API key needed).
    Each call returns a random photo from the requested category.
    """
    print(f"\n[FALLBACK] Downloading {num_images} safe images via Unsplash...")
    dest_dir.mkdir(parents=True, exist_ok=True)

    categories = [
        "nature", "landscape", "city", "architecture", "food",
        "technology", "animals", "travel", "mountains", "ocean",
        "forest", "sky", "plants", "buildings", "streets"
    ]

    downloaded = 0
    attempts   = 0

    while downloaded < num_images and attempts < num_images * 4:
        attempts += 1
        cat  = categories[attempts % len(categories)]
        size = random.choice(["640x480", "800x600", "1024x768"])
        # Using picsum.photos as primary — more reliable than Unsplash source
        url  = f"https://picsum.photos/{size.replace('x', '/')}"

        out_path = dest_dir / f"safe_{attempts:05d}.jpg"
        if out_path.exists():
            downloaded += 1
            continue

        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=15) as resp:
                content = resp.read()
                if len(content) > 5000:
                    with open(out_path, "wb") as f:
                        f.write(content)
                    downloaded += 1
        except Exception:
            pass

        if downloaded % 200 == 0 and downloaded > 0:
            print(f"  Downloaded {downloaded}/{num_images}")

    print(f"  [DONE] {downloaded} safe images downloaded")
    return downloaded


def download_coco_safe_images(dest_dir: Path, num_images: int = 2000):
    dest_dir.mkdir(parents=True, exist_ok=True)

    print("[DOWNLOAD] Getting real COCO val2017 image IDs...")
    ids = get_real_coco_ids(num_images)

    if ids is None:
        return download_via_unsplash(dest_dir, num_images)

    print(f"[DOWNLOAD] Downloading {len(ids)} COCO val2017 images...")
    downloaded = 0
    failed     = 0
    skipped    = 0

    for i, img_id in enumerate(ids):
        filename = f"{str(img_id).zfill(12)}.jpg"
        out_path = dest_dir / filename

        if out_path.exists():
            skipped += 1
            downloaded += 1
            continue

        url = f"http://images.cocodataset.org/val2017/{filename}"
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=20) as resp:
                content = resp.read()
                if len(content) > 1000:
                    with open(out_path, "wb") as f:
                        f.write(content)
                    downloaded += 1
                else:
                    failed += 1
        except Exception:
            failed += 1

        if (i + 1) % 100 == 0:
            pct = (i + 1) / len(ids) * 100
            print(f"  [{pct:5.1f}%] ok={downloaded}  fail={failed}  done={i+1}/{len(ids)}")

    print(f"\n[DOWNLOAD] COCO done: {downloaded} saved | {failed} failed | {skipped} skipped")

    # Supplement with picsum if COCO gave too few
    if downloaded < num_images * 0.5:
        still_need = num_images - downloaded
        print(f"[SUPPLEMENT] Only got {downloaded}. Adding {still_need} more via picsum.photos...")
        download_via_unsplash(dest_dir, still_need)

    return downloaded


def print_nsfw_violence_instructions():
    print("""
==============================================================
  NEXT: Add NSFW + Violence images to staging folders
==============================================================

  staging\\nsfw_explicit\\    <- 1000+ explicit images
    Best sources:
    * NudeNet test set:
        https://github.com/notAI-tech/NudeNet
    * Open Images V7 (nudity subset):
        pip install openimages
        oidv6 downloader --classes Nudity --type_csv validation

  staging\\violence_gore\\    <- 1000+ violent images
    Best sources:
    * Extract frames from action/horror movies:
        ffmpeg -i movie.mp4 -vf "fps=0.5" staging/violence_gore/frame_%04d.jpg
    * VSD dataset:
        https://www.interdigital.com/data_sets/violent-scenes-dataset

After adding images run:
    python prepare_dataset.py --from-staging
==============================================================
""")


def main():
    import argparse
    p = argparse.ArgumentParser()
    p.add_argument("--output",        type=str, default="./dataset")
    p.add_argument("--download-safe", action="store_true")
    p.add_argument("--from-staging",  action="store_true")
    p.add_argument("--num-safe",      type=int, default=2000)
    args = p.parse_args()

    root    = Path(args.output)
    staging = Path("./staging")
    create_structure(root)

    if args.download_safe:
        safe_staging = staging / "safe"
        existing = count_images(safe_staging)
        if existing >= args.num_safe:
            print(f"[SKIP] Already have {existing} safe images in staging/safe/")
        else:
            need = args.num_safe - existing
            print(f"[INFO] Need {need} more safe images (have {existing})")
            download_coco_safe_images(safe_staging, num_images=args.num_safe)

    if args.from_staging:
        print("\n[SPLIT] Processing staging folders...")
        any_missing = False
        for cls in CLASSES:
            src   = staging / cls
            count = count_images(src)
            print(f"  {cls}: {count} images")
            if count == 0:
                any_missing = True
                continue
            if count < MIN_IMGS:
                print(f"  [WARN] Only {count} for '{cls}' (recommend {MIN_IMGS}+)")
            validate_images(src)
            split_class_images(src, root, cls)

        if not any_missing:
            print(f"\n[DONE] Dataset ready at {root}")
            print(f"  Run: python train.py --dataset {root} --epochs 50 --batch 32")
        else:
            print_nsfw_violence_instructions()

    if not args.download_safe and not args.from_staging:
        print("\n[STATUS] Staging folder counts:")
        for cls in CLASSES:
            count  = count_images(staging / cls)
            status = "OK" if count >= MIN_IMGS else f"need {MIN_IMGS - count} more"
            print(f"  {cls:<20}: {count:>5}  [{status}]")
        print("\nCommands:")
        print("  python prepare_dataset.py --download-safe")
        print("  python prepare_dataset.py --from-staging")
        print_nsfw_violence_instructions()


if __name__ == "__main__":
    main()