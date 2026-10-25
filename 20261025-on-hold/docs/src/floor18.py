# v18: call-centre floor shot. Diagnosis (tests/v18/floor_*): the generated still v10_floor.jpg has well-formed faces in every row;
# the i2v clip v10_floor.mp4 degrades the small far faces over time (heads tilt down, features smear into blobs), and v12's
# depth-of-field (1.3-3 px blur on y<300) then turned the mid/far faces into half-formed mush. The clip stays pixel-aligned with
# the still above the row-2 partition top (phase correlation < 0.2 px, colour within ~1 level over src 0.3-3.1).
# Fix: rows above that partition top (y <= 211) come from the still (sharp, well-formed clones), the near and second rows from the
# clip (typing in unison); far rows get only a light blur (0.5-1.1 px) and a bit more haze instead of the mush-making blur.
import numpy as np
from PIL import Image, ImageFilter
W, H = 1280, 720
_ST = None
SEAM = 211.5
_y = np.arange(H, dtype=np.float32)[:, None, None]
_wst = np.clip((SEAM + 1.5 - _y) / 3.0, 0, 1)                      # 1 above the partition-top line, 3 px feather
def plate(frame, root):
    global _ST
    if _ST is None:
        _ST = np.asarray(Image.open(f'{root}/assets/stills/v10_floor.jpg').convert('RGB').resize((W, H), Image.LANCZOS), np.float32)
    f = np.asarray(frame, np.float32)
    return f * (1 - _wst) + _ST * _wst
def dof(img):
    a = np.asarray(img, np.float32)
    b1 = np.asarray(img.filter(ImageFilter.GaussianBlur(0.5)), np.float32)
    b2 = np.asarray(img.filter(ImageFilter.GaussianBlur(1.1)), np.float32)
    d = np.clip((SEAM - _y) / 150, 0, 1)                            # 0 at the seam and nearer, 1 at the far rows (y ~ 60)
    w1 = np.clip(d * 2, 0, 1); w2 = np.clip(d * 2 - 1, 0, 1)
    out = a * (1 - w1) + b1 * w1; out = out * (1 - w2) + b2 * w2
    haze = np.array([228, 232, 236], np.float32); hz = (np.clip((240 - _y) / 210, 0, 1) ** 1.3) * 0.30
    out = out * (1 - hz) + haze * hz
    return Image.fromarray(out.clip(0, 255).astype(np.uint8))
