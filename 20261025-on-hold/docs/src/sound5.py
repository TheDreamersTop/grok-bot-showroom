import numpy as np, os, sys, wave, time, subprocess
_T0 = time.time()
def LOG(m): print(f'[{time.time()-_T0:6.1f}s] {m}', flush=True)
from scipy import signal
sys.path.insert(0, os.path.dirname(__file__))
from timeline5 import *
import sound as S0
from phone4 import oldphone_mild, sos_bp
SR = 48000; ROOT = S0.ROOT
lp, hp, bp, load = S0.lp, S0.hp, S0.bp, S0.load_wav_mono
rng = np.random.default_rng(11)
N = int((END + 1) * SR)
def T(x): return int(round(x * SR))
def place(buf, x, at, g=1.0):
    i = T(at)
    if i < 0: x = x[..., -i:]; i = 0
    j = min(buf.shape[-1], i + x.shape[-1])
    if j > i: buf[..., i:j] += x[..., :j-i] * g
def fades(x, a=0.01, b=0.05):
    x = x.copy(); na, nb = max(1, T(a)), max(1, T(b))
    x[..., :na] *= np.linspace(0, 1, na); x[..., -nb:] *= np.linspace(1, 0, nb); return x
def stereo_wav(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64).reshape(-1, 2).T
def db(x): return 10 ** (x / 20)
def varispeed(x, speed):
    pos = np.cumsum(speed); pos = pos[pos < x.shape[1] - 1]
    return np.stack([np.interp(pos, np.arange(x.shape[1]), x[c]) for c in range(2)])
def lp_st(x, f, o=2): return np.stack([lp(x[c], f, o) for c in range(2)])
def hp_st(x, f, o=2): return np.stack([hp(x[c], f, o) for c in range(2)])
def bp_st(x, a, b, o=2): return np.stack([bp(x[c], a, b, o) for c in range(2)])
def phone_music(x, g=1.4):   # tinny hold music through the handset: steep band-limit after saturation
    y = np.stack([sos_bp(np.tanh(sos_bp(x[c], 300, 3400, 4) * 2.0) / 2.0, 300, 3400, 8) for c in range(2)])
    return y * g
def rev(x, sec, decay, wet):
    ir = S0.reverb_ir(sec, decay)
    if x.ndim == 1: x = np.stack([x, x])
    w = np.stack([signal.fftconvolve(x.mean(0), ir[c])[:x.shape[1]] for c in range(2)])
    return x + w * wet

MUS = os.path.join(ROOT, 'audio', 'music')
lounge, tropical, musicbox, western, orch = [stereo_wav(os.path.join(MUS, n + '.wav')) for n in ('lounge', 'tropical', 'musicbox', 'western', 'orchestra4')]
# v5: real-sample orchestra (VSCO-2 CE, CC0) rendered by orch_vsco.py, RMS-matched to the FluidR3 version
_o5 = stereo_wav(os.path.join(MUS, 'orchestra5.wav')); _n = T(12.5)
orch = _o5 * (np.sqrt((orch[:, :_n]**2).mean()) / np.sqrt((_o5[:, :_n]**2).mean()))
def tape_age(x):
    y = np.stack([S0.warble(x[c], lambda tt: 0.55 + 0 * tt) for c in range(2)])
    y = lp_st(hp_st(y, 90), 5500)
    return y + hp(rng.standard_normal(y.shape[1]), 3000) * 0.004
def speaker(x): return bp_st(x, 160, 7000) * 1.1

music = np.zeros((2, N), np.float32)
def music_seg(src, t0, t1, ff_end=None, g=1.0, proc=None):
    x = proc(src) if proc else src
    seg = x[:, :T(t1 - t0)].copy(); out = [seg]
    if ff_end:
        n_ff = T(ff_end - t1); sp = np.linspace(1.0, 4.5, n_ff) ** 1.3
        ff = varispeed(x[:, seg.shape[1]:], sp); ff = ff * np.linspace(1, 0.55, ff.shape[1]); out.append(ff)
    y = fades(np.concatenate(out, axis=1), 0.01, 0.04)
    place(music, y, t0, g)
