// ================= WORLD: BIOMES, MAP GEN, MAP RENDER =================
const TS=16, DIRS=[[1,0],[-1,0],[0,1],[0,-1]];
const BIOMES={
  sewer:{name:'КАНАЛИЗАЦИЯ',rw:[5,9],rh:[5,8],max:11,cw:[1,1,2],titles:['Мутант','Мусорщик','Беглец','Падальщик'],human:.5,creatures:['rat','rat','slime'],density:'mid',ranged:.25,rk:['пистолет','дробовик'],mk:['нож','мачете','бита','топор'],armor:.1},
  alley:{name:'ПОДВОРОТНИ',rw:[4,8],rh:[4,7],max:13,cw:[1,2,2,3],titles:['Гопник','Бандит','Барыга','Уличный самурай'],human:.75,creatures:['dog','rat'],density:'mid',ranged:.4,rk:['пистолет','револьвер','ПП'],mk:['бита','нож','мачете','катана'],armor:.2},
  streets:{name:'УЛИЦЫ',rw:[6,11],rh:[5,8],max:10,cw:[2,3,3],titles:['Боевик банды','Наёмник','Байкер','Стрелок'],human:.8,creatures:['dog','drone'],density:'mid',ranged:.7,rk:['ПП','винтовка','револьвер','дробовик'],mk:['катана','электродубинка','мачете'],armor:.4},
  server:{name:'СЕРВЕРНАЯ: ВЕРХНИЕ УРОВНИ',rw:[6,10],rh:[6,9],max:10,cw:[1,2],titles:['Охранник','Нетраннер','Сисадмин-изгой','Техник'],human:.6,creatures:['drone','drone','sentry'],density:'high',ranged:.65,rk:['дробовик','пистолет','лазер'],mk:['электродубинка','энергоклинок'],armor:.55},
  core:{name:'СЕРВЕРНАЯ: НИЖНИЕ УРОВНИ',rw:[5,9],rh:[6,9],max:12,cw:[1,2],titles:['Киборг','Страж ядра','Нетраннер','Призрак сети'],human:.55,creatures:['sentry','drone','sentry'],density:'high',ranged:.75,rk:['лазер','винтовка','дробовик'],mk:['энергоклинок','катана'],armor:.75}};
const DEEP_SEQ=['frost','biolab','desert','fog','factory','core'];
const biomeFor=f=>f<=1?'sewer':f===2?'alley':f===3?'streets':f===4?'server':f===5?'core':f<=10?DEEP_SEQ[f-6]:DEEP_SEQ[(Math.imul(f,2654435761)>>>0)%6];

