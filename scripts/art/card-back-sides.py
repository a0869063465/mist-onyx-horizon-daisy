"""Lưng lá hai bên (chủ game 30/10): xanh = rắn cơ khí (phe mình), cam đỏ = sư tử (phe địch).
Dùng: python3 scripts/art/card-back-sides.py <logo-su-tu.webp> <logo-ran.png> <thư mục ra>
Ra: card-back-you.webp, card-back-foe.webp (400 x 572, tỉ lệ gần lá trên sân)."""
import math, sys
from PIL import Image, ImageDraw, ImageFilter

LION, SNAKE, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
W, H, R, B = 400, 572, 20, 16

def radial(w, h, cx, cy, inner, outer, rad):
    img = Image.new("RGB", (w, h)); px = img.load()
    for y in range(h):
        for x in range(w):
            t = min(1.0, math.hypot(x - cx, y - cy) / rad)
            px[x, y] = tuple(int(inner[j] + (outer[j] - inner[j]) * t) for j in range(3))
    return img

def card(field, rays, lattice, glow, disc_in, disc_out, art, rim_in=(150, 104, 36), rim_out=(70, 44, 10)):
    base = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    base.alpha_composite(radial(W, H, W / 2, H / 2, rim_in, rim_out, 380).convert("RGBA"))
    fw, fh = W - 2 * B, H - 2 * B
    f = radial(fw, fh, fw / 2, fh / 2, field[0], field[1], 320).convert("RGBA")
    lines = Image.new("RGBA", f.size, (0, 0, 0, 0)); fd = ImageDraw.Draw(lines)
    cx, cy = fw / 2, fh / 2
    for i in range(48):
        a = i * 2 * math.pi / 48; a2 = a + 0.9
        pts = [(cx + (40 + 330 * k / 39) * math.cos(a + (a2 - a) * k / 39), cy + (40 + 330 * k / 39) * math.sin(a + (a2 - a) * k / 39)) for k in range(40)]
        fd.line(pts, fill=(*rays, 58 if i % 2 else 34), width=2)
    for k in range(-fh, fw + fh, 22):
        fd.line([(k, 0), (k + fh, fh)], fill=(*lattice, 30), width=1)
        fd.line([(k, fh), (k + fh, 0)], fill=(*lattice, 30), width=1)
    f = Image.alpha_composite(f, lines.filter(ImageFilter.GaussianBlur(0.7)))
    m = Image.new("L", f.size, 0); ImageDraw.Draw(m).rounded_rectangle([0, 0, fw - 1, fh - 1], radius=R - 6, fill=255)
    base.paste(f, (B, B), m)
    d = ImageDraw.Draw(base)
    d.rounded_rectangle([B - 3, B - 3, W - B + 2, H - B + 2], radius=R - 4, outline=(250, 220, 140, 255), width=2)
    d.rounded_rectangle([B + 6, B + 6, W - B - 7, H - B - 7], radius=R - 10, outline=(250, 220, 140, 110), width=1)
    mcx, mcy, mr = W // 2, H // 2, 118
    g = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(g).ellipse([mcx - mr - 26, mcy - mr - 26, mcx + mr + 26, mcy + mr + 26], fill=glow)
    base = Image.alpha_composite(base, g.filter(ImageFilter.GaussianBlur(18)))
    disc = radial(2 * mr, 2 * mr, mr, mr * 0.8, disc_in, disc_out, mr * 1.1).convert("RGBA")
    disc.alpha_composite(art.resize((2 * mr, 2 * mr), Image.LANCZOS), (0, 0))
    dm = Image.new("L", disc.size, 0); ImageDraw.Draw(dm).ellipse([0, 0, 2 * mr - 1, 2 * mr - 1], fill=255)
    base.paste(disc, (mcx - mr, mcy - mr), dm)
    d = ImageDraw.Draw(base)
    for off, col, wid in [(0, (92, 60, 14, 255), 9), (0, (246, 212, 120, 255), 4), (10, (255, 236, 170, 140), 1)]:
        d.ellipse([mcx - mr - 4 + off, mcy - mr - 4 + off, mcx + mr + 4 - off, mcy + mr + 4 - off], outline=col, width=wid)
    for i in range(8):
        a = i * math.pi / 4; px, py = mcx + (mr + 4) * math.cos(a), mcy + (mr + 4) * math.sin(a); s = 9 if i % 2 == 0 else 6
        d.polygon([(px + s * math.cos(a), py + s * math.sin(a)), (px + s * 0.45 * math.cos(a + math.pi / 2), py + s * 0.45 * math.sin(a + math.pi / 2)), (px - s * math.cos(a), py - s * math.sin(a)), (px - s * 0.45 * math.cos(a + math.pi / 2), py - s * 0.45 * math.sin(a + math.pi / 2))], fill=(255, 230, 150, 255))
    for x, y in [(B + 26, B + 26), (W - B - 27, B + 26), (B + 26, H - B - 27), (W - B - 27, H - B - 27)]:
        s = 10
        d.polygon([(x, y - s), (x + s, y), (x, y + s), (x - s, y)], fill=(246, 212, 120, 255))
        d.polygon([(x, y - s + 4), (x + s - 4, y), (x, y + s - 4), (x - s + 4, y)], fill=(120, 80, 20, 255))
    om = Image.new("L", (W, H), 0); ImageDraw.Draw(om).rounded_rectangle([0, 0, W - 1, H - 1], radius=R, fill=255)
    base.putalpha(om)
    return base

lion = Image.open(LION).convert("RGBA")
sc = lion.size[0] / 1254
lion_art = lion.crop((int(620 * sc), int(100 * sc), int(1080 * sc), int(560 * sc)))
snake = Image.open(SNAKE).convert("RGBA")
snake_art = snake.crop((120, 40, 640, 560))

# Cam đỏ hợp nền sân đỏ (nền ~ (200,80,30)): tối hơn nền, cùng tông.
foe = card(((196, 64, 26), (84, 18, 10)), (255, 150, 90), (255, 190, 120), (255, 170, 60, 90), (120, 40, 20), (24, 8, 30), lion_art)
# Xanh hợp nền sân xanh (nền ~ (0,70,230)): đậm hơn và bớt bão hoà một chút để không trùng.
you = card(((24, 92, 196), (6, 30, 98)), (120, 176, 255), (170, 210, 255), (90, 170, 255, 90), (20, 70, 160), (6, 16, 56), snake_art)
foe.save(f"{OUT}/card-back-foe.webp", quality=88, method=6)
you.save(f"{OUT}/card-back-you.webp", quality=88, method=6)
print(foe.size, you.size)
