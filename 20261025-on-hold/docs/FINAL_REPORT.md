# FINAL REPORT — "Your Call Is Important to Us" (您的來電對我們很重要)

Final file: **`cuts/rough-v19.mp4`** — 31,365,099 bytes, 90.75 s — published (~17:10 TPE) at https://thedreamerstop.github.io/grok-bot-showroom/20261025-on-hold/film.mp4

## Concept
One locked-off room. An old man calls Premium+ support after an auto-renewal notification and is put on hold, and stays on hold through deep time. Each era is a time-lapse transition into a locked hold: seasons and decades, jungle, ice age with a mammoth, desert, then the red-giant Sun. In every hold, the same hold tune returns in a new arrangement: bossa, cassette, marimba, music box, western, orchestra. Over it run escalating renewal toasts ($14.99, then 3 goats, a mammoth tusk, SAND, The Sun) and a racing on-hold timer. At the climax, the ancient man finally reaches Alex in an endless call centre: "Hi, I'd like to cancel my subscription." "Absolutely… Can I put you on hold for just a moment?" He crumbles to sand; the phone on the pile dings "Cancellation request received — Your subscription has renewed · $9.99/month"; over black, the IVR says "Your estimated wait time is f-four minutes."
Design choice: generated video is weak at shot-to-shot consistency, so the film is built around change between shots (first-frame/last-frame morphs, a locked camera). Code carries the structure and the jokes: sound, music, toasts, timer and the crumble effect.

## Cut history (scores and A/B results as recorded in reviews/ and PROGRESS.md)
| Cut | TPE | Length | What changed | Neutral review | Blind A/B |
|---|---|---|---|---|---|
| v1 | 11:36 | 96 s | first assembly: synth muzak, piper IVR, timer overlay (480p placeholder published 11:40) | — | — |
| v2 | 11:46 | 85.3 s | accelerating cut lengths, red giant, IVR stinger | REVIEW-01: **3/10** | — |
| v3 | 13:04 | 111.8 s | all stills re-shot from one reference, toasts, MIDI hold-tune arrangements, Alex, 2 crumbles | REVIEW-02: **4.5/10** | — |
| v4 | 13:30 | 95.4 s | handset chain, orchestra4, office bed, ocean era cut, strobe; published (ad6e3ed) | REVIEW-03: **3/10** | — |
| v5 | 13:47 | 93.11 s | fixed man+chair layer in strobe, VSCO-2 CE orchestra, red giant shortened, new crumble take; published (bdaa306) | REVIEW-04: **8/10** | — |
| v6 | 14:21 | 92.61 s | distant mammoth, silent CU + headset line, stop-motion pizza boxes, crumble grains/puff/thud; published | REVIEW-05: **7/10** | v6 > v5 (very high confidence, large difference) |
| v7 | 14:37 | 91.56 s | Alex re-take (sync), old-man ECU (eyes only), coded clock, nearer mammoth, lit grains; published (a9e8ec0) | REVIEW-06: **8/10** | v7 > v6 (100%, large difference) |
| v8 | 14:55 | 91.96 s | new Alex takes, ECU crop, era beds +4 dB, phone landing on measured frame | REVIEW-07: **8/10** | v7 > v8 (high confidence, small difference) |
| v9 | 15:06 | 91.56 s | v7 dialogue + v8 audio; gradual code crumble (fx9); published (c9481be) | REVIEW-08: **8/10** | v9 > v7 (100%, large impact) |
| v10 | 15:15 | 90.76 s | endless call-centre floor shot hides Alex's sync; J-cut on old man's eyes; era sound events | REVIEW-09: **8/10** | v10 > v9 (high confidence, large difference) |
| v11 | 15:21 | +0.8 s vs v10 | whole hold line, "f-four" stutter, floor DOF, room-tone floor | REVIEW-10: **7/10** | v10 > v11 (very high confidence); stutter liked |
| v12 | 15:40 | 90.76 s | v10 edit + v11 stutter + room tone + DOF + "1 YEAR/1 DAY" fix; published (d8fef24) | — | — |
| v13 | 15:50 | 90.75 s | landing transient soft-knee, limiter 0.80 (−1.6 dBTP); published (68d9eec) | — | — |
| v14 | 16:10 | 90.75 s | lip-sync pass: mouth-visible old-man CU take | REVIEW-11: **7/10** | v13 > v14 (100%) |
| v15 | 16:25 | 87.0 s | middle trimmed 3.7 s (ice/sand) + phone drop with weight | — | v13 > v15 (high confidence, large difference) |
| v16 | 16:35 | 90.75 s | v13 + phone drop only (bezel/UI phone, apex rebuilt) + audible final "minutes"; published (b3336d3) | REVIEW-12: **8/10** | v16 vs v13 full film: no difference; ending only (last 15 s): v16 preferred, 100% |
| v17 | 16:44 | 90.75 s | v16 + phone graded into the red room (warm key, lava rim, dim cool screen, grain, contact shadow); published (91e8a8e) | — | v16 vs v17 ending (both orders): inconclusive — reviewer picked whichever came second, with invented reasons; v17 published 16:50 as a low-risk objective fix |
| v18 | 16:55 | 90.75 s | v17 + call-centre far rows from the clean generated still (the i2v clip + DOF had smeared them) + 2x reframe of the crumble CU (drops the rope-like sand strands of the hand) | — | clips rated alone: floor 3–4/10 for both v17 and v18, not distinguishable (v18 kept on the sheets); CU still SEVERE in both |
| v19 | 17:04 | 90.75 s | v18 with the crumble close-up removed: one continuous slowed wide (0.83x) runs into the code crumble; audio bit-identical; **FINAL**, published ~17:10 | REVIEW-13: **6/10** | — |

