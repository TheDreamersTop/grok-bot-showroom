# v10: distinct, recognisable environmental events (synthesized), placed in music gaps / on cuts.
import numpy as np
from scipy.signal import butter, sosfilt
SR = 48000
rng = np.random.default_rng(1010)
def T(x): return int(round(x * SR))
def bp(x, a, b, o=2): return sosfilt(butter(o, [a, b], 'bandpass', fs=SR, output='sos'), x)
def lp(x, f, o=2): return sosfilt(butter(o, f, 'lowpass', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'highpass', fs=SR, output='sos'), x)
def env(n, pts):   # pts: [(t, v)]
    t = np.arange(n) / SR; return np.interp(t, [p[0] for p in pts], [p[1] for p in pts])
def st(y, pan=0.5): return np.stack([y * np.sqrt(1 - pan), y * np.sqrt(pan)])
def gust(dur=1.8, g=0.3, f0=280, f1=1100):
    n = T(dur); z = rng.standard_normal(n); out = np.zeros(n); blk = 2048
    for i in range(0, n, blk):
        u = i / n; fc = f0 + (f1 - f0) * np.sin(np.pi * u) ** 1.5
        out[i:i + blk] = bp(z[i:i + blk + 0][:min(blk, n - i)], fc * 0.6, fc * 1.6)
    out = lp(out, 3000) * env(n, [(0, 0), (dur * 0.45, 1), (dur * 0.6, 0.85), (dur, 0)]) ** 1.3 * g
    flutter = 1 + 0.25 * np.sin(2 * np.pi * 7 * np.arange(n) / SR + rng.random() * 6)
    y = out * flutter
    pan = np.linspace(0.25, 0.75, n); return np.stack([y * np.sqrt(1 - pan), y * np.sqrt(pan)])
def rattle(dur=1.0, g=0.12, rate=28):
    n = T(dur); y = np.zeros(n); e = env(n, [(0, 0.3), (dur * 0.35, 1), (dur, 0)])
    t = 0.0
    while t < dur - 0.05:
        i = T(t); m = T(0.03); u = np.arange(m) / SR
        c = bp(rng.standard_normal(m), 1200, 5000) * np.exp(-u * 260) + np.sin(2 * np.pi * (2600 + 300 * rng.random()) * u) * np.exp(-u * 120) * 0.4
        y[i:i + m] += c * e[i] * (0.6 + 0.4 * rng.random()); t += rng.exponential(1 / rate)
    return st(y * g, 0.55)
def caw(n_caws=2, g=0.16, pan=0.3):
    out = np.zeros(T(0.5 * n_caws + 0.6))
    for k in range(n_caws):
        d = 0.32 + 0.05 * rng.random(); n = T(d); u = np.arange(n) / SR
        f = 620 - 160 * (u / d) + 20 * np.sin(2 * np.pi * 9 * u)
        ph = 2 * np.pi * np.cumsum(f) / SR
        saw = sum(np.sin(h * ph) / h for h in range(1, 14))
        y = (saw * (0.7 + 0.6 * rng.standard_normal(n) * 0.5)) * env(n, [(0, 0), (0.03, 1), (d * 0.7, 0.8), (d, 0)])
        y = bp(y, 450, 3200) + bp(rng.standard_normal(n), 900, 2500) * 0.25 * env(n, [(0, 0), (0.03, 1), (d, 0)])
        i = T(k * (0.42 + 0.06 * rng.random())); out[i:i + n] += y
    return st(out / (np.abs(out).max() + 1e-9) * g, pan)
def insects(dur=4.3, g=0.05):
    n = T(dur); t = np.arange(n) / SR
    cic = bp(rng.standard_normal(n), 4200, 6800) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 46 * t))) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.4 * t)) ** 2
    fly_d = 1.4; m = T(fly_d); u = np.arange(m) / SR
    fly = sum(np.sin(2 * np.pi * h * np.cumsum(205 + 25 * np.sin(2 * np.pi * 0.9 * u) + 12 * np.sin(2 * np.pi * 31 * u)) / SR) / h for h in range(1, 8))
    fly = bp(fly, 180, 3000) * env(m, [(0, 0), (0.5, 1), (0.9, 1), (fly_d, 0)]) * 0.5
    y = cic * env(n, [(0, 0), (0.4, 1), (dur - 0.4, 1), (dur, 0)]); yy = np.stack([y, y * 0.8])
    i = T(0.9); pan = np.linspace(0.1, 0.9, m)
    yy[0, i:i + m] += fly * np.sqrt(1 - pan); yy[1, i:i + m] += fly * np.sqrt(pan)
    return yy * g / (np.abs(yy).max() + 1e-9) * 1.0
