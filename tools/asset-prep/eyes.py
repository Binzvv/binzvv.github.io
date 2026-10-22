import numpy as np, cv2, json
from PIL import Image
from scipy import ndimage as ndi
from eyes_def import EYES, contour
I=np.array(Image.open('src.png')).astype(np.float32)
H,W=I.shape[:2]
SS=4
def raster(poly):
    m=np.zeros((H*SS,W*SS),np.uint8)
    cv2.fillPoly(m,[np.round(np.array(poly)*SS).astype(np.int32)],255,lineType=cv2.LINE_AA)
    return cv2.resize(m.astype(np.float32)/255,(W,H),interpolation=cv2.INTER_AREA)
yy,xx=np.mgrid[0:H,0:W].astype(np.float32)
holes=np.zeros((H,W),np.float32)
base=I.copy()
layers={}
for k,e in EYES.items():
    O=raster(contour(e)); holes=np.maximum(holes,O)
    cx,cy,r=e['iris']
    dist=np.hypot(xx-cx,yy-cy)
    Od=ndi.binary_dilation(O>0.01,iterations=3)
    region=(dist<r+3.5)&Od
    # per-row linear interpolation of sclera across the iris chord
    rec=base.copy()
    for y in np.unique(np.nonzero(region)[0]):
        xs=np.nonzero(region[y])[0]
        dy=y-cy; hw=np.sqrt(max(r*r-dy*dy,0))+3.5
        xl=int(np.floor(cx-hw)); xr=int(np.ceil(cx+hw))
        L=I[y,xl-4:xl].mean(0); Rr=I[y,xr:xr+4].mean(0)
        for x in xs:
            t=(x-(xl-2))/((xr+2)-(xl-2))
            rec[y,x]=L*(1-t)+Rr*t
    # soften streaks vertically inside region
    bl=cv2.GaussianBlur(rec,(0,0),sigmaX=0.6,sigmaY=1.6)
    rm=cv2.GaussianBlur(region.astype(np.float32),(0,0),1.0)[...,None]
    base=base*(1-rm)+bl*rm
    # iris layer: original disc, catchlights split out
    pad=12; x0=int(cx-r-pad); y0=int(cy-r-pad); x1=int(cx+r+pad)+1; y1=int(cy+r+pad)+1
    crop=I[y0:y1,x0:x1].copy()
    # iris pixels hidden under the lids are synthesised by extending the visible iris column-wise
    Oc=O[y0:y1,x0:x1]>0.97
    for j in range(crop.shape[1]):
        ys_in=np.nonzero(Oc[:,j])[0]
        if len(ys_in)<4: continue
        t0=ys_in.min()+1; t1=ys_in.max()-1
        for i in range(t0-1,-1,-1): crop[i,j]=crop[i+1,j]*0.97
        for i in range(t1+1,crop.shape[0]): crop[i,j]=crop[i-1,j]*0.98
    d=np.hypot(xx[y0:y1,x0:x1]-cx,yy[y0:y1,x0:x1]-cy)
    a=np.clip((r+0.6-d)/1.4,0,1)
    lum=crop.mean(-1)
    spec=np.clip((lum-95)/90,0,1)*(d<r-2)
    specm=ndi.binary_dilation(spec>0.05,iterations=2)
    iris_clean=cv2.inpaint(np.clip(crop,0,255).astype(np.uint8),specm.astype(np.uint8),3,cv2.INPAINT_TELEA).astype(np.float32)
    iris_rgba=np.dstack([iris_clean,a*255])
    # catchlight layer: white-ish with alpha from excess brightness
    excess=np.clip(crop-iris_clean,0,255).max(-1)
    ca=np.clip(excess/ (255-iris_clean.max(-1)+1e-3),0,1)*specm
    cl=np.dstack([np.full_like(lum,245),np.full_like(lum,248),np.full_like(lum,255),ca*255])
    layers[k]=dict(iris=iris_rgba,catch=cl,box=(x0,y0,x1,y1),center=(cx,cy),r=r)
    # socket (reconstructed) patch box = opening bbox + margin
np.save('holes.npy',holes)
np.save('base.npy',base)
import pickle; pickle.dump(layers,open('layers.pkl','wb'))
# --- preview composites
alpha=np.load('alpha.npy')
def comp(shift):
    img=base.copy()
    for k,L in layers.items():
        x0,y0,x1,y1=L['box']; dx,dy=shift
        M=np.float32([[1,0,dx],[0,1,dy]])
        ir=cv2.warpAffine(L['iris'],M,(x1-x0,y1-y0),flags=cv2.INTER_LINEAR,borderValue=0)
        ca=cv2.warpAffine(L['catch'],np.float32([[1,0,dx*0.4],[0,1,dy*0.4]]),(x1-x0,y1-y0),flags=cv2.INTER_LINEAR)
        sub=img[y0:y1,x0:x1]
        al=ir[...,3:]/255; sub=sub*(1-al)+ir[...,:3]*al
        al=ca[...,3:]/255; sub=sub*(1-al)+ca[...,:3]*al
        img[y0:y1,x0:x1]=sub
    h=holes[...,None]
    return I*(1-h)+img*h
tiles=[]
for sh in [(None),(0,0),(-9,0),(9,0),(0,-3),(0,3),(-7,2.5)]:
    if sh is None: im=I
    else: im=comp(sh)
    tiles.append(cv2.resize(im[575:650,310:790],None,fx=3,fy=3,interpolation=cv2.INTER_LANCZOS4))
emp=I*(1-holes[...,None])+base*holes[...,None]
tiles.insert(1,cv2.resize(emp[575:650,310:790],None,fx=3,fy=3,interpolation=cv2.INTER_LANCZOS4))
Image.fromarray(np.clip(np.vstack(tiles),0,255).astype(np.uint8)).save('eyeprev.png')