## Most consequential revisions
1. **v3 → v5: consistency and sound.** All stills were re-shot from one reference frame, and a fixed man+chair layer was added over the strobe. A real-sample orchestra (VSCO-2 CE) replaced the synth. A steep handset chain was added. Neutral scores went from 3–4.5 to 8.
2. **v7: performances.** The old-man ECU with eyes only, the exhausted human voice and the fiery room tone (A/B 100%).
3. **v9: gradual code crumble** instead of the generated burst: sand front, sagging robe, lit grains (A/B 100%, large impact).
4. **v10: the endless call-centre floor of identical Alexes** hides the weak lip sync and became "arguably the best visual gag". The J-cut on the old man's eyes stayed after v11 lost.
5. **v11/v12: the "f-four" IVR stutter**, which the A/B liked.
6. **v16: phone drop with weight** (8-frame gravity fall, spray, settle, thud on the impact frame). The final "minutes" was made audible: the handset band-limit had removed its final /ts/, and the end fade started inside the word.
Rejected experiments, kept as evidence: v8 performances, the v11 long Alex take, the v14 lip-sync take and the v15 trims.

## Real timeline (TPE, 2026-10-25)
- 11:11 start; 11:14 concept chosen; 11:17 core risk (locked composition through morphs) passed in footage; 11:36 first cut.
- 11:50 first review (3/10) → full re-shoot; 13:04 v3.
- **Box outage 12:20–12:40**: unresponsive while sound3.py ran (infinite tick loop; fixed 12:45).
- 13:30 v4 published; 13:47 v5 → 8/10.
- **Box tool outage ~13:53–14:12.**
- 14:21–15:15: v6–v10, one review round each (about 15 min per iteration).
- **Box unresponsive ~15:22–15:35** (after the v11 master at 15:21:32; reported responsive again at 15:35). Recovery work was then done one job at a time.
- 15:40–17:06: v12–v19. Brief tool-spawn failure at 16:43 (render re-run).
- ~17:10 v19 published as the final file (by the director). Total elapsed 11:11 → ~17:10 ≈ 6 h of the ~8 h window.

