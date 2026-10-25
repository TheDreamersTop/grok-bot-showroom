# v7: code-drawn clock hands over the wall clock (all room/trans/steps/stutter shots).
# One continuous minute-hand angle for the whole film: real time in holds (second hand ticks),
# fast spin through time-lapses (accelerating era by era, motion-blurred), jumps between stop-motion steps / strobe plates.
import numpy as np, math
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from timeline7 import *
from stutter4 import STUTTER_PLAN
CX, CY, RF = 639, 49, 43          # centre, face radius (inside the rim)
SS = 4; BOX = 50                  # supersample; half-size of the working patch
INTER = "/usr/share/fonts/truetype/sand-box/google/Inter/Inter-VariableFont_opsz,wght.ttf"
fnum = ImageFont.truetype(INTER, 12 * SS)
try: fnum.set_variation_by_axes([14, 560])
except Exception: pass
PEAK = {4: 1.6, 6: 2.6, 8: 4.0, 12: 6.5}     # trans shot -> peak minute-hand rev/s
def omega(t):
    i = None
    for j, s in enumerate(SHOTS):
        if s['start'] <= t < s['start'] + s['dur']: i = j; break
    if i is None: return 1 / 3600
    s = SHOTS[i]; u = (t - s['start']) / s['dur']
    if i in PEAK:
        p = PEAK[i]
        if s['kind'] == 'trans7': return p * min(1, math.sin(math.pi * min(u, 0.5)) ** 0.7) * (1 - max(0, u - 0.85) / 0.15 * 0.97)
        return p * math.sin(math.pi * u) ** 0.7
    if i == 13: return 1 / 3600 + 9.0 * u ** 2.2    # red era: timer races to the age of the universe
    return 1 / 3600
NF = int((END + 1) * FPS)
_rev = np.zeros(NF + 1)            # minute-hand revolutions at each frame time
_r = 10 / 60 + 0.0                 # starts at 10:10-ish like the painted clock
sub = 8
for f in range(NF):
    t = f / FPS; _rev[f] = _r
    for k in range(sub): _r += omega(t + (k + 0.5) / (FPS * sub)) / (FPS * sub)
_rev[NF] = _r
# discrete jumps: stop-motion steps (5 states) and strobe plates
def jumps(t):
    j = 0.0
    s2 = SHOTS[2]
    if t >= s2['start']:
        n = min(4, int((min(t, s2['start'] + s2['dur'] - 1e-6) - s2['start']) / (s2['dur'] / 5)))
        j += [0, 7.3, 15.55, 22.9, 30.2][n] if t < s2['start'] + s2['dur'] else 37.45
    s10 = SHOTS[10]
    if t >= s10['start']:
        acc = 0.0; k = 0
        for si, nfr, fl in STUTTER_PLAN:
            if t >= s10['start'] + acc: k += 1
            acc += nfr / FPS
        j += 1.37 * k
    return j
def rev_at(t):
    f = t * FPS; i = int(min(max(f, 0), NF - 1)); a = f - i
    return _rev[i] * (1 - a) + _rev[i + 1] * a + jumps(t)

def _hand(d, ang, L, w, tail, col):
    s, c = math.sin(ang), -math.cos(ang); cx = cy = BOX * SS
    d.line([cx - s * tail * SS, cy - c * tail * SS, cx + s * L * SS, cy + c * L * SS], fill=col, width=max(1, int(w * SS)))