LOG('era music')
music_seg(lounge, S(1) + 4.6, S(2), E(2), g=0.9, proc=lambda x: phone_music(x, 1.3))
plan = [(3, lounge, speaker, 1.0), (5, lounge, tape_age, 1.0), (7, tropical, None, 1.05), (9, musicbox, None, 1.5),
        (11, western, None, 1.05)]
for idx, src, proc, g in plan:
    music_seg(src, S(idx), E(idx), E(idx + 1) if idx != 11 else None, g=g, proc=proc)
LOG('orchestra')
# clean fanfare; sting lands on the CU cut, rings out in a hall, smooth 1.4 s release, then near-silence
o0 = T(ORCH_SKIP_BEATS * 60 / ORCH_BPM)
o = fades(orch[:, o0:o0 + T(ORCH_STING - ORCH_T0 + 3.4)], 0.12, 0.01)
o = np.concatenate([o, np.zeros((2, T(3.0)))], axis=1)
o = rev(o, 3.2, 2.0, 0.12)   # orchestra5 already carries its own hall
n_end = T(ORCH_STING - ORCH_T0 + 1.9); n_rel = T(1.6)
e = np.ones(o.shape[1]); e[n_end:n_end + n_rel] = 0.5 * (1 + np.cos(np.linspace(0, np.pi, n_rel))); e[n_end + n_rel:] = 0
place(music, o * e, ORCH_T0, 1.3)
# re-hold music from the sand pile, tinny, under black
rh = phone_music(lounge[:, :T(END - REHOLD)], 1.0) * 0.8
rh = fades(rh, 0.02, 0.6)
place(music, rev(rh, 0.8, 6, 0.2), REHOLD, 1.0)

LOG('room tones')
amb = np.zeros((2, N), np.float32)
def add_bed(fn, segs, target=None, ramp=0.3):
    target = amb if target is None else target
    for sg in segs:
        a, b = max(0, sg[0] - ramp / 2), sg[1] + ramp / 2; g = sg[2] if len(sg) > 2 else 1.0
        n = T(b - a); tl = a + np.arange(n) / SR
        x = fn(n, tl); e = np.clip(np.minimum((tl - a) / ramp, (b - tl) / ramp), 0, 1)
        e = 0.5 - 0.5 * np.cos(np.pi * e)
        place(target, (x * e * g).astype(np.float32), a)
def rn(n): return rng.standard_normal((2, n))
ERA_G = 0.6   # all era beds softer + darker than v3
def f_apt(n, tl):
    z = rn(n); pink = lp_st(z, 900) * 0.6 + lp_st(z, 200) * 1.2
    hum = 0.02 * (np.sin(2*np.pi*60*tl) + 0.5*np.sin(2*np.pi*120*tl))
    return pink*0.05 + hum*0.4 + lp_st(rn(n), 500) * (0.6 + 0.4*np.sin(2*np.pi*0.07*tl)) * 0.1
hold = lambda k: (S(HOLD_IDX[k]), E(HOLD_IDX[k]))
add_bed(f_apt, [(0.4, S(2), ERA_G), (*hold(1), 0.8 * ERA_G)])
add_bed(lambda n, tl: lp_st(bp_st(rn(n), 300, 1600) * (0.55 + 0.45*np.sin(2*np.pi*0.21*tl + 1)) * 0.18, 2500), [(*hold(2), ERA_G)])
def f_jungle(n, tl):
    z = rn(n); return lp_st(bp_st(z, 3800, 6000) * (0.5 + 0.5*np.sign(np.sin(2*np.pi*38*tl))), 5000) * 0.035 + lp_st(z, 900)*0.03