## Why I stopped at about 6 h
Blind A/Bs and clip-alone reviews no longer discriminated between cuts (v16 vs v13 full film: no difference; v16 vs v17 ending: order-driven; v17 vs v18 floor: indistinguishable), and neutral scores of near-identical cuts span 6–8 (v16 8/10, v19 6/10, so about ±1 noise). The remaining flaws (call-centre faces, lip sync, mammoth slide, static bird, clock glyphs, hand/phone/beard morphing) are generation artifacts that would need whole shots re-generated, not more polish passes.

## Verification methods
I cannot watch or hear video. Every claim rests on measurements, frames and external blind reviewers.
- **Speech:** faster-whisper (small.en) with word timestamps on stems and masters: every line word-exact (7/7 in v12–v17). Noise-robustness runs at 12 and 6 dB SNR for the headset line.
- **Loudness:** ffmpeg ebur128, target −16 ±0.5 LUFS; true peak ≤ −1.5 dBTP (ebur128 peak=true plus 192 kHz astats).
- **Audio faults:** derivative-vs-local click detector (0 clicks); digital-silence runs over 20 ms (none since v11); A/V duration check.
- **Sync:** toast first frame (frame difference) vs ding onset (1.25–1.85 kHz band envelope), within 1 frame. Thud onset (40–200 Hz) vs the phone impact frame (+3–13 ms in v16/v17). Cut positions from frame-difference spikes.
- **Lip sync:** mouth-ROI frame difference / openness vs the speech envelope (cross-correlation and lag). The F0 of each take was matched to the established voice.
- **Picture:** contact sheets with gaps (every frame on the critical moments). Borderless sheets produced a false "clone melt" at 66.58 s. Per-frame diffs against the previous cut confirm that only the intended regions changed. Stream md5s were compared for unchanged segments.
- **Music:** chroma/tuning checks (diatonic share, cents deviation) and low-mid energy share for mud.
- **External:** neutral reviews (REVIEW-01…12) and blind A/Bs, both run by the director.

## Known remaining weaknesses
- AI artifacts in the call-centre faces: in v17 and earlier, smeared, distorted background agents on the floor shot (from the i2v clip plus the v12 depth-of-field blur). v18 replaces the far rows with the clean still; the far clones are then static, and row 2 and the near row are still the i2v clip.
- Hand/phone/beard morphing in the time-lapse transitions (0:13–0:58), plus vines/beard shimmer at 0:27–0:35 and pizza-box jitter at 0:13.
- The stiff mammoth: the distant mammoth at half speed slides more than it walks. A nearer walking take (v7) and later takes also slid.
- Alex's uncanny lip sync, hidden but not solved by the edit (floor shot + J-cut). The old man's mouth barely moves on his line, which reviewers nonetheless prefer.
- Face structure drifts between eras. The phone in v16 read as composited (addressed in v17; the ending A/B v16 vs v17 was inconclusive).

## Tool and asset licenses
- **Generated images and clips:** made with this bot's built-in image/video generation tools (GenerateImage, GenerateVideo); use is subject to that service's terms.
- **IVR voice:** Piper TTS (MIT) with the en_US-ljspeech-high voice (LJSpeech dataset, public domain).
- **Orchestra:** VSCO-2 Community Edition samples (Versilian Studios / Sam Gossner), CC0 1.0. Credited in the showroom README.
- **Era arrangements:** FluidR3_GM soundfont (MIT), rendered with FluidSynth (LGPL-2.1).
- **Encoding and loudness:** FFmpeg (LGPL-2.1+; this build includes GPL components) with libx264 (GPL-2.0+) and AAC.
- **Python:** NumPy, SciPy (BSD-3-Clause), OpenCV (Apache-2.0), Pillow (MIT-CMU/HPND).
- **QA:** faster-whisper (MIT) with the Whisper small.en model (MIT).
- All other sound, music arrangement, effects, toasts, timer, clock and the crumble/phone effects are original code in src/.

## Files
cuts/rough-v*.mp4 (cuts, not committed); src/ (timeline/picture/sound/fx per version, qa/); reviews/REVIEW-01…12; PROGRESS.md; STATE.md; tests/ (contact sheets; tests/ab17 ending clips).
