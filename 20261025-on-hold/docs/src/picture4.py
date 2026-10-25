import numpy as np, subprocess, sys, os, math
from PIL import Image, ImageDraw, ImageFont, ImageFilter
sys.path.insert(0, os.path.dirname(__file__))
from timeline4 import *
from stutter4 import STUTTER_PLAN
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H = 1280, 720
MONO = "/usr/share/fonts/truetype/sand-box/google/IBM Plex Mono/IBMPlexMono-Medium.ttf"
INTER = "/usr/share/fonts/truetype/sand-box/google/Inter/Inter-VariableFont_opsz,wght.ttf"
def inter(size, wght):
    f = ImageFont.truetype(INTER, size)
    try: f.set_variation_by_axes([min(32, max(14, size)), wght])
    except Exception as e: print('font axes', e)
    return f
fmono = ImageFont.truetype(MONO, 24)
f_app = inter(15, 600); f_tt = inter(21, 650); f_body = inter(19, 420); f_title = inter(44, 300); f_icon = inter(22, 800)

def hold_value(t):
    if t < CALL_T0: return None
    if t < S(2): return t - CALL_T0
    v_prev = S(2) - CALL_T0
    for k in ERAS:
        ts, te = S(TRANS_IDX[k]), S(TRANS_IDX[k]) + SHOTS[TRANS_IDX[k]]['dur']
        hs = S(HOLD_IDX[k]); he = hs + SHOTS[HOLD_IDX[k]]['dur']
        if t < te:
            u = (t - ts) / (te - ts); u = u * u * (3 - 2 * u)
            return math.exp(math.log(max(v_prev, 1)) + (math.log(HOLD_AT[k]) - math.log(max(v_prev, 1))) * u)
        if t < he: return HOLD_AT[k] + (t - hs)
        v_prev = HOLD_AT[k] + (he - hs)
    return v_prev
def fmt(s):
    s = int(s); y, r = divmod(s, int(YEAR)); d, r = divmod(r, 86400); h, r = divmod(r, 3600); m, sec = divmod(r, 60)
    hms = f"{h:02d}:{m:02d}:{sec:02d}"
    if y: return f"{y:,} YEARS  {d} DAYS  {hms}"
    if d: return f"{d} DAYS  {hms}"
    return hms
def shot_at(t):
    for i, s in enumerate(SHOTS):
        if s['start'] <= t < s['start'] + s['dur'] - 1e-6: return i, s
    return None, None
def decode(s):
    p = os.path.join(ROOT, 'assets', 'clips', s['clip'])
    f = s['dur'] / (s['b'] - s['a'])
    raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", str(s['a']), "-i", p, "-t", str(s['b'] - s['a'] + 0.1), "-vf",
                          f"setpts=PTS*{f},scale={W}:{H},fps={FPS}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3)

def stutter_frames(s):
    stills = [np.asarray(Image.open(os.path.join(ROOT, 'assets', 'stills', f)).convert('RGB').resize((W, H), Image.LANCZOS)).astype(np.float32) for f in STUTTER]
    out = []; r = np.random.default_rng(9)
    for si, nfr, flash in STUTTER_PLAN:
        for k in range(nfr):
            a = stills[si] * r.uniform(0.82, 1.18)
            if flash and k == 0: a = a * 0.35 + 255 * 0.65
            elif flash and k == 1: a = a * 0.8 + 255 * 0.2
            out.append(np.clip(a, 0, 255).astype(np.uint8))
    return np.stack(out)

def pill(img, text, color):
    d = ImageDraw.Draw(img, 'RGBA')
    tw = d.textlength(text, font=fmono) + 32
    x = (W - tw) / 2; y = H - 62
    sh = Image.new('RGBA', img.size, (0, 0, 0, 0)); sd = ImageDraw.Draw(sh)
    sd.rounded_rectangle([x - 18, y - 11, x + tw + 18, y + 41], 22, fill=(0, 0, 0, 125))
    img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(5)))
    d = ImageDraw.Draw(img, 'RGBA')
    d.ellipse([x, y + 9, x + 13, y + 22], fill=color + (255,))
    d.text((x + 28, y + 1), text, font=fmono, fill=(255, 255, 255, 235))

def wrap(d, text, font, maxw):
    words = text.split(' '); lines = []; cur = ''
    for w in words:
        trial = (cur + ' ' + w).strip()
        if d.textlength(trial, font=font) <= maxw: cur = trial
        else: lines.append(cur); cur = w
    lines.append(cur); return lines
