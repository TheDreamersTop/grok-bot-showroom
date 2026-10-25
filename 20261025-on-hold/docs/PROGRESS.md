# PROGRESS
- 11:11 start. Brief read.
- 11:14 IDEAS.md (6 concepts) → chose #1 "Your Call Is Important to Us".
- 11:15 base still; T1 i2v test: locked camera holds; clips carry AAC audio (quiet, model mumbles) → will mute & do own sound.
- 11:17 T2 first+last frame morph S0→S1: day/night strobe + accumulation, composition locked. Core risk passed.
- 11:18-11:26 era stills S2..S7 (ref-image edits keep framing) + 6 chained morph clips: all hold the composition.
- 11:30 T3 speech test: model generated lip-synced line, whisper confirms "Hi, I'd like to cancel my subscription." Agent clips also verified by ASR.
- 11:37 crumble ending clip. IVR VO via piper (ljspeech, public domain).
- 11:36 rough-v1 assembled (96 s): sound.py (numpy synth muzak w/ tempo map + era instruments, SFX, piper IVR), picture.py (timer overlay). -16 LUFS.
- 11:40 showroom folder 20261025-on-hold pushed; Pages URL 200, video/mp4, range 206.
- 11:41 regenerated red-giant still from desert still (continuity), new m67b/speak_b/crumble_b.
- 11:46 rough-v2 (85.3 s): accelerating cut lengths 8→7→6→5.5 s, then majestic 8 s red giant; IVR stinger over black. ASR verifies all 9 lines at expected times.
- 11:50 REVIEW-01 (3/10) saved. Big push v3 started.
- 11:52-12:10 re-shot all era stills from s00 reference (frame/lamp/chair/phone locked), new opening (phone toast → dial), 7 transitions, 7 holds, 2 old-man CU line takes, Alex listening, 2 crumbles.
- 12:10 fluidsynth + FluidR3_GM (MIT); music.py writes MIDI arrangements (lounge, tropical, musicbox, western, orchestra) of one F-major tune.
- 12:20-12:40 box became unresponsive while running sound3.py (likely memory); resumed 12:40.
- 12:45 sound3 rewritten memory-light; bug: infinite tick loop (rate→∞) caused the hang. Fixed.
- 12:50 picture3: Premium+ toasts (frosted), timer racing in transitions/real-time in holds, flicker+flash transitions, push-in.
- 12:55 orchestra tail overlapped pickup → new CU hold clip; cut to CU on the final chord, ring-out into embers.
- 13:04 rough-v3 (111.8 s). ASR: all 9 lines correct, no stray words. Music chroma check: diatonic. Final toast → "Cancellation request received".

## 13:10–13:40 rough-v4 (REVIEW-02 fixes)
- Measurements first (all on rough-v3 + stems):
  - Headset line 90.4–93: vo stem band energy <300 Hz −14 dB, 300–3.4k −0.5 dB, >3.4k −11.2 dB (rel. total). Cause: S0.telephone = 3rd-order bandpass THEN tanh saturation → regenerates HF harmonics; shallow slope. Line itself only −18.5 dBFS rms vs room −33.8.
  - "Hi," sync: mouth-ROI frame-diff vs audio envelope cross-correlation in rough-v3 at 87.63: best lag +0.04 s (onset in sync, mouth opens ~0.1 s before sound). But frame-by-frame the jaw keeps moving/open ~0.4–0.6 s after the word ends and the CU stayed on 0.7 s more → reads as late.
  - Orchestra: tuning dev 4–11 cents, non-diatonic ≤9% (in tune, not pitch-bent; music stem identical to raw render). Low-mid (150–500 Hz) share 0.45–0.72 of energy in many seconds (mud: choir + brass thirds in F2–A2 + horns melody −12 inside the chord voicing). Dissonance: jazz melody (E over F triad, A over Bb) against plain triads, close-voiced = semitone rubs.
  - Pop at 76.8: second-difference click detector → largest transients 76.1–76.7 all in amb stem = red-era "crackle" impulses (8 ms, hp2500, 12/s, 53× local median). Not an edit discontinuity.
  - Office tone 83–99.6: amb stem alternates −34 dB (office, centroid ~300 Hz incl. 1–3 kHz hiss) and −23 dB (red rumble) at every CU/office cut → 10 dB steps.
