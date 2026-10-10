"""Render the runtime tray states from the user's DailyMirror artwork."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageOps

root = Path(__file__).resolve().parent.parent
source = Image.open(root / "build/dailymirror-tray-icon.png").convert("RGBA")
alpha = source.getchannel("A")
bounds = alpha.point(lambda value: 255 if value > 16 else 0).getbbox()
if not bounds:
    raise ValueError("DailyMirror tray artwork is empty")
source = source.crop(bounds)
output = root / "electron/assets/icons/indicator"
output.mkdir(parents=True, exist_ok=True)


def render(size, dark_background, progress=None, running=False):
    # Draw at 4x resolution so the progress ring remains clean at tray sizes.
    scale = 4
    canvas = Image.new("RGBA", (size * scale, size * scale))
    artwork = source.copy()
    if dark_background:
        inverted = ImageOps.invert(artwork.convert("RGB")).convert("RGBA")
        inverted.putalpha(artwork.getchannel("A"))
        artwork = inverted
    inset = 4 * scale if running else scale
    artwork.thumbnail((size * scale - inset * 2, size * scale - inset * 2), Image.Resampling.LANCZOS)
    canvas.alpha_composite(artwork, ((canvas.width - artwork.width) // 2, (canvas.height - artwork.height) // 2))
    if running:
        draw = ImageDraw.Draw(canvas)
        box = (scale, scale, canvas.width - scale - 1, canvas.height - scale - 1)
        color = (145, 145, 145, 100)
        draw.ellipse(box, outline=color, width=2 * scale)
        if progress is None:
            draw.ellipse((canvas.width - 7 * scale, scale, canvas.width - scale, 7 * scale), fill=(66, 165, 245, 255))
        elif progress > 0:
            draw.arc(box, -90, -90 + 360 * progress, fill=(66, 165, 245, 255), width=2 * scale)
    return canvas.resize((size, size), Image.Resampling.LANCZOS)


for theme in ("l", "d"):
    for suffix, size in (("", 24), ("@2x", 48)):
        render(size, theme == "d").save(output / f"stopped-{theme}{suffix}.png")
        render(size, theme == "d", running=True).save(output / f"running-{theme}{suffix}.png")
        animation = output / f"running-anim-{theme}"
        animation.mkdir(exist_ok=True)
        for frame in range(16):
            render(size, theme == "d", frame / 15, running=True).save(animation / f"{frame}{suffix}.png")

print("DailyMirror paused, running and progress tray icons generated (72 files).")
