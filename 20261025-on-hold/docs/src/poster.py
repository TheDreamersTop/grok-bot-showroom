# poster.jpg: red-giant hold frame (no UI) + code-drawn clock, ON HOLD pill and title
import sys, os, subprocess, numpy as np
sys.path.insert(0, os.path.dirname(__file__))
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import picture8 as P, clock7
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", "1.2", "-i", os.path.join(ROOT, "assets/clips/v3_h7.mp4"), "-frames:v", "1",
                      "-vf", "scale=1280:720", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
img = Image.fromarray(np.frombuffer(raw, np.uint8).reshape(720, 1280, 3))
img = clock7.overlay(img, 40.0, True).convert('RGBA')
# darken the top for the title
grad = Image.new('L', (1, 720)); grad.putdata([int(200 * max(0, 1 - y / 260) ** 1.6) for y in range(720)])
img.alpha_composite(Image.merge('RGBA', [Image.new('L', (1280, 720), 0)] * 3 + [grad.resize((1280, 720))]))
P.pill(img, "ON HOLD  " + P.fmt(4903118422 * P.YEAR + 12 * 86400 + 3 * 3600 + 7 * 60 + 41), (255, 70, 60))
d = ImageDraw.Draw(img, 'RGBA')
ft = P.inter(58, 300)
t = "Your Call Is Important to Us"; tw = d.textlength(t, font=ft)
d.text(((1280 - tw) / 2, 34), t, font=ft, fill=(240, 238, 244, 255))
fz = ImageFont.truetype(sys.argv[2], 26, index=int(sys.argv[3]))
z = "您的來電對我們很重要"; zw = d.textlength(z, font=fz)
d.text(((1280 - zw) / 2, 112), z, font=fz, fill=(225, 210, 205, 225))
img.convert('RGB').save(sys.argv[1], quality=90)
