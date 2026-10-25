import numpy as np, os, sys, wave, time
_T0=time.time()
def LOG(m): print(f'[{time.time()-_T0:6.1f}s] {m}', flush=True)
from scipy import signal
sys.path.insert(0, os.path.dirname(__file__))
from timeline3 import *
import sound as S0   # helpers: lp/hp/bp/load_wav_mono/reverb_ir/conv_st/telephone/warble
SR = 48000; ROOT = S0.ROOT
lp, hp, bp, load = S0.lp, S0.hp, S0.bp, S0.load_wav_mono
rng = np.random.default_rng(11)
N = int((END + 1) * SR)
t = np.arange(N, dtype=np.float32) / SR
def T(x): return int(round(x * SR))
def place(buf, x, at, g=1.0):
    i = T(at)
    if i < 0: x = x[-i:]; i = 0
    j = min(buf.shape[-1], i + x.shape[-1])
    if j > i: buf[..., i:j] += x[..., :j-i] * g
def fades(x, a=0.01, b=0.05):
    x = x.copy(); na, nb = max(1, T(a)), max(1, T(b))
    x[..., :na] *= np.linspace(0, 1, na); x[..., -nb:] *= np.linspace(1, 0, nb); return x
def stereo_wav(path):
    import subprocess
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64).reshape(-1, 2).T
def db(x): return 10 ** (x / 20)
def env_curve(pts): xs, ys = zip(*pts); return np.interp(t, xs, ys)
def varispeed(x, speed):  # x: (2,n); speed array per output sample
    pos = np.cumsum(speed); pos = pos[pos < x.shape[1] - 1]
    return np.stack([np.interp(pos, np.arange(x.shape[1]), x[c]) for c in range(2)])
def lp_st(x, f, o=2): return np.stack([lp(x[c], f, o) for c in range(2)])
def hp_st(x, f, o=2): return np.stack([hp(x[c], f, o) for c in range(2)])
def bp_st(x, a, b, o=2): return np.stack([bp(x[c], a, b, o) for c in range(2)])
def phone(x, g=1.4): return np.stack([S0.telephone(x[c]) * g for c in range(2)]) if x.ndim == 2 else S0.telephone(x) * g
def rev(x, sec, decay, wet):
    ir = S0.reverb_ir(sec, decay)
    if x.ndim == 1: x = np.stack([x, x])
    w = np.stack([signal.fftconvolve(x.mean(0), ir[c])[:x.shape[1]] for c in range(2)])
    return x + w * wet

MUS = os.path.join(ROOT, 'audio', 'music')
lounge, tropical, musicbox, western, orch = [stereo_wav(os.path.join(MUS, n + '.wav')) for n in ('lounge', 'tropical', 'musicbox', 'western', 'orchestra')]

def tape_age(x):
    y = np.stack([S0.warble(x[c], lambda tt: 0.55 + 0 * tt) for c in range(2)])
    y = lp_st(hp_st(y, 90), 5500)
    hiss = hp(rng.standard_normal(y.shape[1]), 3000) * 0.004
    return y + hiss
def underwater(x):
    y = lp_st(x, 1100, 3) * 1.6
    lfo = 1 + 0.25 * np.sin(2 * np.pi * 0.4 * np.arange(y.shape[1]) / SR)
    return y * lfo
def speaker(x):  # small speaker, wider than phone
    return bp_st(x, 160, 7000) * 1.1

music = np.zeros((2, N), np.float32)
def music_seg(src, t0, t1, ff_end=None, g=1.0, proc=None):
    """play src from its start at film t0 until t1; then fast-forward (1->4x) until ff_end."""
    x = proc(src) if proc else src
    n_play = T(t1 - t0)
    seg = x[:, :n_play].copy()
    out = [seg]
    if ff_end:
        n_ff = T(ff_end - t1)
        sp = np.linspace(1.0, 4.5, n_ff) ** 1.3
        rest = x[:, n_play:]
        ff = varispeed(rest, sp)
        ff = ff * np.linspace(1, 0.55, ff.shape[1])
        out.append(ff)
    y = np.concatenate(out, axis=1)
    y = fades(y, 0.004, 0.02)
    place(music, y, t0, g)

LOG('# era music')
# era music: (hold shot idx, src, proc, gain)
music_start0 = S(1) + 5.6
music_seg(lounge, music_start0, S(2), S(3), g=0.9, proc=lambda x: phone(x, 1.3))
plan = [(3, lounge, speaker, 1.0), (5, lounge, tape_age, 1.0), (7, tropical, None, 1.05), (9, musicbox, None, 1.5),
        (11, lounge, underwater, 1.0), (13, western, None, 1.05)]
