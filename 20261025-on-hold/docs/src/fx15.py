# v15: the phone falls with weight. The plate phone (lying on the pile peak) is painted out of the pile plate for the whole
# shot; a sprite cut from it is released from the hand when the sand front reaches it, falls ~8 frames under gravity
# (accelerating, rotating, motion-blurred), lands lower on the pile's front slope with a puff + grain spray + a tiny settle bounce,
# then rests there glowing; a few grains slide down the slope after impact.
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFilter
W, H, FPS = 1280, 720, 24
QUAD = np.array([(601, 465), (650, 457), (688, 509), (639, 522)], np.float32)   # plate phone corners (src frame)
PC = QUAD.mean(0)                                                               # its centre
HAND = np.array([592.0, 514.0])        # phone in the hand (frame A), centre
LANDP = np.array([624.0, 566.0])       # landing spot on the pile's front slope
FALL = 8                               # frames of free fall
_mask = np.zeros((H, W), np.uint8); cv2.fillPoly(_mask, [QUAD.astype(np.int32)], 255)
HALO = np.zeros((H, W), np.uint8); cv2.ellipse(HALO, (int(PC[0]), int(PC[1]) - 26), (70, 26), -8, 0, 360, 255, -1)
HALO_F = cv2.GaussianBlur(HALO.astype(np.float32) / 255, (0, 0), 9)[..., None] * (np.arange(H)[:, None, None] < 470)
PAINT = cv2.dilate(_mask, np.ones((23, 23), np.uint8))
A_PHONE = np.zeros((H, W), np.uint8); cv2.fillPoly(A_PHONE, [np.array([(574, 486), (606, 484), (612, 536), (576, 538)], np.int32)], 255)
A_PHONE = cv2.dilate(A_PHONE, np.ones((11, 11), np.uint8))
def paint_out_A(A):   # phone out of the hand (frame A) once it has been released
    return cv2.inpaint(np.clip(A, 0, 255).astype(np.uint8), A_PHONE, 9, cv2.INPAINT_TELEA).astype(np.float32)
