"""Cinematic showcase of the Smart Home page, rendered from supplied assets.

A virtual camera moves over the full-page screenshot: each shot is a
keyframe (centre y, zoom) and the camera eases between them. Frames are
resampled with Lanczos straight from the source and piped into ffmpeg.

    python3 render.py --test     # 10-second opening test
    python3 render.py            # full showcase (once the storyboard is extended)
"""

import argparse
import subprocess
import sys
from pathlib import Path

from PIL import Image

W, H = 1920, 1080
FPS = 60
HERE = Path(__file__).parent
SOURCE = HERE / "assets" / "full-page.webp"

# Keyframes in source-image pixels: t (s), cy (vertical centre of the frame),
# zoom (1 = page width fills the frame), cx (horizontal centre, default middle).
# Positions measured on the 514px-wide screenshot; scale them if the source changes.
TEST = [
    (0.0, 144.5, 1.00),   # hero, page top aligned (nav + hero + first heading)
    (3.0, 140.0, 1.06),   # slow push-in on the hero
    (5.6, 236.0, 1.00),   # scroll into "It all starts at your front door"
    (8.4, 236.0, 1.10),   # hold and push in on the offer
    (10.0, 300.0, 1.00),  # ease out toward "Your home, but smarter"
]
FADE_IN, FADE_OUT = 0.6, 0.5


def ease(t):
    """Cubic ease-in-out: slow start, slow landing, like a dolly move."""
    return 4 * t ** 3 if t < 0.5 else 1 - (-2 * t + 2) ** 3 / 2


def camera(keys, t):
    for (t0, y0, z0, *c0), (t1, y1, z1, *c1) in zip(keys, keys[1:]):
        if t0 <= t <= t1:
            k = ease((t - t0) / (t1 - t0))
            x0 = c0[0] if c0 else None
            x1 = c1[0] if c1 else None
            cx = None if x0 is None and x1 is None else (x0 or x1) + ((x1 or x0) - (x0 or x1)) * k
            return y0 + (y1 - y0) * k, z0 + (z1 - z0) * k, cx
    _, y, z, *c = keys[-1]
    return y, z, (c[0] if c else None)


def frame(img, cy, zoom, cx=None):
    sw, sh = img.size
    vw = sw / zoom                    # visible width in source px
    vh = vw * H / W
    cx = sw / 2 if cx is None else cx
    x0 = min(max(cx - vw / 2, 0), sw - vw)
    y0 = min(max(cy - vh / 2, 0), sh - vh)
    return img.resize((W, H), Image.Resampling.LANCZOS, box=(x0, y0, x0 + vw, y0 + vh))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--test", action="store_true")
    ap.add_argument("--out", default=str(HERE / "output"))
    args = ap.parse_args()
    keys = TEST  # the full storyboard is added once high-resolution assets arrive
    duration = keys[-1][0]
    out = Path(args.out) / ("showcase-test.mp4" if args.test else "showcase.mp4")
    out.parent.mkdir(parents=True, exist_ok=True)

    src = Image.open(SOURCE)
    page = Image.new("RGB", src.size, "white")
    page.paste(src, mask=src.getchannel("A") if src.mode == "RGBA" else None)

    vf = f"fade=t=in:st=0:d={FADE_IN},fade=t=out:st={duration - FADE_OUT:.2f}:d={FADE_OUT},format=yuv420p"
    ff = subprocess.Popen(
        ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
         "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-vf", vf,
         "-c:v", "libx264", "-preset", "slow", "-crf", "14", "-profile:v", "high",
         "-tune", "film", "-movflags", "+faststart", str(out)],
        stdin=subprocess.PIPE,
    )
    total = round(duration * FPS)
    for i in range(total):
        cy, zoom, cx = camera(keys, i / FPS)
        ff.stdin.write(frame(page, cy, zoom, cx).tobytes())
        if i % FPS == 0:
            print(f"\r{i / FPS:4.1f}s / {duration:.1f}s", end="", file=sys.stderr)
    ff.stdin.close()
    ff.wait()
    print(f"\n{out}", file=sys.stderr)


if __name__ == "__main__":
    main()
