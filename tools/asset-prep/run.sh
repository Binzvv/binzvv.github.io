#!/usr/bin/env bash
# Rebuilds the opener's layers from the flat portrait.
# Needs: python3 with pillow numpy scipy opencv-python-headless
set -euo pipefail
cd "$(dirname "$0")"
python3 -c "from PIL import Image; Image.open('portrait.webp').convert('RGB').save('src.png')"
python3 seg.py      # head mask against the sky (keeps hoops, hinges, neck rim light)
python3 mat.py      # soft alpha + sky-spill removal -> head_full.png
python3 sky.py      # sky gradient fit + cloud alpha unmixing
python3 sprites.py  # cloud sprites
python3 banks.py    # join edge-cut sprites into seamless banks
python3 eyes.py     # eye openings, reconstructed sockets, iris + catchlight layers
python3 export.py   # write assets/*.webp
for k in A B C; do python3 -c "from PIL import Image; Image.open('bank$k.png').save('../../assets/cloud-$(echo $k | tr A-Z a-z).webp', quality=84, method=6)"; done
