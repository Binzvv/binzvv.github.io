import os
import numpy as np, cv2, pickle
from PIL import Image, ImageDraw
import os; V=os.environ.get('WORK','work/')
R=pickle.load(open(V+'rig.pkl','rb'))
SS=4
def raster(poly,H,W):
    m=np.zeros((H*SS,W*SS),np.uint8)
    cv2.fillPoly(m,[np.round(np.array(poly)*SS).astype(np.int32)],255,lineType=cv2.LINE_AA)
    return cv2.resize(m.astype(np.float32)/255,(W,H),interpolation=cv2.INTER_AREA)
def comp(p,dx,dy):
    b=R[p]['base']; img=b[...,:3].copy(); H,W=img.shape[:2]
    for k,e in R[p]['eyes'].items():
        x0,y0,w,h=e['box']; ir=e['iris']
        room=e['room']; ddx=float(np.clip(dx,-min(2.5,room[0]-2),min(2.5,room[1]-2)))
        M=np.float32([[1,0,ddx],[0,1,dy]])
        canvas=np.zeros((H,W,4),np.float32); canvas[y0:y0+h,x0:x0+w]=ir
        sh=cv2.warpAffine(canvas,M,(W,H))
        O=e['clip'][...,None]
        a=sh[...,3:]/255*O
        img=img*(1-a)+sh[...,:3]*a
    return img
rows=[]
for p in ['c0016','c0008','c0001','c0038','c0039','c0040','c0062']:
    tiles=[]
    orig=np.array(Image.open(V+f'cut/{p}.png')).astype(np.float32)[...,:3]
    cx=int((R[p]['eyes']['L']['c'][0]+R[p]['eyes']['R']['c'][0])/2)
    for im in [orig, R[p]['base'][...,:3], comp(p,-2.5,0), comp(p,2.5,0), comp(p,0,-1.2)]:
        t=im[280:325, cx-110:cx+110]
        tiles.append(cv2.resize(t,None,fx=2.5,fy=2.5,interpolation=cv2.INTER_LANCZOS4))
    rows.append(np.hstack(tiles))
Image.fromarray(np.clip(np.vstack(rows),0,255).astype(np.uint8)).save(V+'eyeqa.png')
