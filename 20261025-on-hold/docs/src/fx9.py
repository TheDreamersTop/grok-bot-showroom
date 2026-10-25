# v9 crumble: the slumped figure (frame A) turns to sand from the head down over TR seconds,
# revealing the pile (clip frames B underneath); lit grains stream off the wipe front; robe sags toward the seat.
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
W, H = 1280, 720
TR = 1.0                          # transformation length (s)
POLY = [(325,720),(335,560),(395,495),(520,462),(552,415),(575,368),(615,350),(690,352),(738,385),(752,440),(810,470),(900,520),(945,720)]
Y0, Y1 = 340, 720                  # wipe from head top to the floor
SUNX, SUNY = 640, 230
_m = Image.new('L', (W, H), 0); ImageDraw.Draw(_m).polygon(POLY, fill=255)
FIG = np.asarray(_m.filter(ImageFilter.GaussianBlur(5)), np.float32) / 255
rng = np.random.default_rng(11)
# smooth 1-D noise for the ragged front
_nx = np.interp(np.arange(W), np.linspace(0, W, 40), rng.normal(0, 1, 40))
_nx2 = np.interp(np.arange(W), np.linspace(0, W, 160), rng.normal(0, 1, 160))
NOISE = (_nx * 22 + _nx2 * 9)
# per-pixel sand speckle
SPK = rng.random((H, W)).astype(np.float32)
def front(p):   # p 0..1 -> front y per column (ease in-out, faster in the middle)
    e = p * p * (3 - 2 * p) * 0.4 + p * 0.6
    return Y0 + (Y1 - Y0 + 60) * e + NOISE * min(1, p * 4)
def sag(A, p):   # robe slumps toward the seat: vertical squash about y=640, up to 10%
    s = 1 - 0.18 * p
    yy = np.arange(H); src = np.where(yy < 640, np.clip(640 + (yy - 640) / s, 0, H - 1), yy).astype(int)
    return A[src]
def composite(A, B, tau):
    """A: figure frame (float32 HxWx3), B: underlying clip frame. tau: s since shot start. returns float32 image"""
    if tau >= TR + 0.05: return B
    p = min(1.0, max(0.0, tau / TR))
    As = sag(A, p) if p > 0 else A
    fy = front(p)[None, :]
    yy = np.arange(H)[:, None].astype(np.float32)
    keep = np.clip((yy - fy) / 6.0, 0, 1)                         # below the front: figure still there
    band = np.clip(1 - np.abs(yy - fy - 30) / 50.0, 0, 1)          # just below the front: turned to sand
    sand = np.stack([As.mean(-1) * 0.9 + 70, As.mean(-1) * 0.55 + 32, As.mean(-1) * 0.4 + 20], -1) * (0.75 + 0.5 * SPK[..., None])
    pre = np.clip(1 - (yy - fy) / 160.0, 0, 1) * 0.45 * (yy > fy)   # the figure goes dusty ahead of the front
    w_ = np.maximum(band * 0.95, pre)[..., None]
    Af = As * (1 - w_) + sand * w_
    # crumbling holes in the band (speckle threshold rises toward the front)
    hole = (SPK > np.clip((yy - fy) / 50.0, 0, 1) * 1.2).astype(np.float32) * (yy > fy - 4)
    a = (FIG * keep * np.where(band > 0, 1 - hole * band * 0.9, 1))[..., None]
    return B * (1 - a) + Af * a
# grains streaming off the front
NG = 2600
g_t0 = np.sort(rng.random(NG)) * TR
g_x = np.zeros(NG); g_y = np.zeros(NG)
_polyx = np.array([x for x, y in POLY]); 
for i in range(NG):
    p = g_t0[i] / TR; fy = front(p)
    for _ in range(20):
        x = rng.uniform(325, 945); y = fy[int(x)] + rng.uniform(-4, 10)
        if 0 <= y < H and FIG[int(min(y, H - 1)), int(x)] > 0.5: break
    g_x[i], g_y[i] = x, y
