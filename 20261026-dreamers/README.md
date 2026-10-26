# 20261026-dreamers — 《阿嬤的便條紙》 Grandma's Notes

A 63-second short film for **TheDreamers 夢想家潛意識軟體** (https://www.thedreamers.top/), plus a 15-second cutdown.
**Status: DELIVERED.** Final cut v9.

▶ **Watch:** https://thedreamerstop.github.io/grok-bot-showroom/20261026-dreamers/

For years, Grandma covered Kai's monitor with sticky notes, nags written in red pen. Years later he types them into TheDreamers, one line at a time. Watch to the end, then pause on the last frame.

## Files
| file | duration | size | sha256 |
|---|---|---|---|
| `one-sixtieth_v9.mp4` (final film) | 63.00 s · 1512 frames · 1280×720 · 24 fps · H.264 + AAC 192k | 33,697,005 B | `429a977659c9d63e6c4688d06f796afaa7d54cf34283d85baa227a615d3d66a7` |
| `one-sixtieth_15s.mp4` (cutdown) | 15.00 s · 360 frames · 1280×720 · 24 fps | 7,219,294 B | `e10ee1206686d1fc8673b72417d0b786c8801affc20f7d74281563fd34bdfaac` |
| `one-sixtieth_v1.mp4` … `one-sixtieth_v8.mp4` | earlier cuts, kept for reference (v1–v2: the first concept 《六十分之一秒》 One Sixtieth of a Second) | | |
| `poster.jpg` | frame from v9 (2.2 s) | | |

Loudness: v9 −16.1 LUFS integrated, −2.2 dBTP, LRA 10.1. 15 s: −16.1 LUFS, −3.4 dBTP, LRA 5.7.

## Hidden frames (spoilers)
v9 hides one sentence on a single frame every 192 frames (8 s at 24 fps): frames 70, 262, 454, 646, 838 (你早點睡, 你值得吃好一點, 你偶爾看看窗外, 你可以打給阿嬤, 阿嬤愛你). The last 3 frames hold a final line.
The 15 s cut hides exactly one sentence, on frame 192 (8.000 s), and its twist line says only 「這部片也藏了一句。」 ("This film hides one, too.").
The film uses 1 frame (1/24 s). The real software shows a line for 0.017 s (one 60 Hz refresh).

## Honest notes
- The TheDreamers window is a **recreation drawn in code** after the official demo screenshots, with warmer grading and tighter framing. It is not a screen recording of the software.
- This is **not an official advertisement**, and it makes **no claims about effects**. It only shows what the software does, as stated on the official site: your own sentences, one every 8 s (the recommended setting), at random places on the screen, each for 0.017 s. The writing tips (≤10 characters, avoid 「不」, write 「你」 instead of 「我」) come from the official FAQ.
- No real people appear, and no AI-generated people or faces. Grandma is present only through her notes, her room and her off-screen voice.

## Credits & licences
| element | source | licence |
|---|---|---|
| Room plates (Grandma's CRT room in Tainan; Kai's desk in Hsinchu; over-desk view) | Generated stills (Grok Imagine, GenerateImage), with no people and no text; all text, UI, notes, rain, light and camera moves are drawn in code | generated / original |
| Sticky notes, handwriting, paper, shadows, red-pen marks, TheDreamers UI, code editor | Drawn in code (Python/NumPy/OpenCV/Pillow) | original |
| Music: original motif (music box, lo-fi radio, solo violin) | composed for the film; music box and radio synthesized in code; instruments from **VSCO-2 Community Edition** (violin pizz/arco, violin/cello sustain, harp, contrabass, glock) | VSCO-2 CE: **CC0** |
| Foley: keys (Zhuyin IME bursts, Backspace hold and auto-repeat, Ctrl+A/V), paper slaps and peels, rain, room tone, CRT hum and power on/off, tape rewind, UI ticks | synthesized in NumPy | original |
| Grandma's voice (Taiwanese Hokkien, off-screen) | **AI-generated**: the audio track of a Grok Imagine GenerateVideo clip of an empty room (the picture is not used), filtered and given room reflections. It is not a recording of any real person. A native-speaker *model* persona judged it natural Hokkien; Whisper transcribes it as Mandarin-like text. **No human speaker has verified it.** | generated |
| Fonts | **LXGW WenKai TC** (handwriting); **Noto Sans / Noto Serif CJK TC** (UI, titles); DejaVu Sans Mono (code) | SIL **OFL** 1.1 (WenKai, Noto); DejaVu/Bitstream Vera licence |

Built with Grok Bot by GK, 2026-10-26 (start 15:28 TPE). The production notes, tools and review history are in the work folder (not in this repo).
