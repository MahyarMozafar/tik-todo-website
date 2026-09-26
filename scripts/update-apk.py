"""Puts the newest Android release on the website.

Usage:  python3 scripts/update-apk.py

It downloads the APK of the latest release of MahyarMozafar/tik-todo-android
(with the GitHub CLI, `gh`), saves it as download/Tik.apk, and updates the
version, size and SHA-256 that the Farsi and English pages show.
After that, check the pages and commit.
"""
import hashlib, json, re, shutil, subprocess, sys, tempfile
from pathlib import Path

REPO = 'MahyarMozafar/tik-todo-android'
SITE = Path(__file__).resolve().parent.parent

def main():
    info = json.loads(subprocess.run(['gh', 'release', 'view', '--repo', REPO, '--json', 'tagName,assets'],
                                     capture_output=True, text=True, check=True).stdout)
    version = info['tagName'].lstrip('vV')
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run(['gh', 'release', 'download', info['tagName'], '--repo', REPO, '--pattern', '*.apk', '--dir', tmp], check=True)
        apks = list(Path(tmp).glob('*.apk'))
        if len(apks) != 1:
            sys.exit(f'Expected one APK in the release, found {len(apks)}')
        data = apks[0].read_bytes()
    target = SITE / 'download' / 'Tik.apk'
    target.parent.mkdir(exist_ok=True)
    target.write_bytes(data)

    mb = len(data) / 1e6
    size = f'{round(mb, 1):g} MB' if mb < 10 else f'{round(mb)} MB'
    sha = hashlib.sha256(data).hexdigest()

    for page in ('index.html', 'en/index.html'):
        path = SITE / page
        s = path.read_text(encoding='utf-8')
        s = re.sub(r'download="Tik-[^"]+\.apk"', f'download="Tik-{version}.apk"', s)
        s = re.sub(r'(نسخه&zwnj;ی <bdi>)[^<]+(</bdi> · <bdi>)[^<]+(</bdi>)', rf'\g<1>{version}\g<2>{size}\g<3>', s)
        s = re.sub(r'(data-apk-meta>Version )[^ ]+( · )[^<]+(<)', rf'\g<1>{version}\g<2>{size}\g<3>', s)
        s = re.sub(r'(data-apk-sha>)[0-9a-f]{64}(<)', rf'\g<1>{sha}\g<2>', s)
        s = re.sub(r'("softwareVersion": ")[^"]+(")', rf'\g<1>{version}\g<2>', s)
        path.write_text(s, encoding='utf-8')

    print(f'download/Tik.apk is now version {version}, {size}, SHA-256 {sha}')

if __name__ == '__main__':
    main()
