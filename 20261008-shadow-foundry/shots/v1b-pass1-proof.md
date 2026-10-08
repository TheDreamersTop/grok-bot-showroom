# Pass 1 proof: Shadow Foundry (v1b), 2026-10-08 ~17:40 TPE

Single source of truth: every coverage number comes from `forgeRods()`. It rasterises the actual rod capsules from each lamp and compares them to the target mask. "Hull" uses the exact per-pixel ray test (`rayCoverage`). The placard and console show the same numbers, which are baked into `data/preset-*.json`.

## Coverage (rod-shadow pixels ∩ target / target)
| Sculpture | Figure | V1 rods | **v1b rods** | v1b hull | rods (count) |
|---|---|---|---|---|---|
| No. 1 | cat | 96.6 % (side cat) | **98.67 %** (front cat) | 98.90 % | 1,457 |
| No. 1 | tree | 93.6 % | **99.74 %** | 99.93 % | |
| No. 1 | swallow | 93.9 % | **98.18 %** | 98.58 % | |
| No. 2 | hand | (never fitted) | **98.74 %** | 98.94 % | 1,908 |
| No. 2 | key | (never fitted) | **98.14 %** | 98.22 % | |
| No. 2 | fish → butterfly | 67.1 % (fish) | **98.20 %** | 98.77 % | |
| Drawing test | heart | 93.3 % | **97.42 %** | 97.57 % | 1,320 |
| Drawing test | star | 95.1 % | **96.75 %** | 97.62 % | |
| Drawing test | letter A | 94.1 % | **95.65 %** | 95.70 % | |

The drawing forge runs in a module Web Worker, so the main thread never blocks. In headless SwiftShader, competing with the CPU renderer: first rods (long-rod batch, fly-in starts) at 3.1–3.3 s, done at 3.7–3.9 s. Stages: canvas warm-up 0.44 s, fit 1.34 s, consistency repair 1.37 s, rods 0.23 s. V1 blocked the main thread for 2.3 s.

## Pool-centre luminance (linear, lit pixels, v1b-solved-hero.png)
| Pool | median | mean RGB | target |
|---|---|---|---|
| cat (2700 K) | 0.552 | 0.68 / 0.53 / 0.34 | 0.55–0.65 |
| tree (5600 K) | 0.559 | 0.48 / 0.58 / 0.65 | 0.55–0.65 |
| swallow (4000 K floor) | 0.541 | 0.60 / 0.53 / 0.43 | 0.55–0.65 (slightly low) |
V1 pools were 0.80–0.90 (near white). Dark plaster away from the pools: 0.007 (target 0.015–0.03; still below target). Dark floor: 0.003.

## T3 (t3.py, linear)
- No. 1: back 6.08:1, left 8.43:1, floor 8.36:1, PASS.
- No. 2: back 6.22:1, left 5.48:1, floor 7.41:1, PASS.

## Scramble / solve
Scramble (−0.698, +0.62), max IoU 0.554 / 0.574 / 0.544, picked from real renders. The naive guidance-following solver solves it in 2.25 s (5 drags). At the solved pose, IoU of the projected rods is 0.944 / 0.929 / 0.915.

## Shots
- `v1b-before-after.png`: same frame as `v1-solved-hero` (t=6, ?shot=1), side by side.
- `v1b-edge-crops-100.png`: 100 % crops, v1 vs v1b: cat ear, cat tail, swallow tail.
- `v1b-shadow-crops-nolabel.png`: the three shadows cropped without labels, for context-free naming.
- `v1b-thumb-320.png`: 320 px thumbnail.
- `v1b-solved-hero`, `v1b-preset2-hero`, `v1b-opening-3s`, `v1b-scrambled`, `v1b-scrambled-preset2`, `v1b-mid-approach`.
- Lock sequence: `v1b-lock-1..8`, `v1b-lock-filmstrip`.
- `v1b-drawing-flyin` (long-rod batch mid-flight) and `v1b-drawing-rebuild` (final).
