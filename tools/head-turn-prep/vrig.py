import os
import numpy as np, cv2, json, sys
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from PIL import Image
from scipy import ndimage as ndi
from veyes_def import EYES1
import os; V=os.environ.get('WORK','work/')
FY=json.load(open(V+'flowyaw.json'))
# pose ladder, screen-left to screen-right, with measured face displacement (px at 528 wide)
LEFT=[(f,FY[str(f)][0]) for f in range(16,1,-1)]
RIGHT=[('i_a_25',22.2*.25),('i_a_50',22.2*.5),('i_a_75',22.2*.75),(38,22.2),
       ('i_b_20',22.2+28.6*.2),('i_b_40',22.2+28.6*.4),('i_b_60',22.2+28.6*.6),('i_b_80',22.2+28.6*.8),(39,50.8),
       ('i_c_50',56.0),(64,61.1),(63,68.1),(40,75.6),(62,78.9)]
def name(f): return f'c{f:04d}' if isinstance(f,int) else f
def load(f): return np.array(Image.open(V+f'cut/{name(f)}.png')).astype(np.float32)
def gray(c):
    a=c[...,3:]/255; comp=c[...,:3]*a+128*(1-a)
    return cv2.cvtColor(comp.astype(np.uint8),cv2.COLOR_RGB2GRAY)
dis=cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)
def catmull(pts, n=8):
    pts=np.array(pts,float); P=np.vstack([pts[-1],pts,pts[0],pts[1]]); out=[]
    for i in range(1,len(P)-2):
        p0,p1,p2,p3=P[i-1],P[i],P[i+1],P[i+2]
        for t in np.linspace(0,1,n,endpoint=False):
            out.append(0.5*((2*p1)+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t*t+(-p0+3*p1-3*p2+p3)*t**3))
    return np.array(out)
def sample(fl,pts):
    out=[]
    for x,y in pts:
        x0,y0=int(np.floor(x)),int(np.floor(y)); fx,fy=x-x0,y-y0
        v=(fl[y0,x0]*(1-fx)*(1-fy)+fl[y0,x0+1]*fx*(1-fy)+fl[y0+1,x0]*(1-fx)*fy+fl[y0+1,x0+1]*fx*fy)
        out.append((x+v[0],y+v[1]))
    return out
def track(chain):
    # returns {pose: {eye: {'poly': [...], 'c': (x,y)}}}
    state={k:dict(poly=list(e['upper']+e['lower']),c=(e['iris'][0],e['iris'][1])) for k,e in EYES1.items()}
    res={}
    prev=load(1); res[1]={k:dict(v) for k,v in state.items()}
    for f in chain:
        cur=load(f)
        fl=dis.calc(gray(prev),gray(cur),None)
        # smooth the flow a little so contour points move coherently
        fl=cv2.GaussianBlur(fl,(0,0),2.0)
        for k in state:
            state[k]=dict(poly=sample(fl,state[k]['poly']),c=sample(fl,[state[k]['c']])[0])
        res[f]={k:dict(v) for k,v in state.items()}
        prev=cur
    return res
SS=4
def raster(poly,H,W):
    m=np.zeros((H*SS,W*SS),np.uint8)
    cv2.fillPoly(m,[np.round(np.array(poly)*SS).astype(np.int32)],255,lineType=cv2.LINE_AA)
    return cv2.resize(m.astype(np.float32)/255,(W,H),interpolation=cv2.INTER_AREA)
