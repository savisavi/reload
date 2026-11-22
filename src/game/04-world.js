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
function makeSign(R){
  const w=R.int(8,12),h=R.int(4,5),x0=(16-w)>>1,y0=R.int(3,5),pts=[];
  const style=R.int(0,2);
  if(style<2){for(let x=x0;x<x0+w;x++){pts.push([x,y0]);pts.push([x,y0+h-1])}for(let y=y0+1;y<y0+h-1;y++){pts.push([x0,y]);pts.push([x0+w-1,y])}}
  for(let x=x0+2;x<x0+w-2;x++)for(let y=y0+1;y<y0+h-1;y++)if(R.chance(style===2?.6:.45))pts.push([x,y]);
  if(style===2)for(let x=x0;x<x0+w;x++)if(R.chance(.5))pts.push([x,y0+h-1]);
  return pts;
}
const NEONC=['#ff2fa8','#22e6ff','#f9f871','#7dff4f','#b45cff','#ff8a1f','#ff3355'];
function renderMap(M){
  const {W,H,t,biome}=M,c=document.createElement('canvas');c.width=W*TS;c.height=H*TS;
  const cx=c.getContext('2d'),id=cx.createImageData(c.width,c.height),d=id.data,CWp=c.width;
  const R=RNG(M.seed^0x9e3779b9);
  const C=h=>hx(h),mixc=(a,b,k)=>[a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k,a[2]+(b[2]-a[2])*k];
  const put=(px,py,col,k=1)=>{const i=(py*CWp+px)*4;d[i]=col[0]*k;d[i+1]=col[1]*k;d[i+2]=col[2]*k;d[i+3]=255};
  const pix=(px,py,h)=>put(px,py,C(h));
  const T=(x,y)=>x<0||y<0||x>=W||y>=H?0:t[y*W+x];
  const isFace=(x,y)=>T(x,y)===2&&(T(x,y+1)===1||T(x,y+1)===3);
  const lights=[],neons=[],leds=[],lamps=[],waters=[];
  const pick=a=>a[(R.f()*a.length)|0];
  // palettes
  const P_={
    alley:{slab:['#3a3c46','#363842','#3f414b'].map(C),slabSeam:C('#22232a'),slabHi:C('#4a4c58'),asph:['#26272e','#2a2b33','#232429'].map(C),asphSpk:C('#34353f'),
      brick:['#4a2b2b','#53302e','#44282a'].map(C),mortar:C('#221516'),lip:[C('#5c3a35'),C('#4a2e2b')],fb:[C('#24161a'),C('#140c0e')],cap:[C('#17171d'),C('#1c1c23')],rim:C('#2c2c36')},
    sewer:{st:['#3a3d30','#35382c','#40432f'].map(C),moss:C('#3d4d2c'),dark:C('#2a2c22'),seam:C('#1f2118'),hi:C('#4a4d3c'),
      brick:['#3a3528','#423c2d','#36311f'].map(C),mortar:C('#1c1a12'),lip:[C('#4a4535'),C('#3f3a2c')],fb:[C('#1a180f'),C('#0f0e08')],cap:[C('#141510'),C('#181a13')],rim:C('#262820'),
      water:['#1c3320','#1f3a24','#183020'].map(C),rip:C('#2c5a2e'),foam:C('#4f8a3a')},
    base:{plank:['#4a3a2c','#54422f','#4e3e2d'].map(C),seam:C('#2a2018'),rug:[C('#3a2448'),C('#4a2c5a')],panel:['#4a4458','#46405a'].map(C),cap:[C('#1a161f'),C('#1e1924')],rim:C('#3a3248')},
    streets:{side:['#4a4c56','#464852','#50525c'].map(C),sseam:C('#2c2d34'),asph:['#232429','#26272d','#202126'].map(C),spk:C('#30313a'),cap:[C('#141419'),C('#18181e')],rim:C('#2e2e3a')},
    core:{pan:[C('#1f2129'),C('#23252e')],seam:C('#121318'),hi:C('#2e2a34'),dot:C('#16171c'),cap:[C('#0b0c10'),C('#0f1014')],rim:C('#2a1a22')},
    server:{pan:[C('#2b303b'),C('#2e3440')],seam:C('#1a1e26'),hi:C('#383f4d'),dot:C('#1f232c'),
      cap:[C('#101318'),C('#14181e')],rim:C('#232a36')}}[biome];
  for(let ty=0;ty<H;ty++)for(let tx=0;tx<W;tx++){
    const v=T(tx,ty);if(!v)continue;const bx=tx*TS,by=ty*TS,i=ty*W+tx;
    const shade=(px,py)=>{let k=1;if(T(tx,ty-1)===2&&py<5)k*=[.38,.52,.66,.8,.92][py];if(T(tx-1,ty)===2&&px<2)k*=[.7,.86][px];if(T(tx+1,ty)===2&&px>13)k*=[.9,.8][px-14];return k};
    if(v===1){
      const tv=.92+R.f()*.14;
      for(let py=0;py<16;py++)for(let px=0;px<16;px++){
        let col;
        if(biome==='base'){
          const rug=!!M.rug&&tx>=M.rug[0]&&tx<=M.rug[2]&&ty>=M.rug[1]&&ty<=M.rug[3];
          if(rug){col=((px+py)%8===0||px===0&&tx===4||py===0&&ty===4)?C('#ff2fa8'):P_.rug[((px>>2)+(py>>2))&1];}
          else col=(py%4===3)?P_.seam:((px+(py>>2)*5+tx*3)%16===15?P_.seam:pick(P_.plank));
        } else if(biome==='streets'){
          if(M.room[i]){col=(px%8===7||py%8===7)?P_.sseam:pick(P_.side);if(px%8===0||py%8===0)col=mixc(col,[110,112,124],.3)}
          else{const n=R.f();col=n<.05?P_.spk:pick(P_.asph);
            const hor=T(tx-1,ty)===1&&T(tx+1,ty)===1&&!(T(tx,ty-1)===1&&T(tx,ty+1)===1),ver=T(tx,ty-1)===1&&T(tx,ty+1)===1&&!(T(tx-1,ty)===1&&T(tx+1,ty)===1);
            if(hor&&(ty%3===1)&&py===7&&px>=3&&px<=11)col=C('#c8a030');if(ver&&(tx%3===1)&&px===7&&py>=3&&py<=11)col=C('#c8a030')}
        } else if(biome==='alley'){
          if(M.room[i]){col=(px===15||py===15)?P_.slabSeam:pick(P_.slab);if(px===0||py===0)col=mixc(col,P_.slabHi,.5)}
          else{const n=R.f();col=n<.06?P_.asphSpk:pick(P_.asph)}
        } else if(biome==='sewer'){
          if(px%8===7||py%8===7)col=P_.seam;else{const n=R.f();col=n<.08?P_.dark:pick(P_.st);if(px%8===0||py%8===0)col=mixc(col,P_.hi,.5)}
        } else {
          const pi=((px>>3)+(py>>3))&1;
          if(px%8===7||py%8===7)col=P_.seam;else{col=P_.pan[pi];if(px%8===0||py%8===0)col=P_.hi;else if(R.f()<.05)col=P_.dot}
        }
        put(bx+px,by+py,col,tv*shade(px,py));
      }
      if(biome==='sewer'&&R.chance(.3))for(let k=0;k<R.int(4,12);k++){const px=R.int(0,14),py=R.int(0,14);put(bx+px,by+py,mixc(P_.moss,P_.st[0],R.f()*.4),shade(px,py))}
      if((biome==='server'||biome==='core')&&R.chance(.35)){for(let py=0;py<16;py++)for(let px=0;px<16;px++)if((px%8>1&&px%8<6)&&(py%8>1&&py%8<6)&&((px+py)%2===0)&&(((px>>3)+(py>>3))&1))put(bx+px,by+py,P_.dot,shade(px,py))}
    } else if(v===3){
      waters.push([tx,ty]);
      for(let py=0;py<16;py++)for(let px=0;px<16;px++){
        let col=pick(P_.water);if((py*3+px+tx*7)%11===0)col=P_.rip;
        if(py<2&&T(tx,ty-1)!==3)col=py===0?C('#0d140c'):P_.foam;
        if(py===15&&T(tx,ty+1)!==3)col=C('#0f1a10');
        put(bx+px,by+py,col);
      }
      if((tx+ty*3)%4===0)lights.push({x:tx+.5,y:ty+.5,c:[90,255,110],rad:2.6,int:.35,kind:'water',ph:R.f()*6});
    } else if(isFace(tx,ty)){
      if(biome==='base'){
        for(let py=0;py<16;py++)for(let px=0;px<16;px++){let col;
          if(py<=1)col=py?C('#5a5470'):C('#6a6480');else if(py>=14)col=py===14?C('#2a2434'):C('#18141e');
          else if(px===15||py===8)col=C('#38324a');else col=pick(P_.panel);
          if(py===11)col=C('#6a2a5a');put(bx+px,by+py,col)}
      } else if(biome==='streets'){
        const fc=pick(['#4a4c58','#3e4250','#504a56','#3a4248']);
        for(let py=0;py<16;py++)for(let px=0;px<16;px++){let col;
          if(py<=1)col=py?'#5a5e6a':'#6a6e7a';else if(py>=14)col=py===14?'#1c1d24':'#101116';
          else if((px%8===1||px%8===6)&&py>=3&&py<=12)col=mix(fc,'#000000',.25);
          else if(px%8>=2&&px%8<=5&&py>=3&&py<=12&&py!==7&&py!==8)col=(((px>>3)+tx*3+ty*5+py*7)%5===0)?pick(['#ffd98a','#7fd8ff','#ff8ad8']):'#141a26';
          else col=fc;
          pix(bx+px,by+py,col)}
        const r=R.f();
        if(r<.25){const col=pick(NEONC);const s={x:tx,y:ty,col,pts:makeSign(R),ph:R.f()*20};neons.push(s);lights.push({x:tx+.5,y:ty+1.3,c:hx(col),rad:5,int:1,kind:'neon',ref:s})}
        else if(r<.35){const s={x:tx,y:ty,ph:R.f()*10,col:'#ffe0a0'};lamps.push(s);lights.push({x:tx+.5,y:ty+1.4,c:[255,220,150],rad:5,int:.8,kind:'lamp',ref:s})}
      } else if(biome==='alley'){
        for(let py=0;py<16;py++)for(let px=0;px<16;px++){let col;
          if(py<=1)col=P_.lip[py];else if(py>=14)col=P_.fb[py-14];
          else{const row=Math.floor((py-2)/3),ir=(py-2)%3;if(ir===2)col=P_.mortar;else{const off=(row%2)*3;col=((px+off)%6===5)?P_.mortar:P_.brick[((px+off)/6|0)*7+row*3&1?0:(R.f()<.5?1:2)]}}
          put(bx+px,by+py,col)}
        const r=R.f();
        if(r<.2){const lit=R.chance(.6),lc=R.chance(.7)?'#ffd98a':'#7fd8ff';
          for(let py=4;py<=10;py++)for(let px=4;px<=11;px++){const fr=px===4||px===11||py===4||py===10;pix(bx+px,by+py,fr?'#1a1216':(lit&&R.chance(.35)?lc:(py===7?'#1a1e28':'#101622')))}
          if(lit)lights.push({x:tx+.5,y:ty+1.1,c:hx(lc),rad:2.5,int:.35,kind:'win'});}
        else if(r<.42){const col=pick(NEONC);const s={x:tx,y:ty,col,pts:makeSign(R),ph:R.f()*20};neons.push(s);lights.push({x:tx+.5,y:ty+1.3,c:hx(col),rad:4.6,int:.95,kind:'neon',ref:s})}
        else if(r<.52){for(let py=9;py<=13;py++)for(let px=2;px<=8;px++)pix(bx+px,by+py,(px===2||px===8||py===9||py===13)?'#3a3d45':(py%2?'#6a6e78':'#4a4e58'))}
        if(R.chance(.15)){const gc=pick(NEONC);for(let k=0;k<R.int(5,12);k++)put(bx+R.int(2,13),by+R.int(6,12),mixc(C(gc),[30,20,25],.45))}
      } else if(biome==='sewer'){
        for(let py=0;py<16;py++)for(let px=0;px<16;px++){let col;
          if(py<=1)col=P_.lip[py];else if(py>=14)col=P_.fb[py-14];
          else{const row=(py-2)>>2,ir=(py-2)%4;if(ir===3)col=P_.mortar;else col=((px+(row%2)*4)%8===7)?P_.mortar:pick(P_.brick)}
          put(bx+px,by+py,col)}
        for(let k=0;k<R.int(0,3);k++){const px=R.int(1,14),len=R.int(3,9);for(let py=2;py<2+len;py++)put(bx+px,by+py,P_.moss)}
        const r=R.f();
        if(r<.38){for(let px=0;px<16;px++){pix(bx+px,by+8,'#a0663a');pix(bx+px,by+9,'#7a4a2c');pix(bx+px,by+10,'#4a2a18')}const fx=R.int(3,12);for(let py=7;py<=11;py++)pix(bx+fx,by+py,'#5a3a22')}
        else if(r<.48){for(let py=5;py<=12;py++)for(let px=4;px<=11;px++)pix(bx+px,by+py,(px%2===0||py===5||py===12)?'#4a4a42':'#0a0b07')}
        else if(r<.6){const s={x:tx,y:ty,ph:R.f()*10,col:'#ffb04a'};lamps.push(s);lights.push({x:tx+.5,y:ty+1.2,c:[255,160,70],rad:4.2,int:.75,kind:'lamp',ref:s})}
      } else {
        for(let py=0;py<16;py++)for(let px=0;px<16;px++){let col;
          if(py===0)col='#3a4150';else if(py===1)col='#2a303c';else if(py>=14)col=py===14?'#0d0f13':'#08090c';
          else if(px<=1||px>=14)col=px===0||px===15?'#15181f':'#1c2029';
          else{const ir=(py-2)%3;col=ir===0?'#2c323e':ir===1?'#232830':'#181c23';if(ir===1&&px>9&&px%2===0)col='#11141a'}
          pix(bx+px,by+py,col)}
        const pts=[];const n=R.int(3,7);for(let k=0;k<n;k++){const py=2+3*R.int(0,3),px=R.int(3,8);pts.push([px,py,R.pick(biome==='core'?['#ff3355','#ff3355','#ffb02e','#b45cff']:['#3aff6a','#22e6ff','#22e6ff','#ffb02e','#ff3355']),R.f()*3+1,R.f()*10])}
        leds.push({x:tx,y:ty,pts});
        if(R.chance(.3))lights.push({x:tx+.5,y:ty+1.1,c:biome==='core'?[255,50,80]:[60,200,255],rad:3,int:.4,kind:'led'});
        if(R.chance(biome==='core'?.15:.06)){const s={x:tx,y:ty,ph:R.f()*10,col:'#ff3344'};lamps.push(s);lights.push({x:tx+.5,y:ty+1.2,c:[255,50,70],rad:4.5,int:.8,kind:'lamp',ref:s})}
      }
    } else {
      for(let py=0;py<16;py++)for(let px=0;px<16;px++){
        let col=R.chance(.3)?P_.cap[1]:P_.cap[0];
        const nb=(xx,yy)=>{const q=T(xx,yy);return q===1||q===3};
        if((py===15&&nb(tx,ty+1))||(py===0&&nb(tx,ty-1))||(px===0&&nb(tx-1,ty))||(px===15&&nb(tx+1,ty)))col=P_.rim;
        if((biome==='server'||biome==='core')&&py%4===2&&px>3&&px<12&&R.chance(.5))col=C('#1c2129');
        put(bx+px,by+py,col)}
    }
  }
  // decor
  if(biome!=='base')for(let ty=0;ty<H;ty++)for(let tx=0;tx<W;tx++){
    if(T(tx,ty)!==1||(tx===M.exit.x&&ty===M.exit.y))continue;
    const bx=tx*TS,by=ty*TS,r=R.f();
    if(biome==='alley'||biome==='streets'){
      if(r<.05){for(let k=0;k<R.int(1,2);k++){const ox=bx+R.int(2,10),oy=by+R.int(5,11);for(let yy=0;yy<4;yy++)for(let xx=0;xx<5;xx++)if(!((yy===0||yy===3)&&(xx===0||xx===4)))pix(ox+xx,oy+yy,yy===0?'#2e313c':'#1b1d24');pix(ox+2,oy-1,'#2e313c')}}
      else if(r<.09){const cx_=bx+8,cy_=by+9,rc=pick(NEONC);for(let py=-2;py<=2;py++)for(let px=-5;px<=5;px++)if(px*px/25+py*py/5<=1)pix(cx_+px,cy_+py,'#141a26');pix(cx_-2,cy_-1,rc);pix(cx_-1,cy_-1,rc);pix(cx_+2,cy_,mix(rc,'#141a26',.5))}
      else if(r<.11&&!M.room[ty*W+tx]){const cx_=bx+7.5,cy_=by+7.5;for(let py=2;py<14;py++)for(let px=2;px<14;px++){const dd=Math.hypot(px-7.5,py-7.5);if(dd<5.5)pix(bx+px,by+py,dd>4.6?'#1a1b20':((px+py)%3===0?'#3a3b44':'#2c2d34'))}}
      else if(r<.16){pix(bx+R.int(2,13),by+R.int(3,13),'#c8c4b8');pix(bx+R.int(2,13),by+R.int(3,13),pick(['#c43a3a','#3a8ac4','#c4b03a']))}
      else if(r<.21){let px=bx+R.int(2,12),py=by+R.int(2,12);for(let k=0;k<R.int(4,8);k++){pix(px,py,'#18191e');px+=R.int(-1,1);py+=R.int(0,1);px=Math.max(bx,Math.min(bx+14,px));py=Math.min(by+14,py)}}
    } else if(biome==='sewer'){
      if(r<.04){const ox=bx+R.int(3,9),oy=by+R.int(5,11);for(let i=0;i<5;i++)pix(ox+i,oy,'#cdc4ab');pix(ox,oy-1,'#e6dfcb');pix(ox,oy+1,'#e6dfcb');pix(ox+4,oy-1,'#e6dfcb');pix(ox+4,oy+1,'#e6dfcb')}
      else if(r<.09){const cx_=bx+8,cy_=by+9;for(let py=-2;py<=2;py++)for(let px=-5;px<=5;px++)if(px*px/25+py*py/5<=1)pix(cx_+px,cy_+py,'#22331d');pix(cx_-2,cy_-1,'#4f7a3a')}
      else if(r<.12){for(let py=4;py<=11;py++)for(let px=4;px<=11;px++)pix(bx+px,by+py,(px%2===0||py===4||py===11)?'#4a4a3a':'#0c0d08')}
      else if(r<.16){for(let k=0;k<3;k++){const gx=bx+R.int(2,12),gy=by+R.int(4,13);pix(gx,gy,'#6a5a3a');pix(gx+1,gy,'#4a3e28')}}
    } else {
      if(r<.12){const vert=R.chance(.5),o=R.int(3,12),col=pick(['#2f6fd6','#d6b02f','#c43a3a','#3ac46a','#8a4dff']);
        for(let k=0;k<16;k++){if(vert){pix(bx+o,by+k,col);pix(bx+o+1,by+k,'#14171d')}else{pix(bx+k,by+o,col);pix(bx+k,by+o+1,'#14171d')}}}
      else if(r<.15){for(let py=5;py<=11;py++)for(let px=3;px<=12;px++)pix(bx+px,by+py,(px===3||px===12||py===5||py===11)?'#1a1d24':((px*py)%7===0?'#3a5a7a':'#203040'));pix(bx+7,by+12,'#1a1d24');pix(bx+6,by+12,'#1a1d24')}
      else if(r<.18){for(let py=4;py<=11;py++)for(let px=4;px<=11;px++)pix(bx+px,by+py,'#07080a');pix(bx+6,by+8,'#c43a3a');pix(bx+7,by+9,'#d6b02f');pix(bx+9,by+7,'#2f6fd6')}
      else if(r<.22){pix(bx+R.int(2,13),by+R.int(3,13),'#c8c4b8');pix(bx+R.int(2,13),by+R.int(3,13),'#d6d0c0')}
    }
  }
  // exits
  {const bx=M.exit.x*TS,by=M.exit.y*TS;
    if(biome==='base'){for(let py=0;py<16;py++)for(let px=1;px<15;px++)pix(bx+px,by+py,(px===1||px===14||py===0)?'#3a3f4e':(px===7||px===8)?'#1a1e26':(py%5===2?'#4a5060':'#5a6070'));pix(bx+3,by+3,'#3aff6a');pix(bx+12,by+3,'#3aff6a')}
    else if(biome==='alley'||biome==='streets'){for(let py=1;py<15;py++)for(let px=1;px<15;px++)pix(bx+px,by+py,'#08090c');const sc=['#2a2e3a','#3a3f4e','#4b5162'];for(let s=0;s<3;s++){const y0=by+3+s*4;for(let px=4-s;px<=11+s;px++){pix(bx+px,y0,sc[s]);pix(bx+px,y0+1,sc[s]);pix(bx+px,y0+2,'#050608')}}}
    else if(biome==='sewer'){for(let py=1;py<15;py++)for(let px=1;px<15;px++){const dd=Math.hypot(px-7.5,py-7.5);if(dd<6.5)pix(bx+px,by+py,dd>5.5?'#6a6a5a':'#0a0b07')}for(let py=3;py<=12;py+=3)for(let px=5;px<=10;px++)pix(bx+px,by+py,'#9a8a5a');for(let py=3;py<=12;py++){pix(bx+5,by+py,'#7a6a4a');pix(bx+10,by+py,'#7a6a4a')}}
    else{for(let py=1;py<15;py++)for(let px=1;px<15;px++)pix(bx+px,by+py,px===7||px===8?'#1a1e26':(px===1||px===14||py===1||py===14)?'#3a4150':'#5a6070');pix(bx+3,by+3,'#ff2fa8');pix(bx+12,by+3,'#ff2fa8')}
    lights.push({x:M.exit.x+.5,y:M.exit.y+.5,c:biome==='base'?[80,255,120]:[255,60,200],rad:3.5,int:.7,kind:'exit'});}
  if(M.evac){const bx=M.evac.x*TS,by=M.evac.y*TS;
    for(let py=1;py<15;py++)for(let px=1;px<15;px++){const dd=Math.hypot(px-7.5,py-7.5);if(dd<6.6)pix(bx+px,by+py,dd>5.6?'#3aff6a':dd>4.6?'#14301c':'#1c2a20')}
    for(let py=4;py<=11;py++){pix(bx+7,by+py,'#7dff4f');pix(bx+8,by+py,'#7dff4f')}for(let k=0;k<3;k++){pix(bx+7-k,by+4+k,'#7dff4f');pix(bx+8+k,by+4+k,'#7dff4f')}
    lights.push({x:M.evac.x+.5,y:M.evac.y+.5,c:[80,255,120],rad:3.5,int:.7,kind:'exit'});}
  cx.putImageData(id,0,0);
  return{c,lights,neons,leds,lamps,waters};
}
