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

## rough-v9 (merge, not published) — 15:06 TPE
- Dialogue picture + sync back to v7: agent_hi (0-4.3, native audio, no offset), v7_ecu_a, v7_hold_b (native, no offset). Whisper: "...How can I help you today?" complete (64.86-68.64). Mouth-ROI vs speech: hi lag 0 corr 0.54, hold +1 frame corr 0.55 (same as v7).
- ECU crop y 0-560 (v7 600, v8 480): eyes incl. the closes/opens fully in frame, nose tip at bottom, no lips.
- Kept v8 audio: era beds +4 dB, rustle, thud/boom on the landing. Boom check: max momentary loudness in the landing window -9.6 LUFS, identical to v7/v8 and to the film's other peaks (8.7 s, 48.1 s) -> not excessive.
- Crumble: fx9.py. Shot 21 now = pile plate (v5_crumble_b 5.9-8.04 slowed to 4.94 s) under a 1.0 s code transformation of the slumped figure (frame src 2.85): ragged sand front from the hood (y 340) down to the floor, figure goes dusty ahead of the front, 50 px sand band with crumbling holes, robe sags 18% toward the seat, 2600 lit grains (back-lit, 1.2% embers) stream off the front, dust curtain trails it; phone lands when the front passes it (tau 0.38) with puff + 2-frame shake + thud (Foley times mapped onto the new timing). The clip's 'hood with wings' burst is no longer used. 24 fps sheet: head sanding 83.2-83.4, body dissolving 83.4-83.75, pile settled ~83.9.
- Mammoth: two more takes (v9_h4a/b) again brought a near mammoth that slides -> back to the distant v6_h4a at half speed (src 0-2.5 over 5 s).
- Optional fixed phone/hand layer in the time-lapses: skipped.
- cuts/rough-v9.mp4 91.56 s, -16.2 LUFS, -1.4 dBTP.

## rough-v10 (not published) — 15:15 TPE
- v9 published 15:10: film.mp4 200 video/mp4 31531049 = local, Range 206; README 'Current file' + score table (v8, v9 rows) updated (showroom c9481be).
- Alex sync hidden by editing, voice untouched (same agent_hi / v7_hold_b audio, same offsets):
  - 'Hi, thanks for holding, this is Alex,' over a new wide shot of an endless call-centre floor of identical Alexes (GenerateImage from agent.jpg -> i2v v10_floor, typing in unison, muted; slow code push-in to the centre Alex), cut at src 2.8 (after 'Alex.', 0.3 s before 'How') to the medium take for 'How can I help you today?'.
  - Reply: 'Absolutely, I can help with that.' plays over the old man's hopeful eyes (v7_ecu_b 0.2-2.3, same ECU framing), cut to Alex at src 2.9 landing on 'Can I put you on hold for just a moment?' (mouth opens on the cut). Lip-visible dialogue: ~1.0 s + ~1.9 s (was 4.3 + 5.0).
- Environment events (envfx10.py, synthesized), each level-set relative to the music around it, music ducked 3.5 dB (1.5-2 dB under the long beds): doorbell (12.65) + cardboard slap on each pizza box step; decades gust (22.55) + window rattle (22.95); jungle caws (30.95, 34.55) + cicadas & a fly pass (30.75-35.05); ice crack on the cut (38.25) + distant mammoth trumpet (40.4); desert gust (45.0) + sand hiss (45.25); red era lava gloops (50.55, 53.65-59.25) + deep groan (53.75).
- cuts/rough-v10.mp4 90.76 s, -16.2 LUFS, -1.3 dBTP, LRA 8.2; whisper: every line exact.

## rough-v11 (not published, lost blind A/B to v10) — 15:21 TPE
- Hold line played whole (v7_hold_b 0-5.0 at S18), old man only through 'Absolutely,' (cut to Alex at src 0.875, mouth open). +0.8 s.
- Final IVR = audio/vo/ivr2_stutter.wav: 118 ms bit-crushed half-rate 'f-' fragment + 30 ms gap + 'four' (whisper: 'is for four minutes').
- Floor shot depth of field: rows y<300 blurred 1.3->3 px + light haze up to 22%; Alex/near rows sharp.
- Room-tone floor -60 dBFS under the whole mix (removed 0.27 s head / 65 ms tail digital silence).
- On-disk rough-v11 = 31,534,350 bytes, the room-tone master (15:21:32); the 31,577,940 figure was the first master before the room-tone pass, overwritten. Audio stream md5 matches a fresh master; video differs only by x264 run-to-run variance (PSNR vs pic11 45 dB).
- REVIEW-10: neutral 7/10; blind A/B v10 > v11 (climax J-cut). Stutter heard and liked in A/B.

