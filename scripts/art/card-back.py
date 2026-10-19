import math, random, sys
from PIL import Image, ImageDraw, ImageFilter

LOGO = sys.argv[1]
OUT = sys.argv[2]
# The field colours: blue for a Normal card, gold for SR, purple for UR (shop, 19/10).
TONE = sys.argv[3] if len(sys.argv) > 3 else "N"
FIELD = {
    "N": ((34, 40, 110), (6, 6, 26), (120, 150, 255), (150, 170, 255)),
    "SR": ((132, 92, 22), (30, 18, 4), (255, 214, 120), (255, 226, 150)),
    "UR": ((104, 34, 160), (22, 6, 40), (214, 140, 255), (230, 170, 255)),
}[TONE]
W, H = 400, 610
R = 20
random.seed(11)

def radial(w, h, cx, cy, inner, outer, rad):
    img = Image.new("RGB", (w, h))
    px = img.load()
    for y in range(h):
        for x in range(w):
            t = min(1.0, math.hypot(x - cx, y - cy) / rad)
            px[x, y] = tuple(int(inner[j] + (outer[j] - inner[j]) * t) for j in range(3))
    return img

base = Image.new("RGBA", (W, H), (0, 0, 0, 0))
# bronze rim
rim = radial(W, H, W / 2, H / 2, (150, 104, 36), (70, 44, 10), 380).convert("RGBA")
base.alpha_composite(rim)
# inner field
B = 16
field = radial(W - 2 * B, H - 2 * B, (W - 2 * B) / 2, (H - 2 * B) / 2, FIELD[0], FIELD[1], 330).convert("RGBA")
fw, fh = field.size
lines = Image.new("RGBA", field.size, (0, 0, 0, 0))
fd = ImageDraw.Draw(lines)
# swirling rays around the medallion
cx, cy = fw / 2, fh / 2
for i in range(48):
    a = i * 2 * math.pi / 48
    a2 = a + 0.9
    pts = []
    for k in range(40):
        t = k / 39
        ang = a + (a2 - a) * t
        r = 40 + 330 * t
        pts.append((cx + r * math.cos(ang), cy + r * math.sin(ang)))
    fd.line(pts, fill=(*FIELD[2], 58 if i % 2 else 34), width=2)
# fine diamond lattice
for k in range(-fh, fw + fh, 22):
    fd.line([(k, 0), (k + fh, fh)], fill=(*FIELD[3], 30), width=1)
    fd.line([(k, fh), (k + fh, 0)], fill=(*FIELD[3], 30), width=1)
field = Image.alpha_composite(field, lines.filter(ImageFilter.GaussianBlur(0.7)))
fmask = Image.new("L", field.size, 0)
ImageDraw.Draw(fmask).rounded_rectangle([0, 0, fw - 1, fh - 1], radius=R - 6, fill=255)
base.paste(field, (B, B), fmask)

d = ImageDraw.Draw(base)
d.rounded_rectangle([B - 3, B - 3, W - B + 2, H - B + 2], radius=R - 4, outline=(250, 220, 140, 255), width=2)
d.rounded_rectangle([B + 6, B + 6, W - B - 7, H - B - 7], radius=R - 10, outline=(250, 220, 140, 110), width=1)

# medallion with the lion's head
logo = Image.open(LOGO).convert("RGBA")
head = logo.crop((620, 100, 1080, 560)).resize((236, 236), Image.LANCZOS)
mcx, mcy, mr = W // 2, H // 2, 118
glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
ImageDraw.Draw(glow).ellipse([mcx - mr - 26, mcy - mr - 26, mcx + mr + 26, mcy + mr + 26], fill=(255, 170, 60, 90))
glow = glow.filter(ImageFilter.GaussianBlur(18))
base = Image.alpha_composite(base, glow)
disc = radial(2 * mr, 2 * mr, mr, mr * 0.8, (120, 40, 20), (24, 8, 30), mr * 1.1).convert("RGBA")
disc.alpha_composite(head, (0, 0))
dmask = Image.new("L", disc.size, 0)
ImageDraw.Draw(dmask).ellipse([0, 0, 2 * mr - 1, 2 * mr - 1], fill=255)
base.paste(disc, (mcx - mr, mcy - mr), dmask)
d = ImageDraw.Draw(base)
for off, col, wid in [(0, (92, 60, 14, 255), 9), (0, (246, 212, 120, 255), 4), (10, (255, 236, 170, 140), 1)]:
    d.ellipse([mcx - mr - 4 + off, mcy - mr - 4 + off, mcx + mr + 4 - off, mcy + mr + 4 - off], outline=col, width=wid)
# star points on the ring
for i in range(8):
    a = i * math.pi / 4
    px, py = mcx + (mr + 4) * math.cos(a), mcy + (mr + 4) * math.sin(a)
    s = 9 if i % 2 == 0 else 6
    d.polygon([(px + s * math.cos(a), py + s * math.sin(a)), (px + s * 0.45 * math.cos(a + math.pi / 2), py + s * 0.45 * math.sin(a + math.pi / 2)), (px - s * math.cos(a), py - s * math.sin(a)), (px - s * 0.45 * math.cos(a + math.pi / 2), py - s * 0.45 * math.sin(a + math.pi / 2))], fill=(255, 230, 150, 255))
# corner diamonds
for x, y in [(B + 26, B + 26), (W - B - 27, B + 26), (B + 26, H - B - 27), (W - B - 27, H - B - 27)]:
    s = 10
    d.polygon([(x, y - s), (x + s, y), (x, y + s), (x - s, y)], fill=(246, 212, 120, 255))
    d.polygon([(x, y - s + 4), (x + s - 4, y), (x, y + s - 4), (x - s + 4, y)], fill=(120, 80, 20, 255))
# rounded outer corners
omask = Image.new("L", (W, H), 0)
ImageDraw.Draw(omask).rounded_rectangle([0, 0, W - 1, H - 1], radius=R, fill=255)
base.putalpha(omask)
base.save(OUT, quality=88, method=6)
print(base.size)