def rig(f,tr):
    C=load(f); I=C[...,:3].copy(); H,W=I.shape[:2]
    base=I.copy(); out={}
    yy,xx=np.mgrid[0:H,0:W].astype(np.float32)
    lum=I.mean(-1)
    for k,e in tr.items():
        cpoly=catmull(e['poly'])
        O=raster(cpoly,H,W)
        r0=EYES1[k]['iris'][2]
        cx,cy=e['c']
        # refine iris centre x from the dark pixels inside the opening
        inside=O>0.9
        sel=inside&(lum<np.percentile(lum[inside],32))&(np.abs(yy-cy)<3)&(np.abs(xx-cx)<r0*1.4)
        if sel.sum()>12:
            xs=xx[sel]; cx=0.5*cx+0.5*float(np.median(xs))
            lo,hi=np.percentile(xs,3),np.percentile(xs,97)
            rx=float(np.clip((hi-lo)/2+0.5,r0*0.65,r0*1.02))
        else: rx=r0
        ry=r0
        rx=max(rx,0.88*r0)
        rr=r0*1.08+3.0   # rebuild generously so no original limbus can survive a shifted iris
        dist=((xx-cx)/rr)**2+((yy-cy)/rr)**2
        Od=ndi.binary_dilation(O>0.01,iterations=2)
        region=(dist<1)&Od
        rec=base.copy()
        for y in np.unique(np.nonzero(region)[0]):
            dy=(y-cy)/rr; hw=rr*np.sqrt(max(1-dy*dy,0))
            xl=int(np.floor(cx-hw)); xr=int(np.ceil(cx+hw))
            L=I[y,xl-3:xl].mean(0); R=I[y,xr:xr+3].mean(0)
            for x in np.nonzero(region[y])[0]:
                t=(x-(xl-1))/((xr+1)-(xl-1)); rec[y,x]=L*(1-t)+R*t
        bl=cv2.GaussianBlur(rec,(0,0),sigmaX=0.5,sigmaY=1.2)
        rm=cv2.GaussianBlur(region.astype(np.float32),(0,0),0.8)[...,None]
        base=base*(1-rm)+bl*rm
        # iris layer with lid-hidden parts extended column-wise from the visible iris
        pad=8; x0=int(cx-rx-pad); y0=int(cy-ry-pad); x1=int(cx+rx+pad)+1; y1=int(cy+ry+pad)+1
        crop=I[y0:y1,x0:x1].copy(); Oc=O[y0:y1,x0:x1]>0.95
        for j in range(crop.shape[1]):
            ysin=np.nonzero(Oc[:,j])[0]
            if len(ysin)<3: continue
            t0=ysin.min()+1; t1=ysin.max()-1
            for i in range(t0-1,-1,-1): crop[i,j]=crop[i+1,j]*0.97
            for i in range(t1+1,crop.shape[0]): crop[i,j]=crop[i-1,j]*0.98
        d=np.sqrt(((xx[y0:y1,x0:x1]-cx)/rx)**2+((yy[y0:y1,x0:x1]-cy)/ry)**2)*rx
        a=np.clip((rx+0.5-d)/1.2,0,1)
        iris=np.dstack([crop,a*255])
        # available travel inside this opening (sclera either side of the iris at its centre row)
        row=np.nonzero(O[int(round(cy))]>0.6)[0]
        left_room=cx-rx-row.min() if len(row) else 0; right_room=row.max()-(cx+rx) if len(row) else 0
        Oclip=cv2.GaussianBlur(ndi.binary_erosion(O>0.5,iterations=1).astype(np.float32),(0,0),0.6)
        out[k]=dict(clip=Oclip,poly=[(round(float(x),2),round(float(y),2)) for x,y in cpoly],c=(round(float(cx),2),round(float(cy),2)),
                    rx=round(rx,2),ry=ry,box=[x0,y0,x1-x0,y1-y0],room=[round(float(left_room),1),round(float(right_room),1)],iris=iris)
    return np.dstack([base,C[...,3]]),out
if __name__=='__main__':
    tl=track([f for f,_ in LEFT[::-1]])
    trr=track([f for f,_ in RIGHT])
    poses=[(f,d) for f,d in LEFT]+[(1,0.0)]+RIGHT
    import pickle
    allr={}
    for f,d in poses:
        tr=(tl if (isinstance(f,int) and f<=16) else trr)[f]
        base,eyes=rig(f,tr)
        allr[name(f)]=dict(disp=d,base=base,eyes=eyes)
        print(name(f),round(d,1),{k:(v['c'],v['rx'],v['room']) for k,v in eyes.items()})
    pickle.dump(allr,open(V+'rig.pkl','wb'))
