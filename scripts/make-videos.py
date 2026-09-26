"""Turns raw screen recordings into the small videos and poster pictures the website uses.

Usage:  python3 scripts/make-videos.py RAW_FOLDER

RAW_FOLDER holds recordings named <platform>-<clip>.mov or .mp4, for example
ios-confetti-en.mov or android-language.mp4. Next to each one, a .json file
({"start": 6.9, "end": 18.2}) says which seconds to keep.

Each video becomes assets/video/<name>.mp4 (540 px wide, H.264, no sound, starts
playing while it downloads) plus assets/video/<name>.webp, its first frame.
Needs ffmpeg and Pillow.
"""
import json, subprocess, sys
from pathlib import Path
from PIL import Image

WIDTH = 540

def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    raw = Path(sys.argv[1])
    out = Path(__file__).resolve().parent.parent / 'assets' / 'video'
    out.mkdir(parents=True, exist_ok=True)
    for src in sorted(list(raw.glob('*.mov')) + list(raw.glob('*.mp4'))):
        cut = json.loads(Path(str(src) + '.json').read_text())
        name = src.stem
        mp4 = out / f'{name}.mp4'
        # Screen recordings only add a frame when something changes. Jumping into such a
        # file lands at the wrong moment, so first make an even 30 fps copy of the whole
        # recording, then cut that copy exactly.
        even = out / f'{name}.even.mp4'
        subprocess.run([
            'ffmpeg', '-v', 'error', '-y', '-i', str(src),
            '-vf', f'fps=30,scale={WIDTH}:-2:flags=lanczos,format=yuv420p',
            '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '12', '-an', str(even)], check=True)
        subprocess.run([
            'ffmpeg', '-v', 'error', '-y', '-i', str(even), '-ss', str(cut['start']), '-to', str(cut['end']),
            '-c:v', 'libx264', '-preset', 'slow', '-crf', '28', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
            '-movflags', '+faststart', '-an', str(mp4)], check=True)
        even.unlink()
        png = out / f'{name}.png'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(mp4), '-frames:v', '1', str(png)], check=True)
        Image.open(png).convert('RGB').save(out / f'{name}.webp', quality=78, method=6)
        png.unlink()
        print(f'{name}: {mp4.stat().st_size // 1024} KB, {cut["end"] - cut["start"]:.1f} s')

if __name__ == '__main__':
    main()