## rough-v12 (not published) — 15:40 TPE
- = v10 edit and timing exactly (timeline12 = timeline10 + stutter for the final IVR) + v11 stutter + room-tone floor + floor DOF + '1 YEAR' / '1 DAY' singular fix in fmt().
- Picture vs v10 differs only at 15.04-15.12 s (1 DAY), 21.33-21.50 (1 YEAR), 35.96-36.21 (pill text) and 64.62-67.42 (floor DOF); elsewhere encode-level PSNR.
- Audio: AAC overshoot on the landing transient (82.612) gave -0.4 dBTP with the standard master -> audio re-encoded with limiter 0.75 (video stream copied): -16.2 LUFS, -1.0 dBTP, LRA 8.1.
- QA: 0 click candidates, no digital silence >20 ms, whisper all 7 lines exact, every ding within 1 frame of its toast's first frame, sand start/thud at 82.24/82.60 vs S21 82.224 / impact frame 82.625, cuts within 1 frame (S8 transition 2 frames; S17 is a continuation), A/V end diff 14 ms (0.34 frame).
- cuts/rough-v12.mp4 90.76 s, 31537951 bytes. Sheets tests/v12/.

## rough-v13 (not published) — 15:50 TPE
- Clone melt at 66.58 s: NOT a defect in the film. Dense per-frame sheets with separators (frames 1584-1619 = 66.00-67.46 s, near rows y 280-620; whole floor shot 1551-1618 every 4th frame; full-res frame 1598) show no doubled/merged head. The 'doubled head' in the v12 2x2 sheet was the junction between two borderless cells (right-edge agent of frame 1598 next to left-edge agent of frame 1617). Picture left untouched; v13 video stream is bit-identical to v12 (stream md5 070f9971...).
- True peak: landing transient was the codec-overshoot culprit. sound13: thud/boom attack 1 ms -> 6 ms + tanh soft-knee on the fx stem only in w2(LAND) -0.45..+0.35 s (fx peak 1.133 -> 0.649). Landing max momentary -9.8 LUFS (v12 -9.7). Master limiter 0.80 (src/build13.sh).
- QA: -16.1 LUFS, LRA 8.1, true peak -1.6 dBTP (ebur128; 4x-oversampled -1.56); 0 clicks; no digital silence; whisper 7/7 exact (+ 'is for four minutes' stutter); dings within 1 frame of toasts; sand 82.24 / thud 82.60 vs impact frame 82.625; cuts identical to v12; A/V 90.750 / 90.764 (14 ms).
- cuts/rough-v13.mp4 31540470 bytes. Sheets tests/v13/.

## rough-v14 (not published) — 16:10 TPE — lip-sync pass (base v13; v12 is live, showroom d8fef24)
- Takes (GenerateVideo 720p 6 s, quoted lines; whisper word-exact on all 7):
  - Old man, new mouth-visible CU start frame assets/stills/v14_om_cu.jpg (crop of v3_cu.jpg, eyes upper third, mouth lower third): v14_om_a/b/c.
    Native sync (nose-tracked mouth frame-diff vs own audio): a 0.58 @0 (peak 0.70 at +6, unreliable), b 0.49 @0 (0.61 at +6), c 0.62 @0 (0.68 at +2). Old v7_ecu_a: mouth out of frame (ECU crop).
    Picked c. Mouth-openness (dark-interior px) vs its own audio: 0.57 at -1/-2 fr (mouth opens just before voicing = natural).
    Used its own audio (our v4_line_3 VO cadence has a long mid-line pause no take matches), same chain (hp/lp, level-match, tanh, small room), take and picture both at 0.92 tempo, starting at S16. In film: openness vs VO 0.52 at -1/-2 fr. Line 69.42-73.02 (v13 69.34-73.70) -> ~1.6 s beat before 'Absolutely' (v13 ~1.1 s).
  - Alex punchline: v14_hold_a/b/c from agent.jpg (full line), v14_hold_d from the v7_hold_b frame at 2.9 (punchline only).
    Punchline native (tracked): v7_hold_b 0.45 (fixed-ROI 0.70), a 0.46, b 0.37, c 0.47, d 0.37 (0.46 at +1). d's delivery is 2.5 s vs 1.46 s (doesn't fit the cut).
    Voices F0: agent_hi 152 Hz, v7_hold_b 151, a 127, b 176, c 134 -> only v7_hold_b matches the 'Hi, thanks for holding' voice. Tried a word-onset-warped onto the v7 voice: in-film 0.53 vs v7_hold_b 0.80 (lag 0) -> KEPT v7_hold_b.
- Edit identical to v13 (all cut times, J-cut, phone filter). Picture differs from v13 only 68.92-74.52 (+ x264 variance at 35.96-36.21).
- QA: -16.2 LUFS, LRA 8.1, true peak -1.7 dBTP (4x oversampled -1.65), 0 clicks, no digital silence, whisper 7/7, dings/landing/cuts as v13, A/V 90.750/90.764.
- cuts/rough-v14.mp4 31845066 bytes. Sheets tests/v14/ (film_om_mouth_1-3 every frame 68.96-74.58, om_shot_v14, take mouth sheets).