for idx, src, proc, g in plan:
    h0 = S(idx); h1 = h0 + SHOTS[idx]['dur']; ff = h1 + SHOTS[idx + 1]['dur'] if idx + 1 != 14 else None
    music_seg(src, h0, h1, ff, g=g, proc=proc)
LOG('# orchestra:')
# orchestra: starts at red-sun rise, rings out in a big hall
o = orch[:, :T(ORCH_CHORD - ORCH_T0 + 3.4)]
o = fades(o, 0.005, 2.0)
o = np.concatenate([o, np.zeros((2, T(4.0)))], axis=1)
o = rev(o, 4.5, 1.5, 0.45)
place(music, o, ORCH_T0, 1.35)
# re-hold: tinny phone from the sand pile, continues under black, out at END
rh = lounge[:, :T(END - REHOLD)]
rh = phone(rh, 1.0) * 0.9
rh = fades(rh, 0.004, 0.5)
place(music, rev(rh, 0.8, 6, 0.25), REHOLD, 1.0)

LOG('# ---------------- room tones')
# ---------------- room tones / ambiences (segment-local, memory-light) ----------------
amb = np.zeros((2, N), np.float32)
def add_bed(fn, segs, target=None):
    target = amb if target is None else target
    for sg in segs:
        a, b = sg[0] - 0.15, sg[1] + 0.15; g = sg[2] if len(sg) > 2 else 1.0
        a = max(0, a); n = T(b - a); tl = a + np.arange(n) / SR
        x = fn(n, tl)
        e = np.clip(np.minimum((tl - a) / 0.3, (b - tl) / 0.3), 0, 1)
        place(target, (x * e * g).astype(np.float32), a)
def rn(n): return rng.standard_normal((2, n))
def f_apt(n, tl):
    z = rn(n); pink = lp_st(z, 900) * 0.6 + lp_st(z, 200) * 1.2
    hum = 0.02 * (np.sin(2*np.pi*60*tl) + 0.5*np.sin(2*np.pi*120*tl))
    tr = lp_st(rn(n), 500) * (0.6 + 0.4*np.sin(2*np.pi*0.07*tl))
    return pink*0.05 + hum*0.5 + tr*0.12
hold = lambda k: (S(HOLD_IDX[k]), S(HOLD_IDX[k]) + SHOTS[HOLD_IDX[k]]['dur'])
add_bed(f_apt, [(0.4, S(2)), (*hold(1), 0.8)])
def f_wind(n, tl):
    z = rn(n); return bp_st(z, 300, 1600) * (0.55 + 0.45*np.sin(2*np.pi*0.21*tl + 1)) * 0.18 + lp_st(z, 900)*0.02
add_bed(f_wind, [hold(2)])
def f_jungle(n, tl):
    z = rn(n); return bp_st(z, 4200, 6500) * (0.5 + 0.5*np.sign(np.sin(2*np.pi*38*tl))) * (0.6 + 0.4*np.sin(2*np.pi*0.5*tl)) * 0.06 + lp_st(z, 900)*0.03
add_bed(f_jungle, [hold(3)])
for k in range(18):
    tb = hold(3)[0] + rng.random() * 4.6; n = T(0.11); tt = np.arange(n) / SR
    f0 = 2600 + rng.random() * 2200
    ch = np.sin(2 * np.pi * np.cumsum(f0 * (1 + 0.25 * np.sin(2 * np.pi * 28 * tt))) / SR) * np.hanning(n) * 0.05
    pan = rng.random()
    for r in range(rng.integers(1, 4)): place(amb, np.stack([ch * (1 - pan), ch * pan]) * 1.6, tb + r * 0.14)
def f_ice(n, tl):
    z = rn(n); return bp_st(z, 350, 900) * (0.5 + 0.5*np.sin(2*np.pi*0.3*tl)) * 0.3 + bp_st(z, 2000, 6000)*0.02
add_bed(f_ice, [hold(4)])
for k in range(4):
    tb = hold(4)[0] + 0.5 + rng.random() * 4.5; n = T(0.25); tt = np.arange(n) / SR
    cr = np.sin(2 * np.pi * (180 + 60 * rng.random()) * tt) * (rng.random(n) > 0.6) * np.exp(-tt * 9) * 0.08
    place(amb, np.stack([cr, cr]), tb)
add_bed(lambda n, tl: lp_st(rn(n), 140, 4) * 1.4, [hold(5)])
for k in range(22):
    tb = hold(5)[0] + rng.random() * 5.3; n = T(0.05); tt = np.arange(n) / SR
    f0 = 500 + rng.random() * 900
    bb = np.sin(2 * np.pi * f0 * (1 + tt * 10) * tt) * np.exp(-tt * 55) * 0.05
    place(amb, np.stack([bb, bb]), tb)
