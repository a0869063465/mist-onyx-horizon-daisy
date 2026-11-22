#!/usr/bin/env python3
"""AR03: chuẩn bị tệp để đăng artifact. Chạy: python3 docs/ar03/prep.py <thư mục ra>
Ghi <thư mục ra>/ar03.html (index.html đã bỏ phần bọc <html>/<head>/<body> vì công cụ Artifact tự bọc)
và in danh sách tệp (data.json + cards/*.webp) để đưa vào tham số `files` của lệnh đăng."""
import json, os, re, sys
here = os.path.dirname(os.path.abspath(__file__))
out = sys.argv[1] if len(sys.argv) > 1 else "/tmp/ar03"
os.makedirs(out, exist_ok=True)
s = open(os.path.join(here, "index.html"), encoding="utf-8").read()
s = re.sub(r'<!DOCTYPE html>\s*<html[^>]*>\s*<head>\s*<meta charset="utf-8">\s*<meta name="viewport"[^>]*>\s*', "", s, count=1, flags=re.I)
s = s.replace("</head>\n<body>", "", 1).replace("</body>\n</html>", "").replace("</body></html>", "")
open(os.path.join(out, "ar03.html"), "w", encoding="utf-8").write(s)
files = ["data.json"] + ["cards/" + f for f in sorted(os.listdir(os.path.join(here, "cards"))) if f.endswith(".webp")]
print(json.dumps({"file_path": os.path.join(out, "ar03.html"), "root": here, "files": files}, ensure_ascii=False))
