# Real-sample orchestra for the red-giant climax, from VSCO-2 Community Edition (CC0 1.0).
# Tiny sampler: nearest sample per note, resample to pitch, humanized timing/velocity, legato overlaps, section doubling, hall IR.
import numpy as np, os, re, glob, wave, sys, random
from scipy import signal
sys.path.insert(0, os.path.dirname(__file__))
import music as M
VS = '/workspace/_tmp/vsco2'
SR = 48000
NOTE = {'C':0,'C#':1,'D':2,'D#':3,'E':4,'F':5,'F#':6,'G':7,'G#':8,'A':9,'A#':10,'B':11}
def read(p):
    w = wave.open(p); n = w.getnframes(); ch = w.getnchannels(); sw = w.getsampwidth(); sr = w.getframerate()
    raw = w.readframes(n)
    x = np.frombuffer(raw, '<i2').astype(np.float32) / 32768 if sw == 2 else (np.frombuffer(raw, np.uint8).reshape(-1, 3) @ np.array([1, 256, 65536])).astype(np.int32)
    if sw == 3: x = np.where(x >= 2**23, x - 2**24, x).astype(np.float32) / 2**23
    x = x.reshape(-1, ch).T
    if ch == 1: x = np.vstack([x, x])
    if sr != SR: x = signal.resample_poly(x, SR // 100 * 1, sr // 100, axis=1) if sr == 44100 else x
    return x[:2]
def f0(x):
    y = x.mean(0)[int(0.3*SR):int(1.3*SR)]
    if len(y) < SR // 2: y = x.mean(0)[:SR]
    Y = np.abs(np.fft.rfft(y * np.hanning(len(y)), 8 * len(y))); fr = np.fft.rfftfreq(8 * len(y), 1 / SR)
    hps = Y.copy()
    for h in (2, 3, 4):
        d = Y[::h]; hps[:len(d)] *= d
    m = (fr > 30) & (fr < 1500); return fr[m][np.argmax(hps[m])]
class Inst:
    def __init__(self, pattern, regex, gain=1.0, rel=0.25, atk_trim=0.0):
        self.s = {}; self.gain = gain; self.rel = rel; offs = []
        files = sorted(glob.glob(os.path.join(VS, pattern)))
        for p in files:
            m = re.search(regex, os.path.basename(p))
            if not m: continue
            nm, octv, vel = m.group(1), int(m.group(2)), int(m.group(3))
            midi = 12 * (octv + 1) + NOTE[nm]
            x = read(p); fd = 69 + 12 * np.log2(f0(x) / 440)
            offs.append(fd - midi); self.s.setdefault(midi, {})[vel] = x
        off = np.median(offs); self.off = int(round(off / 12) * 12)
        self.s = {k + self.off: v for k, v in self.s.items()}
        self.cents = (off - self.off) * 100
        print(pattern, 'files', len(files), 'octave offset', self.off, 'residual cents', round(self.cents, 1), 'range', min(self.s), max(self.s))
    def render(self, midi, dur, vel):
        k = min(self.s, key=lambda m: abs(m - midi)); layers = self.s[k]
        vs = sorted(layers); v = vs[min(len(vs) - 1, int(vel / 128 * len(vs)))]
        x = layers[v]; ratio = 2 ** ((midi - k) / 12 - self.cents / 1200)
        n = int((dur + self.rel) * SR); pos = np.arange(n) * ratio; pos = pos[pos < x.shape[1] - 1]
        y = np.stack([np.interp(pos, np.arange(x.shape[1]), x[c]) for c in range(2)])
        nr = int(self.rel * SR); nd = min(y.shape[1], int(dur * SR))
        e = np.ones(y.shape[1]); e[nd:nd + nr] = np.linspace(1, 0, len(e[nd:nd + nr])); e[nd + nr:] = 0
        e[:int(0.004 * SR)] = np.linspace(0, 1, int(0.004 * SR))
        return y * e * self.gain * (0.35 + 0.65 * vel / 127)
def build(bpm=76, out=None, bars=(0, 1, 2, 3), F=16):
    random.seed(5)
    I = dict(
        tpt=Inst('Brass/Trumpet/sus/*.wav', r'_sus_([A-G]#?)(-?\d)_v(\d)', 0.9),
        hrn=Inst('Brass/F Horn/sus/*.wav', r'_sus_([A-G]#?)(-?\d)_v(\d)', 0.8),
        tbn=Inst('Brass/Tenor Trombone/sus/*.wav', r'_sus_([A-G]#?)(-?\d)_v(\d)', 0.55),
        tuba=Inst('Brass/Tuba/sus/*.wav', r'_sus_([A-G]#?)(-?\d)_v(\d)', 0.6),
        vln=Inst('Strings/Violin Section/susVib/*.wav', r'_susVib_([A-G]#?)(-?\d)_v(\d)', 0.9, 0.35),
        vla=Inst('Strings/Viola Section/susvib/*.wav', r'_susvib_([A-G]#?)(-?\d)_v(\d)', 0.7, 0.35),
        vc=Inst('Strings/Cello Section/susvib/*.wav', r'susvib_([A-G]#?)(-?\d)_v(\d)', 0.8, 0.35),
        cb=Inst('Strings/Solo Contrabass/SusVib/*.wav', r'_SusVib_([A-G]#?)(-?\d)_v(\d)', 0.6, 0.3),
    )
    spb = 60 / bpm; total = int((F * spb + 6) * SR)
    bus = {k: np.zeros((2, total)) for k in list(I) + ['perc']}
    def put(name, beat, dur_beats, midi, vel, legato=1.0):
        t = beat * spb + random.uniform(-0.012, 0.012) + (0.02 if name in ('vln', 'vla', 'vc') else 0)
        v = max(20, min(127, vel + random.randint(-7, 7)))
        y = I[name].render(midi, dur_beats * spb * legato, v); i = max(0, int(t * SR)); j = min(total, i + y.shape[1])
        bus[name][:, i:j] += y[:, :j - i]
    for i, bi in enumerate(bars):
        for o, d, n in M.MEL4[bi]:
            put('tpt', i*4+o, d, n, 92 + i*7 + (8 if o == 0 else 0), 1.06)
            put('vln', i*4+o, d, n + 12, 78 + i*6, 1.1)
            put('hrn', i*4+o, d, n - 12, 76 + i*6, 1.05)
        for cb_, cd, name in M.CH4[bi]:
            r, voi = M.T4[name]
            for n in voi: put('vla', i*4+cb_, cd, n - 12 if n - 12 >= 55 else n, 66 + i*6, 1.03)
            for n in voi[:2]: put('hrn', i*4+cb_, cd, n, 60 + i*6, 1.02) if i < 2 else None
            put('vc', i*4+cb_, cd, r + 12, 80, 1.02); put('cb', i*4+cb_, cd, r, 80, 1.0)
            if i >= 1: put('tbn', i*4+cb_, cd * 0.9, r + 12, 62 + i*6)
    for n in [72, 77, 81]: put('tpt', F, 1.2, n, 124)
    for n in [65, 69, 72, 77, 81, 84]: put('vln', F, 1.6, n, 118)
    for n in [60, 65, 69]: put('hrn', F, 1.4, n, 120); put('vla', F, 1.4, n - 12 if n - 12 >= 55 else n, 110)
    for n in [53, 57]: put('tbn', F, 1.2, n, 118)
    put('vc', F, 1.6, 41, 118); put('vc', F, 1.6, 53, 110); put('cb', F, 1.6, 29 + 12, 118); put('tuba', F, 1.2, 29 + 12, 118)
    # percussion: timpani hits pitched to F/C, crash + bass drum on the sting
    tim = sorted(glob.glob(os.path.join(VS, 'Percussion/Timpani/Timpani*_Hit_v3_rr1_Sum.wav')))
    tims = [(read(p), f0(read(p))) for p in tim]
    def timp(beat, midi, g):
        x, f = min(tims, key=lambda z: abs(69 + 12*np.log2(max(z[1], 20)/440) - midi))
        ratio = 440 * 2 ** ((midi - 69) / 12) / f; pos = np.arange(int(2.5 * SR)) * ratio; pos = pos[pos < x.shape[1] - 1]
        y = np.stack([np.interp(pos, np.arange(x.shape[1]), x[c]) for c in range(2)]) * g
        i = int((beat * spb + random.uniform(-0.008, 0.008)) * SR); j = min(total, i + y.shape[1]); bus['perc'][:, i:j] += y[:, :j-i]
    for b in range(0, F - 4, 8): timp(b, 41, 0.7)
    for b in range(4, F - 4, 8): timp(b, 38, 0.6)
    for k in range(8): timp(F - 2 + k * 0.25, 48, 0.25 + k * 0.06)
    timp(F, 41, 1.2)
    cr = read(os.path.join(VS, 'Percussion/cymbal-crash1_ff_rr1.wav')); i = int(F * spb * SR); j = min(total, i + cr.shape[1]); bus['perc'][:, i:j] += cr[:, :j-i] * 0.5
    bd = read(os.path.join(VS, 'Percussion/BDrumNewhit_v7_rr1_Sum.wav')); j = min(total, i + bd.shape[1]); bus['perc'][:, i:j] += bd[:, :j-i] * 0.8
    pan = dict(tpt=0.15, hrn=-0.3, tbn=0.3, tuba=0.2, vln=-0.45, vla=0.1, vc=0.35, cb=0.45, perc=0.0)
    mix = np.zeros((2, total))
    for k, x in bus.items():
        p = pan[k]; mix[0] += x[0] * (1 - max(0, p)) ; mix[1] += x[1] * (1 + min(0, p))
    # hall: synthetic convolution IR (exp-decaying filtered noise, early reflections), 2.4 s
    rng = np.random.default_rng(2); n = int(2.6 * SR); tt = np.arange(n) / SR
    ir = np.stack([signal.lfilter(*signal.butter(2, 6000 / (SR / 2)), rng.standard_normal(n)) * np.exp(-tt * 6.9 / 2.4) for _ in range(2)])
    ir[:, :int(0.012 * SR)] = 0; ir /= np.abs(ir).sum(1, keepdims=True) ** 0.5 * 30
    wet = np.stack([signal.fftconvolve(mix[c], ir[c])[:total] for c in range(2)])
    mix = mix * 0.8 + wet * 0.55
    mix = signal.sosfilt(signal.butter(2, 60 / (SR / 2), 'high', output='sos'), mix)
    mix = mix / np.abs(mix).max() * 0.7
    out = out or os.path.join(M.OUT, 'orchestra5.wav')
    with wave.open(out, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix.T * 32767).astype('<i2').tobytes())
    return out
if __name__ == '__main__':
    print(build())
    print(build(out=os.path.join(M.OUT, 'orchestra6.wav'), bars=(0, 1, 2), F=12))