add_bed(f_jungle, [(*hold(3), ERA_G)])
for k in range(12):
    tb = hold(3)[0] + rng.random() * 4.2; n = T(0.11); tt = np.arange(n) / SR
    f0 = 2400 + rng.random() * 1800
    ch = np.sin(2 * np.pi * np.cumsum(f0 * (1 + 0.25 * np.sin(2 * np.pi * 28 * tt))) / SR) * np.hanning(n) * 0.045
    pan = rng.random()
    for r in range(rng.integers(1, 4)): place(amb, np.stack([ch * (1 - pan), ch * pan]), tb + r * 0.14)
add_bed(lambda n, tl: lp_st(bp_st(rn(n), 350, 900) * (0.5 + 0.5*np.sin(2*np.pi*0.3*tl)) * 0.3, 2000), [(*hold(4), ERA_G)])
for k in range(3):
    tb = hold(4)[0] + 0.5 + rng.random() * 4.0; n = T(0.25); tt = np.arange(n) / SR
    cr = lp(np.sin(2 * np.pi * (180 + 60 * rng.random()) * tt) * (rng.random(n) > 0.6) * np.exp(-tt * 9), 2500) * 0.07
    place(amb, np.stack([cr, cr]), tb)
add_bed(lambda n, tl: lp_st(bp_st(rn(n), 600, 4000) * 0.06 * (0.6 + 0.4*np.sin(2*np.pi*0.17*tl)) + bp_st(rn(n), 300, 1600) * 0.05, 3500),
        [(S(10) + 0.9, E(11), ERA_G)])
# red era: low wind + soft embers (no clicky crackle — that was v3's 'digital pop' source)
def f_red(n, tl, emb=4):
    x = lp_st(rn(n), 70, 4) * 1.0 + lp_st(bp_st(rn(n), 250, 900) * (0.5 + 0.5*np.sin(2*np.pi*0.13*tl)), 1200) * 0.05
    for k in range(int(n / SR * emb)):
        i = rng.integers(0, max(1, n - T(0.06))); m = T(0.05); u = np.arange(m) / SR
        c = lp(bp(rng.standard_normal(m), 900, 4000), 3000) * (1 - np.exp(-u * 400)) * np.exp(-u * 70) * (0.006 + 0.012 * rng.random())
        pan = rng.random(); x[0, i:i+m] += c * (1 - pan); x[1, i:i+m] += c * pan
    return x
add_bed(f_red, [(S(12), S(CU_HOLD), 0.8)])
# after the sting: near-silence — low wind, sparse embers, faint line hiss, one tired breath
add_bed(lambda n, tl: f_red(n, tl, 2) * 0.45, [(S(CU_HOLD), PICKUP, 1.0)], ramp=0.8)
add_bed(lambda n, tl: f_red(n, tl, 2) * 0.25, [(S(CU_LINE), E(CU_LINE), 1.0)], ramp=0.2)
add_bed(lambda n, tl: f_red(n, tl, 3) * 0.6, [(S(CRUMBLE), BLACK, 1.0)], ramp=0.4)
def breath(dur_in, dur_out, g):
    n1, n2 = T(dur_in), T(dur_out); z = rng.standard_normal(n1 + n2)
    e = np.concatenate([np.sin(np.linspace(0, np.pi / 2, n1)) ** 2, np.cos(np.linspace(0, np.pi / 2, n2)) ** 2])
    y = (bp(z, 500, 2200, 2) * 0.7 + bp(z, 2500, 5000, 2) * 0.2) * e * g
    return np.stack([y, y])
place(amb, breath(0.9, 1.4, 0.02), ORCH_STING + 2.3)
# continuous office ambience across the whole call (pickup -> re-hold), regardless of cuts: low, dark
def f_office(n, tl):
    z = rn(n); x = lp_st(z, 220, 3) * 0.16 + lp_st(bp_st(rn(n), 300, 900) * (0.6 + 0.4*np.sin(2*np.pi*0.11*tl)), 1000) * 0.012
    for k in range(int(n / SR * 1.2)):          # sparse, soft keyboard
        i = rng.integers(0, max(1, n - 1000)); m = T(0.015)
        for r in range(rng.integers(2, 6)):
            j = i + T(0.09 * r + 0.03 * rng.random())
            if j + m >= n: break
            c = lp(bp(rng.standard_normal(m), 1500, 5000), 3500) * np.exp(-np.arange(m) / SR * 400) * 0.006
            x[0, j:j+m] += c * 0.5; x[1, j:j+m] += c
    return x
