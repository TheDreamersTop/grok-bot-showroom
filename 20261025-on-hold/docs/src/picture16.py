import numpy as np, subprocess, sys, os, math
from PIL import Image, ImageDraw, ImageFont, ImageFilter
sys.path.insert(0, os.path.dirname(__file__))
from timeline16 import *
import strobe5, fx7 as fx6, clock7, fx9, fx16
clock7.SHOTS = SHOTS
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
        if k == 7:
            if t < he: return HOLD_AT[7] * math.exp(ACC * ((t - hs) / (he - hs)) ** 2.2)
            v_prev = HOLD_AT[7] * math.exp(ACC) + (t - he); return v_prev
        if t < he: return HOLD_AT[k] + (t - hs)
        v_prev = HOLD_AT[k] + (he - hs)
    return v_prev
ACC = math.log(13.79e9 / 4903118422)   # red era: timer races to the age of the universe
def fmt(s):
    s = int(s); y, r = divmod(s, int(YEAR)); d, r = divmod(r, 86400); h, r = divmod(r, 3600); m, sec = divmod(r, 60)
    hms = f"{h:02d}:{m:02d}:{sec:02d}"
    pl = lambda n, w: f"{n:,} {w}" + ("" if n == 1 else "S")   # v12: 1 YEAR / 1 DAY
    if y: return f"{pl(y, 'YEAR')}  {pl(d, 'DAY')}  {hms}"
    if d: return f"{pl(d, 'DAY')}  {hms}"
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

def floor_dof(img):
    a = np.asarray(img, np.float32)
    b1 = np.asarray(img.filter(ImageFilter.GaussianBlur(1.3)), np.float32)
    b2 = np.asarray(img.filter(ImageFilter.GaussianBlur(3.0)), np.float32)
    y = np.arange(H, dtype=np.float32)[:, None, None]
    d = np.clip((300 - y) / 190, 0, 1)                 # 0 at y>=300 (Alex's row and nearer), 1 at the far rows
    w1 = np.clip(d * 2, 0, 1); w2 = np.clip(d * 2 - 1, 0, 1)
    out = a * (1 - w1) + b1 * w1; out = out * (1 - w2) + b2 * w2
    haze = np.array([228, 232, 236], np.float32); hz = (np.clip((260 - y) / 230, 0, 1) ** 1.4) * 0.22
    out = out * (1 - hz) + haze * hz
    return Image.fromarray(out.clip(0, 255).astype(np.uint8))
def _fixmask():
    m = Image.new('L', (W, H), 0); d = ImageDraw.Draw(m)
    d.rectangle([0, 0, W, 470], fill=255)
    d.rectangle([420, 135, 855, 382], fill=0)          # window glass: the world outside keeps changing
    d.rectangle([618, 135, 662, 382], fill=255)        # mullion is frame
    d.polygon([(x, y) for x, y in strobe5.POLY], fill=0)
    m = m.filter(ImageFilter.MaxFilter(1)).filter(ImageFilter.GaussianBlur(10))
    return np.asarray(m, np.float32) / 255
FIXMASK = None
def stutter_frames(s):
    stills = strobe5.plates(STUTTER)
    out = []; r = np.random.default_rng(9)
    for si, nfr, flash in STUTTER_PLAN:
        for k in range(nfr):
            a = stills[si] * r.uniform(0.82, 1.18)
            if flash and k == 0: a = a * 0.35 + 255 * 0.65
            elif flash and k == 1: a = a * 0.8 + 255 * 0.2
            out.append(np.clip(a, 0, 255).astype(np.uint8))
    return np.stack(out)

def pick_steps(frames, n):
    # stop-motion: n discrete states, each the sharpest frame near its target time (no half-faded boxes)
    out = []; L = len(frames)
    for j in range(n):
        c = int((j + 1) / n * (L - 1)); lo, hi = max(0, c - 7), min(L, c + 1) if j == n - 1 else min(L, c + 8)
        best, bs = c, -1
        for q in range(lo, hi):
            g = frames[q, ::4, ::4].mean(-1); lap = np.abs(np.diff(g, 2, 0)).mean() + np.abs(np.diff(g, 2, 1)).mean()
            if lap > bs: bs, best = lap, q
        out.append(best)
    print('steps', out); return out