function genMap(seed,floor,biome){
  const R=RNG(seed),B=BIOMES[biome],W=48,H=48,t=new Uint8Array(W*H),room=new Uint8Array(W*H);
  const ok=(x,y)=>x>1&&y>2&&x<W-2&&y<H-2;
  const set=(x,y,v)=>{if(ok(x,y))t[y*W+x]=v};
  const rooms=[];
  for(let a=0;a<400&&rooms.length<B.max;a++){
    const w=R.int(B.rw[0],B.rw[1]),h=R.int(B.rh[0],B.rh[1]),x=R.int(3,W-w-3),y=R.int(4,H-h-3);
    if(rooms.some(r=>x<r.x+r.w+3&&x+w+3>r.x&&y<r.y+r.h+3&&y+h+3>r.y))continue;
    rooms.push({x,y,w,h,cx:x+(w>>1),cy:y+(h>>1)});
  }
  for(const r of rooms){
    for(let y=r.y;y<r.y+r.h;y++)for(let x=r.x;x<r.x+r.w;x++){set(x,y,1);if(ok(x,y))room[y*W+x]=1}
    const isSrv=biome==='server'||biome==='core';
    if(!isSrv){
      if(R.chance(.6))set(R.pick([r.x,r.x+r.w-1]),R.pick([r.y,r.y+r.h-1]),0);
      if(R.chance(.35))set(R.pick([r.x,r.x+r.w-1]),R.pick([r.y,r.y+r.h-1]),0);
    }
    if(isSrv&&r.w>=6&&r.h>=6){
      for(let y=r.y+2;y<=r.y+r.h-3;y+=3)for(let x=r.x+1;x<=r.x+r.w-2;x++)set(x,y,0);
    }
    if((biome==='alley'||biome==='streets')&&r.w>=6&&r.h>=5&&R.chance(.5)){set(r.x+2,r.y+2,0);if(R.chance(.5))set(r.x+r.w-3,r.y+r.h-3,0)}
  }
  const carve=(a,b)=>{let x=a.cx,y=a.cy;const wd=R.pick(B.cw),hf=R.chance(.5);
    const cs=(xx,yy,vert)=>{for(let k=0;k<wd;k++)vert?set(xx+k,yy,1):set(xx,yy+k,1)};
    const sx=()=>{while(x!==b.cx){cs(x,y,false);x+=Math.sign(b.cx-x)}};
    const sy=()=>{while(y!==b.cy){cs(x,y,true);y+=Math.sign(b.cy-y)}};
    if(hf){sx();sy()}else{sy();sx()}cs(x,y,false)};
  const conn=[0],rest=rooms.map((_,i)=>i).slice(1);
  while(rest.length){let best=null;for(const i of conn)for(const j of rest){const d=Math.abs(rooms[i].cx-rooms[j].cx)+Math.abs(rooms[i].cy-rooms[j].cy);if(!best||d<best.d)best={i,j,d}}
    carve(rooms[best.i],rooms[best.j]);conn.push(best.j);rest.splice(rest.indexOf(best.j),1)}
  for(let k=0;k<2+R.int(0,2);k++){const a=R.pick(rooms),b=R.pick(rooms);if(a!==b)carve(a,b)}
  // connectivity helper
  const floodCount=()=>{let s=-1,total=0;for(let i=0;i<W*H;i++)if(t[i]===1){total++;if(s<0)s=i}
    const seen=new Uint8Array(W*H),q=[s];seen[s]=1;
    for(let h=0;h<q.length;h++){const c=q[h];for(const[dx,dy]of DIRS){const n=c+dy*W+dx;if(t[n]===1&&!seen[n]){seen[n]=1;q.push(n)}}}
    return q.length===total};
  // sewer channels
  if(biome==='sewer'){
    for(const r of rooms){if(r.h<5||r.w<5||!R.chance(.75))continue;
      const y=r.cy,saved=[];const bx=R.int(r.x+1,r.x+r.w-2);
      for(let x=r.x;x<r.x+r.w;x++){const i=y*W+x;if(t[i]===1&&x!==bx){saved.push(i);t[i]=3}}
      if(r.h>=7&&R.chance(.4)){const y2=y+2;for(let x=r.x;x<r.x+r.w;x++){const i=y2*W+x;if(t[i]===1&&x!==r.x+r.w-1-(bx-r.x)){saved.push(i);t[i]=3}}}
      if(!floodCount())saved.forEach(i=>t[i]=1);
    }
  }
  // walls
  for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){if(t[y*W+x])continue;
    for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){const v=t[(y+oy)*W+x+ox];if(v===1||v===3)t[y*W+x]=2}}
  // start & exit
  const start=R.pick(rooms);let sx=start.cx,sy=start.cy;
  if(t[sy*W+sx]!==1){outer:for(let y=start.y;y<start.y+start.h;y++)for(let x=start.x;x<start.x+start.w;x++)if(t[y*W+x]===1){sx=x;sy=y;break outer}}
  const dist=new Int32Array(W*H).fill(-1),q=[sy*W+sx];dist[q[0]]=0;
  for(let h=0;h<q.length;h++){const c=q[h];for(const[dx,dy]of DIRS){const n=c+dy*W+dx;if(t[n]===1&&dist[n]<0){dist[n]=dist[c]+1;q.push(n)}}}
  const interior=i=>{for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++)if(t[i+oy*W+ox]!==1)return false;return true};
  const cand=[];let maxd=0;
  rooms.forEach((r,ri)=>{if(r===start)return;for(let y=r.y;y<r.y+r.h;y++)for(let x=r.x;x<r.x+r.w;x++){const i=y*W+x;if(dist[i]>0&&interior(i)){cand.push({x,y,d:dist[i],ri});if(dist[i]>maxd)maxd=dist[i]}}});
  if(!cand.length){for(const i of q)if(dist[i]>3)cand.push({x:i%W,y:(i/W)|0,d:dist[i],ri:-1});cand.forEach(c=>maxd=Math.max(maxd,c.d))}
  cand.sort((a,b)=>b.d-a.d);
  const far=cand[0]||{x:q[q.length-1]%W,y:(q[q.length-1]/W)|0,ri:-1};
  let ev=cand.filter(c=>c.ri!==far.ri&&c.d>=maxd*.4&&Math.abs(c.x-far.x)+Math.abs(c.y-far.y)>8);
  if(!ev.length)ev=cand.filter(c=>Math.abs(c.x-far.x)+Math.abs(c.y-far.y)>5);
  const evc=ev.length?ev[R.int(0,ev.length-1)]:(()=>{for(const i of q){const x=i%W,y=(i/W)|0;if(Math.abs(x-far.x)+Math.abs(y-far.y)>3&&dist[i]>2)return{x,y}}return{x:sx+1,y:sy}})();
  return{W,H,t,room,rooms,start:{x:sx,y:sy},exit:{x:far.x,y:far.y},evac:{x:evc.x,y:evc.y},seed,biome,startRoom:start};
}

// ---------- map baking ----------
function makeSignCells(R){
  const w=R.int(8,12),h=R.int(4,5),x0=(16-w)>>1,y0=R.int(3,5),pts=[];
  const style=R.int(0,2);
  if(style<2){for(let x=x0;x<x0+w;x++){pts.push([x,y0]);pts.push([x,y0+h-1])}for(let y=y0+1;y<y0+h-1;y++){pts.push([x0,y]);pts.push([x0+w-1,y])}}
  for(let x=x0+2;x<x0+w-2;x++)for(let y=y0+1;y<y0+h-1;y++)if(R.chance(style===2?.6:.45))pts.push([x,y]);
  if(style===2)for(let x=x0;x<x0+w;x++)if(R.chance(.5))pts.push([x,y0+h-1]);
  return pts;
}
// neon tubes in SPRITE pixels: cells of a world-unit design become 1-px strokes at RES× (tube joins kept)
function neonPts(cells,ox=0,oy=0){const set=new Set(cells.map(([x,y])=>(x+ox)+','+(y+oy))),out=[];
  for(const[x0,y0]of cells){const x=x0+ox,y=y0+oy;out.push([x*RES,y*RES]);if(set.has((x+1)+','+y))out.push([x*RES+1,y*RES]);if(set.has(x+','+(y+1)))out.push([x*RES,y*RES+1])}return out}
