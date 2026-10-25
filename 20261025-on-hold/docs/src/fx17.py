# v17: fx16's phone graded into the red-lit room (REVIEW-12: 'looks composited in').
# body/bezel multiplied toward the room's warm key (pile ~ R:G:B 1 : 0.45 : 0.29), warm rim on the edges facing the lava floor
# (down-screen) + a faint red back-rim from the window, screen dimmed to ~55% and kept slightly cool, grain matched to the plate
# (hp sigma ~4), a 0.5 px softening, and a soft warm-dark contact shadow on the pile (growing in over the last fall frames).
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFilter
from fx16 import *
import fx16
from fx16 import _rot

KEY = np.array([1.0, 0.45, 0.29])
def make_sprite(_unused=None):
    sp = np.asarray(fx16.make_sprite(), np.float32).copy()
    k = 4; w, h = SPW * k, SPH * k                                   # screen mask, same geometry as fx16
    m = Image.new('L', (w, h), 0); ImageDraw.Draw(m).rounded_rectangle([4 * k, 5 * k, w - 4 * k - 1, h - 5 * k - 1], radius=6 * k, fill=255)
    scr = np.asarray(m.resize((SPW, SPH), Image.LANCZOS), np.float32)[..., None] / 255
    rgb = sp[..., :3]
    body = rgb * np.array([1.30, 0.62, 0.45]) + np.array([14, 4, 2])                 # dark body under a warm red key
    screen = rgb * 0.55 + np.array([90, 40, 26]) * 0.10                               # ~55% brightness, still slightly cool
    sp[..., :3] = body * (1 - scr) + screen * scr
    return Image.fromarray(sp.clip(0, 255).astype(np.uint8), 'RGBA')

_rng = np.random.default_rng(17)
def _shadow(img, q, op):
    sh = Image.new('L', img.size, 0); ImageDraw.Draw(sh).polygon([tuple(p) for p in (q * 1.06 - q.mean(0) * 0.06 + [2, 6])], fill=int(op))
    sh = sh.filter(ImageFilter.GaussianBlur(7)); dark = Image.new('RGBA', img.size, (22, 6, 3, 255)); dark.putalpha(sh)
    img.alpha_composite(dark)

def draw_phone(img, spr, st, alpha=1.0, glow=0.30, tau=None, t_rel=None):
    q, v = st; c = q.mean(0); sp = np.asarray(spr, np.float32).copy(); sp[..., 3] *= alpha
    src = np.array([(0, 0), (SPW, 0), (SPW, SPH), (0, SPH)], np.float32)
    n = int(min(9, max(1, np.hypot(*v) / 3)))
    lay = np.zeros((H, W, 4), np.float32)
    for k in range(n):
        off = -v * (k / (n - 1) - 0.5) * 0.9 if n > 1 else np.zeros(2)
        M = cv2.getPerspectiveTransform(src, (q + off).astype(np.float32))
        lay += cv2.warpPerspective(sp, M, (W, H), flags=cv2.INTER_LINEAR)
    lay /= n
    # contact shadow on the pile: full when resting; fades in over the last 3 fall frames at the landing spot
    if np.hypot(*v) < 1: _shadow(img, q, 150 * alpha)
    elif tau is not None:
        fr = (tau - t_rel) * FPS
        if fr > FALL - 3: _shadow(img, QLAND + LANDP, 150 * (fr - (FALL - 3)) / 3 * 0.6)
    # rim light in screen space from the alpha edge: warm orange where the edge faces down (lava floor), faint red facing up (window)
    a = lay[..., 3] / 255.0
    x0, x1 = int(max(0, c[0] - 90)), int(min(W, c[0] + 90)); y0, y1 = int(max(0, c[1] - 90)), int(min(H, c[1] + 90))
    A = a[y0:y1, x0:x1]
    if A.max() > 0:
        gy = cv2.Sobel(A, cv2.CV_32F, 0, 1, ksize=3); gx = cv2.Sobel(A, cv2.CV_32F, 1, 0, ksize=3)
        edge = np.clip(-gy, 0, None) * 0.85 + np.clip(gx, 0, None) * 0.25            # down-facing (and a little left-facing) edges
        back = np.clip(gy, 0, None) * 0.25
        edge = cv2.GaussianBlur(edge, (0, 0), 1.2)[..., None] * A[..., None]; back = cv2.GaussianBlur(back, (0, 0), 0.8)[..., None] * A[..., None]
        rgb = lay[y0:y1, x0:x1, :3]
        rgb += edge * np.array([255, 120, 50]) * 0.36 * alpha + back * np.array([190, 40, 22]) * 0.35 * alpha
        # grain match (plate hp sigma ~4) + 0.5 px softening, inside the phone only
        g = _rng.normal(0, 3.6, A.shape)[..., None] + _rng.normal(0, 1.4, A.shape + (3,))
        rgb += g * (lay[y0:y1, x0:x1, 3:4] > 1)
        lay[y0:y1, x0:x1, :3] = rgb
        lay[y0:y1, x0:x1] = cv2.GaussianBlur(lay[y0:y1, x0:x1], (0, 0), 0.5)
    # screen spill: dimmer, still a touch cool
    gl = Image.new('L', img.size, 0); ImageDraw.Draw(gl).ellipse([c[0] - 56, c[1] - 42, c[0] + 56, c[1] + 20], fill=int(60 * glow * alpha))
    gl = gl.filter(ImageFilter.GaussianBlur(18)); light = Image.new('RGBA', img.size, (150, 165, 185, 255)); light.putalpha(gl)
    img.alpha_composite(light)
    img.alpha_composite(Image.fromarray(lay.clip(0, 255).astype(np.uint8), 'RGBA'))
    return img
