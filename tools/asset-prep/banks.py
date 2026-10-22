import numpy as np
from PIL import Image
F=120; P=8
def load(i): return np.array(Image.open(f'cloud{i}.png')).astype(np.float32)
def com_y(a, cols):
    w=a[:,cols].sum(1); ys=np.arange(len(w)); return (w*ys).sum()/max(w.sum(),1e-3)
def join(li, ri, out):
    A=load(li); B=load(ri)
    # A is cut on its right (feather in last F+P cols), B cut on its left (first F+P cols)
    ha,wa=A.shape[:2]; hb,wb=B.shape[:2]
    ya=com_y(A[...,3], slice(wa-P-F, wa-P)); yb=com_y(B[...,3], slice(P, P+F))
    dy=int(round(ya-yb))
    xoff=wa-P-F-P            # B's feather overlaps A's feather exactly
    top=min(0,dy); H=max(ha,dy+hb)-top; W=xoff+wb
    C=np.zeros((H,W,3),np.float32); Al=np.zeros((H,W),np.float32)
    def put(S,x,y):
        a=S[...,3]/255
        sub=Al[y:y+S.shape[0],x:x+S.shape[1]]; cs=C[y:y+S.shape[0],x:x+S.shape[1]]
        na=sub+a*(1-sub)  # over
        cs[:]=np.where(na[...,None]>0,(cs*sub[...,None]*(1-a[...,None])+S[...,:3]*a[...,None])/np.maximum(na[...,None],1e-4),S[...,:3])
        sub[:]=na
    # additive blend inside overlap gives a seamless crossfade since ramps sum to ~1
    a1=A[...,3]/255; b1=B[...,3]/255
    canvasA=np.zeros((H,W),np.float32); canvasB=np.zeros((H,W),np.float32)
    CA=np.zeros((H,W,3),np.float32); CB=np.zeros((H,W,3),np.float32)
    canvasA[-top:-top+ha,0:wa]=a1; CA[-top:-top+ha,0:wa]=A[...,:3]
    canvasB[dy-top:dy-top+hb,xoff:xoff+wb]=b1; CB[dy-top:dy-top+hb,xoff:xoff+wb]=B[...,:3]
    al=np.clip(canvasA+canvasB,0,1)
    import cv2 as _cv
    # suppress faint isolated feather streaks left by the join; real cloud edges sit next to dense cloud
    nb=_cv.GaussianBlur(al,(0,0),9); t=np.clip((nb-0.1)/0.22,0,1)
    al=al*(t*t*(3-2*t))
    col=(CA*canvasA[...,None]+CB*canvasB[...,None])/np.maximum((canvasA+canvasB)[...,None],1e-4)
    w=(al>0).astype(np.float32)
    import cv2
    bl=cv2.GaussianBlur(col*w[...,None],(0,0),6)/np.maximum(cv2.GaussianBlur(w,(0,0),6)[...,None],1e-4)
    col=np.where(w[...,None]>0,col,bl)
    ys,xs=np.nonzero(al>0.003); y0,y1,x0,x1=max(ys.min()-P,0),ys.max()+P,max(xs.min()-P,0),xs.max()+P
    img=np.dstack([col,al*255])[y0:y1,x0:x1]
    Image.fromarray(np.clip(img,0,255).astype(np.uint8)).save(out)
    print(out,img.shape[1],img.shape[0])
join(8,7,'bankA.png'); join(6,5,'bankB.png'); join(3,2,'bankC.png')
