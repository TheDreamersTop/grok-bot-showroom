# STATE  (updated 13:05 TPE)
Direction: "Your Call Is Important to Us". Locked room; man calls Premium+ after a renewal toast, put on hold through deep time.
Each era = flicker/whoosh time-lapse transition (first/last-frame clip at 2x) → locked hold (+slow push-in) with a Premium+
renewal toast joke ($14.99 → Gold+ads → 3 goats → mammoth tusk → 40 kg fish → SAND → The Sun) and the SAME hold tune in a
new costume (phone bossa, cassette-worn, marimba/steel-drum, music box, underwater, whistle western, full orchestra).
Climax: orchestra final chord = cut to CU of the ancient man, reverb rings out to ember silence → click → Alex → CU "Hi," →
Alex listening (line via headset) → "Can I put you on hold?" → tinny muzak, man crumbles to sand, phone on pile dings:
"Cancellation request received — Your subscription has renewed · $9.99/month" → black title + IVR "four minutes".

Strongest cut: cuts/rough-v3.mp4 (111.8 s, -16.1 LUFS, -1.4 dBTP, 45 MB). Previous: rough-v2 (3/10 review, reviews/REVIEW-01.md).
Showroom: /workspace/showroom/20261025-on-hold/ (film.mp4 = 480p rough-v1 placeholder; URL validated).

Build v3: venv=/workspace/_tmp/venv
  venv/bin/python src/music.py            # MIDI → FluidR3_GM wavs in audio/music
  venv/bin/python src/sound3.py           # mix → audio/mix3_raw.wav (+ stems)
  venv/bin/python src/picture3.py /workspace/_tmp/pic_v3.mp4 [t0 t1]
  src/master.sh /workspace/_tmp/pic_v3.mp4 audio/mix3_raw.wav cuts/rough-v3.mp4
Edit list: src/timeline3.py (shots, toasts, IVR times, hold values).
Checks: /workspace/_tmp/asr.py (whisper), tests/r3/* contact sheets.
Unresolved: music/voice quality unheard; transitions still contain generative morphing (hidden by 2x + flicker);
crumble pile shows legs/hands under sand; old man CU "Hi," lip sync unverified; ~112 s may be long.
Next: reviewer pass on rough-v3; then polish; final delivery to showroom + root index/README by ~19:00.


## 13:30 — rough-v4 DONE + published
- cuts/rough-v4.mp4: 95.43 s, 1280x720 24 fps, -16.1 LUFS, -1.4 dBTP, 36.0 MB. Sources: src/timeline4.py, sound4.py, picture4.py, phone4.py, stutter4.py, music.py:orchestra4(76).
- Showroom film.mp4 replaced with v4 (commit ad6e3ed), live URL verified 200 video/mp4 content-length 36004915, range 206.
- Next: wait for REVIEW-03; root README/index card at the end.

## 13:47 — rough-v5 DONE (not pushed; director decides after review)
- cuts/rough-v5.mp4 93.11 s, 720p, -16.2 LUFS, -1.1 dBTP, 35.5 MB. Sources: timeline5/sound5/picture5/strobe5/orch_vsco/phone4.oldphone_mild.
- If published: add VSCO-2 CE (CC0) credit to showroom 20261025-on-hold/README.md.
- Not done: continuity re-shoot of era stills (would cascade into regenerating holds/transitions/crumble).

## 14:21 — rough-v6 DONE (not pushed). v5 is live on the showroom.

## 14:37 TPE — rough-v7 done (not pushed)
cuts/rough-v7.mp4 (91.56 s). Sources: src/timeline7.py, picture7.py (+clock7.py, fx7.py), sound7.py. Showroom still serves rough-v6 (verified live).
Next: wait for review of v7; final phase = root README table + index card in showroom.
