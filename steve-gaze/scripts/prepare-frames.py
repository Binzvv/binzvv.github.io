"""Slice the 3x3 gaze reference sheet into nine aligned, label-free frames.

Usage: python3 scripts/prepare-frames.py source/gaze-sheet.webp public/frames

Each frame is:
  * cut from its grid cell (separator lines excluded)
  * cleaned of the "01 Up Left"-style caption
  * aligned so the head's silhouette centroid sits at the same point
  * given a transparent background with a short feather around the head, so
    the frame has no visible edge and other elements can pass behind the head
  * upscaled 2x (Lanczos + light unsharp) and saved as WebP at identical size
"""
import sys, os, json
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi

SRC, OUT = sys.argv[1], sys.argv[2]
NAMES = ["up-left", "up", "up-right", "left", "centre", "right",
         "down-left", "down", "down-right"]
# Cell bounds inside the sheet, separator lines excluded.
XS = [(0, 510), (514, 1022), (1027, 1536)]
YS = [(0, 338), (343, 674), (679, 1024)]
BG = np.array([254, 243, 228], dtype=float)  # sheet background (#FEF3E4)
CANVAS = 440          # frame size in source pixels (square)
ANCHOR = (220, 222)   # where the head centroid lands in the frame
SCALE = 2             # output upscale

sheet = np.asarray(Image.open(SRC).convert("RGB")).astype(float)
os.makedirs(OUT, exist_ok=True)
meta = {}

for r, (y0, y1) in enumerate(YS):
    for c, (x0, x1) in enumerate(XS):
        idx = r * 3 + c
        cell = sheet[y0:y1, x0:x1].copy()
        h, w, _ = cell.shape

        # --- remove caption: dark, unsaturated text in the bottom-left corner
        sy0 = h - 48
        strip = cell[sy0:h - 4, :220]
        dark = (strip.mean(2) < 190) & (np.ptp(strip, axis=2) < 40)
        cols = np.nonzero(dark.any(0))[0]
        end, last = None, None
        for x in cols:  # walk text columns; stop at a wide gap (= face)
            if last is not None and x - last > 22:
                break
            last = x
        end = last
        rows = np.nonzero(dark[:, :end + 1].any(1))[0]
        ly0, ly1 = sy0 + rows.min() - 4, sy0 + rows.max() + 5
        cell[ly0:ly1, max(cols.min() - 4, 0):end + 5] = BG

        # --- head silhouette mask
        diff = np.abs(cell - BG).sum(2)
        m = ndi.binary_opening(diff > 24, iterations=1)
        lab, n = ndi.label(m)
        sizes = ndi.sum(m, lab, range(1, n + 1))
        head = ndi.binary_fill_holes(lab == (np.argmax(sizes) + 1))
        ys, xs = np.nonzero(head)
        cy, cx = ys.mean(), xs.mean()

        # --- soft alpha: opaque on the head, feathering out over a few pixels.
        # Frames are transparent outside the head so things can pass behind it.
        dist = ndi.distance_transform_edt(~head)
        alpha = np.clip(1 - (dist - 1.5) / 6, 0, 1)

        # --- place on aligned canvas (RGB keeps the cream so edges stay clean)
        rgb = np.tile(BG, (CANVAS, CANVAS, 1))
        a = np.zeros((CANVAS, CANVAS))
        ox, oy = int(round(ANCHOR[0] - cx)), int(round(ANCHOR[1] - cy))
        sx0, sy0_ = max(0, -ox), max(0, -oy)
        sx1, sy1 = min(w, CANVAS - ox), min(h, CANVAS - oy)
        rgb[sy0_ + oy:sy1 + oy, sx0 + ox:sx1 + ox] = cell[sy0_:sy1, sx0:sx1]
        a[sy0_ + oy:sy1 + oy, sx0 + ox:sx1 + ox] = alpha[sy0_:sy1, sx0:sx1]

        size = (CANVAS * SCALE, CANVAS * SCALE)
        col = Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8)).resize(size, Image.LANCZOS)
        col = col.filter(ImageFilter.UnsharpMask(radius=1.6, percent=55, threshold=2))
        mask = Image.fromarray((a * 255).astype(np.uint8)).resize(size, Image.LANCZOS)
        img = col.convert("RGBA")
        img.putalpha(mask)
        name = f"{idx + 1:02d}-{NAMES[idx]}.webp"
        img.save(os.path.join(OUT, name), quality=90, alpha_quality=95, method=6)
        meta[NAMES[idx]] = {"file": name, "centroid": [round(cx, 1), round(cy, 1)],
                            "bbox": [int(xs.min() + ox), int(ys.min() + oy),
                                     int(xs.max() + ox), int(ys.max() + oy)]}
        print(name, meta[NAMES[idx]])

# The sheet's "01 Up Left" cell actually looks up and to the RIGHT (near-duplicate
# of "03 Up Right"), so the true up-left frame is the up-right frame mirrored.
# Frames are centred on the head centroid, so a mirror keeps the alignment.
from PIL import ImageOps
ur = Image.open(os.path.join(OUT, "03-up-right.webp"))
ImageOps.mirror(ur).save(os.path.join(OUT, "01-up-left.webp"), quality=90, alpha_quality=95, method=6)
meta["up-left"] = {"file": "01-up-left.webp", "mirrored_from": "03-up-right.webp"}
print("01-up-left.webp <- mirrored 03-up-right.webp")

with open(os.path.join(os.path.dirname(__file__), "frames.json"), "w") as f:
    json.dump(meta, f, indent=2)
