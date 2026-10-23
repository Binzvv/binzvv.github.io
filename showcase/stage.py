"""Keynote-style staging: the page is a lit object on a dark stage.

The website sits in a rounded "screen" card (no invented browser chrome).
The camera changes the card's scale and position; the page scrolls inside
the card. Card contents are resampled straight from the source at final
pixel size, so nothing is enlarged twice.

    python3 stage.py --test
"""

import argparse
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

W, H = 1920, 1080
FPS = 60
HERE = Path(__file__).parent
SOURCE = HERE / "assets" / "full-page.webp"

STAGE = (8, 8, 9)
CARD_W, CARD_H = 1240, 775          # 16:10 screen at scale 1
RADIUS = 22

# Keyframes: t, scroll (source px from page top shown at the card's top edge),
# card scale, card y offset (px), opacity.
TEST = [
    (0.0, 0, 0.90, 70, 0.0),
    (1.8, 0, 1.00, 0, 1.0),    # card rises into place on the hero
    (4.0, 0, 1.03, 0, 1.0),    # still, slow drift closer
    (6.6, 70, 1.00, 0, 1.0),   # page scrolls to "It all starts at your front door"
    (8.8, 70, 1.13, 0, 1.0),   # camera pushes in on the offer
    (10.0, 150, 1.13, 0, 0.0),  # scroll on toward "Your home, but smarter", fade out
]


def ease(t):
    return 4 * t ** 3 if t < 0.5 else 1 - (-2 * t + 2) ** 3 / 2


def ease_out(t):
    return 1 - (1 - t) ** 4


def state(keys, t):
    for i, (a, b) in enumerate(zip(keys, keys[1:])):
        if a[0] <= t <= b[0]:
            k = (t - a[0]) / (b[0] - a[0])
            k = ease_out(k) if i == 0 else ease(k)
            return [a[j] + (b[j] - a[j]) * k for j in range(1, 5)]
    return list(keys[-1][1:])


def rounded_mask(w, h, r):
    m = Image.new("L", (w, h), 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, w - 1, h - 1), r, fill=255)
    return m


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--test", action="store_true")
    ap.add_argument("--out", default=str(HERE / "output"))
    args = ap.parse_args()
    keys = TEST
    duration = keys[-1][0]
    out = Path(args.out) / "showcase-test-stage.mp4"
    out.parent.mkdir(parents=True, exist_ok=True)

    src = Image.open(SOURCE)
    page = Image.new("RGB", src.size, "white")
    page.paste(src, mask=src.getchannel("A") if src.mode == "RGBA" else None)
    sw = page.width
    view_h = sw * CARD_H / CARD_W   # source px visible in the card

    # Soft contact shadow, rendered once and scaled with the card.
    pad = 160
    shadow = Image.new("L", (CARD_W + pad * 2, CARD_H + pad * 2), 0)
    ImageDraw.Draw(shadow).rounded_rectangle((pad, pad + 30, pad + CARD_W, pad + CARD_H + 30), RADIUS, fill=150)
    shadow = shadow.filter(ImageFilter.GaussianBlur(60))

    ff = subprocess.Popen(
        ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
         "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-vf", "format=yuv420p",
         "-c:v", "libx264", "-preset", "slow", "-crf", "12", "-profile:v", "high",
         "-tune", "film", "-movflags", "+faststart", str(out)],
        stdin=subprocess.PIPE,
    )
    black = Image.new("RGB", (W, H), STAGE)
    for i in range(round(duration * FPS)):
        scroll, scale, dy, alpha = state(keys, i / FPS)
        cw, ch = round(CARD_W * scale), round(CARD_H * scale)
        x, y = (W - cw) / 2, (H - ch) / 2 + dy

        frame = black.copy()
        sh = shadow.resize((round(shadow.width * scale), round(shadow.height * scale)), Image.Resampling.BILINEAR)
        frame.paste((0, 0, 0), (round(x - pad * scale), round(y - pad * scale)), sh)
        card = page.resize((cw, ch), Image.Resampling.LANCZOS, box=(0, scroll, sw, scroll + view_h))
        frame.paste(card, (round(x), round(y)), rounded_mask(cw, ch, round(RADIUS * scale)))
        if alpha < 1:
            frame = Image.blend(black, frame, max(0.0, alpha))
        ff.stdin.write(frame.tobytes())
        if i % FPS == 0:
            print(f"\r{i / FPS:4.1f}s", end="", file=sys.stderr)
    ff.stdin.close()
    ff.wait()
    print(f"\n{out}", file=sys.stderr)


if __name__ == "__main__":
    main()
