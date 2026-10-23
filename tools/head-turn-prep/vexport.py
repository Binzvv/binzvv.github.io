import os
import numpy as np, cv2, json, pickle, os
from PIL import Image
from scipy import ndimage as ndi
import os; V=os.environ.get('WORK','work/')
OUT=os.path.join(os.path.dirname(os.path.abspath(__file__)),'../../experiments/head-turn/frames/')
os.makedirs(OUT,exist_ok=True)
R=pickle.load(open(V+'rig.pkl','rb'))
order=sorted(R.keys(),key=lambda k:R[k]['disp'])
# one crop window for every pose so size and position never drift
al=np.zeros(R[order[0]]['base'].shape[:2],bool)
for k in order: al|=R[k]['base'][...,3]>5
ys,xs=np.nonzero(al); p=4
X0,Y0,X1,Y1=max(xs.min()-p,0),max(ys.min()-p,0),xs.max()+p+1,ys.max()+p+1
f1=R['c0001']['base'][...,3]>128; fy,fx=np.nonzero(f1)
forwardW=int(fx.max()-fx.min()+1)
pieces=[]; poses=[]
for i,k in enumerate(order):
    r=R[k]; base=r['base']
    Image.fromarray(np.clip(base[Y0:Y1,X0:X1],0,255).astype(np.uint8)).save(OUT+f'p{i:02d}.webp',quality=88,method=6)
    orig=np.array(Image.open(V+f'cut/{k}.png')).astype(np.float32)
    eyes=[]
    for ek in ['L','R']:
        e=r['eyes'][ek]; cx,cy=e['c']
        # patch covers the rebuilt area and the opening
        m=(e['clip']>0.01)
        yy,xx=np.nonzero(ndi.binary_dilation(m,iterations=5))
        px0,py0,px1,py1=xx.min(),yy.min(),xx.max()+1,yy.max()+1
        bx0,by0,bw,bh=e['box']
        px0=min(px0,bx0);py0=min(py0,by0);px1=max(px1,bx0+bw);py1=max(py1,by0+bh)
        origp=np.dstack([orig[py0:py1,px0:px1,:3],np.full((py1-py0,px1-px0),255.0)])
        clipp=np.dstack([np.full((py1-py0,px1-px0,3),255.0),e['clip'][py0:py1,px0:px1]*255])
        pieces+= [(origp,(i,ek,'orig')),(clipp,(i,ek,'clip')),(e['iris'],(i,ek,'iris'))]
        eyes.append(dict(c=[round(cx-X0,2),round(cy-Y0,2)],room=e['room'],
                         patch=[int(px0-X0),int(py0-Y0),int(px1-px0),int(py1-py0)],
                         iris=[int(bx0-X0),int(by0-Y0),int(bw),int(bh)]))
    poses.append(dict(file=f'p{i:02d}.webp',disp=round(r['disp'],2),src=k,eyes=eyes))
# shelf-pack the eye pieces into one atlas
pieces.sort(key=lambda t:-t[0].shape[0])
AW=1024; x=y=sh=0; rects={}
for img,key in pieces:
    h,w=img.shape[:2]
    if x+w>AW: x=0; y+=sh+2; sh=0
    rects[key]=(x,y,w,h); x+=w+2; sh=max(sh,h)
AH=y+sh
atlas=np.zeros((AH,AW,4),np.float32)
for img,key in pieces:
    x,y,w,h=rects[key]; atlas[y:y+h,x:x+w]=img
Image.fromarray(np.clip(atlas,0,255).astype(np.uint8)).save(OUT+'eyes.webp',lossless=True,method=6)
for i,pz in enumerate(poses):
    for e,ek in zip(pz['eyes'],['L','R']):
        e['orig']=list(rects[(i,ek,'orig')][:2]); e['clip']=list(rects[(i,ek,'clip')][:2]); e['irisAt']=list(rects[(i,ek,'iris')][:2])
man=dict(width=int(X1-X0),height=int(Y1-Y0),forwardWidth=forwardW,
         forwardIndex=[p['src'] for p in poses].index('c0001'),
         maxDisp=[poses[0]['disp'],poses[-1]['disp']],poses=poses,
         note='Poses ordered screen-left to screen-right. disp = measured face displacement (px at 528-wide source) relative to the forward frame.')
json.dump(man,open(OUT+'manifest.json','w'),separators=(',',':'))
# forward still for first paint
fwd=R['c0001']['base']; o=np.array(Image.open(V+'cut/c0001.png'))
Image.fromarray(o[Y0:Y1,X0:X1]).save(OUT+'../still.webp',quality=90,method=6)
print(man['width'],man['height'],forwardW,man['forwardIndex'],len(poses),'atlas',AW,AH)
