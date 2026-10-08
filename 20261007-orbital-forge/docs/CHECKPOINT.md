# CHECKPOINT — 星鍛 Orbital Forge v2

> 開發過程的工作筆記（原樣保留，僅移除 ship.page claim token）。文中 `/workspace/...`、`/tmp/...` 路徑為開發機上的位置；工具已整理到本資料夾的 `tools/`。ship.place 網址約 2026-11-07 到期。

Updated: 2026-10-08 11:42 (Asia/Taipei)

## State
- Build: index.html + js/{main,shaders,noise,audio}.js + vendor/ (three r160 + GPUComputationRenderer)
- FINAL deploy (11:39): https://regal-shame-b8nzs.ship.place/ — curl 200 all files; REPORT.md complete; shots/ final
- M3 (11:25): https://battle-pocket-unvv7.ship.place/
- Prev (M2, 10:59): https://violet-galleon-vj8ac.ship.place/ ; M1 https://plume-address-93qeo.ship.place/
- Stub deploy: https://denim-truck-qmhtv.ship.place/
- shots/ populated 11:12 (hero, opening, opening-ignition, mode-*, shockwave, supernova-*, spray, gravity-well) — all 1920x1080
- Pass 5 (11:00-11:10): richer plasma nebula palette; spray spawn temp 1.25→0.88-1.04 (gold instead of grey-white), gravity heat 2.5→1.3
- Pass 6 (11:15-): gravity-well lensing+event horizon+photon ring in composite (uWell); spray temp capped 0.80 unless nova (uNovaOn) & b*1.5; HUD contrast/size up (--mute .74, --faint .50, text-shadow); nebula: ridged filaments + neutral dark lanes + haze crush
- Pass 6 verified (v_*.png), errcheck clean, shots/ refreshed, REPORT.md drafted (placeholders __FINAL_URL__ etc.)
- In M3: nova flash toned (flash 1.5@8, exposureKick .6, colour lerp .2) — NOT yet captured
- 11:33 post-M3: title moved to bottom 10vh + drop-shadow; blast temp 0.55+0.5h² (less white peak) — capturing /tmp/x_*.png (seq7 w/ x_ prefix)
- DONE: nova ejecta temp 0.7+0.6h², final shots copied, final deploy. Remaining = optional polish only.
- (old) NEXT: capture nova peak (seq6a steps 300-345), final deploy, fill REPORT placeholders
- OLD NEXT: verify fix muddy nebula + faint HUD text, check shock/nova, deploy M3, REPORT.md, final deploy
- Critique passes done: 1 (confetti particles → disk), 2 (gas/dust/arms), 3 (core redesign, ember structure), 4 (shock visibility, nova whiteout, intro), harness fixed (redraw while paused)

## Tools (outside deploy folder)
- /workspace/_tmp/of2tools/shot.js — puppeteer harness. Steps: {"at":N} freeze at frame N (fast-forward w/o render), {"eval":js}, {"shot":path}, {"ff":N}
- /workspace/_tmp/of2tools/mkzip.py <out.zip> — builds deploy zip
- Local server: python3 -m http.server 8765 in this folder
- URL params: ?shot=1 (fixed dt, no audio), &tex=384 (particle tex size), &mode=1..3, &seed=HEX, &q=0..3, &nopart/&nogas/&nodust

## Deploy
python3 /workspace/_tmp/of2tools/mkzip.py /tmp/of2.zip && curl -sS https://ship.page/deploy -H "Content-Type: application/zip" --data-binary @/tmp/of2.zip

## Capture recipe
cd /workspace/_tmp/of2tools && (node shot.js "http://localhost:8765/?shot=1&tex=384" "$(cat seqN.json)" > /tmp/seqN.log 2>&1 &)  # run in background, poll log; ~3-5 min

## Round 2 polish (started 11:43)
Goals: 1 ember depth/nebula/contrast, 2 nova peak colour (no white), 3 tidy cyan filaments top-right, 4 HUD slightly brighter, 5 opt DOF in opening.
- Backed up old shots as shots/*-v2a.png
- 11:50 ember edits (turb .34, sparks yellow-white bright, non-spark ash 0.5, gas ember 0.85, dust ember bigger/denser, core crack hot lines, ember neb int 2.0 brighter reds, sat 1.15); nebula filaments softened (ridged 1.3 scale, 0.38+1.5fil), plasma c1 teal→blue [0.04,0.26,0.62]. Capturing /tmp/e1_*.png
- 11:55 nova grade (uNova: radial blue-white→magenta/amber + hue-preserving tonemap); HUD --mute .82 --faint .60 mode .74
- 11:58 opening DOF (uDof, 16-tap golden-angle blur outside core, fades by introT 3.8s)
- 12:06 ember capture e1 = big improvement (dust lanes, red neb, gold sparks); added ember corona glow. plasma neb int 2.1 (bg was too sparse after tidy)
- 12:20 nova v1 grade: peak f328 now magenta/amber w/ blue-white core; f325 still creamy → grade = pow(g,uNova), uNova up to 2 early. Opening DOF verified. Ember f_ember good.
- 12:32 nova graded peaks g_peak0/g_peak good (blue-white core, magenta/amber shell, CA). crystal OK. NEXT: gravity well check, errcheck, copy shots, deploy, report
- 12:40 shots refreshed (v2a backups kept), errcheck clean, gravity well OK. NEXT: deploy
- 12:44 R2 FINAL deploy: https://rural-ceder-yohyx.ship.place/ (expires 2026-11-07 11:59 TPE)
- 12:48 live errcheck clean on R2 URL; REPORT.md updated (shots, limits, passes 8-10, deploy table). DONE — round 2 complete.
