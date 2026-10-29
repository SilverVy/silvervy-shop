import json
import argparse
from pathlib import Path

from PIL import Image, ImageDraw, ImageOps


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "generated-artifacts" / "mv-vton-pilot"
SOURCES = [
    ("front_detail", ROOT / "server/public/Одежда/coat/1_coat.png", "close_front"),
    ("front_full", ROOT / "server/public/Одежда/coat/2_coat.png", "front"),
    ("side_proxy", ROOT / "server/public/Одежда/coat/3_coat.png", "side"),
]
PERSON = ROOT / "attached_assets/generated_images/tryon-test-person.jpg"
MAX_EDGE = 1024
PADDING_RATIO = 0.045


def foreground_bounds(alpha):
    thresholded = alpha.point(lambda value: 255 if value >= 16 else 0)
    bounds = thresholded.getbbox()
    if bounds is None:
        raise ValueError("No visible foreground found in image")
    return thresholded, bounds


def open_rgb(source):
    image = ImageOps.exif_transpose(Image.open(source))
    if image.mode == "P" and "transparency" in image.info:
        image = image.convert("RGBA")
    if "A" in image.getbands():
        background = Image.new("RGBA", image.size, (128, 128, 128, 255))
        image = Image.alpha_composite(background, image)
    return image.convert("RGB")


def prepare_garment(name, source, view):
    image = ImageOps.exif_transpose(Image.open(source))
    if image.mode == "P":
        image = image.convert("RGBA")
    else:
        image = image.convert("RGBA")
    alpha, bounds = foreground_bounds(image.getchannel("A"))
    left, top, right, bottom = bounds
    padding = round(max(right - left, bottom - top) * PADDING_RATIO)
    left = max(0, left - padding)
    top = max(0, top - padding)
    right = min(image.width, right + padding)
    bottom = min(image.height, bottom + padding)
    image = image.crop((left, top, right, bottom))
    alpha = alpha.crop((left, top, right, bottom))
    scale = min(1.0, MAX_EDGE / max(image.size))
    size = (max(1, round(image.width * scale)), max(1, round(image.height * scale)))
    image = image.resize(size, Image.Resampling.LANCZOS)
    alpha = alpha.resize(size, Image.Resampling.LANCZOS)
    image.putalpha(alpha)
    image_path = OUTPUT / f"{name}.png"
    mask_path = OUTPUT / f"{name}-alpha.png"
    composite_path = OUTPUT / f"{name}-neutral.png"
    image.save(image_path)
    alpha.save(mask_path)
    background = Image.new("RGBA", image.size, (128, 128, 128, 255))
    Image.alpha_composite(background, image).convert("RGB").save(composite_path, quality=95)
    return {
        "name": name,
        "view": view,
        "source": str(source.relative_to(ROOT)),
        "size": list(image.size),
        "foreground_bbox": list(bounds),
        "image": str(image_path.relative_to(ROOT)),
        "alpha_mask": str(mask_path.relative_to(ROOT)),
        "neutral_composite": str(composite_path.relative_to(ROOT)),
    }