function makeSign(R){return neonPts(makeSignCells(R))
}
const NEONC=['#ff2fa8','#22e6ff','#f9f871','#7dff4f','#b45cff','#ff8a1f','#ff3355'];
function renderMap(M){
  // Baked natively at SPX (32) pixels per tile: 1-px seams and mortar, per-pixel grain, finer decor.
  const {W,H,t,biome}=M,N=SPX,c=document.createElement('canvas');c.width=W*N;c.height=H*N;
  const cx=c.getContext('2d'),id=cx.createImageData(c.width,c.height),d=id.data,CWp=c.width;
  const R=RNG(M.seed^0x9e3779b9);
  const C=h=>hx(h),mixc=(a,b,k)=>[a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k,a[2]+(b[2]-a[2])*k];
  const put=(px,py,col,k=1)=>{if(px<0||py<0||px>=CWp||py>=c.height)return;const i=(py*CWp+px)*4;d[i]=Math.min(255,col[0]*k);d[i+1]=Math.min(255,col[1]*k);d[i+2]=Math.min(255,col[2]*k);d[i+3]=255};
  const pix=(px,py,h)=>put(px,py,C(h));
  const rect=(x,y,w,h,col)=>{for(let j=0;j<h;j++)for(let i=0;i<w;i++)pix(x+i,y+j,col)};
  const T=(x,y)=>x<0||y<0||x>=W||y>=H?0:t[y*W+x];
  const isFace=(x,y)=>T(x,y)===2&&(T(x,y+1)===1||T(x,y+1)===3);
  const lights=[],neons=[],leds=[],lamps=[],waters=[];
  const pick=a=>a[(R.f()*a.length)|0];
  const hsh=(a,b,s=0)=>{let h=Math.imul(a*73856093^b*19349663^s*83492791,2654435761)>>>0;return(h>>>8)/16777216};
  const grain=(px,py,s=0)=>{const h=hsh(px,py,s);return h<.18?.93:h>.86?1.06:1}; // per-pixel grain
  const P_={
    alley:{slab:['#3a3c46','#363842','#3f414b'].map(C),slabSeam:C('#22232a'),slabHi:C('#4a4c58'),asph:['#26272e','#2a2b33','#232429'].map(C),asphSpk:C('#34353f'),
      brick:['#4a2b2b','#53302e','#44282a'].map(C),mortar:C('#221516'),lip:[C('#6a443e'),C('#5c3a35'),C('#4a2e2b'),C('#3e2624')],fb:[C('#24161a'),C('#1c1014'),C('#140c0e'),C('#0e080a')],cap:[C('#17171d'),C('#1c1c23')],rim:C('#2c2c36')},
    sewer:{st:['#3a3d30','#35382c','#40432f'].map(C),moss:C('#3d4d2c'),dark:C('#2a2c22'),seam:C('#1f2118'),hi:C('#4a4d3c'),
      brick:['#3a3528','#423c2d','#36311f'].map(C),mortar:C('#1c1a12'),lip:[C('#56503e'),C('#4a4535'),C('#3f3a2c'),C('#36321f')],fb:[C('#1a180f'),C('#15130c'),C('#0f0e08'),C('#0a0906')],cap:[C('#141510'),C('#181a13')],rim:C('#262820'),
      water:['#1c3320','#1f3a24','#183020'].map(C),rip:C('#2c5a2e'),foam:C('#4f8a3a')},
    base:{plank:['#4a3a2c','#54422f','#4e3e2d','#463628'].map(C),seam:C('#2a2018'),grainc:C('#3e3024'),rug:[C('#3a2448'),C('#4a2c5a')],panel:['#4a4458','#46405a'].map(C),cap:[C('#1a161f'),C('#1e1924')],rim:C('#3a3248')},
    streets:{side:['#4a4c56','#464852','#50525c'].map(C),sseam:C('#2c2d34'),asph:['#232429','#26272d','#202126'].map(C),spk:C('#30313a'),cap:[C('#141419'),C('#18181e')],rim:C('#2e2e3a')},
    core:{pan:[C('#1f2129'),C('#23252e')],seam:C('#121318'),hi:C('#2e2a34'),dot:C('#16171c'),cap:[C('#0b0c10'),C('#0f1014')],rim:C('#2a1a22')},
    server:{pan:[C('#2b303b'),C('#2e3440')],seam:C('#1a1e26'),hi:C('#383f4d'),dot:C('#1f232c'),cap:[C('#101318'),C('#14181e')],rim:C('#232a36')}}[biome];
  const LIP=k=>P_.lip?P_.lip[k]:null;
  for(let ty=0;ty<H;ty++)for(let tx=0;tx<W;tx++){
    const v=T(tx,ty);if(!v)continue;const bx=tx*N,by=ty*N,i=ty*W+tx;
    // contact shadows from the walls around a floor tile
    const shade=(px,py)=>{let k=1;if(T(tx,ty-1)===2&&py<10)k*=.38+.62*(py/10)**.8;if(T(tx-1,ty)===2&&px<4)k*=.7+.3*px/4;if(T(tx+1,ty)===2&&px>27)k*=.8+.2*(31-px)/4;return k};
    if(v===1){
      const tv=.92+R.f()*.14;
      for(let py=0;py<N;py++)for(let px=0;px<N;px++){
        let col;
        if(biome==='base'){
          const rug=!!M.rug&&tx>=M.rug[0]&&tx<=M.rug[2]&&ty>=M.rug[1]&&ty<=M.rug[3];
          if(rug){const gx=tx*N+px,gy=ty*N+py,ed=(tx===M.rug[0]&&px<2)||(tx===M.rug[2]&&px>29)||(ty===M.rug[1]&&py<2)||(ty===M.rug[3]&&py>29);
            col=ed?C('#ff2fa8'):((gx+gy)%16===0||(gx-gy+1024)%16===0)?C('#7a3a8a'):P_.rug[((gx>>3)+(gy>>3))&1]}
          else{const row=py>>3,off=(row*11+tx*7)%32,joint=(px+off)%32===31,plank=Math.floor((px+off)/32)+row*3+tx*5+ty*13;
            if(py%8===7||joint)col=P_.seam;else{col=P_.plank[plank&3];if(py%8===0)col=mixc(col,[110,90,70],.18);if((px*3+py*17+plank*7)%29===0||(px+plank*5)%13===0&&py%8===3)col=P_.grainc}}
        } else if(biome==='streets'){
          if(M.room[i]){const s=(px>>4)+(py>>4)*2+i;if(px%16===15||py%16===15)col=P_.sseam;else{col=P_.side[s%3];if(px%16===0||py%16===0)col=mixc(col,[110,112,124],.3)}}
          else{const n=R.f();col=n<.05?P_.spk:pick(P_.asph);
            const hor=T(tx-1,ty)===1&&T(tx+1,ty)===1&&!(T(tx,ty-1)===1&&T(tx,ty+1)===1),ver=T(tx,ty-1)===1&&T(tx,ty+1)===1&&!(T(tx-1,ty)===1&&T(tx+1,ty)===1);
            if(hor&&(ty%3===1)&&(py===14||py===15)&&px>=6&&px<=23)col=py===14?C('#d8b040'):C('#a88020');if(ver&&(tx%3===1)&&(px===14||px===15)&&py>=6&&py<=23)col=px===14?C('#d8b040'):C('#a88020')}
        } else if(biome==='alley'){
          if(M.room[i]){col=(px===31||py===31)?P_.slabSeam:P_.slab[i%3];if(px===0||py===0)col=mixc(col,P_.slabHi,.5);if(px===1||py===1)col=mixc(col,P_.slabHi,.2)}
          else{const n=R.f();col=n<.06?P_.asphSpk:pick(P_.asph)}
        } else if(biome==='sewer'){
          const st=(px>>4)+(py>>4)*2;
          if(px%16===15||py%16===15)col=P_.seam;else{const n=R.f();col=n<.06?P_.dark:P_.st[(st+i)%3];if(px%16===0||py%16===0)col=mixc(col,P_.hi,.5);else if(px%16===14||py%16===14)col=mixc(col,P_.seam,.35)}
        } else {
          const pi=((px>>4)+(py>>4))&1,lx=px%16,ly=py%16;
          if(lx===15||ly===15)col=P_.seam;else{col=P_.pan[pi];if(lx===0||ly===0)col=P_.hi;else if(lx===14||ly===14)col=mixc(col,P_.seam,.4);else if((lx===2||lx===12)&&(ly===2||ly===12))col=P_.dot;else if(R.f()<.04)col=P_.dot}
        }
        put(bx+px,by+py,col,tv*shade(px,py)*grain(bx+px,by+py,7));
      }
      if(biome==='sewer'&&R.chance(.3)){const mx=R.int(4,26),my=R.int(4,26),n=R.int(10,30);for(let k=0;k<n;k++){const px=Math.max(0,Math.min(31,mx+R.int(-6,6))),py=Math.max(0,Math.min(31,my+R.int(-4,4)));put(bx+px,by+py,mixc(P_.moss,P_.st[0],R.f()*.4),shade(px,py))}}
      if((biome==='server'||biome==='core')&&R.chance(.35)){const q=R.int(0,3),ox=(q&1)*16,oy=(q>>1)*16;for(let py=3;py<12;py++)for(let px=3;px<12;px++)if((px+py)%2===0)put(bx+ox+px,by+oy+py,P_.dot,shade(ox+px,oy+py))}
    } else if(v===3){
      waters.push([tx,ty]);
      for(let py=0;py<N;py++)for(let px=0;px<N;px++){
        let col=P_.water[(hsh(bx+px,by+py,3)*3)|0];if((py*3+px+tx*14)%22===0||(py*3+px+tx*14)%22===1&&py%2===0)col=P_.rip;
        if(py<4&&T(tx,ty-1)!==3)col=py===0?C('#0d140c'):py===1?C('#2a4a24'):P_.foam;
        if(py>=30&&T(tx,ty+1)!==3)col=py===31?C('#0a120a'):C('#0f1a10');
        put(bx+px,by+py,col);
      }
      if((tx+ty*3)%4===0)lights.push({x:tx+.5,y:ty+.5,c:[90,255,110],rad:2.6,int:.35,kind:'water',ph:R.f()*6});
    } else if(isFace(tx,ty)){
      const top=py=>py<4,bot=py=>py>=28;
      if(biome==='base'){
        for(let py=0;py<N;py++)for(let px=0;px<N;px++){let col;
          if(top(py))col=['#7a7490','#6a6480','#5a5470','#4a4460'][py];else if(bot(py))col=['#2a2434','#201b2a','#18141e','#100d14'][py-28];
          else if(px===31||py===16)col=C('#38324a');else if(px===0||py===17)col=C('#5a5470');else col=P_.panel[(px>>4)&1];
          if(py===22||py===23)col=py===22?C('#8a3a7a'):C('#5a2050');
          if((px===3||px===28)&&(py===7||py===26))col=C('#7a7490');
          if(Array.isArray(col))put(bx+px,by+py,col,grain(bx+px,by+py,5));else pix(bx+px,by+py,col)}
      } else if(biome==='streets'){
        const fc=pick(['#4a4c58','#3e4250','#504a56','#3a4248']),fcd=mix(fc,'#000000',.25),fcl=mix(fc,'#ffffff',.12);
        const lit=[0,1].map(k=>(((k)+tx*3+ty*5)%5===0)?pick(['#ffd98a','#7fd8ff','#ff8ad8']):null);
        for(let py=0;py<N;py++)for(let px=0;px<N;px++){let col;const lx=px%16,w=px>>4;
          if(top(py))col=['#7a7e8a','#6a6e7a','#5a5e6a','#4a4e5a'][py];else if(bot(py))col=['#24252e','#1c1d24','#15161c','#101116'][py-28];
          else if((lx===2||lx===13)&&py>=6&&py<=25)col=fcd;
          else if(lx>=3&&lx<=12&&py>=6&&py<=25){const mid=py===15||py===16||lx===7||lx===8;col=mid?fcd:lit[w]?(py<10&&lx<6?'#ffffff':lit[w]):(py===6||lx===3?'#1e2636':'#141a26')}
          else if(py===5||py===26)col=lx>=2&&lx<=13?fcl:fc;
          else col=fc;
          pix(bx+px,by+py,col)}
        if(lit[0]||lit[1])lights.push({x:tx+.5,y:ty+1.1,c:hx(lit[0]||lit[1]),rad:2.2,int:.3,kind:'win'});
        const r=R.f();
        if(r<.25){const col=pick(NEONC);const s={x:tx,y:ty,col,pts:makeSign(R),ph:R.f()*20};neons.push(s);lights.push({x:tx+.5,y:ty+1.3,c:hx(col),rad:5,int:1,kind:'neon',ref:s})}
        else if(r<.35){const s={x:tx,y:ty,ph:R.f()*10,col:'#ffe0a0'};lamps.push(s);lights.push({x:tx+.5,y:ty+1.4,c:[255,220,150],rad:5,int:.8,kind:'lamp',ref:s})}
      } else if(biome==='alley'){
        const bt=[];for(let k=0;k<12;k++)bt.push(R.f()<.5?1:2);
        for(let py=0;py<N;py++)for(let px=0;px<N;px++){let col;
          if(top(py))col=P_.lip[py];else if(bot(py))col=P_.fb[py-28];
          else{const row=Math.floor((py-4)/6),ir=(py-4)%6;if(ir===5)col=P_.mortar;else{const off=(row%2)*6,bi=Math.floor((px+off)/12);col=((px+off)%12===11)?P_.mortar:P_.brick[(bi*7+row*3)&1?0:bt[(row*3+bi)%12]];if(ir===0&&(px+off)%12!==11)col=mixc(col,[120,80,70],.15)}}
          put(bx+px,by+py,col,grain(bx+px,by+py,9))}
        const r=R.f();
        if(r<.2){const lit=R.chance(.6),lc=R.chance(.7)?'#ffd98a':'#7fd8ff';
          for(let py=8;py<=21;py++)for(let px=8;px<=23;px++){const fr=px===8||px===23||py===8||py===21,mul=px===15||px===16||py===14;pix(bx+px,by+py,fr?'#1a1216':mul?'#2a2026':(lit&&hsh(bx+px>>1,by+py>>1,2)<.4?lc:(py<11?'#1a1e28':'#101622')))}
          rect(bx+7,by+22,18,1,'#5c3a35');
          if(lit)lights.push({x:tx+.5,y:ty+1.1,c:hx(lc),rad:2.5,int:.35,kind:'win'});}
        else if(r<.42){const col=pick(NEONC);const s={x:tx,y:ty,col,pts:makeSign(R),ph:R.f()*20};neons.push(s);lights.push({x:tx+.5,y:ty+1.3,c:hx(col),rad:4.6,int:.95,kind:'neon',ref:s})}
        else if(r<.52){for(let py=18;py<=27;py++)for(let px=4;px<=17;px++)pix(bx+px,by+py,(px===4||px===17||py===18||py===27)?'#3a3d45':(py%2?'#6a6e78':'#2a2d34'));rect(bx+5,by+19,12,1,'#8a8e98')}
        if(R.chance(.15)){const gc=C(pick(NEONC));let gx=bx+R.int(4,26),gy=by+R.int(12,24);for(let k=0;k<R.int(12,26);k++){put(gx,gy,mixc(gc,[30,20,25],.4));gx+=R.int(-1,1);gy+=R.int(-1,1)}}
      } else if(biome==='sewer'){
        for(let py=0;py<N;py++)for(let px=0;px<N;px++){let col;
          if(top(py))col=P_.lip[py];else if(bot(py))col=P_.fb[py-28];
          else{const row=(py-4)>>3,ir=(py-4)%8;if(ir===7)col=P_.mortar;else{const off=(row%2)*8,bi=(px+off)>>4;col=((px+off)%16===15)?P_.mortar:P_.brick[(bi+row+tx)%3];if(ir===0)col=mixc(col,[90,84,60],.25);else if(ir===6)col=mixc(col,P_.mortar,.3)}}
          put(bx+px,by+py,col,grain(bx+px,by+py,4))}
        for(let k=0;k<R.int(0,3);k++){const px=R.int(2,29),len=R.int(6,18);for(let py=4;py<4+len;py++){put(bx+px,by+py,P_.moss);if(py%3===0)put(bx+px+1,by+py,mixc(P_.moss,[20,30,10],.4))}put(bx+px,by+4+len,[90,130,60])}
        const r=R.f();
        if(r<.38){for(let px=0;px<N;px++){pix(bx+px,by+16,'#c8884a');pix(bx+px,by+17,'#a0663a');pix(bx+px,by+18,'#8a5634');pix(bx+px,by+19,'#7a4a2c');pix(bx+px,by+20,'#5a3420');pix(bx+px,by+21,'#3a2214')}
          const fx=R.int(6,24);for(let py=14;py<=23;py++){pix(bx+fx,by+py,'#5a3a22');pix(bx+fx+1,by+py,'#7a4a2c');pix(bx+fx+2,by+py,'#4a2a18')}pix(bx+fx,by+14,'#8a5a34')}
        else if(r<.48){for(let py=10;py<=25;py++)for(let px=8;px<=23;px++)pix(bx+px,by+py,(px===8||px===23||py===10||py===25)?'#5a5a50':(px%3===0?'#4a4a42':'#0a0b07'));rect(bx+9,by+11,14,1,'#6a6a5e')}
        else if(r<.6){const s={x:tx,y:ty,ph:R.f()*10,col:'#ffb04a'};lamps.push(s);lights.push({x:tx+.5,y:ty+1.2,c:[255,160,70],rad:4.2,int:.75,kind:'lamp',ref:s})}
      } else {
        for(let py=0;py<N;py++)for(let px=0;px<N;px++){let col;
          if(top(py))col=['#4a5262','#3a4150','#2e3440','#2a303c'][py];else if(bot(py))col=['#12141a','#0d0f13','#0a0b0f','#08090c'][py-28];
          else if(px<=3||px>=28)col=px===0||px===31?'#15181f':px===1||px===30?'#232833':(py%6===2&&(px===2||px===29))?'#0a0c10':'#1c2029';
          else{const ir=(py-4)%6;col=ir===0?'#3a4150':ir===1?'#2c323e':ir===5?'#13161c':'#232830';if((ir===2||ir===3)&&px>19&&px<27&&px%2===0)col='#0e1116';if((ir===2||ir===3)&&px>=5&&px<=6)col='#2c323e'}
          pix(bx+px,by+py,col)}
        const pts=[];const n=R.int(3,7);for(let k=0;k<n;k++){const py=4+6*R.int(0,3)+2,px=R.int(8,17);pts.push([px,py,R.pick(biome==='core'?['#ff3355','#ff3355','#ffb02e','#b45cff']:['#3aff6a','#22e6ff','#22e6ff','#ffb02e','#ff3355']),R.f()*3+1,R.f()*10])}
        leds.push({x:tx,y:ty,pts}); // LED positions are sprite pixels
        if(R.chance(.3))lights.push({x:tx+.5,y:ty+1.1,c:biome==='core'?[255,50,80]:[60,200,255],rad:3,int:.4,kind:'led'});
        if(R.chance(biome==='core'?.15:.06)){const s={x:tx,y:ty,ph:R.f()*10,col:'#ff3344'};lamps.push(s);lights.push({x:tx+.5,y:ty+1.2,c:[255,50,70],rad:4.5,int:.8,kind:'lamp',ref:s})}
      }
    } else {
      const nb=(xx,yy)=>{const q=T(xx,yy);return q===1||q===3};
      for(let py=0;py<N;py++)for(let px=0;px<N;px++){
        let col=hsh(bx+px>>1,by+py>>1,11)<.3?P_.cap[1]:P_.cap[0];
        if((py===31&&nb(tx,ty+1))||(py===0&&nb(tx,ty-1))||(px===0&&nb(tx-1,ty))||(px===31&&nb(tx+1,ty)))col=P_.rim;
        else if((py===30&&nb(tx,ty+1))||(py===1&&nb(tx,ty-1))||(px===1&&nb(tx-1,ty))||(px===30&&nb(tx+1,ty)))col=mixc(P_.rim,P_.cap[0],.5);
        if((biome==='server'||biome==='core')&&py%8===4&&px>6&&px<25&&hsh(tx,ty*8+(py>>3),13)<.5)col=C('#1c2129');
        put(bx+px,by+py,col,grain(bx+px,by+py,12))}
    }
  }
  // decor
  if(biome!=='base')for(let ty=0;ty<H;ty++)for(let tx=0;tx<W;tx++){
    if(T(tx,ty)!==1||(tx===M.exit.x&&ty===M.exit.y))continue;
    const bx=tx*N,by=ty*N,r=R.f();
    if(biome==='alley'||biome==='streets'){
      if(r<.05){for(let k=0;k<R.int(1,2);k++){const ox=bx+R.int(4,20),oy=by+R.int(10,22);for(let yy=0;yy<8;yy++)for(let xx=0;xx<10;xx++)if(!((yy===0||yy===7)&&(xx===0||xx===9)))pix(ox+xx,oy+yy,yy<=1?'#3a3d48':yy===7?'#121318':xx===9?'#15171c':'#1b1d24');rect(ox+4,oy-2,2,2,'#2e313c');pix(ox+2,oy+1,'#4a4e5a')}}
      else if(r<.09){const cx_=bx+16,cy_=by+18,rc=C(pick(NEONC));for(let py=-4;py<=4;py++)for(let px=-10;px<=10;px++)if(px*px/100+py*py/18<=1)pix(cx_+px,cy_+py,px*px/100+py*py/18>.8?'#1a2232':'#141a26');
        for(let k=-5;k<=-1;k++)put(cx_+k,cy_-2,mixc(rc,[20,26,38],.2));put(cx_+4,cy_,mixc(rc,[20,26,38],.55));put(cx_+5,cy_,mixc(rc,[20,26,38],.6))}
      else if(r<.11&&!M.room[ty*W+tx]){for(let py=4;py<28;py++)for(let px=4;px<28;px++){const dd=Math.hypot(px-15.5,py-15.5);if(dd<11.5)pix(bx+px,by+py,dd>10.5?'#121318':dd>9.6?'#3a3b44':((px+py)%4===0||(px-py+40)%4===0)?'#3a3b44':'#2c2d34')}}
      else if(r<.16){const ox=bx+R.int(4,24),oy=by+R.int(6,24);rect(ox,oy,4,3,'#c8c4b8');pix(ox+1,oy+1,'#9a9488');const ox2=bx+R.int(4,26),oy2=by+R.int(6,26);rect(ox2,oy2,2,4,pick(['#c43a3a','#3a8ac4','#c4b03a']));pix(ox2,oy2,'#e8e4f4')}
      else if(r<.21){let px=bx+R.int(4,24),py=by+R.int(4,24);for(let k=0;k<R.int(8,16);k++){pix(px,py,'#18191e');if(k%3===0)pix(px+1,py,'#1e1f25');px+=R.int(-1,1);py+=R.int(0,1);px=Math.max(bx,Math.min(bx+29,px));py=Math.min(by+29,py)}}
    } else if(biome==='sewer'){
      if(r<.04){const ox=bx+R.int(6,18),oy=by+R.int(10,22);rect(ox+1,oy,8,2,'#cdc4ab');rect(ox+1,oy,8,1,'#e6dfcb');for(const xx of[0,9]){rect(ox+xx-1,oy-2,2,2,'#e6dfcb');rect(ox+xx-1,oy+2,2,2,'#cdc4ab')}}
      else if(r<.09){const cx_=bx+16,cy_=by+18;for(let py=-4;py<=4;py++)for(let px=-10;px<=10;px++){const q=px*px/100+py*py/18;if(q<=1)pix(cx_+px,cy_+py,q>.75?'#1a2a17':'#22331d')}rect(cx_-5,cy_-2,4,1,'#4f7a3a');pix(cx_+3,cy_+1,'#3a5a2c')}
      else if(r<.12){for(let py=8;py<=23;py++)for(let px=8;px<=23;px++)pix(bx+px,by+py,(px===8||px===23||py===8||py===23)?'#5a5a48':(px%3===1?'#4a4a3a':'#0c0d08'));rect(bx+9,by+9,14,1,'#6a6a56')}
      else if(r<.16){for(let k=0;k<3;k++){const gx=bx+R.int(4,24),gy=by+R.int(8,26);rect(gx,gy,3,2,'#6a5a3a');pix(gx+2,gy+1,'#4a3e28');pix(gx,gy,'#8a7a52')}}
    } else {
      if(r<.12){const vert=R.chance(.5),o=R.int(6,24),col=C(pick(['#2f6fd6','#d6b02f','#c43a3a','#3ac46a','#8a4dff']));
        for(let k=0;k<N;k++){const a=vert?[bx+o,by+k]:[bx+k,by+o],b2=vert?[bx+o+1,by+k]:[bx+k,by+o+1],s2=vert?[bx+o+2,by+k]:[bx+k,by+o+2];put(...a,mixc(col,[255,255,255],.2));put(...b2,col);put(...s2,[20,23,29])}}
      else if(r<.15){for(let py=10;py<=22;py++)for(let px=6;px<=25;px++)pix(bx+px,by+py,(px===6||px===25||py===10||py===22)?'#1a1d24':((px*py)%7===0?'#3a5a7a':py<13?'#2a4058':'#203040'));rect(bx+13,by+23,6,2,'#1a1d24');rect(bx+10,by+25,12,1,'#2a2d36')}
      else if(r<.18){for(let py=8;py<=23;py++)for(let px=8;px<=23;px++)pix(bx+px,by+py,px===8||py===8?'#14161c':'#07080a');rect(bx+12,by+16,2,1,'#c43a3a');rect(bx+14,by+18,2,1,'#d6b02f');rect(bx+18,by+14,2,1,'#2f6fd6');pix(bx+20,by+20,'#3aff6a')}
      else if(r<.22){const ox=bx+R.int(4,24),oy=by+R.int(6,24);rect(ox,oy,4,2,'#c8c4b8');pix(ox+3,oy+1,'#9a9488');const ox2=bx+R.int(4,26),oy2=by+R.int(6,26);rect(ox2,oy2,3,2,'#d6d0c0')}
    }
  }
  // exits
  {const bx=M.exit.x*N,by=M.exit.y*N;
    if(biome==='base'){for(let py=0;py<N;py++)for(let px=2;px<30;px++)pix(bx+px,by+py,(px<=3||px>=28||py<=1)?(px===2||px===29||py===0?'#2a2f3a':'#3a3f4e'):(px===15||px===16)?'#1a1e26':(py%10===4?'#4a5060':(px<15?'#5a6070':'#525868')));
      rect(bx+6,by+6,2,2,'#3aff6a');rect(bx+24,by+6,2,2,'#3aff6a');pix(bx+6,by+6,'#c8ffd0');pix(bx+24,by+6,'#c8ffd0')}
    else if(biome==='alley'||biome==='streets'){for(let py=2;py<30;py++)for(let px=2;px<30;px++)pix(bx+px,by+py,'#08090c');const sc=['#2a2e3a','#3a3f4e','#4b5162'];
      for(let s=0;s<3;s++){const y0=by+6+s*8;for(let px=8-s*2;px<=23+s*2;px++){pix(bx+px,y0,mix(sc[s],'#ffffff',.15));for(let k=1;k<5;k++)pix(bx+px,y0+k,sc[s]);for(let k=5;k<8;k++)pix(bx+px,y0+k,'#050608')}}}
    else if(biome==='sewer'){for(let py=2;py<30;py++)for(let px=2;px<30;px++){const dd=Math.hypot(px-15.5,py-15.5);if(dd<13)pix(bx+px,by+py,dd>12?'#4a4a3e':dd>11?'#6a6a5a':'#0a0b07')}
      for(let py=6;py<=25;py+=5){rect(bx+10,by+py,12,1,'#b8a870');rect(bx+10,by+py+1,12,1,'#7a6a4a')}rect(bx+10,by+6,2,20,'#7a6a4a');rect(bx+20,by+6,2,20,'#5a4a34')}
    else{for(let py=2;py<30;py++)for(let px=2;px<30;px++)pix(bx+px,by+py,px===15||px===16?'#1a1e26':(px<=3||px>=28||py<=3||py>=28)?(px===2||py===2?'#4a5262':'#3a4150'):(py%8===6?'#4a5060':'#5a6070'));
      rect(bx+6,by+6,2,2,'#ff2fa8');rect(bx+24,by+6,2,2,'#ff2fa8');pix(bx+6,by+6,'#ffd0f0');pix(bx+24,by+6,'#ffd0f0')}
    lights.push({x:M.exit.x+.5,y:M.exit.y+.5,c:biome==='base'?[80,255,120]:[255,60,200],rad:3.5,int:.7,kind:'exit'});}
  if(M.evac){const bx=M.evac.x*N,by=M.evac.y*N;
    for(let py=2;py<30;py++)for(let px=2;px<30;px++){const dd=Math.hypot(px-15.5,py-15.5);if(dd<13.4)pix(bx+px,by+py,dd>12.4?'#1c6a30':dd>11.4?'#3aff6a':dd>10.4?'#14301c':(px+py)%4===0?'#22382a':'#1c2a20')}
    for(let py=9;py<=23;py++){pix(bx+15,by+py,'#c8ffb0');pix(bx+16,by+py,'#7dff4f')}for(let k=0;k<6;k++){pix(bx+15-k,by+9+k,'#7dff4f');pix(bx+14-k,by+9+k,'#4ab030');pix(bx+16+k,by+9+k,'#7dff4f');pix(bx+17+k,by+9+k,'#4ab030')}
    lights.push({x:M.evac.x+.5,y:M.evac.y+.5,c:[80,255,120],rad:3.5,int:.7,kind:'exit'});}
  cx.putImageData(id,0,0);
  return{c,lights,neons,leds,lamps,waters};
}