def pill(img, text, color, blur=0.0):
    d = ImageDraw.Draw(img, 'RGBA')
    tw = d.textlength(text, font=fmono) + 32
    x = (W - tw) / 2; y = H - 62
    sh = Image.new('RGBA', img.size, (0, 0, 0, 0)); sd = ImageDraw.Draw(sh)
    sd.rounded_rectangle([x - 18, y - 11, x + tw + 18, y + 41], 22, fill=(0, 0, 0, 125))
    img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(5)))
    d = ImageDraw.Draw(img, 'RGBA')
    d.ellipse([x, y + 9, x + 13, y + 22], fill=color + (255,))
    if blur <= 0.05:
        d.text((x + 28, y + 1), text, font=fmono, fill=(255, 255, 255, 235)); return
    lab = "ON HOLD  "; lw = d.textlength(lab, font=fmono)
    d.text((x + 28, y + 1), lab, font=fmono, fill=(255, 255, 255, 235))
    lay = Image.new('RGBA', img.size, (0, 0, 0, 0)); ld = ImageDraw.Draw(lay)
    for k in range(-3, 4):   # vertical smear = digits rolling
        ld.text((x + 28 + lw, y + 1 + k * blur * 1.6), text[len(lab):], font=fmono, fill=(255, 255, 255, int(235 / (1 + abs(k) * 0.9))))
    img.alpha_composite(lay.filter(ImageFilter.GaussianBlur(blur)))

def wrap(d, text, font, maxw):
    words = text.split(' '); lines = []; cur = ''
    for w in words:
        trial = (cur + ' ' + w).strip()
        if d.textlength(trial, font=font) <= maxw: cur = trial
        else: lines.append(cur); cur = w
    lines.append(cur); return lines
def toast(img, title, body, age, life, app="PREMIUM+"):
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
        c = (int(255 - k * 1.5), int(70 + k * 1.2), int(140 + k * 2.2), 255) if app == "PREMIUM+" else (int(70 + k), int(200 - k), 90, 255)
        d.line([ix, iy + k, ix + 43, iy + k], fill=c)
    m = Image.new('L', img.size, 0); ImageDraw.Draw(m).rounded_rectangle([ix, iy, ix + 43, iy + 43], 11, fill=255)
    icon_layer = Image.new('RGBA', img.size, (0, 0, 0, 0)); icon_layer.paste(ov, (0, 0), m)
    ov2 = Image.new('RGBA', img.size, (0, 0, 0, 0)); d2 = ImageDraw.Draw(ov2)
    d2.rounded_rectangle([x, y, x + tw_, y + th], 20, fill=(28, 28, 32, 190), outline=(255, 255, 255, 40))
    img.alpha_composite(ov2); img.alpha_composite(icon_layer)
    d = ImageDraw.Draw(img, 'RGBA')
    if app == "PREMIUM+":
        pw = d.textlength("P+", font=f_icon); d.text((ix + 22 - pw / 2, iy + 9), "P+", font=f_icon, fill=(255, 255, 255, 255))
    else:   # battery glyph, 1%
        d.rounded_rectangle([ix + 8, iy + 14, ix + 33, iy + 29], 3, outline=(255, 255, 255, 255), width=2)
        d.rectangle([ix + 34, iy + 18, ix + 36, iy + 25], fill=(255, 255, 255, 255))
        d.rectangle([ix + 11, iy + 17, ix + 12, iy + 26], fill=(255, 60, 50, 255))
    tx = x + 76
    d.text((tx, y + 14), app, font=f_app, fill=(200, 200, 210, 220))
    nw = d.textlength("now", font=f_app); d.text((x + tw_ - 20 - nw, y + 14), "now", font=f_app, fill=(170, 170, 180, 200))
    d.text((tx, y + 33), title, font=f_tt, fill=(255, 255, 255, 255))
    for i, ln in enumerate(lines): d.text((tx, y + 59 + 24 * i), ln, font=f_body, fill=(225, 225, 232, 245))