OFFICE = (PICKUP + 0.02, REHOLD)
add_bed(f_office, [(*OFFICE, 1.0)], ramp=0.25)

LOG('transitions')
fx = np.zeros((2, N), np.float32)
for k, si in TRANS_IDX.items():
    a = S(si); d = SHOTS[si]['dur']; n = T(d); tt = np.arange(n) / SR
    if SHOTS[si]['kind'] == 'stutter': continue
    sw = np.zeros(n); x = rng.standard_normal(n)
    for i0 in range(0, n, 1024):
        u = i0 / n; fc = 300 * (14 ** u); blk = x[i0:i0 + 1024]
        sw[i0:i0 + len(blk)] = bp(blk, fc * 0.7, min(fc * 1.4, 20000)) if fc * 1.4 < 23000 else blk
    w = sw * np.sin(np.pi * np.clip(tt / d, 0, 1)) ** 1.5 * 0.2
    place(fx, np.stack([w, w]), a)
    tk_n = T(0.012); tk = bp(rng.standard_normal(tk_n), 2500, 7000) * np.exp(-np.arange(tk_n) / SR * 600) * 0.1
    tc, rate = 0.0, 3.0
    while tc < d - 0.1:
        place(fx, np.stack([tk, tk]) * (0.6 + 0.4 * (tc / d)), a + tc); rate = min(rate * 1.18, 45); tc += 1 / rate
# stutter: one 'shutter' hit per hard cut (times exported by picture4 STUTTER_CUTS) + fast ticks
from stutter4 import STUTTER_PLAN
st0 = S(10); acc = 0.0
for still, nfr, flash in STUTTER_PLAN:
    m = T(0.06); u = np.arange(m) / SR
    hit = (bp(rng.standard_normal(m), 1200, 8000) * np.exp(-u * 90) * (0.16 if flash else 0.08)
           + np.sin(2 * np.pi * 70 * u) * np.exp(-u * 45) * (0.12 if flash else 0.0))
    place(fx, fades(np.stack([hit, hit]), 0.002, 0.01), st0 + acc)
    acc += nfr / FPS
n = T(SHOTS[10]['dur'] + 0.3); tt = np.arange(n) / SR
riser = bp(rng.standard_normal(n), 800, 6000) * (tt / tt[-1]) ** 2 * 0.06
place(fx, fades(np.stack([riser, riser]), 0.05, 0.2), st0 - 0.15)
LOG('ding')
def ding():
    n = T(0.9); y = np.zeros(n)
    for f0, off in [(1318.5, 0.0), (1760.0, 0.11)]:
        i = T(off); u = np.arange(n - i) / SR
        y[i:] += (np.sin(2*np.pi*f0*u) + 0.3*np.sin(2*np.pi*f0*2.01*u) + 0.12*np.sin(2*np.pi*f0*3.2*u)) * np.exp(-u * 7)
    return fades(y * 0.11, 0.002, 0.05)
D = ding()
for si, (off, *_x) in TOASTS.items():
    place(fx, rev(np.stack([D, D]), 0.4, 10, 0.2), S(si) + off)
LOG('opening')
digs = [(697,1209),(770,1336),(852,1477),(941,1336),(697,1336),(770,1477),(852,1209),(697,1209),(941,1336),(770,1209)]
for k, (fa, fb) in enumerate(digs):
    n = T(0.08); tt = np.arange(n) / SR
    y = (np.sin(2*np.pi*fa*tt) + np.sin(2*np.pi*fb*tt)) * 0.05 * np.hanning(n) ** 0.3
    place(fx, np.stack([y, y]), S(0) + 2.4 + k * 0.14)
