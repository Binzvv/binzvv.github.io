import numpy as np, cv2
from PIL import Image
from scipy import ndimage as ndi
a=np.load('cloudA.npy'); C=np.load('cloudC.npy'); alpha=np.load('alpha.npy')
H,W=a.shape
coef=np.load('skycoef.npy')
for t in [0,.25,.5,.75,1]:
    y=t; x=.5; f=np.array([1,x,y,x*x,y*y,x*y]); print('sky',t,(coef@f).round())
# feather away from head
dh=ndi.distance_transform_edt(alpha<0.02)
a=a*np.clip((dh-4)/26,0,1)
a=np.where(a<0.02,0,a)
lab,n=ndi.label(ndi.binary_dilation(a>0.08,iterations=6))
out=[]
for i in range(1,n+1):
    m=lab==i
    if m.sum()<5000: continue
    ys,xs=np.nonzero(m); y0,y1,x0,x1=ys.min(),ys.max()+1,xs.min(),xs.max()+1
    al=(a*m)[y0:y1,x0:x1].copy()
    hh,ww=al.shape
    F=120.0
    ss=lambda t:(lambda u:u*u*(3-2*u))(np.clip(t,0,1))
    yy,xx=np.mgrid[0:hh,0:ww].astype(float)
    if y0==0: al*=ss(yy/F)
    if y1==H: al*=ss((hh-1-yy)/F)
    if x0==0: al*=ss(xx/F)
    if x1==W: al*=ss((ww-1-xx)/F)
    p=8
    rgba=np.zeros((hh+2*p,ww+2*p,4),np.float32)
    rgba[p:-p,p:-p,:3]=C[y0:y1,x0:x1]; rgba[p:-p,p:-p,3]=al*255
    # bleed colour into transparent area to avoid dark fringes on resample
    col=rgba[...,:3]; w=(rgba[...,3]>0).astype(np.float32)
    bl=cv2.GaussianBlur(col*w[...,None],(0,0),6)/np.maximum(cv2.GaussianBlur(w,(0,0),6)[...,None],1e-4)
    rgba[...,:3]=np.where(w[...,None]>0,col,np.clip(bl,0,255))
    k=len(out)
    Image.fromarray(rgba.astype(np.uint8)).save(f'cloud{k}.png')
    out.append((k,int(x0),int(y0),int(ww),int(hh),int(m.sum())))
for o in out: print(o)