def toast(img, title, body, age, life):
    tw_ = 600
    d0 = ImageDraw.Draw(img)
    lines = wrap(d0, body, f_body, tw_ - 110)
    th = 64 + 24 * len(lines)
    ease = lambda u: 1 - (1 - min(max(u, 0), 1)) ** 3
    yin = ease(age / 0.32); yout = ease((age - (life - 0.3)) / 0.3) if age > life - 0.3 else 0
    y = -th - 10 + (th + 32) * yin - (th + 42) * yout
    x = (W - tw_) // 2; y = int(y)
    if y + th < 0: return
    # frosted glass: blur the region under the toast
    box = (x, max(0, y), x + tw_, max(1, y + th))
    if box[3] > box[1]:
        reg = img.crop(box).filter(ImageFilter.GaussianBlur(14))
        mask = Image.new('L', (tw_, box[3] - box[1]), 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, y - box[1], tw_ - 1, y - box[1] + th - 1], 20, fill=255)
        img.paste(reg, box[:2], mask)
    ov = Image.new('RGBA', img.size, (0, 0, 0, 0)); d = ImageDraw.Draw(ov)
    d.rounded_rectangle([x, y, x + tw_, y + th], 20, fill=(28, 28, 32, 190), outline=(255, 255, 255, 40))
    # icon
    ix, iy = x + 18, y + 18
    for k in range(44):
        c = (int(255 - k * 1.5), int(70 + k * 1.2), int(140 + k * 2.2), 255)
        d.line([ix, iy + k, ix + 43, iy + k], fill=c)
    m = Image.new('L', img.size, 0); ImageDraw.Draw(m).rounded_rectangle([ix, iy, ix + 43, iy + 43], 11, fill=255)
    icon_layer = Image.new('RGBA', img.size, (0, 0, 0, 0)); icon_layer.paste(ov, (0, 0), m)
    ov2 = Image.new('RGBA', img.size, (0, 0, 0, 0)); d2 = ImageDraw.Draw(ov2)
    d2.rounded_rectangle([x, y, x + tw_, y + th], 20, fill=(28, 28, 32, 190), outline=(255, 255, 255, 40))
    img.alpha_composite(ov2); img.alpha_composite(icon_layer)
    d = ImageDraw.Draw(img, 'RGBA')
    pw = d.textlength("P+", font=f_icon); d.text((ix + 22 - pw / 2, iy + 9), "P+", font=f_icon, fill=(255, 255, 255, 255))
    tx = x + 76
    d.text((tx, y + 14), "PREMIUM+", font=f_app, fill=(200, 200, 210, 220))
    nw = d.textlength("now", font=f_app); d.text((x + tw_ - 20 - nw, y + 14), "now", font=f_app, fill=(170, 170, 180, 200))
    d.text((tx, y + 33), title, font=f_tt, fill=(255, 255, 255, 255))
    for i, ln in enumerate(lines): d.text((tx, y + 59 + 24 * i), ln, font=f_body, fill=(225, 225, 232, 245))

def main(out, t0=0.0, t1=None):
    t1 = END if t1 is None else t1
    ff = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                           "-c:v", "libx264", "-crf", "15", "-preset", "fast", "-pix_fmt", "yuv420p", out], stdin=subprocess.PIPE)
    cache = {}; rng = np.random.default_rng(5); flick = 1.0
    for fi in range(int(t0 * FPS), int(t1 * FPS)):
        t = fi / FPS
        i, s = shot_at(t)
        if s is not None:
            if i not in cache: cache = {i: decode(s) if s['clip'] else stutter_frames(s)}
            frames = cache[i]; k = min(len(frames) - 1, int(round((t - s['start']) * FPS)))
            fr = frames[k]
            u = (t - s['start']) / s['dur']
            img = Image.fromarray(fr)
            # slow push-in on holds (room), centred on the man
            if s['kind'] == 'room' and i not in (0, CRUMBLE):
                z = 1.0 + 0.045 * u
                cw, ch = W / z, H / z; cx = 640; cy = min(max(330, ch / 2), H - ch / 2)
                img = img.resize((W, H), Image.LANCZOS, box=(cx - cw / 2, cy - ch / 2, cx + cw / 2, cy + ch / 2))
            arr = np.asarray(img).astype(np.float32)
            if s['kind'] == 'trans':
                flick = 0.6 * flick + 0.4 * rng.uniform(0.72, 1.22)
                arr *= flick
                if t - s['start'] < 2 / FPS: arr = arr * 0.5 + 255 * 0.5
            if t < LEAD + 0.5: arr *= max(0, (t - LEAD) / 0.5)
            img = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)).convert('RGBA')
        else:
            img = Image.new('RGBA', (W, H), (0, 0, 0, 255))
        kind = s['kind'] if s else 'black'
        hv = hold_value(t)
        if kind in ('room', 'trans', 'trans7', 'cu', 'stutter'):
            if i == CRUMBLE: pill(img, "ON HOLD  " + fmt(max(0, t - REHOLD)), (255, 70, 60))
            elif t >= PICKUP: pill(img, "CONNECTED", (80, 220, 120))
            elif hv is not None: pill(img, "ON HOLD  " + fmt(hv), (255, 70, 60))
        if kind == 'black':
            pill(img, "ON HOLD  " + fmt(max(0, t - REHOLD)), (255, 70, 60))
            a = int(255 * min(1, max(0, (t - BLACK - 0.25) / 0.4)))
            d = ImageDraw.Draw(img, 'RGBA'); txt = "Your call is important to us."
            tw = d.textlength(txt, font=f_title); d.text(((W - tw) / 2, H / 2 - 44), txt, font=f_title, fill=(236, 236, 240, a))
        for si, (off, title, body) in TOASTS.items():
            ts = S(si) + off; life = 3.6 if len(body) < 50 else 4.4
            if si == CRUMBLE: life = BLACK - ts
            if ts <= t < ts + life and kind not in ('office', 'black'): toast(img, title, body, t - ts, life)
        ff.stdin.write(np.asarray(img.convert('RGB')).tobytes())
    ff.stdin.close(); ff.wait()

if __name__ == '__main__':
    a = float(sys.argv[2]) if len(sys.argv) > 2 else 0.0; b = float(sys.argv[3]) if len(sys.argv) > 3 else None
    main(sys.argv[1], a, b)