n = T(1.3); tt = np.arange(n) / SR
rb = phone_music(np.stack([(np.sin(2*np.pi*440*tt) + np.sin(2*np.pi*480*tt)) * 0.10] * 2), 1.0) * np.minimum(1, np.minimum(tt, 1.3 - tt) / 0.02)
place(fx, rb, S(1) - 1.4)
def click(g):
    n = T(0.03); tt = np.arange(n) / SR
    y = bp(rng.standard_normal(n), 800, 5000) * np.exp(-tt * 200) * g + np.sin(2*np.pi*180*tt) * np.exp(-tt * 80) * g * 0.6
    return fades(np.stack([y, y]), 0.001, 0.005)
place(fx, click(0.35), CALL_T0 - 0.05)
place(fx, click(0.45), PICKUP)
place(fx, click(0.3), REHOLD - 0.05)
LOG('crumble foley')
W1, CC, W2 = S(19), S(20), S(21)
def w1(x): return W1 + (x - SHOTS[19]['a'])
def w2(x): return W2 + (x - SHOTS[21]['a'])
# wide 1: body sags (src 2.0-2.9): low groan of settling sand + first trickles
n = T(1.4); tt = np.arange(n) / SR
gro = lp(rng.standard_normal(n), 220, 3) * np.interp(tt, [0, 0.9, 1.4], [0, 1, 0.8]) * 0.5
place(fx, fades(np.stack([gro, gro]), 0.05, 0.05), w1(1.6))
def f_trickle(n, tl):
    z = rn(n); e = np.interp(tl, [w1(2.2), CC + 0.2, CC + 1.2], [0, 1, 1])
    return hp_st(z, 2500) * 0.12 * e
add_bed(f_trickle, [(w1(2.1), CC + 1.2, 1.0)], target=fx, ramp=0.08)
# CU: hand runs to sand — dense fine grains
def f_grains(n, tl, a, b, dens, amp):
    x = np.zeros((2, n))
    for k in range(int(n / SR * dens)):
        i = rng.integers(0, max(1, n - 200)); g = np.interp(tl[i], [a, a + 0.2, b - 0.3, b], [0, 1, 1, 0])
        m = T(0.003); c = hp(rng.standard_normal(m), 3000) * np.exp(-np.arange(m) / SR * 2500) * amp * g
        pan = rng.random(); x[0, i:i+m] += c * (1 - pan); x[1, i:i+m] += c * pan
    return x
add_bed(lambda n, tl: f_grains(n, tl, CC, CC + 1.2, 260, 0.035), [(CC, CC + 1.2, 1.0)], target=fx, ramp=0.05)
# wide 2: collapse burst (src 3.2-4.0) -> pour -> dust settles (to ~6.0); phone lands ~3.7
n = T(0.7); tt = np.arange(n) / SR
whoomp = (lp(rng.standard_normal(n), 300, 3) * 1.2 + np.sin(2 * np.pi * 55 * tt) * 0.5) * np.exp(-tt * 5) * 0.35
place(fx, fades(np.stack([whoomp, whoomp]), 0.01, 0.1), w2(3.2))
def f_pour(n, tl):
    z = rn(n); e = np.interp(tl, [w2(3.15), w2(3.5), w2(4.2), w2(5.2), w2(6.3)], [0, 1, 0.8, 0.3, 0])
    el = np.interp(tl, [w2(3.2), w2(3.5), w2(4.3)], [0, 1, 0])
    return hp_st(z, 1600) * 0.22 * e + lp_st(z, 500) * 0.55 * el
add_bed(f_pour, [(w2(3.1), w2(6.4), 1.0)], target=fx, ramp=0.06)
add_bed(lambda n, tl: f_grains(n, tl, w2(3.2), w2(6.0), 180, 0.03), [(w2(3.2), w2(6.0), 1.0)], target=fx, ramp=0.05)
n = T(0.06); tt = np.arange(n) / SR
clack = bp(rng.standard_normal(n), 1500, 6000) * np.exp(-tt * 120) * 0.06
place(fx, fades(np.stack([clack, clack]), 0.001, 0.01), w2(3.7))

