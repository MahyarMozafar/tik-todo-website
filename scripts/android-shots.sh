#!/bin/sh
# Takes the Android screenshots for the website: English and Farsi, light and dark,
# four screens each. Needs a running emulator (or phone) with a debug build of Tik.
#
# Usage:  sh scripts/android-shots.sh OUT_FOLDER [device serial]
# Then:   python3 scripts/make-shots.py android OUT_FOLDER

set -e
OUT=${1:?give a folder for the PNG files}
ADB="adb${2:+ -s $2}"
APP=com.mahyarmozafar.tik
mkdir -p "$OUT"

demo() { $ADB shell am broadcast -a com.android.systemui.demo -e command "$@" > /dev/null; }
$ADB shell settings put global sysui_demo_allowed 1
demo enter
demo clock -e hhmm 0941
demo battery -e level 100 -e plugged false
demo network -e wifi show -e level 4 -e fully true -e mobile hide
demo notifications -e visible false

shot() {
  name=$1
  shift
  $ADB shell am force-stop $APP
  $ADB shell am start -W -n $APP/.MainActivity --ez demo true "$@" > /dev/null
  sleep 4
  $ADB exec-out screencap -p > "$OUT/$name.png"
  echo "$name"
}

for lang in en fa; do
  for theme in light dark; do
    shot "$lang-$theme-today" --es lang $lang --es theme $theme --es tab today
    shot "$lang-$theme-lists" --es lang $lang --es theme $theme --es tab lists
    shot "$lang-$theme-editor" --es lang $lang --es theme $theme --es screen editor
    shot "$lang-$theme-settings" --es lang $lang --es theme $theme --es screen settings
  done
done

$ADB shell am force-stop $APP
demo exit
