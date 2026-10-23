import os
import numpy as np, cv2, sys
from PIL import Image
import os; V=os.environ.get('WORK','work/')
def load(f):
    c=np.array(Image.open(V+f'cut/c{f:04d}.png')).astype(np.float32)
    return c
def gray(c):
    a=c[...,3:]/255; comp=c[...,:3]*a+np.array([128,128,128])*(1-a)
    return cv2.cvtColor(comp.astype(np.uint8),cv2.COLOR_RGB2GRAY)
dis=cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_ULTRAFAST+2)
def flows(A,B):
    ga,gb=gray(A),gray(B)
    return dis.calc(ga,gb,None), dis.calc(gb,ga,None)
def warp(img,fl):
    h,w=fl.shape[:2]; gx,gy=np.meshgrid(np.arange(w),np.arange(h))
    return cv2.remap(img,(gx+fl[...,0]).astype(np.float32),(gy+fl[...,1]).astype(np.float32),cv2.INTER_LINEAR,borderMode=cv2.BORDER_REPLICATE)
def premul(c): return np.dstack([c[...,:3]*c[...,3:]/255,c[...,3]])
def unpremul(p):
    a=p[...,3:]; return np.dstack([np.where(a>0.5,p[...,:3]*255/np.maximum(a,1e-3),0),a])
def interp(fa,fb,ts,tag):
    A,B=load(fa),load(fb); F01,F10=flows(A,B)
    PA,PB=premul(A),premul(B)
    out=[]
    for t in ts:
        Ft0=-(1-t)*t*F01+t*t*F10
        Ft1=(1-t)**2*F01-t*(1-t)*F10
        wa=warp(PA,Ft0); wb=warp(PB,Ft1)
        P=(1-t)*wa+t*wb
        C=unpremul(P)
        name=f'{tag}{int(t*100):02d}'
        Image.fromarray(np.clip(C,0,255).astype(np.uint8)).save(V+f'cut/i_{name}.png'); out.append(name)
        # misalignment metric between the two warps inside the face
        m=(PA[...,3]>200)&(PB[...,3]>200)
        print(name,'warp disagreement',round(float(np.abs(wa[...,:3]-wb[...,:3])[m].mean()),2))
    return out
if __name__=='__main__':
    interp(1,38,[0.25,0.5,0.75],'a_')
    interp(38,39,[0.2,0.4,0.6,0.8],'b_')
    interp(39,64,[0.5],'c_')
