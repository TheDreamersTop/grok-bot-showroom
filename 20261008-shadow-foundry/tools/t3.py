import sys, json
from PIL import Image
img = Image.open(sys.argv[1]).convert('RGB'); pts = json.load(open(sys.argv[2]))
def lin(c):
    c = c / 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
def L(p):
    r, g, b = img.getpixel((int(p[0]), int(p[1])))
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
res = []
for w in pts:
    s = sorted(L(p) for p in w['shadow']); l = sorted(L(p) for p in w['lit'])
    ms = sum(s) / len(s); ml = sum(l) / len(l)
    res.append((w['wall'], ms, ml, ml / max(ms, 1e-6)))
    print(f"{w['wall']:6s} shadow {ms:.4f} lit {ml:.4f} ratio {ml/max(ms,1e-6):.2f}:1  (n={len(s)},{len(l)})")
print('T3', 'PASS' if all(r[3] >= 4 for r in res) else 'FAIL')
