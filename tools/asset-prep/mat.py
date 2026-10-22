import numpy as np, cv2
from PIL import Image
from scipy import ndimage as ndi
I=np.array(Image.open('src.png')).astype(np.float32)
fg=np.load('fg.npy')
# re-open enclosed sky holes (e.g. through earring hoops): small skyish regions inside fg that are clearly sky-blue
R,G,B=I[...,0],I[...,1],I[...,2]
pure=((B-R)>60)&((B-R)/np.maximum(B,1)>0.45)&fg
lab,n=ndi.label(pure)
for i in range(1,n+1):
    m=lab==i
    cy,cx=np.argwhere(m).mean(0)
    if 760<cx<850 and 250<cy<350: continue  # blue flower clip
    if m.sum()>6: fg[m]=False; print('hole',i,m.sum(),np.argwhere(m).mean(0))
sure_fg=ndi.binary_erosion(fg,iterations=2)
sure_bg=ndi.binary_erosion(~fg,iterations=2)
def fill(mask,sig=4):
    w=mask.astype(np.float32); out=np.zeros_like(I)
    for s in [2,4,8,16]:
        num=np.stack([cv2.GaussianBlur(I[...,c]*w,(0,0),s) for c in range(3)],-1)
        den=cv2.GaussianBlur(w,(0,0),s)[...,None]
        est=num/np.maximum(den,1e-6)
        sel=(den[...,0]>1e-3)&(out.sum(-1)==0)
        out[sel]=est[sel]
    return out
Fe=fill(sure_fg); Be=fill(sure_bg)
d=Fe-Be
a=((I-Be)*d).sum(-1)/np.maximum((d*d).sum(-1),1)
a=np.clip(a,0,1)
unk=~(sure_fg|sure_bg)
alpha=np.where(sure_fg,1.0,np.where(sure_bg,0.0,a))*ndi.binary_dilation(fg,iterations=4)
# decontaminate colour
C=np.where((alpha[...,None]>0.05),(I-(1-alpha[...,None])*Be)/np.maximum(alpha[...,None],0.05),Fe)
C=np.where(unk[...,None], C*np.clip(alpha[...,None]*2,0,1)+Fe*(1-np.clip(alpha[...,None]*2,0,1)), I)
C=np.clip(C,0,255)
out=np.dstack([C,alpha*255]).astype(np.uint8)
Image.fromarray(out).save('head_full.png')
np.save('alpha.npy',alpha)
# checks over dark and white bg
for nm,(x0,y0,x1,y1) in {'hl':(150,540,300,700),'er':(170,780,300,920),'er2':(820,780,940,960),'hair':(180,80,480,330),'neck':(280,1150,800,1300)}.items():
    crop=out[y0:y1,x0:x1].astype(np.float32); al=crop[...,3:]/255
    for bgc,suf in [((20,20,30),'d'),((90,160,240),'b')]:
        comp=crop[...,:3]*al+np.array(bgc)*(1-al)
        Image.fromarray(comp.astype(np.uint8)).resize(((x1-x0)*3,(y1-y0)*3),Image.LANCZOS).save(f'm_{nm}_{suf}.png')
