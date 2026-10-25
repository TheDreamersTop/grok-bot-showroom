# v16: fx15's phone drop, with a phone that reads as a phone (dark body/bezel, dim screen with a hint of a call UI)
# and no size/brightness pop on the release frame (smaller edge-on start, fade-in over the first 2 frames).
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFilter
from fx15 import *            # QUAD, HAND, LANDP, FALL, paint_out, paint_out_A, spray, _rot, Q0, QLAND, SPW, SPH ...
import fx15
from fx15 import _rot, _mask

def make_sprite(_unused=None):
    """procedural 56x74 phone, drawn 4x and downsampled: dark body + thin lit edge, dim cool screen, faint call UI"""
    k = 4; w, h = SPW * k, SPH * k
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, w - 1, h - 1], radius=9 * k, fill=(24, 24, 28, 255), outline=(78, 78, 86, 255), width=k)
    sx0, sy0, sx1, sy1 = 4 * k, 5 * k, w - 4 * k, h - 5 * k
    scr = np.zeros((sy1 - sy0, sx1 - sx0, 3), np.float32)
    g = np.linspace(0, 1, sy1 - sy0)[:, None, None]
    scr[:] = np.array([128, 140, 156]) * (1 - g) + np.array([92, 102, 118]) * g          # dim, cool, top-lit
    sim = Image.fromarray(scr.astype(np.uint8)); sd = ImageDraw.Draw(sim); sw, sh_ = sim.size
    sd.rectangle([2 * k, 1 * k, sw - 2 * k, 2 * k], fill=(160, 170, 182))                 # status bar
    sd.ellipse([sw / 2 - 7 * k, 9 * k, sw / 2 + 7 * k, 23 * k], fill=(150, 158, 170))       # caller avatar
    sd.rectangle([sw / 2 - 12 * k, 27 * k, sw / 2 + 12 * k, 29 * k], fill=(165, 172, 184))  # name line
    sd.rectangle([sw / 2 - 7 * k, 32 * k, sw / 2 + 7 * k, 33.5 * k], fill=(130, 140, 152))  # call timer
    for i in range(3):                                                                     # keypad/mute row
        cx = sw / 2 + (i - 1) * 12 * k; sd.ellipse([cx - 3 * k, 41 * k, cx + 3 * k, 47 * k], fill=(112, 122, 136))
    sd.ellipse([sw / 2 - 4.5 * k, sh_ - 13 * k, sw / 2 + 4.5 * k, sh_ - 4 * k], fill=(168, 70, 62))   # red 'end call'
    m = Image.new('L', sim.size, 0); ImageDraw.Draw(m).rounded_rectangle([0, 0, sw - 1, sh_ - 1], radius=6 * k, fill=255)
    im.paste(sim, (sx0, sy0), m)
    return im.resize((SPW, SPH), Image.LANCZOS)

QSTART = _rot(np.array([(-8, -24), (8, -24), (8, 24), (-8, 24)], np.float32), -18)   # in the hand: edge-on (matches the A phone)
def phone_state(tau, t_rel):
    if tau < t_rel: return None
    fr = (tau - t_rel) * FPS
    if fr < FALL:
        u = fr / FALL; d = u * u
        c = HAND + (LANDP - HAND) * np.array([0.35 * u + 0.65 * d, d])
        shape = _rot(QSTART * (1 - u) + QLAND * u, 35 * np.sin(np.pi * u))
        v = (LANDP - HAND) * np.array([0.35 + 1.3 * u, 2 * u]) / FALL
        return shape + c, v
    k = fr - FALL
    b = (6 * np.sin(np.pi * k / 3) if k < 3 else 0) + (1.5 * np.sin(np.pi * (k - 3) / 2) if 3 <= k < 5 else 0)
    shape = _rot(QLAND, -5 * np.exp(-k / 2) * np.cos(k * 1.8)) if k < 8 else QLAND
    return shape + LANDP - np.array([0, b]), np.zeros(2)