- Fixes: phone4.oldphone chain (tremor 5.3 Hz, rasp, carbon-mic sat, 8 kHz 8-bit mu-law, 8th-order 300–3400 AFTER nonlinear stages, 1.75 kHz earpiece peak, compression, band-limited hiss); oldest take v4_line_3 (jitter 13.1%, HNR 1.3 dB; takes 2/3 have burned-in subtitles so only its audio is used); orchestra4 (trumpet melody, strings 8va, horn triads, roots-only bass, timpani downbeats, glock, sting + hall ring-out, no choir) low-mid 0.08–0.35; ember crackle replaced by soft 50 ms embers; continuous low office bed; era beds −4.4 dB + low-passed; ocean era cut, ice→desert hard-cut strobe (stills s04/s05/s06 + flashes) with shutter hits; crumble take 1; 95.4 s.

## 13:32–13:55 rough-v5 (REVIEW-03 visual fixes; audio only (a)/(b) + real orchestra per calibration)
- (a) headset: oldphone_mild (tremor kept, rasp .04, light 1.6 sat, 11 kHz/10-bit crush instead of 8 kHz mu-law, steep 300-3400 kept) + atempo 0.92. Whisper exact on clean and with brown noise at 12 dB and 6 dB SNR (v4 chain failed at 6 dB). Soft-limited peaks, loudness matched to Alex.
- (b) final picture mouth ROI frame-diff during "Hi" (v5 70.65-71.4): 8-13.7 vs 1.9-2.8 in the silent frames just before (4-6x); mouth starts opening 0.25 s before sound. Added 1.0->1.07 push-in toward the mouth and gamma 0.88 lift on that shot.
- Strobe: fixed man+chair layer from v3_s06 (polygon mask, tinted per plate) over ice/ocean/desert plates. Normalised structural change in face box per cut: v4 0.45-0.55 -> v5 0.10-0.16; chair 0.79-0.85 -> 0.12-0.24.
- Red giant 12.6 s -> 9.5 s (t67 3.5 + h7 5.97), orchestra starts at bar 2; The Sun toast on t67, "Low battery 1%" toast (battery app style), timer accelerates to 13.79 billion years with vertical digit smear blur.
- Crumble: new take v5_crumble_b (slump -> burst -> grains/dust -> phone lands) cut wide/CU hand (v5_cu_crumble)/wide; Foley retimed (groan, trickle, CU grains, whoomp, pour, grains, phone clack).
- Orchestra: VSCO-2 CE (CC0) sampler src/orch_vsco.py (trumpet, horns, trombone, tuba, violin/viola/cello sections, contrabass, timpani pitched by f0, crash, bass drum; humanized; hall IR). Tuning 2-10 c, non-diatonic <=7%.
- rough-v5: 93.11 s, -16.2 LUFS, -1.1 dBTP, 35.5 MB. Whisper: all 9 lines exact.

## 13:49–14:21 v5 published; rough-v6 (REVIEW-04 polish)
- v5 pushed to showroom (bdaa306) with README description + VSCO-2 CE CC0 credit; live 200 video/mp4, content-length 35487575 == local, range 206. (Box tool outage ~13:53–14:12.)
- Ice: new still v6_s04 (one small distant mammoth, no bear) + i2v hold v6_h4a (slow walk, picked over h4b) + new jungle->ice transition v6_t34a (first v3_s03, last v6_s04); strobe plate also v6_s04.
- Old man's line: CU 'Hi,' removed; 1.0 s silent CU reaction (cu_hold src 5.3-6.3, mouth verified closed) then the whole line 'Hi, I'd like to cancel my subscription' from take 3 through the headset over Alex listening. Whisper: exact clean; core sentence exact at 12 and 6 dB brown-noise SNR (3 seeds); 'Hi' kept at 12 dB.
- Pizza boxes: t01 shown as 5 held stop-motion states (sharpest frame near each target, exposure flicker), hard cuts + clunk on each step.
- Hands: h1 trimmed to src 0-3.4 (the second hand rubbing the face at src ~3.6 removed).
- Crumble: code grains with depth (1400, 3 blur layers, gravity, streaks), dust puff at phone landing (src 3.70, measured from phone-screen tracking), 2-frame shake, heavy thud + puff hiss.
- Orchestra: measured v5 music -18.7 dB vs rumble -28.9 (98% of rumble energy <100 Hz). v6: orchestra6 = full hold-tune head (bars 1-3) + sting, +2 dB; rumble -8 dB -> music -17.6..-19.7 vs amb -36.5.
- rough-v6: 92.61 s, -16.2 LUFS, -1.4 dBTP, 33.7 MB; whisper all lines exact.

