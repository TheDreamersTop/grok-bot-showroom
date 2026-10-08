#!/bin/bash
cd /workspace/_tmp/overnight/20261008-1524-v3
U="http://localhost:8931/v1/?shot=1"; S=/workspace/_tmp/v3tools/shot.js
i=0; for t in 3.6 3.8 4.0 4.1 4.2 4.35 4.6 5.0; do i=$((i+1)); timeout 200 node $S "$U&t=$t" shots/v1-lock-$i.png 180 2>&1 | grep -E "rror|shot "; done
timeout 200 node $S "$U&t=3.0" shots/v1-opening-3s.png 180 2>&1 | grep -E "rror|shot "
timeout 200 node $S "$U&pose=scramble" shots/v1-scrambled.png 180 2>&1 | grep -E "rror|shot "
timeout 200 node $S "$U&pose=0.35" shots/v1-mid-approach.png 180 2>&1 | grep -E "rror|shot "
DUMP="window.__t3points()" timeout 200 node $S "$U&t=6" shots/v1-solved-hero.png 180 2>&1 | grep -E "rror|shot "
DUMP="({solve:window.__naiveSolve(), iouScr: window.__iouAt(-0.6,0.65), iouSolved: window.__iouAt(0,0), forge: window.__forge.fidRaw, cov: window.__forge.fidRep, rods: window.__forge.current.rods.length})" timeout 200 node $S "$U&t=6" shots/v1-metrics.png 180 2>&1 | grep -E "rror|shot "
timeout 300 node $S "$U&drawDemo=1" shots/v1-draw-mode.png 280 2>&1 | grep -E "rror|shot "
DUMP="window.__lastForge" timeout 300 node $S "$U&forgeTest=heart,star,letterA&ft=3" shots/v1-drawing-rebuild.png 280 2>&1 | grep -E "rror|shot |forged"
DUMP="window.__lastForge" timeout 300 node $S "$U&forgeTest=heart,star,letterA&ft=0.7" shots/v1-drawing-flyin.png 280 2>&1 | grep -E "rror|shot |forged"
echo ALLDONE
