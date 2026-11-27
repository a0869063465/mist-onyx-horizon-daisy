"""Xuất ảnh icon skill để chủ game vẽ lại (skill /xuat-icon-skill).
Dùng: sửa danh sách ICONS bên dưới (tên, mô tả 1 dòng, SVG phác thảo), chạy `python3 make-sheet.py <thư mục ra>`, rồi
`NODE_PATH=$(npm root -g) node shot.cjs <thư mục ra>` để chụp `icon-xuat.png`, rồi SendUserFile.
Phác thảo: viewBox 200x200, nét trắng (stroke #fff, dày 5), phần nhấn màu: vàng #ffd24a, kiếm #e6ecff, cán #c9a46a,
đỏ #ff4a4a, xanh dương #3da5ff, xanh lá #3fe06a, lá bài nền #1d2550 viền #9fb0ff."""
import html, math, sys

OUT = sys.argv[1] if len(sys.argv) > 1 else "."

def sk(inner):
    return f'<svg viewBox="0 0 200 200" width="190" height="190" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">{inner}</svg>'

CARD = '<rect x="64" y="46" width="72" height="108" rx="8" fill="#1d2550" stroke="#9fb0ff"/><path d="M64 100 h72" stroke="#9fb0ff" stroke-width="2"/>'

def sword(x, a=0, top=28):
    return (f'<g transform="rotate({a} {x} 170)"><line x1="{x}" y1="{top}" x2="{x}" y2="140" stroke="#e6ecff" stroke-width="10"/>'
            f'<line x1="{x-16}" y1="140" x2="{x+16}" y2="140" stroke="#ffd24a" stroke-width="8"/>'
            f'<line x1="{x}" y1="140" x2="{x}" y2="168" stroke="#c9a46a" stroke-width="9"/></g>')

rays = "".join(f'<line x1="{100+46*math.cos(a):.1f}" y1="{100+46*math.sin(a):.1f}" x2="{100+82*math.cos(a):.1f}" y2="{100+82*math.sin(a):.1f}" stroke="#ffd24a" stroke-width="7"/>' for a in [i * math.pi / 6 for i in range(12)])

# (tên skill, mô tả ngắn, svg). Ví dụ các icon đã làm 27/11:
ICONS = [
    ("Nắng ấm lên", "Tia nắng mặt trời toả ra", sk(rays + '<circle cx="100" cy="100" r="32" fill="#ffb02e" stroke="#fff3b0"/>')),
    ("Sinh mệnh mới", "Lá bài, mũi tên ĐỎ đi ra, mũi tên XANH đi vào",
     sk(CARD + '<path d="M118 60 L172 20" stroke="#ff4a4a" stroke-width="9"/><path d="M150 18 h24 v24" stroke="#ff4a4a" stroke-width="9"/><path d="M14 150 L58 120" stroke="#3da5ff" stroke-width="9"/><path d="M30 112 L60 118 L46 146" stroke="#3da5ff" stroke-width="9"/>')),
    ("Gặt hồn", "Lưỡi hái chém xuống, lưỡi xuyên qua lá bài",
     sk('<rect x="60" y="62" width="80" height="112" rx="8" fill="#1d2550" stroke="#9fb0ff"/><path d="M60 118 h80" stroke="#9fb0ff" stroke-width="2"/><line x1="168" y1="14" x2="168" y2="84" stroke="#c9a46a" stroke-width="9"/><path d="M168 84 C130 84 78 70 52 120 C84 96 128 108 168 84Z" fill="#dfe6ff" stroke="#fff"/>')),
    ("Lời thề", "3 thanh kiếm giơ lên như 3 hiệp sĩ tuyên thệ", sk(sword(100) + sword(62, -14) + sword(138, 14))),
    ("Càng xinh đẹp", "Thanh kiếm và dấu thập xanh lá",
     sk('<line x1="52" y1="172" x2="132" y2="40" stroke="#e6ecff" stroke-width="10"/><line x1="48" y1="128" x2="82" y2="150" stroke="#ffd24a" stroke-width="8"/><path d="M150 70 v52 M124 96 h52" stroke="#3fe06a" stroke-width="16"/>')),
]

cells = "".join(f'<div class="c"><div class="ic">{svg}</div><b>{html.escape(n)}</b><span>{html.escape(d)}</span></div>' for n, d, svg in ICONS)
doc = f'''<!doctype html><meta charset=utf8><style>
body{{margin:0;background:#0b1020;color:#e9eefc;font:15px system-ui;padding:8px;width:760px}}
.g{{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}}
.c{{display:flex;flex-direction:column;align-items:center;gap:2px;padding:4px}}
.ic{{width:200px;height:200px;border-radius:50%;background:radial-gradient(circle,#2b3a78,#0d1430);display:flex;align-items:center;justify-content:center;border:3px solid #6f86d6}}
b{{color:#ffd77a}} span{{color:#cfd8f5;font-size:12px;text-align:center;max-width:220px}}
</style><div class="g">{cells}</div>'''
open(f"{OUT}/sheet.html", "w", encoding="utf-8").write(doc)
print("ok", len(ICONS), "icon")