n = T(2.6); tt = np.arange(n) / SR
moan = np.sin(2 * np.pi * np.cumsum(220 - 70 * tt / 2.6) / SR) * np.sin(np.pi * tt / 2.6) ** 2 * 0.05
place(amb, rev(np.stack([moan, moan]), 2, 2, 0.6), hold(5)[0] + 0.3)
def f_desert(n, tl):
    z = rn(n); return bp_st(z, 900, 5000) * 0.07 * (0.6 + 0.4*np.sin(2*np.pi*0.17*tl)) + bp_st(z, 300, 1600)*0.06
add_bed(f_desert, [hold(6)])
red0, red1 = S(14), BLACK
red_segs = [(red0, S(17)), (S(18), S(19)), (S(21), red1)]
def f_red(n, tl):
    x = lp_st(rn(n), 70, 4) * 2.2
    for k in range(int(n / SR * 12)):
        i = rng.integers(0, max(1, n - 400)); m = T(0.008)
        c = hp(rng.standard_normal(m), 2500) * np.exp(-np.arange(m) / SR * 700) * (0.03 + 0.08 * rng.random())
        pan = rng.random(); x[0, i:i+m] += c * (1 - pan); x[1, i:i+m] += c * pan
    return x
add_bed(f_red, red_segs)
off_segs = [(S(17), S(18)), (S(19), S(21))]
def f_office(n, tl):
    z = rn(n); x = lp_st(z, 400) * 0.25 + bp_st(z, 1000, 3000) * 0.012
    for k in range(int(n / SR * 3)):
        i = rng.integers(0, max(1, n - 1000)); m = T(0.02)
        c = bp(rng.standard_normal(m), 2000, 6000) * np.exp(-np.arange(m) / SR * 300) * 0.02
        x[0, i:i+m] += c * 0.4; x[1, i:i+m] += c
    return x
add_bed(f_office, off_segs)

LOG('# ---------------- transitions')
# ---------------- transitions: whoosh + clock ticks racing ----------------
fx = np.zeros((2, N), np.float32)
for k, si in TRANS_IDX.items():
    a = S(si); d = SHOTS[si]['dur']; n = T(d)
    tt = np.arange(n) / SR
    sw = np.zeros(n); x = rng.standard_normal(n)
    # swept band noise via short blocks
    for i0 in range(0, n, 1024):
        u = i0 / n; fc = 300 * (14 ** u)
        blk = x[i0:i0 + 1024]
        sw[i0:i0 + len(blk)] = bp(blk, fc * 0.7, min(fc * 1.4, 20000)) if fc * 1.4 < 23000 else blk
    shape = np.sin(np.pi * np.clip(tt / d, 0, 1)) ** 1.5
    w = sw * shape * 0.22
    place(fx, np.stack([w, w]), a)
    # ticks: accelerating
    tk_n = T(0.012); tk = bp(rng.standard_normal(tk_n), 2500, 7000) * np.exp(-np.arange(tk_n) / SR * 600) * 0.12
    tc, rate = 0.0, 3.0
    while tc < d - 0.1:
        place(fx, np.stack([tk, tk]) * (0.6 + 0.4 * (tc / d)), a + tc)
        rate = min(rate * 1.18, 45); tc += 1 / rate
LOG('# notification ding')
# notification ding (Premium+ signature)
def ding():
    n = T(0.9); tt = np.arange(n) / SR; y = np.zeros(n)
    for f0, off in [(1318.5, 0.0), (1760.0, 0.11)]:
        i = T(off); m = n - i; u = np.arange(m) / SR
        y[i:] += (np.sin(2 * np.pi * f0 * u) + 0.3 * np.sin(2 * np.pi * f0 * 2.01 * u) + 0.12 * np.sin(2 * np.pi * f0 * 3.2 * u)) * np.exp(-u * 7)
    return y * 0.11
D = ding()
for si, (off, *_x) in TOASTS.items():
    place(fx, rev(np.stack([D, D]), 0.4, 10, 0.2), S(si) + off)
LOG('# opening:')
# opening: phone taps / DTMF, ringback, pickup click
digs = [(697,1209),(770,1336),(852,1477),(941,1336),(697,1336),(770,1477),(852,1209),(697,1209),(941,1336),(770,1209)]
for k, (fa, fb) in enumerate(digs):
    n = T(0.08); tt = np.arange(n) / SR
    y = (np.sin(2 * np.pi * fa * tt) + np.sin(2 * np.pi * fb * tt)) * 0.05 * np.hanning(n) ** 0.3
    place(fx, np.stack([y, y]), S(0) + 2.4 + k * 0.14)