_feather = cv2.GaussianBlur(cv2.dilate(_mask, np.ones((17, 17), np.uint8)).astype(np.float32) / 255, (0, 0), 3)[..., None]
SHIFT = -100                            # texture donor: same rows, 100 px to the left (pile slope)
GLOW = np.zeros((H, W), np.uint8); cv2.ellipse(GLOW, (int(PC[0]), int(PC[1]) - 18), (95, 52), -6, 0, 360, 255, -1)
GLOW_F = cv2.GaussianBlur(GLOW.astype(np.float32) / 255, (0, 0), 12)[..., None]
def paint_out(B):
    """remove the plate phone + its glow from a pile-plate frame.
    glow: swap the low frequencies inside a soft ellipse for low frequencies inpainted from outside it (texture kept);
    phone: inpaint + donor sand grain (high-pass) inside the (small) quad mask"""
    B = B.astype(np.float32)
    lo = cv2.GaussianBlur(B, (0, 0), 10)
    sm = cv2.resize(lo, (W // 4, H // 4), interpolation=cv2.INTER_AREA)
    gm = cv2.resize(GLOW, (W // 4, H // 4), interpolation=cv2.INTER_NEAREST)
    lo_in = cv2.inpaint(np.clip(sm, 0, 255).astype(np.uint8), gm, 9, cv2.INPAINT_TELEA).astype(np.float32)
    lo_in = cv2.GaussianBlur(cv2.resize(lo_in, (W, H), interpolation=cv2.INTER_LINEAR), (0, 0), 6)
    B = B - (lo - lo_in) * GLOW_F
    B8 = np.clip(B, 0, 255).astype(np.uint8)
    inp = cv2.inpaint(B8, PAINT, 7, cv2.INPAINT_TELEA).astype(np.float32)
    donor = np.roll(B8, -SHIFT, axis=1).astype(np.float32)
    hp = donor - cv2.GaussianBlur(donor, (0, 0), 3)
    return B * (1 - _feather) + (inp + hp * 0.9) * _feather
def make_sprite(Bsrc):
    """cut the plate phone out (RGBA), axis-aligned: returns RGBA PIL image, its own centre is the phone centre"""
    w, h = 56, 74
    dst = np.array([(0, 0), (w, 0), (w, h), (0, h)], np.float32)
    # QUAD order: top-left, top-right(short edge), bottom-right, bottom-left -> rectify (short edge on top)
    M = cv2.getPerspectiveTransform(QUAD, dst)
    rgb = cv2.warpPerspective(np.asarray(Bsrc, np.uint8), M, (w, h), flags=cv2.INTER_CUBIC)
    a = np.full((h, w), 255, np.uint8); a[:1] = a[-1:] = 0; a[:, :1] = a[:, -1:] = 0
    a = cv2.GaussianBlur(a, (3, 3), 0.8)
    return Image.fromarray(np.dstack([rgb, a]), 'RGBA')
def ease_fall(u):   # 0..1 time -> 0..1 distance under gravity from rest
    return u * u
Q0 = QUAD - PC                                                   # plate phone shape (lying, perspective), centred
def _rot(q, deg):
    a = np.deg2rad(deg); R = np.array([[np.cos(a), -np.sin(a)], [np.sin(a), np.cos(a)]]); return q @ R.T
QSTART = _rot(np.array([(-11, -31), (11, -31), (11, 31), (-11, 31)], np.float32), -18)   # in the hand: edge-on, upright, tilted
QLAND = _rot(Q0, 8)                                                                        # resting on the slope, a little turned
def phone_state(tau, t_rel):
    """returns (quad corners in frame px, velocity px/frame) or None before release"""
    if tau < t_rel: return None
    fr = (tau - t_rel) * FPS
    if fr < FALL:   # free fall from rest: distance ~ t^2, tumbling from upright to flat
        u = fr / FALL; d = u * u
        c = HAND + (LANDP - HAND) * np.array([0.35 * u + 0.65 * d, d])
        shape = QSTART * (1 - u) + QLAND * u
        shape = _rot(shape, 35 * np.sin(np.pi * u))
        v = (LANDP - HAND) * np.array([0.35 + 1.3 * u, 2 * u]) / FALL
        return shape + c, v
    k = fr - FALL   # settle: a 3-frame hop of 6 px, a 2-frame 1.5 px rebound, a little rotational wobble, then rest
    b = (6 * np.sin(np.pi * k / 3) if k < 3 else 0) + (1.5 * np.sin(np.pi * (k - 3) / 2) if 3 <= k < 5 else 0)
    shape = _rot(QLAND, -5 * np.exp(-k / 2) * np.cos(k * 1.8)) if k < 8 else QLAND
    return shape + LANDP - np.array([0, b]), np.zeros(2)
SPW, SPH = 56, 74
def draw_phone(img, spr, st, glow=1.0):
    """img: PIL RGBA. warps the sprite onto the quad, motion-blurred along v; contact shadow + soft glow when resting"""
    q, v = st; c = q.mean(0); sp = np.asarray(spr, np.float32)
    src = np.array([(0, 0), (SPW, 0), (SPW, SPH), (0, SPH)], np.float32)
    n = int(min(9, max(1, np.hypot(*v) / 3)))
    lay = np.zeros((H, W, 4), np.float32)
    for k in range(n):
        off = -v * (k / (n - 1) - 0.5) * 0.9 if n > 1 else np.zeros(2)
        M = cv2.getPerspectiveTransform(src, (q + off).astype(np.float32))
        lay += cv2.warpPerspective(sp, M, (W, H), flags=cv2.INTER_LINEAR)
    lay /= n
    if np.hypot(*v) < 1:
        sh = Image.new('L', img.size, 0); ImageDraw.Draw(sh).polygon([tuple(p) for p in (q + [3, 7])], fill=120)
        sh = sh.filter(ImageFilter.GaussianBlur(6)); dark = Image.new('RGBA', img.size, (0, 0, 0, 255)); dark.putalpha(sh)
        img.alpha_composite(dark)
    gl = Image.new('L', img.size, 0); ImageDraw.Draw(gl).ellipse([c[0] - 62, c[1] - 46, c[0] + 62, c[1] + 22], fill=int(60 * glow))
    gl = gl.filter(ImageFilter.GaussianBlur(18)); light = Image.new('RGBA', img.size, (190, 215, 235, 255)); light.putalpha(gl)
    img.alpha_composite(light)
    img.alpha_composite(Image.fromarray(lay.clip(0, 255).astype(np.uint8), 'RGBA'))
    return img
rng = np.random.default_rng(15)
NS = 90
sp_v = np.stack([rng.normal(0, 70, NS), -rng.uniform(40, 160, NS)], 1)       # impact spray (px/s)
sp_sz = rng.uniform(0.7, 1.7, NS); sp_c = rng.uniform(0.75, 1.15, NS)
NSL = 40                                                                   # grains sliding down the slope after impact
sl_x = LANDP[0] + rng.uniform(-110, 110, NSL); sl_t0 = rng.uniform(0.05, 1.2, NSL); sl_sp = rng.uniform(25, 70, NSL)
def spray(t):   # t since impact
    if t < 0 or t > 1.4: return None
    lay = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(lay)
    if t < 0.6:
        p = LANDP + np.array([0, 8]) + sp_v * t + np.array([0, 420]) * t * t
        a = int(230 * (1 - t / 0.6))
        for (x, y), r, cc in zip(p, sp_sz, sp_c):
            d.ellipse([x - r, y - r, x + r, y + r], fill=(int(170 * cc), int(92 * cc), int(60 * cc), a))
    for x0, t0, sp in zip(sl_x, sl_t0, sl_sp):   # slope: y rises toward the centre (pile peak ~ x 640, y 470)
        u = t - t0
        if 0 <= u < 0.9:
            dx = np.sign(x0 - 640) * sp * u; x = x0 + dx; y = 478 + abs(x - 640) * 0.55 + 4 * np.sin(x0)
            a = int(170 * np.sin(np.pi * u / 0.9)); r = 1.2
            d.ellipse([x - r, y - r, x + r, y + r], fill=(175, 95, 60, a))
    return lay.filter(ImageFilter.GaussianBlur(0.6))
