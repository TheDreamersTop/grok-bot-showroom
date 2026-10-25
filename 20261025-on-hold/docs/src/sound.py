import numpy as np, subprocess, sys, os
from scipy import signal
sys.path.insert(0, os.path.dirname(__file__))
from timeline import *
SR = 48000
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
rng = np.random.default_rng(7)
N = int(END*SR)+SR
def mtof(m): return 440*2**((m-69)/12)
def env_adsr(n, a, d, s, r, sr=SR):
    t = np.arange(n)/sr; dur = n/sr
    e = np.where(t < a, t/max(a,1e-4), s + (1-s)*np.exp(-(t-a)/max(d,1e-4)))
    rel = np.clip((dur - t)/max(r,1e-4), 0, 1)
    return e*rel
def lp(x, fc, order=2):
    b, a = signal.butter(order, min(fc/(SR/2), 0.99), 'low'); return signal.lfilter(b, a, x)
def hp(x, fc, order=2):
    b, a = signal.butter(order, fc/(SR/2), 'high'); return signal.lfilter(b, a, x)
def bp(x, lo, hi, order=2):
    b, a = signal.butter(order, [lo/(SR/2), hi/(SR/2)], 'band'); return signal.lfilter(b, a, x)
def smooth(t, a, b):  # 0 before a, 1 after b
    return np.clip((t-a)/(b-a), 0, 1)**1 if b > a else (t >= a).astype(float)
def wcurve(pts):  # piecewise-linear weight fn of film time
    xs, ys = zip(*pts); return lambda t: np.interp(t, xs, ys)

# ---------------- instruments ----------------
def epiano(f, dur):
    n = int((dur+0.6)*SR); t = np.arange(n)/SR
    idx = 1.8*np.exp(-t*4)
    x = np.sin(2*np.pi*f*t + idx*np.sin(2*np.pi*f*t)) + 0.25*np.sin(2*np.pi*2*f*t)*np.exp(-t*6)
    return x*env_adsr(n, 0.004, 0.9, 0.35, 0.25)*0.5
def vibes(f, dur):
    n = int((dur+0.8)*SR); t = np.arange(n)/SR
    x = np.sin(2*np.pi*f*t) + 0.2*np.sin(2*np.pi*4*f*t)*np.exp(-t*8)
    trem = 1 + 0.25*np.sin(2*np.pi*5.5*t)
    return x*trem*env_adsr(n, 0.003, 1.2, 0.0, 0.3)*0.6
def celesta(f, dur):
    n = int((dur+2.5)*SR); t = np.arange(n)/SR
    x = sum(a*np.sin(2*np.pi*f*r*t)*np.exp(-t*k) for a, r, k in [(1,1,1.2),(0.5,2.76,3),(0.25,5.4,6),(0.15,8.93,9)])
    return x*env_adsr(n, 0.002, 3, 0, 1.5)*0.45
def saw(f, t, ph=0):
    return 2*((f*t+ph) % 1)-1
def strings(f, dur):
    n = int((dur+1.5)*SR); t = np.arange(n)/SR
    vib = 1+0.004*np.sin(2*np.pi*5*t)
    x = sum(saw(f*d*vib, t, rng.random()) for d in (0.996, 1.0, 1.005))/3
    x = lp(x, min(f*5, 6000))
    return x*env_adsr(n, min(0.6, dur*0.4), 3, 0.9, 1.2)*0.35
def choir(f, dur):
    n = int((dur+1.8)*SR); t = np.arange(n)/SR
    vib = 1+0.006*np.sin(2*np.pi*5.2*t + rng.random()*6)
    src = sum(saw(f*d*vib, t, rng.random()) for d in (0.993, 1.0, 1.007, 2.0*0.998))
    y = sum(g*bp(src, fc*0.85, fc*1.15) for fc, g in [(700,1.0),(1150,0.6),(2800,0.25)])  # 'ah'
    return y*env_adsr(n, min(0.9, dur*0.5), 3, 0.95, 1.6)*0.5
def bass(f, dur):
    n = int((dur+0.2)*SR); t = np.arange(n)/SR
    x = np.sin(2*np.pi*f*t) + 0.3*np.sin(2*np.pi*2*f*t) + 0.1*np.sin(2*np.pi*3*f*t)
    return x*env_adsr(n, 0.005, 0.5, 0.6, 0.08)*0.55
def brass(f, dur):
    n = int((dur+1.0)*SR); t = np.arange(n)/SR
    e = env_adsr(n, min(0.5, dur*0.3), 2, 0.9, 0.8)
    x = saw(f*(1+0.003*np.sin(2*np.pi*4.5*t)), t)
    y = np.zeros(n); # brightness follows envelope (2 bands)
    y = lp(x, 900)*0.7 + lp(x, 2600)*0.3*e
    return y*e*0.35
