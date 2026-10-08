from PIL import Image, ImageDraw, ImageFont
import os
S='/workspace/_tmp/overnight/20261008-1524-v3/shots/'
F=lambda n: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', n)
a=Image.open(S+'v1-solved-hero.png').convert('RGB'); b=Image.open(S+'v1b-solved-hero.png').convert('RGB')
# 1. same-frame before/after (t=6, shot mode)
W=960; ha=int(a.height*W/a.width)
sheet=Image.new('RGB',(W*2+30,ha+70),(18,17,16)); d=ImageDraw.Draw(sheet)
sheet.paste(a.resize((W,ha),Image.LANCZOS),(10,60)); sheet.paste(b.resize((W,ha),Image.LANCZOS),(W+20,60))
d.text((10,15),'BEFORE  v1-solved-hero  (t=6, ?shot=1)',fill=(230,220,200),font=F(24)); d.text((W+20,15),'AFTER  v1b-solved-hero  (t=6, ?shot=1, Pass 1)',fill=(230,220,200),font=F(24))
sheet.save(S+'v1b-before-after.png')
# 2. 100% edge crops (native 1920x1080 px, no scaling)
s=1920/1024; C=200
def crop(im,cx,cy): x,y=int(cx*s-C/2),int(cy*s-C/2); return im.crop((x,y,x+C,y+C))
pairs=[('cat ear',(a,640,128),(b,598,238)),('cat tail',(a,560,165),(b,636,358)),('swallow tail',(a,462,452),(b,548,468))]
out=Image.new('RGB',(3*(2*C+30)+20,C+90),(18,17,16)); d=ImageDraw.Draw(out)
for i,(nm,(ia,xa,ya),(ib,xb,yb)) in enumerate(pairs):
  x0=10+i*(2*C+30); d.text((x0,10),nm+'  (100% crops)',fill=(230,220,200),font=F(20))
  out.paste(crop(ia,xa,ya),(x0,45)); out.paste(crop(ib,xb,yb),(x0+C+10,45))
  d.text((x0,C+55),'v1',fill=(170,160,150),font=F(16)); d.text((x0+C+10,C+55),'v1b',fill=(170,160,150),font=F(16))
out.save(S+'v1b-edge-crops-100.png')
# 3. context-free shadow crops (no labels, no titles): each pool cropped alone
pools=[(610,288,95,110),(413,288,95,110),(512,460,120,80)]
ims=[b.crop((int((x-rx)*s),int((y-ry)*s),int((x+rx)*s),int((y+ry)*s))) for x,y,rx,ry in pools]
h=max(i.height for i in ims); cf=Image.new('RGB',(sum(i.width for i in ims)+40,h+20),(0,0,0)); x=10
for i in ims: cf.paste(i,(x,10)); x+=i.width+10
cf.save(S+'v1b-shadow-crops-nolabel.png')
# 4. 320 px thumbnail
b.resize((320,180),Image.LANCZOS).save(S+'v1b-thumb-320.png')
print('ok')