def main(out, t0=0.0, t1=None):
    global FIXMASK; FIXMASK = _fixmask()
    t1 = END if t1 is None else t1
    ff = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                           "-c:v", "libx264", "-crf", "15", "-preset", "fast", "-pix_fmt", "yuv420p", out], stdin=subprocess.PIPE)
    cache = {}; rng = np.random.default_rng(5); flick = 1.0
    for fi in range(int(t0 * FPS), int(t1 * FPS)):
        t = fi / FPS
        i, s = shot_at(t)
        ov = next((o for o in OVR if o['start'] <= t < o['start'] + o['dur']), None)
        if ov is not None: s = dict(ov, era=8); key = ('ovr', ov['clip'])
        else: key = i
        if s is not None:
            if key not in cache: cache = {key: decode(s) if s['clip'] else stutter_frames(s)}
            frames = cache[key]; k = min(len(frames) - 1, int(round((t - s['start']) * FPS)))
            if s['kind'] == 'steps':
                if 'steps' not in s: s['steps'] = pick_steps(frames, 5)
                k = s['steps'][min(4, int((t - s['start']) / (s['dur'] / 5)))]
            fr = frames[k]
            if i == CR_WIDE2:   # v9: figure -> sand, head down, over the pile plate
                if 'A' not in s:
                    s['A'] = decode(dict(clip=s['clip'], a=CR_A_SRC, b=CR_A_SRC + 0.1, dur=0.1))[0].astype(np.float32)
                if 'A0' not in s:   # v16: phone painted out of the pile plate (whole shot) and out of the hand (from release)
                    s['A0'] = fx16.paint_out_A(s['A']); s['SPR'] = fx16.make_sprite()
                tau_ = t - s['start']; rm_ = fx16.release_mix(tau_, T_REL)
                A_ = s['A'] * (1 - rm_) + s['A0'] * rm_
                fr = fx9.composite(A_, fx16.paint_out(frames[k]), tau_).clip(0, 255).astype(np.uint8)
            u = (t - s['start']) / s['dur']
            img = Image.fromarray(fr)
            if s['kind'] in ('trans', 'trans7'):   # v7: walls / window frame / clock settle into the end plate over the last half (no warping)
                wv = min(1.0, max(0.0, (u_ := (t - s['start']) / s['dur']) - 0.5) / 0.35); wv = wv * wv * (3 - 2 * wv)
                if wv > 0:
                    m = FIXMASK[..., None] * wv
                    img = Image.fromarray((fr * (1 - m) + frames[-1] * m).astype(np.uint8))
            if s['kind'] in ('room', 'trans', 'trans7', 'steps', 'stutter'):   # v7: code-drawn clock hands
                img = clock7.overlay(img, t, s['kind'] in ('room', 'steps', 'stutter'))
            if s['kind'] == 'floor':   # v10: slow push toward the Alex in the middle of the floor
                img = floor_dof(img)   # v12 (from v11): depth of field + haze on far rows
                z = 1.0 + 0.10 * ((t - s['start']) / s['dur']) ** 1.3; cw, ch = W / z, H / z; cx, cy = 640, 380
                cx = min(max(cw / 2, cx), W - cw / 2); cy = min(max(ch / 2, cy), H - ch / 2)
                img = img.resize((W, H), Image.LANCZOS, box=(cx - cw / 2, cy - ch / 2, cx + cw / 2, cy + ch / 2))
            if s['kind'] == 'ecu':   # v7: crop so the mouth stays below frame (eyes + beard only)
                z = 1.0 + 0.03 * min(1, max(0, (t - S(ECU)) / (SHOTS[ECU]['dur'] * 2)))
                bw, bh = 996 / z, 560 / z; bx = 643 - bw / 2; by = 0    # v9: between v7 (600) and v8 (480): lips out, eyes + blink fully in
                img = img.resize((W, H), Image.LANCZOS, box=(bx, by, bx + bw, by + bh)).filter(ImageFilter.UnsharpMask(2, 60, 2))
            # slow push-in on holds (room), centred on the man
            if s['kind'] == 'room' and i not in (0,) + CRUMBLE_SHOTS:
                z = 1.0 + 0.045 * u
                cw, ch = W / z, H / z; cx = 640; cy = min(max(330, ch / 2), H - ch / 2)
                img = img.resize((W, H), Image.LANCZOS, box=(cx - cw / 2, cy - ch / 2, cx + cw / 2, cy + ch / 2))
            if False:
                z = 1.0 + 0.07 * u; cw, ch = W / z, H / z; cx, cy = 650, 360
                cx = min(max(cw / 2, cx), W - cw / 2); cy = min(max(ch / 2, cy), H - ch / 2)
                img = img.resize((W, H), Image.LANCZOS, box=(cx - cw / 2, cy - ch / 2, cx + cw / 2, cy + ch / 2))
            arr = np.asarray(img).astype(np.float32)

            if s['kind'] == 'steps':
                arr *= [1.0, 0.96, 1.03, 0.97, 1.0][min(4, int((t - s['start']) / (s['dur'] / 5)))]
            if s['kind'] == 'trans':
                flick = 0.6 * flick + 0.4 * rng.uniform(0.72, 1.22)
                arr *= flick
                if t - s['start'] < 2 / FPS: arr = arr * 0.5 + 255 * 0.5
            if t < LEAD + 0.5: arr *= max(0, (t - LEAD) / 0.5)
            img = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)).convert('RGBA')
            if i == CR_WIDE2:
                tau = t - s['start']; tl_ = tau - TAU_LAND
                for L in (fx9.dust(tau), fx9.grains(tau), fx16.spray(tl_)):
                    if L is not None: img.alpha_composite(L)
                st_ = fx16.phone_state(tau, T_REL)   # v16: the phone falls from the hand (8 frames), lands on the impact frame, settles
                if st_ is not None: fx16.draw_phone(img, s['SPR'], st_, alpha=fx16.release_mix(tau, T_REL))
                L = fx6.puff_layer(tl_, int(fx16.LANDP[0]), int(fx16.LANDP[1]) + 4)
                if L is not None: img.alpha_composite(L)
                dx, dy = fx6.shake(tl_)
                if dx or dy:
                    img = Image.fromarray(np.roll(np.asarray(img), (dy, dx), (0, 1)))
        else:
            img = Image.new('RGBA', (W, H), (0, 0, 0, 255))
        kind = s['kind'] if s else 'black'
        if kind == 'floor': kind = 'office'
        hv = hold_value(t)
        if kind in ('room', 'trans', 'trans7', 'cu', 'ecu', 'stutter', 'steps') or (ov is not None and ov['kind'] == 'ecu'):
            if i in CRUMBLE_SHOTS: pill(img, "ON HOLD  " + fmt(max(0, t - REHOLD)), (255, 70, 60))
            elif t >= PICKUP: pill(img, "CONNECTED", (80, 220, 120))
            elif hv is not None:
                bl = 0.0
                if i == 13: bl = 2.6 * max(0, (t - S(13)) / SHOTS[13]['dur'] - 0.25) / 0.75
                pill(img, "ON HOLD  " + fmt(hv), (255, 70, 60), bl)
        if kind == 'black':
            pill(img, "ON HOLD  " + fmt(max(0, t - REHOLD)), (255, 70, 60))
            a = int(255 * min(1, max(0, (t - BLACK - 0.25) / 0.4)))
            d = ImageDraw.Draw(img, 'RGBA'); txt = "Your call is important to us."
            tw = d.textlength(txt, font=f_title); d.text(((W - tw) / 2, H / 2 - 44), txt, font=f_title, fill=(236, 236, 240, a))
        for si, (off, title, body) in TOASTS.items():
            ts = S(si) + off; life = 3.6 if len(body) < 50 else 4.4
            app = "PREMIUM+"
            if si == CR_WIDE2: life = BLACK - ts
            if title == "Low battery": life = 2.9; app = "BATTERY"
            if ts <= t < ts + life and kind not in ('office', 'black'): toast(img, title, body, t - ts, life, app)
        ff.stdin.write(np.asarray(img.convert('RGB')).tobytes())
    ff.stdin.close(); ff.wait()

if __name__ == '__main__':
    a = float(sys.argv[2]) if len(sys.argv) > 2 else 0.0; b = float(sys.argv[3]) if len(sys.argv) > 3 else None
    main(sys.argv[1], a, b)
