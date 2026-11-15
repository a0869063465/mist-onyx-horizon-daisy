import numpy as np, json
from PIL import Image, ImageDraw
floor=np.load("floor.npy")  # True = floor
H,W=floor.shape
# overlay homography estimate for expected positions
Q=[[160,138],[985,142],[1088,965],[75,965]]
def hom(src,dst):
    A=[];b=[]
    for (x,y),(u,v) in zip(src,dst):
        A.append([x,y,1,0,0,0,-u*x,-u*y]);b.append(u)
        A.append([0,0,0,x,y,1,-v*x,-v*y]);b.append(v)
    h=np.linalg.solve(np.array(A,float),np.array(b,float)); return np.append(h,1).reshape(3,3)
Hm=hom([(0,0),(1,0),(1,1),(0,1)],Q)
def P(x,y):
    p=Hm@np.array([x,y,1.0]); return p[0]/p[2],p[1]/p[2]
rowsL="GFEDCBA"  # row index 0=G top ... 6=A
# horizontal boundary k between row index k-1 and k (k=1..6); cols 1..7
HW={1:[2,3,5,6],2:[1,4],3:[2,3,5],4:[1,2,4,6],5:[3,4,6],6:[2,3,5]}  # G|F=1 ... B|A=6
VW={1:[4],2:[1,2,5],3:[0,6],4:[0,1,2,3,4,5,6],5:[4],6:[1,2,3,5]}    # between col j and j+1, rows idx (0=G)
# note: C is row idx 4, F idx 1, E idx 2, D idx 3, B idx 5, A idx 6, G idx 0
def dark_run_center(line):
    # line: boolean array (True=floor) ; find the dark run nearest centre
    n=len(line); c=n//2
    if line[c]:
        # move to nearest dark
        for d in range(1,n):
            for q in (c-d,c+d):
                if 0<=q<n and not line[q]: c=q;break
            else: continue
            break
        else: return None
    a=c
    while a>0 and not line[a-1]: a-=1
    b=c
    while b<n-1 and not line[b+1]: b+=1
    return (a+b)/2, b-a
hpts={}; vpts={}
for k,cols in HW.items():
    for c in cols:
        xl,yl=P((c-1)/7,k/7); xr,yr=P(c/7,k/7)
        xs=np.linspace(xl+0.2*(xr-xl),xl+0.8*(xr-xl),9)
        ys=[];ws=[]
        for x in xs:
            y0=int(yl+(x-xl)/(xr-xl)*(yr-yl))
            lo=max(0,y0-45);hi=min(H,y0+45)
            seg=floor[lo:hi,int(x)]
            r=dark_run_center(seg)
            if r: ys.append((r[0]+lo,x)); ws.append(r[1])
        if ys:
            ymed=np.median([p[0] for p in ys]);xm=np.median([p[1] for p in ys])
            hpts.setdefault(k,[]).append((xm,ymed,float(np.median(ws))))
for j,rows in VW.items():
    for r in rows:
        xt,yt=P(j/7,r/7); xb,yb=P(j/7,(r+1)/7)
        ys=np.linspace(yt+0.2*(yb-yt),yt+0.8*(yb-yt),9)
        xsout=[];ws=[]
        for y in ys:
            x0=int(xt+(y-yt)/(yb-yt)*(xb-xt))
            lo=max(0,x0-45);hi=min(W,x0+45)
            seg=floor[int(y),lo:hi]
            res=dark_run_center(seg)
            if res: xsout.append((res[0]+lo,y)); ws.append(res[1])
        if xsout:
            xmed=np.median([p[0] for p in xsout]);ym=np.median([p[1] for p in xsout])
            vpts.setdefault(j,[]).append((xmed,ym,float(np.median(ws))))
json.dump({"h":hpts,"v":vpts},open("wallpts.json","w"))
for k,v in hpts.items(): print("H",k,[(round(a),round(b),round(c)) for a,b,c in v])
for j,v in vpts.items(): print("V",j,[(round(a),round(b),round(c)) for a,b,c in v])