def release_mix(tau, t_rel):
    """0 before release; 0.5 on the release frame; 1 from the next frame: hand-phone -> painted-out hand, and sprite opacity"""
    if tau < t_rel: return 0.0
    fr = (tau - t_rel) * FPS
    return 0.5 if fr < 0.5 else 1.0

def draw_phone(img, spr, st, alpha=1.0, glow=0.6):
    q, v = st; c = q.mean(0); sp = np.asarray(spr, np.float32).copy(); sp[..., 3] *= alpha
    src = np.array([(0, 0), (SPW, 0), (SPW, SPH), (0, SPH)], np.float32)
    n = int(min(9, max(1, np.hypot(*v) / 3)))
    lay = np.zeros((H, W, 4), np.float32)
    for k in range(n):
        off = -v * (k / (n - 1) - 0.5) * 0.9 if n > 1 else np.zeros(2)
        M = cv2.getPerspectiveTransform(src, (q + off).astype(np.float32))
        lay += cv2.warpPerspective(sp, M, (W, H), flags=cv2.INTER_LINEAR)
    lay /= n
    if np.hypot(*v) < 1:
        sh = Image.new('L', img.size, 0); ImageDraw.Draw(sh).polygon([tuple(p) for p in (q + [3, 7])], fill=int(120 * alpha))
        sh = sh.filter(ImageFilter.GaussianBlur(6)); dark = Image.new('RGBA', img.size, (0, 0, 0, 255)); dark.putalpha(sh)
        img.alpha_composite(dark)
    gl = Image.new('L', img.size, 0); ImageDraw.Draw(gl).ellipse([c[0] - 56, c[1] - 42, c[0] + 56, c[1] + 20], fill=int(60 * glow * alpha))
    gl = gl.filter(ImageFilter.GaussianBlur(18)); light = Image.new('RGBA', img.size, (170, 195, 220, 255)); light.putalpha(gl)
    img.alpha_composite(light)
    img.alpha_composite(Image.fromarray(lay.clip(0, 255).astype(np.uint8), 'RGBA'))
    return img

# v16: rebuild the pile's apex where the plate phone used to sit (fx15 left a notch): extend the two slope edges measured on the plate
# (left y = 528 - 0.66 (x - 520), right y = 487 + 0.63 (x - 700), apex ~ (640, 449)) and fill below that ridge with sand texture
# copied from the same depth below the ridge on the opposite, intact parts of the slopes (+-110 px).
def ridge(x): return np.maximum(528 - 0.66 * (x - 520), 487 + 0.63 * (x - 700)) + 3.0 * np.exp(-((x - 640) / 14.0) ** 2)  # slightly rounded apex
_yy, _xx = np.mgrid[0:H, 0:W].astype(np.float32)
_dd = _yy - ridge(_xx)
_xs = np.where(_xx >= 640, _xx - 110, _xx + 110).astype(np.float32)
_ys = (ridge(_xs) + _dd).astype(np.float32)
_core = ((_xx > 596) & (_xx < 692) & (_yy < 530)).astype(np.float32)
_reg = np.clip(cv2.GaussianBlur(_core, (0, 0), 12) * 2.0, 0, 1)              # wide, soft blend into the intact sand
_ring = (_reg > 0.05) & (_reg < 0.6) & (_dd > 4)                             # intact sand around the fill: tone reference
APEX_F = (_reg * np.clip(_dd + 1.5, 0, 1.5) / 1.5)[..., None]   # below the ridge only, soft 1.5 px edge
def paint_out(B):
    out = fx15.paint_out(B)
    donor = cv2.remap(np.asarray(B, np.float32), _xs, _ys, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    gain = out[_ring].mean(0) / (donor[_ring].mean(0) + 1e-3)                    # match the fill's tone to the sand around it
    yy = np.clip((_yy - 449) / 90.0, 0, 1)[..., None]
    donor = donor * gain * (1.08 - 0.08 * yy)                                     # apex a touch brighter (top-lit), as the slopes are
    return out * (1 - APEX_F) + donor * APEX_F