def overlay(img, t, holdlike):
    """img: PIL RGB(A) 1280x720 source frame (before push-in). Replaces the face + hands of the wall clock."""
    arr = np.asarray(img.convert('RGB')).astype(np.float32)
    y0, y1 = max(0, CY - BOX), CY + BOX; x0, x1 = CX - BOX, CX + BOX
    patch = arr[y0:y1, x0:x1]
    yy, xx = np.mgrid[y0:y1, x0:x1]; rr = np.hypot(xx - CX, yy - CY)
    inner = rr < RF - 3
    px = patch[inner]; lum = px.mean(1)
    face = px[(lum >= np.percentile(lum, 45)) & (lum <= np.percentile(lum, 90))].mean(0); ink = px[lum <= np.percentile(lum, 4)].mean(0)
    ink = face * 0.12 + ink * 0.45           # painted-ink darkness, in the scene's tint
    # draw face at SS
    S2 = 2 * BOX * SS
    lay = Image.new('L', (S2, S2), 0); d = ImageDraw.Draw(lay)   # 0 = face, 255 = ink
    for h in range(1, 13):
        a = h / 12 * 2 * math.pi; r = 33.5 * SS
        txt = str(h); tw = d.textlength(txt, font=fnum)
        d.text((BOX * SS + math.sin(a) * r - tw / 2, BOX * SS - math.cos(a) * r - 8 * SS), txt, font=fnum, fill=235)
    for m in range(60):
        a = m / 60 * 2 * math.pi; r0 = (40.5 if m % 5 else 39.0) * SS; r1 = 42.3 * SS
        d.line([BOX*SS + math.sin(a)*r0, BOX*SS - math.cos(a)*r0, BOX*SS + math.sin(a)*r1, BOX*SS - math.cos(a)*r1], fill=200, width=SS if m % 5 else 2*SS)
    # hands with motion blur over a half-frame shutter
    rv0 = rev_at(t); rv1 = rev_at(t + 0.5 / FPS); sweep = abs(rv1 - rv0) * 360
    n = int(min(64, max(1, sweep / 1.5)))
    hl = np.zeros((S2, S2), np.float32)
    for k in range(n):
        rv = rv0 + (rv1 - rv0) * (k + 0.5) / n
        h = Image.new('L', (S2, S2), 0); hd = ImageDraw.Draw(h)
        _hand(hd, rv / 12 * 2 * math.pi, 22, 3.2, 4, 255)
        _hand(hd, rv * 2 * math.pi, 33, 2.2, 5, 255)
        hl += np.asarray(h, np.float32) / n
    sec_vis = max(0.0, 1 - (rv1 - rv0) * FPS * 2 / 0.05)
    if sec_vis > 0 and holdlike:
        secs = rv0 * 3600; base = math.floor(secs); fr = secs - base
        pos = base + min(1, fr / 0.08) ** 0.5 + (0.04 * math.sin(min(1, fr / 0.18) * math.pi) if fr < 0.18 else 0)   # tick with a tiny overshoot
        h = Image.new('L', (S2, S2), 0); hd = ImageDraw.Draw(h)
        _hand(hd, pos / 60 * 2 * math.pi, 36, 0.9, 8, 255)
        hl += np.asarray(h, np.float32) * 0.85 * sec_vis
    inkm = np.maximum(np.asarray(lay, np.float32), np.minimum(255, hl * (1.0 if n == 1 else 1.25)))
    ink_s = np.asarray(Image.fromarray(inkm.clip(0, 255).astype(np.uint8)).resize((2 * BOX, 2 * BOX), Image.LANCZOS)
                       .filter(ImageFilter.GaussianBlur(0.55)), np.float32)[(y0 - (CY - BOX)):, :] / 255
    # hub
    hub = np.clip(1 - (rr - 2.4), 0, 1); ink_s = np.maximum(ink_s, hub)
    newp = face[None, None] * (1 - ink_s[..., None]) + ink[None, None] * ink_s[..., None]
    # keep the scene's own soft lighting gradient across the face (low-pass of the original, normalised)
    lowp = np.asarray(Image.fromarray(patch.clip(0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(9)), np.float32)
    g = (lowp.mean(-1, keepdims=True) + 8) / (lowp[inner].mean() + 8); newp *= np.clip(g, 0.75, 1.25) ** 0.6
    newp += np.random.default_rng(int(t * 1000)).normal(0, 2.2, newp.shape)
    m = np.clip((RF - rr) / 2.0, 0, 1)[..., None]
    arr[y0:y1, x0:x1] = patch * (1 - m) + newp * m
    return Image.fromarray(arr.clip(0, 255).astype(np.uint8))
