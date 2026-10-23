import os
import numpy as np, cv2, sys
from PIL import Image
from scipy import ndimage as ndi
import os; V=os.environ.get('WORK','work/')
def border_conn(m):
    lab,n=ndi.label(m)
    b=set(np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]])))-{0}
    return np.isin(lab,list(b))
def fill(I,mask):
    w=mask.astype(np.float32); out=np.zeros_like(I); done=np.zeros(mask.shape,bool)
    for s in [2,4,8,16,32]:
        num=np.stack([cv2.GaussianBlur(I[...,c]*w,(0,0),s) for c in range(3)],-1)
        den=cv2.GaussianBlur(w,(0,0),s)
        sel=(den>1e-3)&~done
        out[sel]=(num/np.maximum(den[...,None],1e-6))[sel]; done|=sel
    return out
def cut(I):
    R,G,B=I[...,0],I[...,1],I[...,2]
    ratio=(B-R)/np.maximum(B,1)
    skyG=G>128                       # the flower clip's petals are a deeper blue (G 50-120)
    pure=(ratio>0.42)&(B>140)&skyG
    cloud=(B>=R-3)&(G>=R-8)&(np.minimum(np.minimum(R,G),B)>140)
    mid=((B-R)>12)&skyG
    bg=border_conn(pure|cloud|mid)
    fg=~bg
    lab,n=ndi.label(fg); s=ndi.sum(fg,lab,range(1,n+1)); fg=lab==(1+np.argmax(s))
    filled=ndi.binary_fill_holes(fg)
    # sky enclosed by a lens rim or a hoop stays see-through (the flower is excluded by skyG)
    holes=filled&~fg&ndi.binary_erosion(pure|cloud,iterations=1)
    fg=ndi.binary_opening(filled,iterations=1)
    sure_fg=ndi.binary_erosion(fg,iterations=1)
    sure_bg=ndi.binary_erosion(~fg,iterations=2)
    Fe=fill(I,sure_fg); Be=fill(I,sure_bg)
    d=Fe-Be
    a=np.clip(((I-Be)*d).sum(-1)/np.maximum((d*d).sum(-1),1),0,1)
    alpha=np.where(sure_fg,1.0,np.where(sure_bg,0.0,a))*ndi.binary_dilation(fg,iterations=3)
    hs=cv2.GaussianBlur(holes.astype(np.float32),(0,0),0.8)
    alpha=alpha*(1-0.9*hs)
    unk=~(sure_fg|sure_bg)
    C=np.where(alpha[...,None]>0.05,(I-(1-alpha[...,None])*Be)/np.maximum(alpha[...,None],0.05),Fe)
    k=np.clip(alpha[...,None]*2,0,1)
    C=np.where(unk[...,None],C*k+Fe*(1-k),I)
    return np.clip(C,0,255),alpha
if __name__=='__main__':
    for f in map(int,sys.argv[1:]):
        I=np.array(Image.open(V+f'frames/f{f:04d}.png').convert('RGB')).astype(np.float32)
        C,a=cut(I)
        Image.fromarray(np.dstack([C,a*255]).astype(np.uint8)).save(V+f'cut/c{f:04d}.png')
