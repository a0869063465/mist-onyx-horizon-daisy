import numpy as np, json
from PIL import Image, ImageDraw
from collections import deque
floor=np.load("floor.npy"); H,W=floor.shape
def fill(seed):
    comp=np.zeros_like(floor); sy,sx=seed; dq=deque([seed]); comp[sy,sx]=True
    while dq:
        y,x=dq.popleft()
        for dy,dx in ((1,0),(-1,0),(0,1),(0,-1)):
            ny,nx=y+dy,x+dx
            if 0<=ny<H and 0<=nx<W and floor[ny,nx] and not comp[ny,nx]:
                comp[ny,nx]=True; dq.append((ny,nx))
    return comp
left=fill((330,300)); right=fill((350,800))
comp=left|right
pts=json.load(open("wallpts.json"))
hp={int(k):[p for p in v if p[2]>=30] for k,v in pts["h"].items()}
vp={int(k):v for k,v in pts["v"].items()}
def fit_h(plist,slope_default=0.0):
    if len(plist)>=2:
        x=np.array([p[0] for p in plist]);y=np.array([p[1] for p in plist])
        b,a=np.polyfit(x,y,1); return a,b
    x,y=plist[0][0],plist[0][1]; return y-slope_default*x,slope_default
def fit_v(plist,slope_default):
    if len(plist)>=2:
        y=np.array([p[1] for p in plist]);x=np.array([p[0] for p in plist])
        b,a=np.polyfit(y,x,1); return a,b
    x,y=plist[0][0],plist[0][1]; return x-slope_default*y,slope_default
Hl={}  # k -> (a,b): y=a+b*x
for k,pl in hp.items(): Hl[k]=fit_h(pl,0.0)
# outer horizontal: top (k=0) and bottom (k=7)
top_y=min(np.where(comp[:,x])[0].min() for x in range(250,600,10) if comp[:,x].any())
bot_y=max(np.where(comp[:,x])[0].max() for x in range(300,600,10) if comp[:,x].any())
print("top floor y",top_y,"bottom floor y",bot_y)
Hl[0]=(top_y-16,0.0)
Hl[7]=(985.0,0.0)
Vl={}
slopes={2:-0.038,3:-0.007,4:0.0426,6:0.047}
for j,pl in vp.items():
    Vl[j]=fit_v(pl,slopes.get(j,0.0))
# slopes for missing: j=1,5
Vl[1]=fit_v(vp[1],-0.065); Vl[5]=fit_v(vp[5],0.045)
# outer vertical: left/right floor edges
def edge(side,y):
    r=np.where((left if side=="L" else right)[y])[0]; return r.min() if side=="L" else r.max()
yy=np.arange(200,900,20)
lx=[edge("L",y) for y in yy]; rx=[edge("R",y) for y in yy]
bl,al=np.polyfit(yy,lx,1); br,ar=np.polyfit(yy,rx,1)
Vl[0]=(172.6,-0.153); Vl[7]=(980.1,0.156)
print("left edge fit",al,bl,"right",ar,br)
# intersection of horizontal k and vertical j
def inter(k,j):
    a,b=Hl[k]; c,d=Vl[j]
    # y=a+b x ; x=c+d y -> x=c+d(a+b x) -> x(1-d b)=c+d a
    x=(c+d*a)/(1-d*b); y=a+b*x; return x,y
G={(k,j):inter(k,j) for k in range(8) for j in range(8)}
im=Image.open("/root/.claude/uploads/c2413530-f8f2-5ed9-b754-785a2a5e5712/dc1292f7-image.png").convert("RGB")
d=ImageDraw.Draw(im)
for k in range(8):
    d.line([G[(k,0)],G[(k,7)]],fill=(255,0,0),width=2)
for j in range(8):
    d.line([G[(0,j)],G[(7,j)]],fill=(255,0,0),width=2)
rows="GFEDCBA"
cells={}
for r in range(7):
    for c in range(7):
        cs=[G[(r,c)],G[(r,c+1)],G[(r+1,c)],G[(r+1,c+1)]]
        cx=sum(p[0] for p in cs)/4; cy=sum(p[1] for p in cs)/4
        wid=((G[(r,c+1)][0]-G[(r,c)][0])+(G[(r+1,c+1)][0]-G[(r+1,c)][0]))/2
        hei=((G[(r+1,c)][1]-G[(r,c)][1])+(G[(r+1,c+1)][1]-G[(r,c+1)][1]))/2
        bx=(G[(r+1,c)][0]+G[(r+1,c+1)][0])/2; by=(G[(r+1,c)][1]+G[(r+1,c+1)][1])/2
        fx=(cx+bx)/2; fy=(cy+by)/2
        fx=(cx+fx)/2; fy=(cy+fy)/2
        cells[f"{c+1}{rows[r]}"]={"x":round(float(cx),1),"y":round(float(cy),1),"w":round(float(wid),1),"h":round(float(hei),1),"fx":round(float(fx),1),"fy":round(float(fy),1)}
        d.ellipse([cx-4,cy-4,cx+4,cy+4],fill=(0,255,255))
        d.ellipse([fx-6,fy-6,fx+6,fy+6],fill=(255,0,255))
        d.text((cx+7,cy-6),f"{c+1}{rows[r]}",fill=(255,255,0))
im.save("overlay2.png")
json.dump(cells,open("cells.json","w"),indent=1)
print(cells["1A"],cells["4D"])
