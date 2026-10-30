"""Android launcher icons from the installed app's icons (public/icon-512.png, public/icon-maskable-512.png).

Usage: python3 scripts/apk/icons.py <icon-512.png> <icon-maskable-512.png> <android res folder>
"""
import os
import sys

from PIL import Image

plain, maskable, res = sys.argv[1:4]
DENSITIES = {"mdpi": 1, "hdpi": 1.5, "xhdpi": 2, "xxhdpi": 3, "xxxhdpi": 4}

icon = Image.open(plain).convert("RGBA")
full = Image.open(maskable).convert("RGBA")
for name, scale in DENSITIES.items():
    folder = os.path.join(res, f"mipmap-{name}")
    os.makedirs(folder, exist_ok=True)
    # Android 7: the plain icon, 48dp.
    icon.resize((round(48 * scale),) * 2, Image.LANCZOS).save(os.path.join(folder, "ic_launcher.png"))
    # Android 8+: the maskable icon fills the 108dp layer; the launcher's mask shows its middle.
    full.resize((round(108 * scale),) * 2, Image.LANCZOS).save(os.path.join(folder, "ic_launcher_art.png"))

folder = os.path.join(res, "mipmap-anydpi-v26")
os.makedirs(folder, exist_ok=True)
with open(os.path.join(folder, "ic_launcher.xml"), "w") as out:
    out.write(
        '<?xml version="1.0" encoding="utf-8"?>\n'
        '<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n'
        '    <background android:drawable="@mipmap/ic_launcher_art" />\n'
        '    <foreground android:drawable="@android:color/transparent" />\n'
        "</adaptive-icon>\n"
    )
