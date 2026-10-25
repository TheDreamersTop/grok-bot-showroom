# fixed man+chair layer (from the desert still) over changing background plates
import numpy as np, os
from PIL import Image, ImageDraw, ImageFilter
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H = 1280, 720
POLY = [(372,720),(372,445),(410,388),(540,378),(560,300),(585,262),(615,246),(650,246),(678,262),(700,300),(716,378),(865,386),(912,445),(912,720)]
def mask():
    m = Image.new('L', (W, H), 0); ImageDraw.Draw(m).polygon(POLY, fill=255)
    return np.asarray(m.filter(ImageFilter.GaussianBlur(6))).astype(np.float32)[..., None] / 255
def load(n): return np.asarray(Image.open(os.path.join(ROOT, 'assets', 'stills', n)).convert('RGB').resize((W, H), Image.LANCZOS)).astype(np.float32)
def plates(names, fg='v3_s06.jpg'):
    M = mask(); F = load(fg)
    ring = (mask_ring := (np.asarray(Image.new('L',(W,H),0).filter(ImageFilter.GaussianBlur(0))) )) is None
    out = []
    for n in names:
        B = load(n)
        # tint the fixed layer toward the plate's light (per-channel mean ratio in the area around the chair)
        g = (B[200:720, 250:1030].reshape(-1, 3).mean(0) + 1) / (F[200:720, 250:1030].reshape(-1, 3).mean(0) + 1)
        g = 1 + (g - 1) * 0.75
        out.append(np.clip(F * g, 0, 255) * M + B * (1 - M))
    return out
if __name__ == '__main__':
    P = plates(['v3_s04.jpg', 'v3_s05.jpg', 'v3_s06.jpg'])
    Image.fromarray(np.hstack([p[::2, ::2] for p in P]).astype(np.uint8)).save(os.path.join(ROOT, 'tests', 'v5', 'strobe_plates.png'))