def segment_inputs():
    import numpy as np
    import torch
    import torch.nn.functional as functional
    from transformers import SegformerForSemanticSegmentation, SegformerImageProcessor

    model_id = "mattmdjaga/segformer_b2_clothes"
    processor = SegformerImageProcessor.from_pretrained(model_id)
    model = SegformerForSemanticSegmentation.from_pretrained(model_id)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model.to(device).eval()
    categories = {
        "garment": {4, 7},
        "person_upper": {4},
    }
    paths = [(name, source, categories["garment"]) for name, source, _ in SOURCES]
    paths.append(("person_upper", PERSON, categories["person_upper"]))
    results = {}
    for name, source, wanted_classes in paths:
        prepared_path = OUTPUT / f"{name}.png"
        image_source = prepared_path if name != "person_upper" else source
        image = open_rgb(image_source)
        batch = processor(images=image, return_tensors="pt").to(device)
        with torch.inference_mode():
            logits = model(**batch).logits
            logits = functional.interpolate(
                logits,
                size=(image.height, image.width),
                mode="bilinear",
                align_corners=False,
            )[0]
            probabilities = logits.softmax(dim=0)
            confidence, labels = probabilities.max(dim=0)
        allowed = torch.zeros_like(labels, dtype=torch.bool)
        for class_id in wanted_classes:
            allowed |= labels == class_id
        mask = (allowed & (confidence >= 0.42)).to(torch.uint8).cpu().numpy() * 255
        mask_image = Image.fromarray(mask, mode="L")
        mask_image.save(OUTPUT / f"{name}-semantic-mask.png")
        tint = Image.new("RGBA", image.size, (91, 217, 172, 0))
        tint.putalpha(mask_image.point(lambda value: value * 112 // 255))
        overlay = Image.alpha_composite(image.convert("RGBA"), tint)
        overlay.convert("RGB").save(OUTPUT / f"{name}-semantic-preview.jpg", quality=92)
        if name == "person_upper":
            agnostic = image.copy()
            agnostic.paste((128, 128, 128), mask=mask_image)
            agnostic.save(OUTPUT / "person-agnostic.png")
        else:
            prepared = Image.open(prepared_path).convert("RGBA")
            semantic_alpha = mask_image.resize(prepared.size, Image.Resampling.NEAREST)
            alpha = Image.fromarray(
                (
                    np.array(prepared.getchannel("A"), dtype="uint16")
                    * np.array(semantic_alpha, dtype="uint16")
                    // 255
                ).astype(np.uint8),
                mode="L",
            )
            prepared.putalpha(alpha)
            prepared.save(OUTPUT / f"{name}-garment-only.png")
        results[name] = {
            "source": str(source.relative_to(ROOT)),
            "mask": str((OUTPUT / f"{name}-semantic-mask.png").relative_to(ROOT)),
            "preview": str((OUTPUT / f"{name}-semantic-preview.jpg").relative_to(ROOT)),
            "selected_class_ids": sorted(wanted_classes),
            "confidence_threshold": 0.42,
            "foreground_fraction": round(float(mask.mean()) / 255.0, 4),
            "device": str(device),
        }
    person_mask = Image.open(OUTPUT / "person_upper-semantic-mask.png").convert("L")
    person_mask.save(OUTPUT / "person-inpaint-mask.png")
    (OUTPUT / "segmentation-report.json").write_text(
        json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    return results


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--segment", action="store_true")
    args = parser.parse_args()
    OUTPUT.mkdir(parents=True, exist_ok=True)
    manifest = {
        "model": "MV-VTON",
        "person_image": str(PERSON.relative_to(ROOT)),
        "garment_views": [prepare_garment(*entry) for entry in SOURCES],
        "limitations": [
            "The side view is only a proxy for the model's expected rear view.",
            "The alpha mask separates the photographed model from the background; it is not a coat-only segmentation mask.",
            "Garment-only masks, person parsing, pose maps, and MV-VTON warp intermediates remain required.",
        ],
    }
    person = ImageOps.exif_transpose(Image.open(PERSON)).convert("RGB")
    person.thumbnail((MAX_EDGE, MAX_EDGE), Image.Resampling.LANCZOS)
    person_path = OUTPUT / "person.png"
    person.save(person_path)
    manifest["person_image_prepared"] = str(person_path.relative_to(ROOT))
    (OUTPUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    cards = []
    for item in manifest["garment_views"]:
        image = Image.open(ROOT / item["neutral_composite"]).convert("RGB")
        image.thumbnail((280, 420), Image.Resampling.LANCZOS)
        card = Image.new("RGB", (300, 470), (245, 245, 245))
        card.paste(image, ((300 - image.width) // 2, 24))
        ImageDraw.Draw(card).text((12, 444), f'{item["name"]} · {item["view"]}', fill=(25, 25, 25))
        cards.append(card)
    sheet = Image.new("RGB", (300 * len(cards), 470), (235, 235, 235))
    for index, card in enumerate(cards):
        sheet.paste(card, (300 * index, 0))
    sheet.save(OUTPUT / "garment-view-check.jpg", quality=92)
    print(json.dumps(manifest, ensure_ascii=False, indent=2))
    print(f"Contact sheet: {OUTPUT / 'garment-view-check.jpg'}")
    if args.segment:
        print(json.dumps(segment_inputs(), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
