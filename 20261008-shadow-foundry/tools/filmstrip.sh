#!/bin/bash
# usage: filmstrip.sh <prefix> [extra query]
cd /workspace/_tmp/overnight/20261008-1524-v3
P=$1; X=$2; U="http://localhost:8931/v1/?shot=1$X"; S=/workspace/_tmp/v3tools/shot.js
TS="0.3 1.0 1.5 2.0 2.5 3.0 3.5 4.0 4.5 4.8 5.5 6.0"
i=0; for t in $TS; do i=$((i+1)); n=$(printf %02d $i); ( timeout 250 node $S "$U&t=$t" /workspace/_tmp/v3tools/tmp/fs-$P-$n.png 240 2>&1 | grep -iE "error" ) & if [ $((i % 3)) -eq 0 ]; then wait; fi; done; wait
python3 - "$P" "$TS" <<'PY'
import sys; from PIL import Image, ImageDraw, ImageFont
P=sys.argv[1]; TS=sys.argv[2].split(); F=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',20)
W,H=480,270; sh=Image.new('RGB',(4*W+50,3*(H+34)+10),(14,13,12)); d=ImageDraw.Draw(sh)
for i,t in enumerate(TS):
  im=Image.open('/workspace/_tmp/v3tools/tmp/fs-%s-%02d.png'%(P,i+1)).convert('RGB').resize((W,H),Image.LANCZOS); x=10+(i%4)*(W+10); y=34+(i//4)*(H+34)
  sh.paste(im,(x,y)); d.text((x,y-26),'t = %s s'%t,fill=(230,220,200),font=F)
sh.save('/workspace/_tmp/v3tools/tmp/fs-%s.png'%P); print('sheet', P)
PY
