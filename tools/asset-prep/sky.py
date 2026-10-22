import numpy as np, cv2
from PIL import Image
from scipy import ndimage as ndi
I=np.array(Image.open('src.png')).astype(np.float32)
H,W=I.shape[:2]
alpha=np.load('alpha.npy')
R,G,B=I[...,0],I[...,1],I[...,2]
pure=((B-R)/np.maximum(B,1)>0.62)&(alpha<0.01)
ys,xs=np.nonzero(pure)
sel=np.random.RandomState(0).choice(len(ys),20000)
ys,xs=ys[sel],xs[sel]
def feats(y,x):
    y=y/H; x=x/W
    return np.stack([np.ones_like(y),x,y,x*x,y*y,x*y],-1)
A=feats(ys.astype(float),xs.astype(float))
coef=[np.linalg.lstsq(A,I[ys,xs,c],rcond=None)[0] for c in range(3)]
yy,xx=np.mgrid[0:H,0:W]
F=feats(yy.astype(float),xx.astype(float))
S=np.stack([F@coef[c] for c in range(3)],-1)
print('sky top',S[0,W//2],'bottom',S[-1,W//2],'corners',S[0,0],S[-1,-1])
np.save('skycoef.npy',np.array(coef))
Rc=252.0
a=np.clip((R-S[...,0])/(Rc-S[...,0]),0,1)
a[alpha>0.02]=0
a=np.clip((a-0.06)/0.94,0,1)
C=np.clip((I-(1-a[...,None])*S)/np.maximum(a[...,None],0.03),0,255)
lab,n=ndi.label(ndi.binary_dilation(a>0.10,iterations=4))
headz=ndi.binary_dilation(alpha>0.02,iterations=6)
clouds=[]
for i in range(1,n+1):
    m=lab==i
    if m.sum()<800: continue
    ys2,xs2=np.nonzero(m)
    touchesHead=(m&headz).any()
    edge=(ys2.min()==0,ys2.max()==H-1,xs2.min()==0,xs2.max()==W-1)
    clouds.append((i,m.sum(),xs2.min(),ys2.min(),xs2.max(),ys2.max(),touchesHead,edge))
for c in clouds: print(c)
np.save('cloudA.npy',a); np.save('cloudC.npy',C); np.save('cloudLab.npy',lab)
v=(np.dstack([C,a*255])).astype(np.uint8)
Image.fromarray(v).save('clouds_full.png')
bgv=np.zeros_like(I)+[30,30,40]; comp=np.ascontiguousarray((C*a[...,None]+bgv*(1-a[...,None])).astype(np.uint8))
for c in clouds:
    cv2.rectangle(comp,(int(c[2]),int(c[3])),(int(c[4]),int(c[5])),(255,0,0) if c[6] else (0,255,0),2)
    cv2.putText(comp,str(c[0]),(int(c[2])+5,int(c[3])+30),0,1,(255,255,0),2)
Image.fromarray(comp.astype(np.uint8)).resize((540,728)).save('clouds_v.png')