LOG('voices')
vo = np.zeros((2, N)); VO = os.path.join(ROOT, 'audio', 'vo')
for name, at, mode in IVR:
    x = load(os.path.join(VO, name))
    y = phone_music(np.stack([x, x]), 1.4)
    if mode == 'echo': y = rev(y, 2.5, 2.2, 0.5)
    place(vo, fades(y, 0.005, 0.05), at, 1.0)
CL = os.path.join(ROOT, 'assets', 'clips')
def atempo_ff(y, f):   # slower, clearer delivery (pitch kept)
    p = subprocess.run(["ffmpeg", "-v", "error", "-f", "f64le", "-ar", str(SR), "-ac", "1", "-i", "-", "-af", f"atempo={f}", "-f", "f64le", "-"],
                       input=np.asarray(y, np.float64).tobytes(), capture_output=True).stdout
    return np.frombuffer(p, np.float64)
def clip_audio(name, a, b): return load(os.path.join(CL, name))[T(a):T(b)]
dia = np.zeros((2, N))
small = lambda y: rev(np.stack([y, y]), 0.35, 14, 0.18)
hi = clip_audio('agent_hi.mp4', 0.0, 4.25); place(dia, fades(small(hi * 0.7), 0.01, 0.08), S(AG_HI))
# old man "Hi," — the CU clip's own lip-synced audio, same offsets as the picture
sh = SHOTS[CU_LINE]; hi_old = clip_audio(sh['clip'], sh['a'], sh['b'] - 0.02)
place(dia, fades(rev(np.stack([hi_old, hi_old]), 1.2, 4, 0.1), 0.02, 0.12), S(CU_LINE), 0.95)
# the rest, from the oldest-sounding take, heard through Alex's headset: tremor + rasp + carbon-mic + 8k mu-law + steep 300-3400
rest = clip_audio('v4_line_3.mp4', 3.55, 7.0)   # measured: speech 3.8-6.8 s (whisper word times were off); skip 2.3 s dead air
rp = oldphone_mild(atempo_ff(rest, 0.92))
def act_rms(y):
    f = T(0.05); r = np.sqrt(np.convolve(y**2, np.ones(f)/f, 'same')); return np.percentile(r, 95)
rp = rp * (act_rms(hi * 0.7) * 0.85 / act_rms(rp))   # match Alex's loudness (-1.4 dB): clearly audible over the room
_lim = 1.6 * act_rms(rp); rp = _lim * np.tanh(rp / _lim)   # soft-limit peaks of the line (like a real phone AGC)
rp = rp * (act_rms(hi * 0.7) * 0.85 / act_rms(rp))
place(dia, fades(np.stack([rp, rp]), 0.02, 0.1), S(LISTEN) + 0.2, 1.0)
hold_line = clip_audio('agent_hold.mp4', 0.95, 5.25)
place(dia, fades(small(hold_line * 0.7), 0.03, 0.08), S(AG_HOLD) + 0.95)

LOG('duck + mix')
voice = np.abs(vo).mean(0) + np.abs(dia).mean(0)
env = lp(voice, 4); duck = db(-9) + (1 - db(-9)) * np.clip(1 - env * 30, 0, 1); duck = lp(duck, 6)
music *= duck * 1.3
mix = music + amb + fx + vo + dia
mix[:, :T(0.4)] *= np.linspace(0, 1, T(0.4))
mix = mix[:, :T(END)]
nf = T(0.8); mix[:, -nf:] *= np.cos(np.linspace(0, np.pi / 2, nf)) ** 2
pk = np.abs(mix).max(); mix = mix / pk * 0.89
out = os.path.join(ROOT, 'audio', 'mix5_raw.wav')
def wr(path, x):
    with wave.open(path, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(x, -1, 1).T * 32767).astype('<i2').tobytes())
wr(out, mix)
for nm, x in [('music', music), ('amb', amb), ('fx', fx), ('vo', vo + dia)]: wr(os.path.join(ROOT, 'audio', f'stem5_{nm}.wav'), x[:, :T(END)] / pk * 0.89)
print('wrote', out, END, 'peak_pre', pk)
