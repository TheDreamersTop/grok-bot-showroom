import numpy as np
from scipy import signal
SR = 48000
def sos_bp(x, lo, hi, order=8):
    return signal.sosfilt(signal.butter(order, [lo/(SR/2), hi/(SR/2)], 'band', output='sos'), x)
def peak(x, f0, q, gain_db):
    A = 10**(gain_db/40); w = 2*np.pi*f0/SR; al = np.sin(w)/(2*q)
    b = [1+al*A, -2*np.cos(w), 1-al*A]; a = [1+al/A, -2*np.cos(w), 1-al/A]
    return signal.lfilter(b, a, x)
def compress(x, thr_db=-24, ratio=4, att=0.004, rel=0.08):
    env = np.abs(x); out = np.empty_like(env); ga, gr = np.exp(-1/(att*SR)), np.exp(-1/(rel*SR)); e = 0.0
    # vectorised-ish envelope via lfilter on rectified signal (release-dominated)
    env = signal.lfilter([1-gr], [1, -gr], env)
    lvl = 20*np.log10(env + 1e-6); over = np.maximum(0, lvl - thr_db)
    g = 10**(-(over - over/ratio)/20)
    return x * g
def oldphone(x, seed=3, trem=0.16, rasp=0.1):
    rng = np.random.default_rng(seed); t = np.arange(len(x))/SR
    # 1) old-age tremor: amplitude tremolo 5.3 Hz + tiny pitch wobble
    wob = 0.0009*np.sin(2*np.pi*5.3*t)
    x = np.interp(np.arange(len(x)) - wob*SR, np.arange(len(x)), x)
    x = x * (1 + trem*np.sin(2*np.pi*5.3*t + 0.7))
    # 2) rasp: band noise riding the voice envelope
    env = signal.lfilter([0.002], [1, -0.998], np.abs(x)) * 60
    x = x + sos_bp(rng.standard_normal(len(x)), 1200, 3200, 4) * env * rasp
    # 3) pre-band-limit, saturate (carbon mic)
    x = sos_bp(x, 280, 3500, 4); x = x / (np.abs(x).max() + 1e-9)
    x = np.tanh(x*3.0) / np.tanh(3.0)
    # 4) bitcrush: 8 kHz, 8-bit mu-law
    d = signal.resample_poly(x, 1, 6); mu = 255
    c = np.sign(d)*np.log1p(mu*np.abs(np.clip(d, -1, 1)))/np.log1p(mu); c = np.round(c*127)/127
    d = np.sign(c)*((1+mu)**np.abs(c) - 1)/mu
    x = signal.resample_poly(d, 6, 1)[:len(x)]
    # 5) hard band-limit AFTER all nonlinear stages (8th order), earpiece resonance
    x = sos_bp(x, 300, 3400, 8)
    x = peak(x, 1750, 2.2, 6) ; x = peak(x, 600, 1.0, -3)
    # 6) squash
    x = compress(x, -26, 5); x = x / (np.abs(x).max() + 1e-9)
    # 7) line hiss, band-limited
    x = x + sos_bp(rng.standard_normal(len(x)), 300, 3400, 6) * 0.012
    return x

def oldphone_mild(x, seed=3, trem=0.14, rasp=0.04, crush_bits=10):
    """v5: milder — keep tremor + steep 300-3400 band-pass + earpiece; light saturation, light 11 kHz/10-bit crush."""
    rng = np.random.default_rng(seed); t = np.arange(len(x))/SR
    wob = 0.0008*np.sin(2*np.pi*5.3*t)
    x = np.interp(np.arange(len(x)) - wob*SR, np.arange(len(x)), x)
    x = x * (1 + trem*np.sin(2*np.pi*5.3*t + 0.7))
    env = signal.lfilter([0.002], [1, -0.998], np.abs(x)) * 60
    x = x + sos_bp(rng.standard_normal(len(x)), 1200, 3200, 4) * env * rasp
    x = sos_bp(x, 280, 3500, 4); x = x / (np.abs(x).max() + 1e-9)
    x = np.tanh(x*1.6) / np.tanh(1.6)
    d = signal.resample_poly(x, 11, 48); q = 2**(crush_bits-1); d = np.round(d*q)/q
    x = signal.resample_poly(d, 48, 11)[:len(x)]
    x = sos_bp(x, 300, 3400, 8)
    x = peak(x, 1750, 1.6, 4); x = peak(x, 600, 1.0, -2)
    x = compress(x, -24, 3); x = x / (np.abs(x).max() + 1e-9)
    x = x + sos_bp(rng.standard_normal(len(x)), 300, 3400, 6) * 0.006
    return x