g_vx = rng.normal(0, 40, NG) + (g_x - 640) * 0.25
g_vy = rng.uniform(-60, 30, NG)
g_z = rng.random(NG) ** 0.8
g_sz = 0.8 + 3.0 * g_z ** 1.5
g_floor = np.minimum(700, 560 + rng.uniform(0, 140, NG))
g_col = np.stack([rng.uniform(120, 175, NG), rng.uniform(60, 90, NG), rng.uniform(40, 60, NG)], 1)
g_emb = rng.random(NG) < 0.012
G = 900.0
def grains(tau):
    tt = tau - g_t0; ok = (tt > 0)
    if not ok.any(): return None
    lay = [Image.new('RGBA', (W, H), (0, 0, 0, 0)) for _ in range(2)]; d = [ImageDraw.Draw(l) for l in lay]
    glow = []
    for k in np.nonzero(ok)[0]:
        t_ = tt[k]; x = g_x[k] + g_vx[k] * t_; y = g_y[k] + g_vy[k] * t_ + 0.5 * G * t_ * t_
        vy = g_vy[k] + G * t_; a = 1.0
        if y > g_floor[k]:
            tl = t_ - (-g_vy[k] + np.sqrt(max(0, g_vy[k] ** 2 + 2 * G * (g_floor[k] - g_y[k])))) / G
            a = max(0, 1 - tl / 0.35); y = g_floor[k]; vy = 0
            if a <= 0: continue
        r = g_sz[k]; li = 1 if g_z[k] > 0.7 else 0
        dx, dy = g_vx[k] / 48, vy / 48
        if g_emb[k]:
            c = (255, 175, 80, int(240 * a)); d[li].line([x, y, x - dx, y - dy], fill=c, width=max(1, int(r))); glow.append((x, y, r, a)); continue
        near = max(0.0, 1 - ((x - 640) / 260) ** 2 - ((y - 230) / 220) ** 2)
        c = tuple(int(v * 0.45) for v in g_col[k]) + (int(225 * a),)
        d[li].line([x, y, x - dx, y - dy], fill=c, width=max(1, int(r)))
        if r >= 1.5:
            lx, ly = SUNX - x, SUNY - y; ln = max(1e-3, (lx * lx + ly * ly) ** 0.5)
            ox, oy = lx / ln * r * 0.3, ly / ln * r * 0.3; rr = r * 0.3
            d[li].ellipse([x + ox - rr, y + oy - rr, x + ox + rr, y + oy + rr], fill=(255, int(105 + 40 * near), 55, int((50 + 110 * near) * a)))
    out = lay[0]; out.alpha_composite(lay[1].filter(ImageFilter.GaussianBlur(1.2)))
    if glow:
        gl = Image.new('RGBA', (W, H), (0, 0, 0, 0)); gd = ImageDraw.Draw(gl)
        for x, y, r, a in glow:
            R = 3 + r * 2; gd.ellipse([x - R, y - R, x + R, y + R], fill=(255, 120, 40, int(110 * a)))
        out.alpha_composite(gl.filter(ImageFilter.GaussianBlur(4)))
    return out
def dust(tau):   # soft back-lit dust curtain trailing the front, then settling
    if tau < 0 or tau > TR + 1.6: return None
    lay = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    p = min(1, tau / TR); fy = Y0 + (Y1 - Y0) * (p * p * (3 - 2 * p)); fade = 1.0 if tau < TR else max(0, 1 - (tau - TR) / 1.6)
    for k in range(14):
        cx = 360 + k * 40 + 10 * np.sin(k * 1.7 + tau * 2); cy = fy - 20 - 30 * np.sin(k * 2.3) ** 2 - tau * 25
        rr = 40 + 25 * ((k * 7) % 3)
        d.ellipse([cx - rr, cy - rr * 0.6, cx + rr, cy + rr * 0.6], fill=(170, 85, 55, int(70 * fade)))
    return lay.filter(ImageFilter.GaussianBlur(18))
