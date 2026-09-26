# Tik website

The website of **Tik**, a simple, glassy to-do app for Android and iPhone: https://tik.mahyarmozafar.ir

- Farsi at `/` (right-to-left) and English at `/en/`.
- Built for phones first: a glass tab bar, swipeable screenshots and slide-up sheets.
- A live demo of the Today screen, the app's 11 colors, screenshots and short videos of both apps.
- Plain HTML, CSS and JavaScript, with no framework and no build step. Every file is served from the site itself.
- Hosted for free on GitHub Pages.

## Run it on your computer

```sh
python3 -m http.server 8080
```

Then open http://localhost:8080. To try it on your phone, use the same Wi-Fi and open
`http://<your Mac's IP>:8080` (find the IP with `ipconfig getifaddr en0`).

## What is where

```
index.html               Farsi home page
en/index.html            English home page
privacy/, en/privacy/    Privacy pages
404.html                 "Page not found", in both languages
css/style.css            All styles, phone first
js/main.js               Language bar and memory, colors, sheets, tab bar, screenshots, videos
js/demo.js               The live demo inside the phone
download/Tik.apk         The Android app (the same file as the GitHub release)
assets/shots/            Screenshots: {ios,android}/{en,fa}-{light,dark}-{today,lists,editor,settings}.webp
assets/video/            Short videos and their first-frame pictures
assets/og/               Link preview pictures for Telegram, WhatsApp and others
scripts/                 Helpers, see below
```

## When a new Android version comes out

```sh
python3 scripts/update-apk.py
```

It downloads the newest APK from the
[tik-todo-android releases](https://github.com/MahyarMozafar/tik-todo-android/releases) (it needs the
GitHub CLI, `gh`), saves it as `download/Tik.apk`, and updates the version, size and SHA-256 on both pages.

## New screenshots

- **iPhone:** in the iOS repo, run the `ScreenshotTests` UI tests with `TEST_RUNNER_SCREENSHOTS_DIR=<folder>`,
  then `python3 scripts/make-shots.py ios <folder>`.
- **Android:** with a debug build running on an emulator, run `sh scripts/android-shots.sh <folder>`,
  then `python3 scripts/make-shots.py android <folder>`.

## New videos

Record with `xcrun simctl io booted recordVideo` (iPhone) or `adb shell screenrecord` (Android). Next to
each recording, put a `.json` file with the seconds to keep, like `{"start": 6.9, "end": 18.2}`. Then run
`python3 scripts/make-videos.py <folder>`.

## Visitor stats

Put your GoatCounter address in `js/main.js` (`GOATCOUNTER`). When it is empty, nothing is sent.

## Credits

The Vazirmatn font is by Saber Rastikerdar, under the SIL Open Font License (`assets/fonts/OFL.txt`).
GoatCounter's `count.js` is under the ISC license.

© 2026 Mahyar Mozafar
