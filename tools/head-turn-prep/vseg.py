import os
import numpy as np, sys, json
from PIL import Image
from scipy import ndimage as ndi
import os; V=os.environ.get('WORK','work/')
def border_conn(m):
    lab,n=ndi.label(m)
    b=set(np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]])))-{0}
    return np.isin(lab,list(b))
def segment(I):
    R,G,B=I[...,0],I[...,1],I[...,2]
    ratio=(B-R)/np.maximum(B,1)
    pure=(ratio>0.42)&(B>140)
    cloud=(B>=R-3)&(G>=R-8)&(np.minimum(np.minimum(R,G),B)>140)
    mid=((B-R)>12)
    bg=border_conn(pure|cloud|mid)
    fg=~bg
    lab,n=ndi.label(fg); s=ndi.sum(fg,lab,range(1,n+1)); fg=lab==(1+np.argmax(s))
    fg=ndi.binary_fill_holes(fg)
    return fg
if __name__=='__main__':
    out=[]
    for f in range(1,126):
        I=np.array(Image.open(V+f'frames/f{f:04d}.png').convert('RGB')).astype(np.float32)
        fg=segment(I)
        np.save(V+f'frames/m{f:04d}.npy',fg)
        ys,xs=np.nonzero(fg)
        top,bot=ys.min(),ys.max()
        H=bot-top
        # neck: width at 92% height ; head width at 45%
        def span(fr):
            y=int(top+fr*H); r=np.nonzero(fg[y])[0]; return (r.min(),r.max()) if len(r) else (0,0)
        L45=span(0.45); L90=span(0.9)
        # mustache: dark pixels in lower face band
        lum=I.mean(-1)
        y0,y1=int(top+0.60*H),int(top+0.70*H)
        band=(lum[y0:y1]<70)&fg[y0:y1]
        yy,xx=np.nonzero(band)
        mx=xx.mean() if len(xx) else np.nan
        cx=(L45[0]+L45[1])/2; w=L45[1]-L45[0]
        out.append(dict(f=f,top=int(top),bot=int(bot),w45=int(w),cx45=float(cx),neck=[int(L90[0]),int(L90[1])],yaw=float((mx-cx)/w),area=int(fg.sum())))
    json.dump(out,open(V+'stats.json','w'))
    for o in out: print(o['f'],o['top'],o['bot'],o['w45'],round(o['cx45'],1),o['neck'],round(o['yaw'],3))
