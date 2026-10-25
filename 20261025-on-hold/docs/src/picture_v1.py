import numpy as np, subprocess, sys, os, math
from PIL import Image, ImageDraw, ImageFont, ImageFilter
sys.path.insert(0, os.path.dirname(__file__))
from timeline import *
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H = 1280, 720
MONO = "/usr/share/fonts/truetype/sand-box/google/IBM Plex Mono/IBMPlexMono-Medium.ttf"
SANS = "/usr/share/fonts/truetype/sand-box/google/Inter/Inter-VariableFont_opsz,wght.ttf"
fmono = ImageFont.truetype(MONO, 26); fsmall = ImageFont.truetype(MONO, 18)
ftitle = ImageFont.truetype(SANS, 46)
try: ftitle.set_variation_by_axes([32, 300])
except Exception: pass

def hold_seconds(t):
    xs = [p[0] for p in HOLD_MAP]; ys = [p[1] for p in HOLD_MAP]
    if t <= xs[0]: return 0.0
    if t >= xs[-1]: return ys[-1]
    i = np.searchsorted(xs, t) - 1
    a, b = ys[i], ys[i+1]; u = (t - xs[i])/(xs[i+1]-xs[i])
    if a <= 0: return b*u
    return math.exp(math.log(a) + (math.log(b)-math.log(a))*u)
def fmt(s):
    s = int(s); y, r = divmod(s, int(YEAR)); d, r = divmod(r, 86400); h, r = divmod(r, 3600); m, sec = divmod(r, 60)
    hms = f"{h:02d}:{m:02d}:{sec:02d}"
    if y: return f"{y:,} YEARS  {d} DAYS  {hms}"
    if d: return f"{d} DAYS  {hms}"
    return hms

def shot_at(t):
    cur = None
    for s in SHOTS:
        if s[3] <= t + 1e-6: cur = s
    if cur and t < cur[3] + (cur[2]-cur[1]) - 1e-6: return cur
    return None

def decode(clip, a, b):
    p = os.path.join(ROOT, 'assets', 'clips', clip)
    raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", str(a), "-i", p, "-t", str(b-a+0.2), "-vf", f"scale={W}:{H},fps={FPS}",
                          "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3)

def overlay(img, text, color=(255, 70, 60), sub=None):
    d = ImageDraw.Draw(img, 'RGBA')
    tw = d.textlength(text, font=fmono) + 34
    x = (W - tw)/2; y = H - 66
    # soft shadow
    sh = Image.new('RGBA', img.size, (0, 0, 0, 0)); sd = ImageDraw.Draw(sh)
    sd.rounded_rectangle([x-18, y-12, x+tw+18, y+44], 22, fill=(0, 0, 0, 120))
    sh = sh.filter(ImageFilter.GaussianBlur(6)); img.alpha_composite(sh)
    d = ImageDraw.Draw(img, 'RGBA')
    d.ellipse([x, y+9, x+14, y+23], fill=color+(255,))
    d.text((x+30, y), text, font=fmono, fill=(255, 255, 255, 235))

def main(out):
    nfr = int(END*FPS)
    ff = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                           "-c:v", "libx264", "-crf", "16", "-preset", "medium", "-pix_fmt", "yuv420p", out], stdin=subprocess.PIPE)
    cache = {}
    rng = np.random.default_rng(1)
    for fi in range(nfr):
        t = fi/FPS
        s = shot_at(t)
        if s:
            key = (s[0], s[3])
            if key not in cache: cache = {key: decode(s[0], s[1], s[2])}
            frames = cache[key]; k = min(len(frames)-1, int(round((t - s[3])*FPS)))
            fr = frames[k].astype(np.float32)
        else:
            fr = np.zeros((H, W, 3), np.float32)
        # fade in at 1.6
        if 1.6 <= t < 2.1: fr *= (t-1.6)/0.5
        # subtle grain for cohesion
        pass
        img = Image.fromarray(fr.astype(np.uint8)).convert('RGBA')
        room = s is not None and not s[0].startswith('agent')
        if room and t < PICKUP_CLICK:
            if t >= 3.0: overlay(img, "ON HOLD  " + fmt(hold_seconds(t - 0.0)))
        elif room and t < REHOLD:
            overlay(img, "CONNECTED", color=(80, 220, 120))
        elif room or t >= BLACK_START:
            overlay(img, "ON HOLD  " + fmt(t - REHOLD))
        if t >= BLACK_START + 0.8:
            d = ImageDraw.Draw(img, 'RGBA')
            a = int(255*min(1, (t - BLACK_START - 0.8)/0.6))
            txt = "Your call is important to us."
            tw = d.textlength(txt, font=ftitle)
            d.text(((W-tw)/2, H/2 - 40), txt, font=ftitle, fill=(235, 235, 235, a))
        ff.stdin.write(np.asarray(img.convert('RGB')).tobytes())
    ff.stdin.close(); ff.wait()

if __name__ == '__main__':
    main(sys.argv[1])
