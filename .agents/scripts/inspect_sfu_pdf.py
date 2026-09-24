from pathlib import Path
import fitz
from PIL import Image, ImageOps, ImageDraw

source = Path("attached_assets/sfu-stu-7.5-07_1790249061202.pdf")
out = Path(".agents/outputs/sfu-stu-7.5-07")
pages_dir = out / "pages"
pages_dir.mkdir(parents=True, exist_ok=True)

doc = fitz.open(source)
text_path = out / "full_text.txt"
sheet_pages = []
with text_path.open("w", encoding="utf-8") as text_file:
    text_file.write(f"PAGE COUNT: {doc.page_count}\n")
    for index, page in enumerate(doc):
        text = page.get_text("text")
        text_file.write(f"\n{'=' * 24} PAGE {index + 1} {'=' * 24}\n{text}\n")
        pix = page.get_pixmap(matrix=fitz.Matrix(1.25, 1.25), alpha=False)
        img_path = pages_dir / f"page-{index + 1:03}.png"
        pix.save(img_path)
        image = Image.open(img_path).convert("RGB")
        image.thumbnail((420, 594))
        canvas = Image.new("RGB", (440, 630), "white")
        canvas.paste(image, ((440 - image.width) // 2, 24))
        draw = ImageDraw.Draw(canvas)
        draw.text((12, 5), f"Page {index + 1}", fill="black")
        sheet_pages.append(canvas)

for start in range(0, len(sheet_pages), 4):
    tiles = sheet_pages[start:start + 4]
    sheet = Image.new("RGB", (880, 1260), "#dddddd")
    for offset, tile in enumerate(tiles):
        x = (offset % 2) * 440
        y = (offset // 2) * 630
        sheet.paste(tile, (x, y))
    sheet.save(out / f"contact-{start + 1:03}-{start + len(tiles):03}.jpg", quality=88)

print(f"Pages: {doc.page_count}")
print(f"Text: {text_path} ({text_path.stat().st_size} bytes)")
print(f"Rendered pages: {len(sheet_pages)}")
for index, page in enumerate(doc):
    print(f"{index + 1:02}: {len(page.get_text('text'))} chars")