## rough-v7 (polish, not published)
- v6 publish verified live 14:24 TPE: film.mp4 HTTP 200, video/mp4, content-length 33724806 (= local), Range 206, page 200.
- Fix 1 Alex lip sync: mouth-ROI (615-690, 228-278) frame-diff vs speech envelope. agent_hi native: lag 0, corr 0.68 (kept). agent_hold: best lag -0.50 s, corr 0.24 (bad) -> regenerated 2 takes from agent.jpg with the exact quoted line: v7_hold_a corr 0.59 lag 0, v7_hold_b corr 0.63 lag 0 -> using hold_b with its own audio, same offsets. In the final cut: hi corr 0.54 lag 0, hold corr 0.56 lag +1 frame.
- Fix 4 old man line: v7_ecu_a (i2v from a crop of v3_cu.jpg), cropped in comp to y 0-600 so the mouth is below frame; voice = take-3 audio, atempo 0.92, clean small-room (not headset) at 69.27-74.14; cut to Alex 74.52. v3_alex_listen + silent CU dropped.
- Fix 2 clock: src/clock7.py replaces face + hands at (639,49) r43 in every room/trans/steps/stutter frame (before push-in); one continuous minute-hand angle; real time + ticking second hand in holds, sin-shaped spin peaks 1.6/2.6/4.0/6.5 rev/s in the 4 transitions, jumps per stop-motion step and strobe plate, red hold accelerates to 9 rev/s; half-frame motion blur. Face/ink colours sampled per frame (tints match era; ice face whiter).
- Fix 3 mammoth: v7_h4a — a second, near mammoth walks up and peers in (legs below sill, body bob); the distant one keeps walking.
- Fix 5 crumble: fx7 grains back-lit (shadow side 0.42x, warm rim toward sun at (640,230), stronger against the window), half-frame streaks, 3.5% embers with glow; puff warm top/dark bottom.
- Fix 6: last half of each dissolve transition (4,6,8,12) blends walls/window frame (mask: y<470 minus glass, minus man polygon, feather 10) toward the clip's end frame (smoothstep 0.5->0.85).
- Result: cuts/rough-v7.mp4 91.56 s, -16.2 LUFS, -1.5 dBTP; whisper: every line exact.

## rough-v8 (final polish, not published) — 14:55 TPE
- v7 published + verified live 14:41 TPE: 200, video/mp4, content-length 33306058 = local, Range 206.
- Sync: 3 new hi takes + 2 new hold takes from agent.jpg (exact quoted lines). Mouth crops at 8 and 24 fps vs 48 Hz envelope: agent_hi talks through a fixed toothy grin (little shape change); v8_hi_b has the clearest shapes (wide 'Hi', 'Alex', rounded 'How'); v8_hold_d neutral mouth with rounded 'o' on 'on hold'. Frame-level check: lips lead their own audio by ~0.08–0.12 s in these model takes -> Alex audio placed 2 frames early (AV_LEAD 0.083). hi shot 4.3 -> 4.7 s so 'today?' is complete (whisper had dropped it at 4.3).
- Old man ECU: crop y 40–520 (eyes, brow, nose; no lips at any frame), unsharp 2/60. Voice + fiery bed unchanged (same take, same loudness reference agent_hi).
- Era beds: ice +4 dB (+ thin whistle, 5 creaks), desert +4 dB + soft tumbleweed rustle L->R, red/lava +4 dB with a few more soft embers. Measured stems vs v7 (relative): ice +3.5, desert +5 (with rustle), red +4.3 dB; still 12–16 dB under music.
- Phone landing: frame-by-frame the phone stops at src 3.667 (not 3.70): thud, clack, shake, puff moved to LAND=3.667; added 48→38 Hz sub boom + low sand slump.
- cuts/rough-v8.mp4 91.96 s, -16.1 LUFS, -1.3 dBTP; whisper all lines exact.
