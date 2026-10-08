#!/bin/bash
cd /workspace/_tmp/overnight/20261008-1524-v3
U="http://localhost:8931/v1/?shot=1"; S=/workspace/_tmp/v3tools/shot.js
R() { timeout 300 node $S "$@" 2>&1 | grep -E "rror|shot |forged|baked" | grep -v Feedback; }
DUMP="window.__t3points()" R "$U&t=6" shots/v1b-solved-hero.png 180
R "$U&t=3.0" shots/v1b-opening-3s.png 180
R "$U&pose=scramble" shots/v1b-scrambled.png 180
R "$U&pose=0.35" shots/v1b-mid-approach.png 180
R "$U&pose=scramble&preset=1" shots/v1b-scrambled-preset2.png 180
DUMP="window.__t3points()" R "$U&t=6&preset=1" shots/v1b-preset2-hero.png 180
DUMP="({solve:window.__naiveSolve(), iouScr: window.__iouAt(-0.698,0.62), iouSolved: window.__iouAt(0,0)})" R "$U&t=6" shots/v1b-metrics.png 180
DUMP="window.__lastForge" R "$U&forgeTest=heart,star,letterA&ft=3" shots/v1b-drawing-rebuild.png 280
DUMP="window.__lastForge" R "$U&forgeTest=heart,star,letterA&phase=long" shots/v1b-drawing-flyin.png 280
i=0; for t in 3.6 3.8 4.0 4.1 4.2 4.35 4.6 5.0; do i=$((i+1)); R "$U&t=$t" shots/v1b-lock-$i.png 180; done
echo ALLDONE
