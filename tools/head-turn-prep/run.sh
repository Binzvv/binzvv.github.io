#!/usr/bin/env bash
# Rebuilds the head-turn experiment's pose frames from the rendered turn video.
# Needs: ffmpeg, python3 with pillow numpy scipy opencv-python-headless
# Usage: tools/head-turn-prep/run.sh path/to/binz_blanko.mp4
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
export WORK="$here/work/"
mkdir -p "$WORK/frames" "$WORK/cut"
ffmpeg -v error -y -i "$1" "$WORK/frames/f%04d.png"
cd "$here"
python3 vseg.py        # rough masks + per-frame stats
python3 flowyaw.py     # measured face displacement per frame (the angle-to-frame map)
python3 vcut.py $(seq 1 20) 36 37 38 39 40 41 42 59 60 61 62 63 64   # matted cutouts
python3 interp.py      # flow in-betweens for the two large right-turn gaps
python3 vrig.py        # tracked eye openings, rebuilt sockets, iris layers per pose
python3 vqa.py         # contact sheet of eye shifts for review (work/eyeqa.png)
python3 vexport.py     # frames, eye atlas, manifest -> experiments/head-turn/frames
