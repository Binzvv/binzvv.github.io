import numpy as np, json, pickle
from PIL import Image
from scipy import ndimage as ndi
OUT='../../assets/'
I=np.array(Image.open('src.png')).astype(np.float32)
alpha=np.load('alpha.npy'); holes=np.load('holes.npy'); base=np.load('base.npy')
head=np.array(Image.open('head_full.png')).astype(np.float32)
ys,xs=np.nonzero(alpha>0.01); p=6
X0,Y0,X1,Y1=xs.min()-p,ys.min()-p,xs.max()+p+1,ys.max()+p+1
X0=max(X0,0);Y0=max(Y0,0)
hl=head.copy(); hl[...,3]=hl[...,3]*(1-holes)
Image.fromarray(np.clip(hl[Y0:Y1,X0:X1],0,255).astype(np.uint8)).save(OUT+'head.webp',quality=92,method=6)
layers=pickle.load(open('layers.pkl','rb'))
meta=dict(width=int(X1-X0),height=int(Y1-Y0),eyes={})
hm=holes>0.001
lab,n=ndi.label(ndi.binary_dilation(hm,iterations=3))
for k,L in layers.items():
    cx,cy=L['center']
    # socket box
    m=lab==lab[int(cy),int(cx)]
    yy,xx=np.nonzero(m); sx0,sy0,sx1,sy1=xx.min()-2,yy.min()-2,xx.max()+3,yy.max()+3
    sock=np.dstack([base[sy0:sy1,sx0:sx1],np.full((sy1-sy0,sx1-sx0),255.0)])
    Image.fromarray(np.clip(sock,0,255).astype(np.uint8)).save(OUT+f'socket-{k.lower()}.webp',lossless=True)
    x0,y0,x1,y1=L['box']
    Image.fromarray(np.clip(L['iris'],0,255).astype(np.uint8)).save(OUT+f'iris-{k.lower()}.webp',lossless=True)
    Image.fromarray(np.clip(L['catch'],0,255).astype(np.uint8)).save(OUT+f'catch-{k.lower()}.webp',lossless=True)
    meta['eyes'][k]=dict(socket=[int(sx0-X0),int(sy0-Y0),int(sx1-sx0),int(sy1-sy0)],
                        iris=[int(x0-X0),int(y0-Y0),int(x1-x0),int(y1-y0)],
                        center=[round(cx-X0,1),round(cy-Y0,1)])
print(json.dumps(meta))
# sanity: recompose in crop space and diff vs original