def rim(): n = int(0.06*SR); t = np.arange(n)/SR; return (bp(rng.standard_normal(n), 1500, 3500)*np.exp(-t*90) + 0.6*np.sin(2*np.pi*1700*t)*np.exp(-t*120))*0.5
def shaker(): n = int(0.08*SR); t = np.arange(n)/SR; return hp(rng.standard_normal(n), 5000)*np.exp(-t*50)*0.18
def kick(): n = int(0.25*SR); t = np.arange(n)/SR; f = 50+80*np.exp(-t*30); return np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*12)*0.8

# ---------------- score (beats, 4/4, 32-beat loop) ----------------
CH = [[55,58,62,65],[48,52,58,62],[53,57,60,64],[50,53,57,60],[55,58,62,65],[48,52,55,58],[53,57,60,64],[53,57,60,62]]
ROOTS = [43,36,41,38,43,36,41,41]
MEL = [[(0,1.5,74),(1.5,.5,72),(2,1,70),(3,1,69)],[(0,1.5,67),(1.5,.5,69),(2,2,70)],
       [(0,1,69),(1,1,72),(2,1,76),(3,1,74)],[(0,3,72),(3,1,69)],
       [(0,1.5,70),(1.5,.5,69),(2,1,67),(3,1,65)],[(0,1.5,64),(1.5,.5,65),(2,2,67)],
       [(0,1,69),(1,1,72),(2,1,77),(3,1,76)],[(0,4,77)]]
def events(nbeats):
    ev = []  # (beat, durbeats, kind, midi)
    for b0 in range(0, nbeats, 32):
        for bar in range(8):
            B = b0 + bar*4
            for o, d, m in MEL[bar]: ev.append((B+o, d, 'mel', m))
            for o, d in [(0,1.2),(1.5,.5),(2.5,1.0)]:
                for m in CH[bar]: ev.append((B+o, d, 'comp', m))
            for m in CH[bar]: ev.append((B, 4, 'pad', m))
            r = ROOTS[bar]
            for o, d, m in [(0,1.4,r),(1.5,.5,r+7),(2,1.4,r+7),(3.5,.5,r)]: ev.append((B+o, d, 'bass', m))
            for o in [0,1.5,3] if bar % 2 == 0 else [1,2]: ev.append((B+o, .1, 'rim', 0))
            for o in np.arange(0,4,.5): ev.append((B+o, .1, 'shk', 0))
            for o in [0,2]: ev.append((B+o, .1, 'kick', 0))
    return [e for e in ev if e[0] < nbeats]

def render_music(t0, t_end, bpm_fn, weights, tel_fn, seed_shift=0):
    """Render score from film time t0 with tempo curve bpm_fn(t). Returns dict of buses (full-length arrays)."""
    tt = np.arange(t0, t_end+20, 0.005)
    beat = np.concatenate([[0], np.cumsum(bpm_fn(tt[:-1])/60*0.005)])
    b2t = lambda b: np.interp(b, beat, tt)
    buses = {k: np.zeros(N) for k in ('dry', 'verb')}
    for b, d, kind, m in events(int(beat[-1])):
        ts = b2t(b)
        if ts >= t_end: continue
        dur = b2t(b+d) - ts
        f = mtof(m); out = []
        W = {k: float(fn(ts)) for k, fn in weights.items()}
        if kind == 'mel':
            if W['vibes'] > 0: out.append(vibes(f, dur)*W['vibes'])
            if W['celesta'] > 0: out.append(celesta(f, dur)*W['celesta'])
            if W['choir'] > 0: out.append(choir(f, dur)*W['choir']*0.9)
            if W['brass'] > 0: out.append(brass(f/2, dur)*W['brass'])
        elif kind == 'comp' and W['epiano'] > 0: out.append(epiano(f, dur)*W['epiano']*0.45)
        elif kind == 'pad':
            if W['strings'] > 0: out.append(strings(f, dur)*W['strings']*0.6)
            if W['choirpad'] > 0: out.append(choir(f/2, dur)*W['choirpad']*0.45)
        elif kind == 'bass' and W['bass'] > 0: out.append(bass(mtof(m), dur)*W['bass'])
        elif kind == 'rim' and W['drums'] > 0: out.append(rim()*W['drums'])
        elif kind == 'shk' and W['drums'] > 0: out.append(shaker()*W['drums'])
        elif kind == 'kick' and W['drums'] > 0: out.append(kick()*W['drums']*0.6)
        if not out: continue
        L = max(len(o) for o in out); x = np.zeros(L)
        for o in out: x[:len(o)] += o
        i = int(ts*SR); j = min(N, i+L); x = x[:j-i]
        buses['dry'][i:j] += x
    return buses

