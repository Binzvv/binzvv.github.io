import numpy as np, cv2
from PIL import Image
from scipy import ndimage as ndi
I=np.array(Image.open('src.png')).astype(np.float32)
R,G,B=I[...,0],I[...,1],I[...,2]
ratio=(B-R)/np.maximum(B,1)
pure=(ratio>0.45)&(B>150)
cloud=(B>=R-3)&(G>=R-8)&(np.minimum(np.minimum(R,G),B)>150)
def border_conn(m):
    lab,n=ndi.label(m)
    b=set(np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]])))-{0}
    return np.isin(lab,list(b))
bgs=border_conn(pure)
lab,n=ndi.label(cloud&~bgs)
sizes=ndi.sum(np.ones_like(R),lab,range(1,n+1))
touch=ndi.binary_dilation(bgs,iterations=2)
keep=[i+1 for i in range(n) if sizes[i]>1500 and touch[lab==i+1].any()]
bg=bgs|np.isin(lab,keep)
# blur-ish transition pixels between pure sky and cloud (mid-saturation, large)
mid=((B-R)>15)&~bg
lab3,n3=ndi.label(mid)
s3=ndi.sum(np.ones_like(R),lab3,range(1,n3+1))
keep3=[i+1 for i in range(n3) if s3[i]>1500 and touch[lab3==i+1].any()]
bg|=np.isin(lab3,keep3)
bg=border_conn(bg)
fg=~bg
lab2,n2=ndi.label(fg); sizes=ndi.sum(fg,lab2,range(1,n2+1)); fg=lab2==(1+np.argmax(sizes))
fg=ndi.binary_fill_holes(fg)
# glossy white rim light on the left of the neck touches a cloud; keep it as head
box=np.zeros_like(fg); box[1085:1185,306:345]=True
fg|=box&(ratio<0.2)
fg=ndi.binary_fill_holes(fg)
np.save('fg.npy',fg)
v=I.copy(); v[~fg]=v[~fg]*0.25+np.array([255,0,255])*0.75
Image.fromarray(v.astype(np.uint8)).resize((540,728)).save('segv_s.png')
