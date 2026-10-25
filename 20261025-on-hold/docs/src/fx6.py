# code-drawn crumble weight: grains with depth, dust puff at phone landing, 2-frame shake
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
W, H = 1280, 720
rng = np.random.default_rng(42)
NG = 1400
z = rng.random(NG) ** 0.7                       # depth: 0 far .. 1 near camera
t0 = rng.uniform(0.0, 0.35, NG)                 # spawn time after burst
ang = rng.uniform(-np.pi, 0, NG)                # upper half-plane, outward
spd = rng.uniform(120, 520, NG) * (0.6 + 0.8 * z)
x0 = 645 + rng.normal(0, 70, NG); y0 = 430 + rng.normal(0, 50, NG)
vx = np.cos(ang) * spd * 1.3; vy = np.sin(ang) * spd * 0.8 - 40
floor = 600 + z * 110
size = 0.8 + 4.2 * z ** 1.5
col = np.stack([rng.uniform(120, 175, NG), rng.uniform(60, 90, NG), rng.uniform(40, 60, NG)], 1)
G = 1100.0
def grains_layer(t):   # t: seconds since burst
    lay = [Image.new('RGBA', (W, H), (0, 0, 0, 0)) for _ in range(3)]
    d = [ImageDraw.Draw(l) for l in lay]
    tt = t - t0; ok = tt > 0
    if not ok.any(): return None
    x = x0 + vx * tt; y = y0 + vy * tt + 0.5 * G * tt ** 2
    landed = y > floor
    for k in np.nonzero(ok)[0]:
        if landed[k] and tt[k] > 0.05:
            # settle and fade after landing
            tl = tt[k] - max(0, (-(vy[k]) + np.sqrt(max(0, vy[k] ** 2 + 2 * G * (floor[k] - y0[k])))) / G)
            a = max(0, 1 - tl / 0.6)
            if a <= 0: continue
            yy = floor[k]
        else: a = 1.0; yy = y[k]
        if not (-10 < x[k] < W + 10 and -10 < yy < H + 10): continue
        li = 0 if z[k] < 0.4 else (1 if z[k] < 0.75 else 2)
        r = size[k]; c = tuple(int(v) for v in col[k]) + (int(220 * a),)
        # motion streak for fast near grains
        vyk = vy[k] + G * tt[k]
        d[li].line([x[k], yy, x[k] - vx[k] * 0.012, yy - vyk * 0.012], fill=c, width=max(1, int(r)))
        d[li].ellipse([x[k] - r / 2, yy - r / 2, x[k] + r / 2, yy + r / 2], fill=c)
    out = lay[0]
    out.alpha_composite(lay[1].filter(ImageFilter.GaussianBlur(0.8)))
    out.alpha_composite(lay[2].filter(ImageFilter.GaussianBlur(2.2)))
    return out
def puff_layer(t, cx=649, cy=486):   # t since phone landing
    if t < 0 or t > 1.6: return None
    lay = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    u = t / 1.6; R = 25 + 190 * (1 - (1 - u) ** 3); a = int(255 * (1 - u) ** 1.3)
    for k in range(10):   # lumpy cloud: several offset blobs
        ox = np.cos(k * 2.1) * R * 0.35; oy = -abs(np.sin(k * 1.7)) * R * 0.25
        rr = R * (0.45 + 0.1 * (k % 3))
        d.ellipse([cx + ox - rr, cy + oy - rr * 0.55, cx + ox + rr, cy + oy + rr * 0.55], fill=(175, 110, 80, int(a * 0.55)))
    return lay.filter(ImageFilter.GaussianBlur(14 + 10 * u))
def shake(t):   # 2 frames at landing
    if 0 <= t < 1 / 24: return (0, 7)
    if 1 / 24 <= t < 2 / 24: return (2, -4)
    return (0, 0)