def ice_crack(g=0.5):
    n = T(1.6); y = np.zeros(n); u = np.arange(n) / SR
    y[:T(0.004)] += rng.standard_normal(T(0.004)) * 1.0                               # snap
    for k in range(18):                                                                 # splintering crackle
        i = T(0.01 + rng.exponential(0.06)); m = T(0.004)
        if i + m < n: y[i:i + m] += rng.standard_normal(m) * 0.6 * np.exp(-i / SR * 8)
    chirp_d = 0.5; m = T(chirp_d); uu = np.arange(m) / SR                               # dispersive 'pew' of lake ice
    f = 3200 * np.exp(-uu * 5.5) + 250; ch = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-uu * 6) * 0.35
    y[T(0.02):T(0.02) + m] += ch
    y += np.sin(2 * np.pi * 55 * u) * np.exp(-u * 4) * 0.45 * (1 - np.exp(-u * 200))     # low boom
    y = y / np.abs(y).max() * g
    return np.stack([y * 0.9, y])
def trumpet(g=0.12, pan=0.7):
    d = 1.3; n = T(d); u = np.arange(n) / SR
    f = 430 + 110 * np.clip(u / 0.25, 0, 1) - 60 * np.clip((u - 0.8) / 0.5, 0, 1) + 14 * np.sin(2 * np.pi * 6.5 * u)
    ph = 2 * np.pi * np.cumsum(f) / SR
    y = sum(np.sin(h * ph) * (1 / h ** 0.8) for h in range(1, 18)) * (1 + 0.5 * lp(rng.standard_normal(n), 80))
    y = bp(y, 350, 3500) * env(n, [(0, 0), (0.12, 1), (d * 0.75, 0.9), (d, 0)])
    y = lp(y, 2200)                                             # distance
    y = y / np.abs(y).max() * g
    return st(y, pan)
def sand_hiss(dur=2.5, g=0.07):
    n = T(dur); y = hp(rng.standard_normal(n), 3500) * lp(np.abs(rng.standard_normal(n)), 30) * env(n, [(0, 0), (0.6, 1), (dur, 0)])
    return np.stack([y, y * 0.9]) * g / (np.abs(y).max() + 1e-9) * 3
def lava(dur=6.0, g=0.12, rate=5):
    n = T(dur); y = np.zeros(n); t = 0.2
    while t < dur - 0.2:
        m = T(0.07 + 0.05 * rng.random()); u = np.arange(m) / SR
        f = 70 + 220 * (u / u[-1]) ** 1.5 * (0.7 + 0.6 * rng.random())
        b = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.abs(np.sin(np.pi * u / u[-1])) ** 0.7
        i = T(t); y[i:i + m] += b * (0.5 + 0.5 * rng.random()); t += rng.exponential(1 / rate)
    y = lp(y, 900) * g / (np.abs(y).max() + 1e-9)
    return np.stack([y, np.roll(y, T(0.013))])
def groan(dur=2.2, g=0.22):
    n = T(dur); u = np.arange(n) / SR
    f = 42 + 6 * np.sin(2 * np.pi * 0.35 * u) + 4 * lp(rng.standard_normal(n), 3) * 30
    ph = 2 * np.pi * np.cumsum(f) / SR
    y = sum(np.sin(h * ph) / h for h in range(1, 10)) * (1 + 0.3 * lp(rng.standard_normal(n), 12) * 8)
    y = lp(y, 260, 3) * env(n, [(0, 0), (0.7, 1), (1.5, 0.8), (dur, 0)])
    return st(y / (np.abs(y).max() + 1e-9) * g, 0.5)
def doorbell(g=0.13):
    out = np.zeros(T(1.6))
    for f0, off in ((659.3, 0.0), (523.3, 0.42)):
        m = T(1.1); u = np.arange(m) / SR
        y = sum(a * np.sin(2 * np.pi * f0 * r * u) * np.exp(-u * dcy) for r, a, dcy in ((1, 1, 3.5), (2.76, 0.35, 7), (5.4, 0.15, 11), (2.0, 0.2, 5)))
        i = T(off); out[i:i + m] += y * (1 - np.exp(-u * 800))
    return st(out / np.abs(out).max() * g, 0.6)
def box_slap(g=0.18):
    m = T(0.12); u = np.arange(m) / SR
    y = bp(rng.standard_normal(m), 250, 1800) * np.exp(-u * 45) + np.sin(2 * np.pi * 110 * u) * np.exp(-u * 35) * 0.8
    return st(y / np.abs(y).max() * g, 0.5)
