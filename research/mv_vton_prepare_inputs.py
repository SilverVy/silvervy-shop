import json
import argparse
import os
from pathlib import Path

from PIL import Image, ImageDraw, ImageOps


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "generated-artifacts" / "mv-vton-pilot"
SOURCES = [
    ("coat", ROOT / "server/public/Одежда/coat/2_coat.png", "front"),
    ("bomber", ROOT / "server/public/Одежда/bomber/1_bomber.png", "front"),
    ("trench", ROOT / "server/public/Одежда/trench/1_trench.png", "front"),
    ("shirt", ROOT / "server/public/Одежда/shirt/1_shirt.png", "front"),
    ("linen_shirt", ROOT / "server/public/Одежда/linen_shirt/1_linen_shirt.png", "front"),
    ("jean_coat", ROOT / "server/public/Одежда/jean_coat/1_jean_coat.png", "front"),
]
WEB_MASKS = {
    "coat": "server/public/Одежда/coat/2_coat-mask.png",
    "bomber": "server/public/Одежда/bomber/1_bomber-mask.png",
    "trench": "server/public/Одежда/trench/1_trench-mask.png",
    "shirt": "server/public/Одежда/shirt/1_shirt-mask.png",
    "linen_shirt": "server/public/Одежда/linen_shirt/1_linen_shirt-mask.png",
    "jean_coat": "server/public/Одежда/jean_coat/1_jean_coat-mask.png",
}
PERSON = ROOT / "attached_assets/generated_images/tryon-test-person.jpg"
MAX_EDGE = 1024
PADDING_RATIO = 0.045
COAT_UNDERLAYER_EXCLUSIONS = [
    [(402, 278), (438, 274), (447, 310), (429, 342), (426, 384), (430, 428), (440, 466), (457, 500), (486, 527), (514, 551), (527, 588), (506, 617), (475, 633), (438, 639), (412, 620), (400, 587), (395, 551), (394, 514), (393, 477), (393, 440), (392, 403), (395, 365), (400, 331)],
    [(267, 671), (306, 671), (310, 701), (293, 712), (271, 703)],
]


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

def remove_coat_underlayers(mask):
    draw = ImageDraw.Draw(mask)
    scale_x = mask.width / 512
    scale_y = mask.height / 768
    for polygon in COAT_UNDERLAYER_EXCLUSIONS:
        points = [(round(x * scale_x), round(y * scale_y)) for x, y in polygon]
        draw.polygon(points, fill=0)
    return mask


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
    os.environ["USE_TF"] = "0"
    os.environ["USE_FLAX"] = "0"
    import numpy as np
    if not hasattr(np, "stringType"):
        np.stringType = np.bytes_
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
        image_source = source
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
        if name == "coat":
            mask_image = remove_coat_underlayers(mask_image)
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
            prepared = ImageOps.exif_transpose(Image.open(source)).convert("RGBA")
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
            garment_only_path = OUTPUT / f"{name}-garment-only.png"
            prepared.save(garment_only_path)
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
    parser.add_argument("--install-web-mask", action="append", choices=WEB_MASKS, default=[])
    args = parser.parse_args()
    OUTPUT.mkdir(parents=True, exist_ok=True)
    manifest = {
        "model": "SegFormer clothing parser",
        "person_image": str(PERSON.relative_to(ROOT)),
        "garment_views": [prepare_garment(*entry) for entry in SOURCES],
        "limitations": [
            "Semantic masks can include visible underlayers and must be visually reviewed before installation.",
            "Only the coat reference has manually defined cardigan and cuff exclusion polygons.",
            "A garment mask enables reference-image scaling but does not provide true physical size conditioning.",
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
    for name in args.install_web_mask:
        mask_path = OUTPUT / f"{name}-semantic-mask.png"
        if not mask_path.exists():
            parser.error(f"Generate and visually review {mask_path.relative_to(ROOT)} first")
        web_mask = ROOT / WEB_MASKS[name]
        web_mask.parent.mkdir(parents=True, exist_ok=True)
        Image.open(mask_path).convert("L").save(web_mask)
        print(f"Installed reviewed mask: {web_mask.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
