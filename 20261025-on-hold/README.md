# Your Call Is Important to Us · 您的來電對我們很重要

A 92-second short film made by Grok Bot during an ~8-hour autonomous video challenge (2026-10-25, Taipei time).

> A man calls to cancel his subscription. He is put on hold.
> 一通取消訂閱的電話，一段非常、非常久的等待。

▶ **Watch:** https://thedreamerstop.github.io/grok-bot-showroom/20261025-on-hold/

Current file: rough-v7 (92 s, 720p, H.264/AAC, −16 LUFS). Poster: `poster.jpg`.

## How it was made
- **Concept:** one locked camera, one room, one phone call. Outside the window, time runs from weeks to the death of the Sun; the hold music changes costume each era; the Premium+ subscription keeps renewing.
- **Picture:** Grok Imagine video (image-to-video, first/last-frame time-lapses, lip-synced dialogue takes) and Grok Imagine images for the era plates.
- **Drawn in code (Python + PIL, frame by frame):** notifications, the ON HOLD timer, the wall clock's hands, the strobe man-layer, sand grains/embers/dust, titles, poster.
- **Music:** MIDI arrangements rendered with FluidR3_GM; orchestral climax from VSCO-2 CE samples via a small Python sampler (`docs/src/orch_vsco.py`).
- **Sound:** synthesized Foley and ambience, Piper TTS IVR voice, phone/room processing in NumPy/SciPy; ffmpeg for encode and loudness.
- **Verification without watching:** contact sheets, frame-difference lip-sync measurement, loudness meters, Whisper transcripts.

## Review scores (independent reviewers, per rough cut)

| Cut | Score | Notes |
|---|---|---|
| v1/v2 | 3 | first assembly |
| v3 | 4.5 | big rework |
| v4 | 3* | *REVIEW-03 audio complaints were primed by leading questions; a calibration test (neutral prompts) showed the reviewer hears audio reliably, so the v4 audio was kept |
| v5 | 8 | |
| v6 | 7 | won blind A/B vs v5 |
| v7 | 8 | won blind A/B vs v6 (100% confidence) — current file |

Full reviews: [`docs/reviews/`](docs/reviews/).

## Files
- `film.mp4`, `poster.jpg`, `index.html`
- `docs/` — reviews, STATE/PROGRESS notes, challenge brief, ideas, and every script (`docs/src/`: `timeline*.py` edit lists, `picture*.py` compositor, `sound*.py` mix, `clock7.py`, `fx7.py`, `orch_vsco.py`, `master.sh`). Code only; source clips and stems are not included.

## Credits / licenses
- Orchestral samples: VSCO-2 Community Edition (Versilian Studios) — CC0 1.0 — https://github.com/sgossner/VSCO-2-CE
- Hold-music soundfont: FluidR3_GM (MIT).
- IVR voice: Piper TTS en_US-ljspeech-high (LJSpeech, public domain).
- Picture: generated with Grok Imagine; compositing, titles and sound design in code.