n = T(1.3); tt = np.arange(n) / SR
rb = S0.telephone((np.sin(2 * np.pi * 440 * tt) + np.sin(2 * np.pi * 480 * tt)) * 0.10 * np.minimum(1, np.minimum(tt, 1.3 - tt) / 0.02))
place(fx, np.stack([rb, rb]), S(1) - 1.4)
def click(g):
    n = T(0.03); tt = np.arange(n) / SR
    y = bp(rng.standard_normal(n), 800, 5000) * np.exp(-tt * 200) * g + np.sin(2 * np.pi * 180 * tt) * np.exp(-tt * 80) * g * 0.6
    return np.stack([y, y])
place(fx, click(0.35), CALL_T0 - 0.05)
place(fx, click(0.45), PICKUP)
place(fx, click(0.35), REHOLD - 0.05)
LOG('# crumble:')
# crumble: sand pour + phone thud
CR = S(21)
def f_sand(n, tl):
    z = rn(n); e = np.interp(tl, [CR+3.7, CR+4.3, CR+5.3, CR+6.1], [0, 1, 0.7, 0])
    return (hp_st(z, 1500) * 0.35 + lp_st(z, 600) * 0.45) * e * 0.5
add_bed(f_sand, [(CR + 3.7, CR + 6.1)], target=fx)
n = T(0.15); tt = np.arange(n) / SR
thud = (np.sin(2 * np.pi * 95 * tt) * np.exp(-tt * 30) + lp(rng.standard_normal(n), 900) * np.exp(-tt * 40) * 0.4) * 0.25
place(fx, np.stack([thud, thud]), CR + 5.0)

LOG('# ---------------- voices')
# ---------------- voices ----------------
vo = np.zeros((2, N))
VO = os.path.join(ROOT, 'audio', 'vo')
for name, at, mode in IVR:
    x = load(os.path.join(VO, name))
    if mode == 'water': y = S0.telephone(lp(x, 2600, 2)) * 1.5
    else: y = S0.telephone(x) * 1.4
    y = np.stack([y, y])
    if mode == 'echo': y = rev(y, 2.5, 2.2, 0.5)
    place(vo, fades(y, 0.005, 0.05), at, 1.0)
CL = os.path.join(ROOT, 'assets', 'clips')
def clip_audio(name, a, b): return load(os.path.join(CL, name))[T(a):T(b)]
dia = np.zeros((2, N))
# Alex on his side: clean + small office room
small = lambda y: rev(np.stack([y, y]), 0.35, 14, 0.18)
hi = clip_audio('agent_hi.mp4', 0.0, 4.25); place(dia, fades(small(hi * 0.7), 0.01, 0.08), S(17))
# old man: CU "Hi," clean (src 0.7..3.4 of line_a), then the rest heard through Alex's headset
ln = load(os.path.join(CL, 'v3_line_a.mp4'))
hi_old = ln[T(0.7):T(3.35)]
place(dia, fades(rev(np.stack([hi_old, hi_old]), 1.2, 4, 0.12), 0.02, 0.1), S(18), 1.25)
rest = ln[T(3.45):T(6.25)]
place(dia, fades(np.stack([S0.telephone(rest) * 1.6] * 2), 0.01, 0.08), S(19) + 0.15, 1.0)
hold_line = clip_audio('agent_hold.mp4', 0.95, 5.25)  # starts just before "Absolutely" (1.14)
place(dia, fades(small(hold_line * 0.7), 0.03, 0.08), S(20) + 0.95)

LOG('# ---------------- duck')
# ---------------- duck music under voices ----------------
voice = np.abs(vo).mean(0) + np.abs(dia).mean(0)
env = lp(voice, 4)
duck = db(-9) + (1 - db(-9)) * np.clip(1 - env * 30, 0, 1)
duck = lp(duck, 6)
music *= duck * 1.4

mix = music * 1.0 + amb * 1.0 + fx * 1.0 + vo * 1.0 + dia * 1.0
mix[:, :T(0.4)] *= np.linspace(0, 1, T(0.4))
mix = mix[:, :T(END)]
pk = np.abs(mix).max(); mix = mix / pk * 0.89
out = os.path.join(ROOT, 'audio', 'mix3_raw.wav')
with wave.open(out, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix.T * 32767).astype('<i2').tobytes())
# stems for inspection
for nm, x in [('music', music), ('amb', amb), ('fx', fx), ('vo', vo + dia)]:
    x = x[:, :T(END)] / pk * 0.89
    with wave.open(os.path.join(ROOT, 'audio', f'stem3_{nm}.wav'), 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(x, -1, 1).T * 32767).astype('<i2').tobytes())
print('wrote', out, END, 'peak_pre', pk)
