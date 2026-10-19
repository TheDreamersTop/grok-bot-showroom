B="https://thedreamerstop.github.io/grok-bot-showroom/20261019-ink-bloom/?"
S7="-0.9,0,0,1,0;-0.6,0,1,1,0.1;-0.3,0,2,1,0.2;0,0,3,1,0.3;0.3,0,4,1,0.4;0.6,0,0,1,0.5;0.9,0,1,1,0.6"
r(){ node /tmp/shot2.js "$B$2" $1.png 600 > log-$1.txt 2>&1; }
r hero-t0.3 "shot=0.3&tw=768" & r hero-t0.6 "shot=0.6&tw=768" & r hero-t3 "shot=3&tw=768" & wait
r hero-t6 "shot=6&tw=768" & r hero-t8.6 "shot=8.6&tw=768" & r hero-t10 "shot=10&tw=768" & wait
r hero-t12 "shot=12&tw=768" & r hero-t16 "shot=16&tw=768" & r hero-t24 "shot=24&tw=768" & wait
VW=1440 VH=900 r hero-t16-1440 "shot=16&tw=768" & VW=1440 VH=900 r hero-t0.3-1440 "shot=0.3&tw=768" & r hero-t16-salt0 "shot=16&tw=768&salt=0" & wait
r mix-ic-t14 "shot=14&tw=768&drops=-0.15,0,0,1,0;0.15,0,1,1,1.5" & r mix-gv-t14 "shot=14&tw=768&drops=-0.15,0,2,1,0;0.15,0,4,1,1.5" & r drops7-t10 "shot=10&tw=768&drops=$S7" & wait
r stir-t10 "shot=10&tw=768&stir=5,-0.8,1.4,0.8,1.2,1.5,1" & r salt1-t13 "shot=13&tw=768&drops=0.3,0,9,1,0;-0.12,0,0,1,2.5" & r entrain-ctrl-gap25-t35 "shot=35&tw=768&drops=-0.12,0,0,1.6,0;-0.12,0.015,1,1.1,25" & wait
r hero-t16-autostroke "shot=16&tw=768&autostroke" & r hero-t16-low "shot=16&tier=low" & r hero-t40 "shot=40&tw=768" & wait
echo DONE
