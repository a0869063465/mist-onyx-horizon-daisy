import math, random, sys
from PIL import Image, ImageDraw, ImageFilter, ImageChops

LOGO = sys.argv[1]
OUT = sys.argv[2]
W, H = 420, 700
CR = 34  # crimp band height
random.seed(7)

def vgrad(w, h, stops):
    img = Image.new("RGB", (w, h))
    px = img.load()
    for y in range(h):
        t = y / (h - 1)
        for i in range(len(stops) - 1):
            t0, c0 = stops[i]; t1, c1 = stops[i + 1]
            if t0 <= t <= t1:
                k = (t - t0) / (t1 - t0) if t1 > t0 else 0
                c = tuple(int(c0[j] + (c1[j] - c0[j]) * k) for j in range(3))
                break
        for x in range(w):
            px[x, y] = c
    return img

base = vgrad(W, H, [(0, (14, 30, 92)), (0.45, (30, 14, 74)), (1, (8, 6, 28))]).convert("RGBA")

# light rays behind the lion
cx, cy = W // 2, 322
rays = Image.new("RGBA", (W, H), (0, 0, 0, 0))
d = ImageDraw.Draw(rays)
for i in range(22):
    a0 = i * (2 * math.pi / 22) + random.uniform(-0.05, 0.05)
    spread = random.uniform(0.035, 0.08)
    r = 900
    pts = [(cx, cy), (cx + r * math.cos(a0 - spread), cy + r * math.sin(a0 - spread)), (cx + r * math.cos(a0 + spread), cy + r * math.sin(a0 + spread))]
    alpha = random.randint(26, 60)
    d.polygon(pts, fill=(255, 196, 92, alpha))
rays = rays.filter(ImageFilter.GaussianBlur(3))
base = Image.alpha_composite(base, rays)

# warm glow in the middle, cool glow at the bottom
glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
g = ImageDraw.Draw(glow)
for r, a in [(250, 18), (190, 26), (130, 38), (80, 46)]:
    g.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(255, 150, 60, a))
for r, a in [(240, 30), (170, 40)]:
    g.ellipse([cx - r * 1.4, H - 40 - r * 0.5, cx + r * 1.4, H - 40 + r * 0.5], fill=(70, 120, 255, a))
glow = glow.filter(ImageFilter.GaussianBlur(28))
base = Image.alpha_composite(base, glow)

# sparkles
sp = Image.new("RGBA", (W, H), (0, 0, 0, 0))
s = ImageDraw.Draw(sp)
for _ in range(70):
    x, y = random.uniform(14, W - 14), random.uniform(CR + 8, H - CR - 8)
    r = random.choice([0.8, 1.0, 1.3, 1.8])
    s.ellipse([x - r, y - r, x + r, y + r], fill=(255, 240, 200, random.randint(120, 230)))
for _ in range(9):
    x, y = random.uniform(30, W - 30), random.uniform(CR + 30, H - CR - 30)
    L = random.uniform(5, 10)
    s.line([x - L, y, x + L, y], fill=(255, 245, 210, 200), width=1)
    s.line([x, y - L, x, y + L], fill=(255, 245, 210, 200), width=1)
sp = sp.filter(ImageFilter.GaussianBlur(0.6))
base = Image.alpha_composite(base, sp)

# the logo
logo = Image.open(LOGO).convert("RGBA")
logo = logo.crop(logo.getchannel("A").getbbox())
lw = 396
logo = logo.resize((lw, round(logo.height * lw / logo.width)), Image.LANCZOS)
shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
sh = Image.new("RGBA", logo.size, (0, 0, 0, 0))
sh.putalpha(logo.getchannel("A").point(lambda v: int(v * 0.75)))
shadow.paste(sh, ((W - lw) // 2 + 4, 172 + 10), sh)
shadow = shadow.filter(ImageFilter.GaussianBlur(10))
base = Image.alpha_composite(base, shadow)
base.alpha_composite(logo, ((W - lw) // 2, 172))

# gold frame lines between the crimps
fr = ImageDraw.Draw(base)
for inset, col, wid in [(9, (120, 84, 20, 255), 4), (9, (246, 212, 120, 255), 2), (15, (255, 236, 170, 120), 1)]:
    fr.rectangle([inset, CR + 4, W - 1 - inset, H - CR - 5], outline=col, width=wid)

# crimped foil bands top and bottom
def band(h, flip):
    b = vgrad(W, h, [(0, (250, 226, 150)), (0.5, (176, 128, 40)), (1, (92, 60, 14))]).convert("RGBA")
    if flip:
        b = b.transpose(Image.FLIP_TOP_BOTTOM)
    bd = ImageDraw.Draw(b)
    for x in range(0, W, 6):
        bd.line([x, 0, x, h], fill=(255, 250, 220, 90), width=2)
        bd.line([x + 3, 0, x + 3, h], fill=(60, 36, 4, 90), width=1)
    # zigzag outer edge
    mask = Image.new("L", (W, h), 255)
    md = ImageDraw.Draw(mask)
    tooth = 10
    for x in range(-tooth, W + tooth, tooth):
        tri = [(x, 0), (x + tooth, 0), (x + tooth / 2, 6)] if not flip else [(x, h), (x + tooth, h), (x + tooth / 2, h - 6)]
        md.polygon(tri, fill=0)
    b.putalpha(mask)
    return b

top = band(CR, False)
bottom = band(CR, True)
base.alpha_composite(top, (0, 0))
base.alpha_composite(bottom, (0, H - CR))
# a dark seam under/over each band
fr.line([0, CR, W, CR], fill=(40, 24, 4, 255), width=2)
fr.line([0, H - CR - 1, W, H - CR - 1], fill=(40, 24, 4, 255), width=2)

# soft side shading so the pack reads as a pouch
shade = Image.new("RGBA", (W, H), (0, 0, 0, 0))
sd = ImageDraw.Draw(shade)
for i in range(26):
    a = int(90 * (1 - i / 26) ** 2)
    sd.line([i, 0, i, H], fill=(0, 0, 0, a))
    sd.line([W - 1 - i, 0, W - 1 - i, H], fill=(0, 0, 0, a))
gloss = Image.new("RGBA", (W, H), (0, 0, 0, 0))
gd = ImageDraw.Draw(gloss)
gd.polygon([(W * 0.12, 0), (W * 0.30, 0), (W * 0.02, H), (-W * 0.16, H)], fill=(255, 255, 255, 26))
gloss = gloss.filter(ImageFilter.GaussianBlur(8))
alpha = base.getchannel("A")
base = Image.alpha_composite(base, shade)
base = Image.alpha_composite(base, gloss)
base.putalpha(alpha)
base.save(OUT, quality=88, method=6)
print(base.size)
