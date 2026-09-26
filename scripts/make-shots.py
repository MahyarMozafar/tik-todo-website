"""Turns full-size app screenshots (PNG) into the small WebP files the website uses.

Usage:  python3 scripts/make-shots.py ios|android FOLDER_WITH_PNGS

Only the files the website shows are converted: {en,fa}-{light,dark}-{today,lists,editor,settings}.
They are made 720 pixels wide, which stays sharp on phones and computers.
Needs Pillow (pip install pillow).
"""
import sys
from pathlib import Path
from PIL import Image

WIDTH = 720
SCREENS = ['today', 'lists', 'editor', 'settings']

def main():
    if len(sys.argv) != 3 or sys.argv[1] not in ('ios', 'android'):
        sys.exit(__doc__)
    platform, folder = sys.argv[1], Path(sys.argv[2])
    out = Path(__file__).resolve().parent.parent / 'assets' / 'shots' / platform
    out.mkdir(parents=True, exist_ok=True)
    made = 0
    for lang in ('en', 'fa'):
        for theme in ('light', 'dark'):
            for screen in SCREENS:
                name = f'{lang}-{theme}-{screen}'
                src = folder / f'{name}.png'
                if not src.exists():
                    print('missing', src)
                    continue
                im = Image.open(src).convert('RGB')
                height = round(im.height * WIDTH / im.width)
                im.resize((WIDTH, height), Image.LANCZOS).save(out / f'{name}.webp', quality=80, method=6)
                made += 1
    print(f'{made} pictures written to {out}')

if __name__ == '__main__':
    main()
