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
# v7: red-sun key from the window behind the man -> grains are back-lit: dark shadow side to camera, warm rim toward the sun
SUNX, SUNY = 640, 230
ember = rng.random(NG) < 0.035
eph = rng.uniform(0, 6.28, NG)
G = 1100.0
def grains_layer(t):   # t: seconds since burst
    lay = [Image.new('RGBA', (W, H), (0, 0, 0, 0)) for _ in range(3)]; glow = []
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
        r = size[k]
        vyk = vy[k] + G * tt[k] if not (landed[k] and tt[k] > 0.05) else 0.0
        vxk = vx[k] if not (landed[k] and tt[k] > 0.05) else 0.0
        dxs, dys = vxk / 48, vyk / 48          # half-frame shutter streak
        lx, ly = SUNX - x[k], SUNY - yy; ln = max(1e-3, (lx * lx + ly * ly) ** 0.5); lx, ly = lx / ln, ly / ln
        near_win = max(0.0, 1 - ((x[k] - 640) / 260) ** 2 - ((yy - 230) / 220) ** 2)   # silhouetted against the red window
        if ember[k]:
            fl = 0.75 + 0.25 * np.sin(t * 23 + eph[k]); ae = int(255 * fl * max(a, 0.6 if tt[k] < 2.2 else 0))
            c = (255, int(150 + 60 * fl), 70, ae)
            d[li].line([x[k], yy, x[k] - dxs, yy - dys], fill=c, width=max(1, int(r * 0.8)))
            glow.append((x[k], yy, r, ae)); continue
        sh = 0.42 + 0.25 * near_win * 0                      # shadow side (towards camera)
        c = tuple(int(v * sh) for v in col[k]) + (int(225 * a),)
        d[li].line([x[k], yy, x[k] - dxs, yy - dys], fill=c, width=max(1, int(r)))
        d[li].ellipse([x[k] - r / 2, yy - r / 2, x[k] + r / 2, yy + r / 2], fill=c)
        # warm rim on the side facing the sun (stronger when silhouetted against the window)
        rim = (255, int(105 + 40 * near_win), 55, int((90 + 140 * near_win) * a))
        if r >= 1.6:
            rr_ = r * 0.32; ox, oy = lx * r * 0.32, ly * r * 0.32
            d[li].ellipse([x[k] + ox - rr_, yy + oy - rr_, x[k] + ox + rr_, yy + oy + rr_], fill=rim)
        elif near_win > 0.2:
            d[li].point([x[k], yy], fill=rim)
    out = lay[0]
    out.alpha_composite(lay[1].filter(ImageFilter.GaussianBlur(0.8)))
    out.alpha_composite(lay[2].filter(ImageFilter.GaussianBlur(2.2)))
    if glow:   # ember halos
        gl = Image.new('RGBA', (W, H), (0, 0, 0, 0)); gd = ImageDraw.Draw(gl)
        for gx, gy, r, ae in glow:
            R = 3 + r * 2.2; gd.ellipse([gx - R, gy - R, gx + R, gy + R], fill=(255, 120, 40, int(ae * 0.45)))
        out.alpha_composite(gl.filter(ImageFilter.GaussianBlur(4)))
    return out
def puff_layer(t, cx=649, cy=486):   # t since phone landing
    if t < 0 or t > 1.6: return None
    lay = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    u = t / 1.6; R = 25 + 190 * (1 - (1 - u) ** 3); a = int(255 * (1 - u) ** 1.3)
    for k in range(10):   # lumpy cloud: several offset blobs
        ox = np.cos(k * 2.1) * R * 0.35; oy = -abs(np.sin(k * 1.7)) * R * 0.25
        rr = R * (0.45 + 0.1 * (k % 3))
        d.ellipse([cx + ox - rr, cy + oy - rr * 0.55, cx + ox + rr, cy + oy + rr * 0.55], fill=(185, 95, 60, int(a * 0.55)) if oy < -R * 0.08 else (110, 60, 42, int(a * 0.55)))
    return lay.filter(ImageFilter.GaussianBlur(14 + 10 * u))
def shake(t):   # 2 frames at landing
    if 0 <= t < 1 / 24: return (0, 7)
    if 1 / 24 <= t < 2 / 24: return (2, -4)
    return (0, 0)
