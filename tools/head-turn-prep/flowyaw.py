import os
import numpy as np, cv2
import os; V=os.environ.get('WORK','work/')
g=lambda f: cv2.cvtColor(cv2.imread(V+f'frames/f{f:04d}.png'),cv2.COLOR_BGR2GRAY)
ref=g(1)
dis=cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)
# face centre box (nose/mustache/glasses bridge) and the neck base
box=(slice(250,470),slice(190,340))
neck=(slice(600,635),slice(170,360))
res={}
for f in list(range(1,46))+list(range(54,65))+list(range(99,126)):
    fl=dis.calc(ref,g(f),None)
    res[f]=(float(np.median(fl[box][...,0])),float(np.median(fl[neck][...,0])),float(np.median(fl[box][...,1])))
for f,v in res.items(): print(f, *[round(x,1) for x in v])
import json; json.dump(res,open(V+'flowyaw.json','w'))