def reverb_ir(sec, decay):
    n = int(sec*SR); t = np.arange(n)/SR
    ir = rng.standard_normal((2, n))*np.exp(-t*decay)
    ir[:, :int(0.02*SR)] *= np.linspace(0, 1, int(0.02*SR))
    return ir/np.sqrt((ir**2).sum(axis=1, keepdims=True))*0.9
def conv_st(x, ir):
    return np.stack([signal.fftconvolve(x, ir[c])[:len(x)] for c in range(2)])
def telephone(x):
    y = bp(x, 380, 3300, 3); y = np.tanh(y*2.5)/2.5
    return y
def warble(x, depth_fn):
    t = np.arange(len(x))/SR
    d = depth_fn(t)*(0.0025*np.sin(2*np.pi*0.7*t) + 0.0012*np.sin(2*np.pi*5.3*t+1) + 0.0008*np.sin(2*np.pi*0.23*t))
    idx = np.arange(len(x)) - (0.004 + d)*SR
    return np.interp(idx, np.arange(len(x)), x)
def time_varying(x, w, fx):  # crossfade dry/processed by weight array
    return x*(1-w) + fx(x)*w

def load_wav_mono(path, sr=SR):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"], capture_output=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)
def place(buf, x, t, g=1.0):
    i = int(t*SR); j = min(len(buf), i+len(x)); buf[i:j] += x[:j-i]*g

