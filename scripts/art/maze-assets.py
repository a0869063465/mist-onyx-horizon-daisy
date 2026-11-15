"""Cắt nguyên liệu mê cung từ ảnh chủ game gửi -> public/maze/*.webp. Dùng: python3 maze-assets.py <thư mục ảnh gốc>"""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

U = sys.argv[1].rstrip("/") + "/"
OUT = "public/maze/"


def save(img, name, width=None):
    if width and img.width > width:
        img = img.resize((width, round(img.height * width / img.width)), Image.LANCZOS)
    img.save(OUT + name + ".webp", quality=90, method=6)


def trim(img, pad=2):
    a = np.array(img)[..., 3]
    ys, xs = np.where(a > 8)
    return img.crop((max(xs.min() - pad, 0), max(ys.min() - pad, 0), xs.max() + pad, ys.max() + pad))


def keyed(img):
    """Nền đen -> trong suốt (alpha = sáng nhất của 3 kênh x4), giữ màu."""
    a = np.array(img.convert("RGB")).astype(np.float32)
    al = np.clip(a.max(axis=2) * 4, 0, 255)
    out = np.dstack([a, al]).astype(np.uint8)
    return Image.fromarray(out, "RGBA")


# Bản đồ
Image.open(U + "dc1292f7-image.png").convert("RGB").save(OUT + "board.jpg", quality=88)

# Quái, cổng, rương, boss (ảnh 4324b759 đã có alpha)
sheet = Image.open(U + "4324b759-image.png").convert("RGBA")
arr = np.array(sheet)
lab, _ = ndi.label(ndi.binary_dilation(arr[..., 3] > 60, iterations=6))
names = {
    (402, 55): "portal-green", (567, 120): "chest", (248, 121): "mon-2", (628, 235): "boss",
    (77, 296): "portal-blue", (109, 520): "portal-red", (510, 636): "mon-1", (954, 363): "mon-3",
}
for i, s in enumerate(ndi.find_objects(lab), 1):
    key = (s[1].start, s[0].start)
    if key in names:
        part = np.array(sheet).copy()
        part[lab != i] = 0
        save(trim(Image.fromarray(part, "RGBA")), names[key], 220)

# Nhân vật 4 hướng (ảnh 853e5af4, 2172 rộng): trước, trái, sau, phải. Nền đen nối với mép = trong suốt.
def solid(img, thr=14):
    rgb = np.array(img.convert("RGB"))
    dark = rgb.max(axis=2) < thr
    lab, _ = ndi.label(dark)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bg = np.isin(lab, list(edge))
    al = ndi.gaussian_filter((~bg).astype(np.float32), 0.8)
    return Image.fromarray(np.dstack([rgb, (al * 255).astype(np.uint8)]), "RGBA")


K = 2172 / 2000
heroes = Image.open(U + "853e5af4-image.png")
for name, (x0, x1) in {"down": (150, 470), "left": (630, 880), "up": (1100, 1340), "right": (1550, 1800)}.items():
    part = heroes.crop((int(x0 * K), int(40 * K), int(x1 * K), int(580 * K)))
    h = trim(solid(part), 4)
    # cùng một tỉ lệ cho cả 4 hướng (không ép bề ngang) để nhân vật cao bằng nhau
    save(h.resize((round(h.width * 0.5), round(h.height * 0.5)), Image.LANCZOS), "hero-" + name)

# Bảo vật
tre = keyed(Image.open(U + "a65c7b3d-image.png"))
for name, (x0, x1) in {"key": (60, 380), "game": (420, 760), "eye": (800, 1160), "wand": (1230, 1500), "scale": (1550, 1950)}.items():
    save(trim(tre.crop((int(x0 * K), int(100 * K), int(x1 * K), int(600 * K))), 4), "item-" + name, 160)
save(trim(keyed(Image.open(U + "dd40fa15-image.png")), 4), "item-necklace", 220)