def build():
    t = np.arange(N)/SR
    CR = E['crumble']
    # ---------- hold music, main ----------
    bpm = wcurve([(0,100),(E['jungle'],100),(E['ice'],80),(E['ocean'],62),(E['desert'],50),(E['red'],40),(E['cut'],34)])
    W = dict(
        epiano=wcurve([(0,1),(E['jungle']+2,1),(E['ice']+4,0)]), drums=wcurve([(0,1),(E['jungle'],1),(E['ice']+1,0)]),
        bass=wcurve([(0,1),(E['ocean'],1),(E['desert']+2,0)]), vibes=wcurve([(0,1),(E['ice'],1),(E['ice']+4,0)]),
        celesta=wcurve([(0,0),(E['jungle']+2,0),(E['ice']+2,1),(E['desert'],1),(E['desert']+4,0.3),(E['red']+3,0)]),
        strings=wcurve([(0,0),(E['decades']+4,0),(E['ice']+2,0.6),(E['desert'],0.9),(E['red'],1.2),(E['cut'],1.6)]),
        choir=wcurve([(0,0),(E['ocean']+3,0),(E['desert']+3,1),(E['cut'],1.2)]), choirpad=wcurve([(0,0),(E['ocean']+4,0),(E['desert']+4,0.8),(E['cut'],1.3)]),
        brass=wcurve([(0,0),(E['red']-1,0),(E['red']+3,0.9),(E['cut'],1.2)]))
    mb = render_music(MUSIC_T0, MUSIC_CUT, bpm, W, None)
    m = mb['dry']
    # sub drone in red-giant era (F + C)
    sub = (np.sin(2*np.pi*43.65*t)+0.5*np.sin(2*np.pi*65.4*t)+0.2*np.sin(2*np.pi*87.3*t))*wcurve([(0,0),(E['red']-2,0),(E['cut']-0.1,0.5)])(t)
    m = m + sub*0.5
    # warble era
    m = warble(m, wcurve([(0,0),(E['decades']-1,0),(E['decades']+4,0.6),(E['jungle']+4,1),(E['ice']+3,0.4),(E['ocean']+2,0)]))
    # telephone filter → opens up
    tw = wcurve([(0,1),(E['decades'],1),(E['jungle']+4,0)])(t)
    m = m*(1-tw) + telephone(m)*tw*1.4
    # underwater lowpass
    uw = wcurve([(0,0),(E['ocean']+1.2,0),(E['ocean']+2.5,1),(E['desert']-0.3,1),(E['desert']+1.8,0)])(t)
    m = m*(1-uw) + lp(m, 500, 4)*uw*1.3
    # reverb wet grows
    ir = reverb_ir(4.5, 1.1)
    wet = conv_st(m*wcurve([(0,0.08),(E['decades']+4,0.12),(E['ocean'],0.45),(E['cut'],0.7)])(t), ir)
    master_m = wcurve([(0,0),(MUSIC_T0,0),(MUSIC_T0+0.05,0.9),(E['red'],0.9),(MUSIC_CUT-0.4,1.35),(MUSIC_CUT,1.35),(MUSIC_CUT+0.003,0)])(t)
    music = (np.stack([m, m]) + wet)*master_m
    # ---------- reprise (tinny, phone held to dead ear, room perspective) ----------
    W2 = dict(epiano=lambda x: 1, drums=lambda x: 1, bass=lambda x: 1, vibes=lambda x: 1, celesta=lambda x: 0,
              strings=lambda x: 0, choir=lambda x: 0, choirpad=lambda x: 0, brass=lambda x: 0)
    r = render_music(REHOLD, END, lambda x: 100+0*x, W2, None)['dry']
    r = telephone(r)*0.55
    r = r*wcurve([(0,0),(REHOLD,0),(REHOLD+0.02,1),(BLACK_START,1),(BLACK_START+0.02,1.6),(END-0.6,1.6),(END,0)])(t)
    rv = conv_st(r*0.2, reverb_ir(1.2, 4))
    music = music + np.stack([r, r]) + rv

    # ---------- SFX ----------
    sfx = np.zeros(N)
    # DTMF dialing in black
    digs = [(697,1209),(770,1336),(852,1477),(941,1336),(697,1336),(770,1477),(852,1209),(697,1209),(941,1336),(770,1209)]
    for k, (a, b) in enumerate(digs):
        n = int(0.09*SR); tt = np.arange(n)/SR
        place(sfx, telephone((np.sin(2*np.pi*a*tt)+np.sin(2*np.pi*b*tt))*0.25*np.hanning(n)**0.2), 0.15 + k*0.13)
    # one ringback 1.65-2.9
    n = int(1.2*SR); tt = np.arange(n)/SR
    place(sfx, telephone((np.sin(2*np.pi*440*tt)+np.sin(2*np.pi*480*tt))*0.18*np.minimum(1, np.minimum(tt, 1.2-tt)/0.02)), 1.65)
    def click(g=0.5):
        n = int(0.03*SR); tt = np.arange(n)/SR
        return bp(rng.standard_normal(n), 800, 5000)*np.exp(-tt*200)*g + np.sin(2*np.pi*180*tt)*np.exp(-tt*80)*g*0.6
    place(sfx, click(0.6), 3.0)
    place(sfx, click(0.7), PICKUP_CLICK)
    place(sfx, click(0.6), REHOLD - 0.05)
    # clock tick: 1/s, accelerating from 8 to a buzz by ~22, fades ~28
    tick_n = int(0.012*SR); tk = bp(rng.standard_normal(tick_n), 2000, 7000)*np.exp(-np.arange(tick_n)/SR*600)
    tc, rate = 1.7, 1.0
    while tc < E['jungle']+5.5:
        g = 0.22*float(wcurve([(0,1),(E['jungle']-1,1),(E['jungle']+5,0)])(tc))
        place(sfx, tk*g*(1 if int(tc*rate) % 2 else 0.8), tc)
        rate = 1.0 if tc < 8 else min(60, np.exp((tc-8)*0.33))
        tc += 1.0/rate
    # weeks/years: whoosh of passing days (filtered noise with 'day/night' modulation)
    nz = rng.standard_normal(N)
    dn = lp(nz, 900)*(0.5+0.5*np.sin(2*np.pi*np.cumsum(wcurve([(0,0),(8,1),(E['decades'],4),(E['jungle'],6),(E['ice'],2),(E['ocean'],0)])(t))/SR))
    sfx += dn*wcurve([(0,0),(8,0),(11,0.12),(E['jungle']+4,0.12),(E['ice']+3,0)])(t)
    # birds (jungle 23.6-33)
    for k in range(26):
        tb = E['jungle']+0.2 + rng.random()*6.5; n = int(0.12*SR); tt = np.arange(n)/SR
        f0 = 2500+rng.random()*2500
        ch = np.sin(2*np.pi*np.cumsum(f0*(1+0.3*np.sin(2*np.pi*30*tt)))/SR)*np.hanning(n)*0.06
        for rep in range(rng.integers(1, 4)): place(sfx, ch, tb + rep*0.15)
    # wind (ice 31.6-40, desert 47.6-56)
    wind = bp(nz[::-1].copy(), 250, 1800)*(0.6+0.4*np.sin(2*np.pi*0.17*t))
    sfx += wind*(wcurve([(0,0),(E['ice']-0.5,0),(E['ice']+1.5,0.35),(E['ocean']+0.5,0.35),(E['ocean']+2,0)])(t) + wcurve([(0,0),(E['desert']+0.5,0),(E['desert']+2,0.18),(E['red']+1,0.15),(E['red']+3,0)])(t))
    # underwater: rumble + bubbles 39.6-48
    sfx += lp(nz, 120, 4)*wcurve([(0,0),(E['ocean']+1,0),(E['ocean']+2.5,1.2),(E['desert'],1.2),(E['desert']+1.5,0)])(t)
    for k in range(40):
        tb = E['ocean']+2 + rng.random()*3.5; n = int(0.05*SR); tt = np.arange(n)/SR
        f0 = 400+rng.random()*900
        place(sfx, np.sin(2*np.pi*f0*(1+tt*8)*tt)*np.exp(-tt*60)*0.08, tb)
    # embers / fire crackle 56-88 (continues under the silence)
    crk = np.zeros(N)
    for k in range(260):
        tb = E['red']+0.5 + rng.random()*(E['black']-E['red']-0.5); n = int(0.008*SR)
        place(crk, hp(rng.standard_normal(n), 2500)*np.exp(-np.arange(n)/SR*700)*(0.05+0.1*rng.random()), tb)
    sfx += crk + lp(nz, 300)*wcurve([(0,0),(E['red'],0),(E['red']+4,0.06),(E['cut']-0.1,0.08),(E['cut'],0.02),(E['black']-0.2,0.02),(E['black'],0)])(t)
    # crumble: sand pour 83.5-87 + phone thud ~86
    sand = hp(nz, 1500)*0.5 + lp(nz, 500)*0.6
    sfx += sand*wcurve([(0,0),(CR+3.0,0),(CR+4.1,0.25),(CR+6.0,0.18),(CR+7.4,0)])(t)
    nn = int(0.15*SR); tt = np.arange(nn)/SR
    place(sfx, (np.sin(2*np.pi*90*tt)*np.exp(-tt*30) + lp(rng.standard_normal(nn), 800)*np.exp(-tt*40)*0.5)*0.6, CR+6.0)
    sfx_st = np.stack([sfx, sfx])

    # ---------- VO (IVR) ----------
    vo = np.zeros(N)
    VO = os.path.join(ROOT, 'audio', 'vo')
    def ivr(name, tt, proc=None, g=1.0):
        x = load_wav_mono(os.path.join(VO, name))
        if proc: x = proc(x)
        place(vo, telephone(x)*1.3*g, tt)
    def slow(x, f):  # pitch+time slow (tape)
        return np.interp(np.arange(0, len(x), f), np.arange(len(x)), x)
    ivr('ivr1.wav', 3.3)
    ivr('ivr2.wav', 10.6)
    ivr('ivr3.wav', E['jungle']+1.2, lambda x: warble(x, lambda tt: 0.8+0*tt))
    ivr('ivr2.wav', E['ocean']+1.6, lambda x: lp(slow(x, 0.85), 700), 1.3)
    ivr('ivr4.wav', E['desert']+2.5, lambda x: slow(x, 0.7), 1.1)
    ivr('ivr2.wav', STINGER, None, 1.0)
    vo_st = np.stack([vo, vo]) + conv_st(vo*wcurve([(0,0.03),(E['ice'],0.1),(E['desert'],0.5),(E['black'],0.5),(E['black']+0.1,0.04)])(t), reverb_ir(3, 1.5))

    # duck music under VO
    env = np.abs(signal.hilbert(lp(np.abs(vo), 8))) if False else lp(np.abs(vo), 6)
    duck = 1 - np.clip(env*8, 0, 0.55)
    music *= duck

    # ---------- dialogue from clips ----------
    dia = np.zeros(N)
    CL = os.path.join(ROOT, 'assets', 'clips')
    for clip, a, b, fs, _d in SHOTS:
        if (clip, fs) in DIALOGUE:
            x = load_wav_mono(os.path.join(CL, clip))[int(a*SR):int(b*SR)]
            fade = int(0.03*SR); x[:fade] *= np.linspace(0, 1, fade); x[-fade:] *= np.linspace(1, 0, fade)
            place(dia, x, fs)
    # agent heard through phone? No: we cut to his side -> clean. Old man: clean.
    dia_st = np.stack([dia, dia])

    mix = music*0.9 + sfx_st*0.9 + vo_st*1.0 + dia_st*1.7
    mix = mix[:, :int(END*SR)]
    return mix

if __name__ == '__main__':
    mix = build()
    out = os.path.join(ROOT, 'audio', 'mix_raw.wav')
    pk = np.abs(mix).max(); mix = mix/pk*0.9
    import wave
    with wave.open(out, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((mix.T*32767).astype('<i2').tobytes())
    print('wrote', out, mix.shape[1]/SR)
