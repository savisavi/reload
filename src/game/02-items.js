// ================= ITEM GENERATOR =================
let uid=1;
const capF=s=>s[0].toUpperCase()+s.slice(1);
const RAR=[{n:'обычный',c:'#b3b1c2'},{n:'необычный',c:'#5fd35f'},{n:'редкий',c:'#3fa0ff'},{n:'эпический',c:'#c06bff'},{n:'легендарный',c:'#ff9a1f'}];
const BRANDS=['Кобра-Тех','Нейрон','Север-Сталь','Хироки','ВольтМаш','Шэнь-Ли','Оникс','Кайдзю','Рёкан','Мегастрой','Тесла-Дин','Гефест'];
const NICKS=['Гадюка','Шершень','Бритва','Молот','Ворон','Призрак','Скорпион','Клык','Шторм','Импульс','Жнец','Кобальт','Неон','Сирена','Дракон','Тень','Квант','Вихрь','Аспид','Мангуст','Оса','Ласка','Гром','Хром','Сапсан','Барракуда'];
const GRIPS=['#1b1622','#2a2433','#6a4426','#3a2a1e','#22303a','#3a1f2a'];
const MIL=['#3a4a32','#2a2d38','#4a4a58','#5a4a32','#1e2a3a','#3a2230','#2f3a3a'];
const CAT_N={melee:'Ближний бой',ranged:'Дальний бой',armor:'Броня',clothes:'Одежда',implant:'Импланты',med:'Аптечки',battery:'Батареи',ammo:'Патроны'};
const mul=it=>(1+.14*(it.lvl-1))*(1+.22*it.rar);
const sc=(v,it)=>Math.max(1,Math.round(v*mul(it)));

// Item icons are drawn natively on a 32×32 grid. P(x,y,c) puts one pixel; helpers:
//  P.r(x,y,w,h,c) rect · P.l(x0,y0,x1,y1,c) line · P.box(x,y,w,h,R) shaded block (light top/left, shade right/bottom)
//  P.ball(cx,cy,rx,ry,R) shaded ellipse lit from the upper left · P.get(x,y) · P.del(x,y)
// R is a ramp {l,b,m,d}; a highlight R.h is derived automatically. The icon gets a 1-px outline.
const ICN=32;
function rampH(R){return R.h||(R.h=mix(R.b,'#ffffff',.6))}
function pixIcon(draw){
  const N=ICN,px=new Array(N*N).fill(null);
  const P=(x,y,c)=>{x=Math.round(x);y=Math.round(y);if(x<0||y<0||x>=N||y>=N||!c)return;px[y*N+x]=c};
  P.get=(x,y)=>x<0||y<0||x>=N||y>=N?null:px[y*N+x];
  P.del=(x,y)=>{if(x>=0&&y>=0&&x<N&&y<N)px[y*N+x]=null};
  P.r=(x,y,w,h,c)=>{for(let j=0;j<h;j++)for(let i=0;i<w;i++)P(x+i,y+j,c)};
  P.l=(x0,y0,x1,y1,c)=>{const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0),1);for(let s=0;s<=n;s++)P(x0+(x1-x0)*s/n,y0+(y1-y0)*s/n,c)};
  P.box=(x,y,w,h,R)=>{for(let j=0;j<h;j++)for(let i=0;i<w;i++)P(x+i,y+j,j===0?R.l:j===h-1?R.d:i===0?R.l:i===w-1?R.m:R.b);if(w>2&&h>2)P(x,y,rampH(R))};
  P.ball=(cx,cy,rx,ry,R)=>{const H=rampH(R);for(let y=Math.floor(cy-ry);y<=Math.ceil(cy+ry);y++)for(let x=Math.floor(cx-rx);x<=Math.ceil(cx+rx);x++){
    const nx=(x-cx)/rx,ny=(y-cy)/ry,d=nx*nx+ny*ny;if(d>1)continue;const v=(-nx*.55-ny*.8)*(.6+.4*Math.sqrt(1-d))-(d>.75?.22:0);
    P(x,y,v>.6?H:v>.25?R.l:v>-.2?R.b:v>-.5?R.m:R.d)}};
  draw(P);
  return gridCanvas(outline1(px,N,N,OUT),N,N);
}
const iconURL=it=>it.url||(it.url=it.icon.toDataURL());

// ---------- ranged ----------
const RANGED={
  'пистолет':{dmg:[3,6],range:6,acc:.85,ammo:'пули',L:8,held:3},
  'револьвер':{dmg:[5,9],range:6,acc:.8,ammo:'пули',L:10,held:4},
  'ПП':{dmg:[3,5],range:5,acc:.78,ammo:'пули',L:11,held:4,burst:2},
  'дробовик':{dmg:[6,11],range:4,acc:.9,ammo:'дробь',L:14,held:6},
  'винтовка':{dmg:[5,9],range:8,acc:.9,ammo:'пули',L:14,held:6},
  'лазер':{dmg:[4,8],range:7,acc:.95,ammo:'энергия',L:12,held:5}};
function drawRangedIcon(P,k,L,M,A,G,o){
  // L is the gun length in tile-sixteenths; the 32-px icon uses 2 px per unit, muzzle to the right
  const len=L*2,sx=Math.floor((32-len-(o.sil?6:0))/2),ex=sx+len-1;
  const acc=o.glow?A.l:A.b,GD=mix(G,'#000000',.35),GL=mix(G,'#ffffff',.18),DK='#16141c';
  const grip=(x0,y0,y1,w=5)=>{for(let y=y0;y<=y1;y++){const s=-Math.floor((y-y0)/3);for(let i=0;i<w;i++)P(x0+s+i,y,i===0?GL:i===w-1?GD:((y+i)%3===0?GD:G))}
    P.r(x0-Math.floor((y1-y0)/3),y1,w,1,GD)};
  const guard=(x,y)=>{P.l(x,y,x,y+3,M.d);P.l(x,y+3,x+5,y+3,M.d);P(x+2,y+1,M.d);P(x+2,y+2,M.m)};
  switch(k){
    case 'пистолет':{
      P.box(sx+2,10,len-2,5,M);for(let x=sx+3;x<=sx+7;x+=2){P(x,11,M.d);P(x,12,M.d)}P.r(ex-7,11,4,1,DK);P(ex-1,9,M.d);P(sx+3,9,M.d);
      P.r(sx+5,15,len-7,2,M.m);P.r(sx+5,16,len-7,1,M.d);P.r(ex,11,1,2,DK);
      guard(sx+9,16);grip(sx+3,15,25);P.r(sx+1,25,5,1,M.d);P.l(sx+8,12,sx+12,12,acc);break}
    case 'револьвер':{
      P.box(sx+10,10,len-10,4,M);P.r(sx+10,10,len-10,1,rampH(M));P(ex-1,9,M.d);P(ex,11,DK);P.r(sx+10,14,len-12,1,M.d);
      P.box(sx+4,9,7,9,{l:M.l,b:M.m,m:M.d,d:M.d});for(const x of[sx+5,sx+7,sx+9])P.l(x,10,x,16,M.d);P(sx+6,11,DK);P(sx+8,15,DK);
      P.r(sx+1,7,3,2,M.d);P.r(sx+2,9,2,3,M.b);guard(sx+8,17);grip(sx+2,17,26);P.l(sx+12,12,sx+15,12,acc);break}
    case 'ПП':{
      P.box(sx+3,9,len-10,8,M);for(let x=sx+5;x<ex-8;x+=3)P.r(x,11,2,2,DK);P.r(ex-7,11,7,3,M.d);P.r(ex-7,11,7,1,M.m);P(ex,12,DK);
      P.r(sx,10,3,6,M.d);P.r(sx,10,3,1,M.m);P(ex-9,8,M.d);P(sx+5,8,M.d);
      grip(sx+6,17,23,4);P.box(sx+13,17,4,10,{l:M.m,b:M.d,m:M.d,d:'#14121a'});P.r(sx+13,26,4,1,M.m);
      P.l(sx+5,15,sx+12,15,acc);P(sx+12,15,mix(acc,'#ffffff',.5));break}
    case 'дробовик':{
      P.r(sx+12,10,len-12,2,M.l);P.r(sx+12,12,len-12,1,M.m);P(ex,11,DK);P(ex-1,9,M.d);
      P.r(sx+12,13,len-13,2,M.d);P.r(sx+12,13,len-13,1,M.m);
      for(let x=ex-10;x<=ex-4;x++){P.r(x,13,1,3,x%2?G:GL)}P.r(ex-10,16,7,1,GD);
      P.box(sx+6,9,7,8,M);P.r(sx+8,11,3,2,DK);
      for(let x=sx;x<=sx+6;x++){const t=x-sx;P.r(x,11+Math.floor((6-t)/3),1,6+Math.floor((6-t)/2),t===0?GD:(x%2?G:GL))}
      guard(sx+8,16);grip(sx+6,17,22,3);P.l(sx+7,14,sx+11,14,acc);break}
    case 'винтовка':{
      P.box(sx+6,10,16,6,M);P.r(sx+22,12,len-22,2,M.d);P.r(sx+22,12,len-22,1,M.m);P(ex,12,DK);P(ex-2,10,M.d);P(ex-2,11,M.d);
      for(let x=sx;x<=sx+6;x++){const t=x-sx;P.r(x,11,1,6+Math.floor(t/3),t===0?'#14121a':x%2?M.d:M.m)}P.r(sx,11,7,1,M.m);
      P.r(sx+8,12,4,1,DK);grip(sx+9,16,22,4);
      for(let y=16;y<=24;y++){const s=Math.floor((y-16)/3);P.r(sx+15+s,y,4,1,y===24?'#14121a':y%2?M.d:M.m)}
      guard(sx+11,16);
      if(o.scope){P.r(sx+9,6,11,3,DK);P.r(sx+9,6,11,1,'#2e2a3c');P.r(sx+10,9,2,1,M.d);P.r(sx+17,9,2,1,M.d);P.r(sx+20,6,1,3,A.l);P(sx+20,6,'#ffffff');P.r(sx+8,7,1,2,M.d)}
      P.l(sx+7,14,sx+13,14,acc);break}
    case 'лазер':{
      P.box(sx+2,9,15,9,M);P.r(sx+4,8,10,1,M.l);P.r(sx+3,18,12,1,M.d);
      P.r(sx+6,12,7,3,DK);P.r(sx+7,13,5,1,A.l);P(sx+7,12,A.b);P(sx+11,14,A.b);
      for(let x=sx+17;x<=ex;x++){const on=(x-sx)%2===0;P.r(x,11,1,5,on?A.b:M.d);if(on){P(x,11,A.l);P(x,15,A.d)}}
      P.r(ex,12,1,3,'#ffffff');P(ex-1,13,A.l);grip(sx+5,18,25,4);P.r(sx+1,11,2,4,M.d);break}
  }
  if(o.sil&&k!=='лазер'){const y=k==='пистолет'?11:k==='ПП'?11:11;P.box(ex+1,y-1,6,4,{l:'#3a3d48',b:'#2a2d36',m:'#1b1d24',d:'#121318'});P.l(ex+3,y-1,ex+3,y+2,'#14151a');P(ex+6,y,'#0a0a0e')}
  if(o.ls){const x=sx+Math.floor(len/2)-2;P.r(x,17,4,2,'#2a2d36');P(x+3,17,'#ff3355');P(x+3,18,'#a01a30')}
}

// ---------- melee ----------
const MELEE={
  'нож':{dmg:[2,5],crit:.18,h:3,B:5,wide:1,held:3},
  'мачете':{dmg:[3,7],crit:.1,h:3,B:8,wide:2,held:5},
  'катана':{dmg:[4,8],crit:.14,h:4,B:8,wide:0,guard:1,held:7},
  'топор':{dmg:[5,9],crit:.06,h:9,B:0,axe:1,held:6},
  'бита':{dmg:[3,7],crit:.06,h:4,B:7,thick:1,held:6},
  'электродубинка':{dmg:[3,6],crit:.08,h:4,B:6,baton:1,stun:.25,held:5},
  'энергоклинок':{dmg:[5,9],crit:.12,h:4,B:8,energy:1,guard:1,held:6}};
function drawMeleeIcon(P,D,M,A,G,o){
  // diagonal weapon: pommel at the lower left, tip at the upper right; t walks along the blade, 1 px per step
  const at=t=>[4+t,27-t],GD=mix(G,'#000000',.35),GL=mix(G,'#ffffff',.2),H=rampH(M);
  const hL=D.h*2,bL=D.B*2;
  // handle (3 px wide), wrapped every 3 px, pommel cap
  for(let t=0;t<hL;t++){const[x,y]=at(t),band=(t%3===0);P(x,y,band?GD:G);P(x+1,y,band?G:GL);P(x,y-1,band?GD:GL)}
  {const[x,y]=at(0);P(x-1,y+1,M.d);P(x,y+1,M.d);P(x-1,y,M.m);P(x,y,M.m)}
  if(D.axe){const[x,y]=at(hL-1);
    // head: crescent blade on the far side of the haft
    for(let j=-5;j<=5;j++){const w=Math.round(5-Math.abs(j)*.55);for(let i=0;i<w;i++){const px=x+2+i+Math.floor(j/2),py=y+j+i;P(px,py,i===w-1?(Math.abs(j)<4?'#ffffff':H):i===w-2?M.l:i===0?M.d:M.b)}}
    P(x-2,y-1,M.d);P(x-1,y-2,M.d);P(x,y-1,M.m);P(x+1,y,M.d);if(o.glow){P(x+4,y+1,A.l);P(x+5,y+2,A.b)}return}
  const[gx,gy]=at(hL);
  if(D.guard){for(let s=-4;s<=4;s++)P(gx+s,gy+s,Math.abs(s)>=3?M.d:(o.glow?A.b:M.m));P(gx-4,gy-4,M.l);P(gx+4,gy+4,M.d);P(gx,gy,o.glow?A.l:M.l)}
  else{P(gx,gy,M.d);P(gx+1,gy+1,M.d);P(gx-1,gy-1,M.d)}
  for(let t=hL+1;t<=hL+bL;t++){const[x,y]=at(t),tip=t>=hL+bL-1,k=(t-hL)/bL;
    if(D.energy){P(x,y,'#ffffff');P(x+1,y,A.l);P(x,y+1,A.l);P(x+1,y+1,A.b);P(x-1,y,A.d);P(x,y-1,A.b);if(tip){P(x+1,y-1,A.l)}}
    else if(D.baton){const ring=(t-hL)%5===2;P(x,y,tip?A.l:ring?A.b:M.d);P(x+1,y,tip?A.b:ring?A.d:M.m);P(x,y-1,tip?'#ffffff':ring?A.l:M.b)}
    else if(D.thick){const w=1+Math.round(k*2.2);P(x,y-1,M.l);for(let i=0;i<w;i++)P(x+i,y+i,i===w-1?M.m:M.b);if(o.nails&&(t-hL)%4===1){P(x+w+1,y-1+w,'#c8c8d0');P(x+w+2,y-2+w,'#ffffff')}}
    else{ // blades: edge light on the upper side, spine darker
      P(x,y-1,tip?'#ffffff':H);P(x,y,tip?'#ffffff':M.l);
      if(!tip){P(x+1,y,M.b);P(x+1,y+1,M.m);if(D.wide>=1&&k<.9){P(x+2,y+1,M.b);P(x+2,y+2,M.d)}if(D.wide>=2&&k<.8){P(x+3,y+2,M.m);P(x+3,y+3,M.d)}if(D.wide===0)P(x+2,y+2,M.d)}
      if(D.guard&&!tip&&(t-hL)%4===0)P(x+1,y,M.b)}
  }
  if(o.glow&&!D.energy&&!D.baton){for(let t=hL+3;t<hL+bL-3;t+=2){const[x,y]=at(t);P(x+1,y,A.b)}}
}

// ---------- armor / clothes ----------
const ARMORS={'кевларовый жилет':{def:1,hp:0},'бронежилет':{def:2,hp:0},'тяжёлая броня':{def:3,hp:4},'экзоброня':{def:4,hp:10}};
function drawArmorIcon(P,k,M,A,glow){
  const H=rampH(M),heavy=k==='тяжёлая броня'||k==='экзоброня';
  // straps + body silhouette (neck scoop, armholes)
  P.box(7,6,6,6,M);P.box(19,6,6,6,M);P.r(8,6,4,1,rampH(M));
  for(let y=10;y<=27;y++){const a=y<14?7:8,b=y<14?24:23;for(let x=a;x<=b;x++)P(x,y,x===a?M.l:x===b?M.m:M.b)}
  for(let x=12;x<=19;x++)for(let y=10;y<=10+Math.round(3-Math.abs(x-15.5)*.4);y++)P.del(x,y);
  P.r(8,27,16,1,M.d);P.r(8,10,4,1,H);P.r(20,10,4,1,M.l);
  // chest plates with bevel
  for(const x0 of[9,17]){P.box(x0,13,6,6,{l:H,b:M.l,m:M.b,d:M.m})}
  // MOLLE webbing
  for(const y of[21,24])for(let x=9;x<=22;x++)P(x,y,x%3===0?M.d:M.m);
  P.r(9,19,14,1,M.d);
  if(k==='бронежилет'||heavy){for(const x0 of[9,18]){P.box(x0,22,5,4,{l:M.b,b:M.m,m:M.d,d:M.d});P.r(x0+1,22,3,1,M.l);P(x0+2,23,'#c0c7d4')}}
  if(heavy){P.box(3,5,5,9,M);P.box(24,5,5,9,M);P.r(3,8,5,1,M.d);P.r(24,8,5,1,M.d);P.r(4,14,3,1,M.d);P.r(25,14,3,1,M.d)}
  if(k==='экзоброня'){P.r(15,11,2,16,M.d);P.ball(15.5,15.5,2.4,2.4,{l:A.l,b:A.b,m:A.d,d:A.d,h:'#ffffff'});for(let y=20;y<=26;y+=2){P(15,y,A.b);P(16,y,A.d)}}
  if(glow){P(8,12,A.l);P(23,12,A.l);P.r(10,20,12,1,A.b)}
}
const CLOTHES={'куртка':{dodge:.04,def:0},'худи':{dodge:.06,def:0},'плащ':{dodge:.03,def:1},'бомбер':{dodge:.05,def:0}};
function drawClothesIcon(P,k,C1,C2,A){
  const H=rampH(C1),coat=k==='плащ',bottom=coat?29:25;
  // sleeves
  for(let y=7;y<=21;y++){const s=Math.floor((y-7)/5);P.r(3-s,y,5,1,C1.b);P(3-s,y,C1.l);P(7-s,y,C1.m);P.r(24+s,y,5,1,C1.b);P(24+s,y,C1.l);P(28+s,y,C1.m)}
  P.r(1,21,5,2,C1.d);P.r(26,21,5,2,C1.d);
  // body
  for(let y=5;y<=bottom;y++){const a=coat&&y>20?6:7,b=coat&&y>20?25:24;for(let x=a;x<=b;x++)P(x,y,x===a?C1.l:x===b?C1.m:C1.b)}
  P.r(7,5,18,1,H);P.r(7,bottom,coat?20:18,1,C1.d);
  // collar
  P.r(12,4,8,2,C2.d);P(11,5,C1.l);P(20,5,C1.l);P.l(12,6,15,10,C1.l);P.l(19,6,16,10,C1.m);
  if(k==='худи'){for(let x=10;x<=21;x++)P(x,3,C1.m);P.r(11,1,10,2,C1.m);P.r(12,1,8,1,C1.l);P.r(13,3,6,2,'#14101c');
    P.l(14,6,14,11,'#e8e4f4');P.l(17,6,17,10,'#e8e4f4');P(14,12,A.b);P(17,11,A.b);
    P.r(10,17,12,1,C1.d);P.r(10,18,1,5,C1.d);P.r(21,18,1,5,C1.d);P.r(11,23,10,1,C1.d)}
  else{for(let y=6;y<=bottom;y++){P(15,y,C2.b);P(16,y,y%2?'#c0c7d4':C2.m)}}
  if(k==='бомбер'){for(let x=1;x<=30;x++)if(x<7||x>24){P(x,11,A.b);P(x,12,A.d)}for(let x=7;x<=24;x++)P(x,bottom-1,x%2?C1.d:C1.m);for(let x=1;x<=5;x++)P(x,22,C1.d)}
  if(coat){P.r(7,18,18,1,C1.d);P.r(14,17,4,3,'#c9a35a');P(15,18,'#14101c');P.r(7,4,3,2,C1.l);P.r(22,4,3,2,C1.l);P.l(15,20,13,29,C1.d)}
  if(k==='куртка'){P.r(9,9,4,1,C1.l);P.r(19,9,4,1,C1.l);P.box(9,16,4,4,{l:C1.b,b:C1.m,m:C1.d,d:C1.d});P.box(19,16,4,4,{l:C1.b,b:C1.m,m:C1.d,d:C1.d});P(10,17,A.b);P(21,17,A.b)}
}

// ---------- implants ----------
const IMPL={
  'Подкожная броня':{t:'pas',shape:'arm',def:1},
  'Кардио-модуль':{t:'pas',shape:'heart',hp:8},
  'Нейро-прицел':{t:'pas',shape:'eye',acc:.06},
  'Боевой процессор':{t:'pas',shape:'chip',crit:.06},
  'Регенератор':{t:'pas',shape:'spine',regen:1},
  'Энерго-ядро':{t:'pas',shape:'chip',mp:10},
  'Электро-разряд':{t:'act',shape:'arm',cost:12,cd:6,pow:7},
  'Ракетный модуль':{t:'act',shape:'arm',cost:15,cd:8,pow:14},
  'Нано-ремонт':{t:'act',shape:'heart',cost:14,cd:10,pow:.3},
  'Оптический камуфляж':{t:'act',shape:'eye',cost:12,cd:14,pow:5},
  'Щит-проектор':{t:'act',shape:'shield',cost:10,cd:12,pow:14},
  'Рефлекс-ускоритель':{t:'act',shape:'spine',cost:16,cd:14,pow:4}};
function drawImplantIcon(P,s,M,A){
  const H=rampH(M),AL=A.l,AB=A.b,DK='#0a0a12';
  if(s==='chip'){
    for(const i of[10,13,16,19,22]){P.r(i,4,1,4,M.l);P.r(i,24,1,4,M.d);P.r(4,i,4,1,M.l);P.r(24,i,4,1,M.d)}
    P.box(8,8,16,16,{l:H,b:'#1c2a24',m:M.m,d:M.d});P.r(9,9,14,14,'#1c2a24');
    P.r(12,12,8,8,'#0e1612');P.box(13,13,6,6,{l:AL,b:AB,m:A.d,d:A.d});P(14,14,'#ffffff');
    P.l(10,10,12,12,A.d);P.l(22,10,19,13,A.d);P.l(10,21,13,18,A.d);P.l(21,21,19,19,A.d);P(10,10,AB);P(22,10,AB)}
  else if(s==='eye'){
    P.ball(15.5,15.5,12,12,M);
    for(let y=0;y<32;y++)for(let x=0;x<32;x++){const d=Math.hypot(x-15.5,y-15.5);
      if(d<=9){P(x,y,d>8?M.d:d>6.5?A.d:d>4?((Math.atan2(y-15.5,x-15.5)*6|0)%2?AB:A.d):d>2.6?AB:DK)}}
    P.r(12,11,3,2,'#ffffff');P(13,10,'#ffffff');P(19,19,AL);P(20,18,AL)}
  else if(s==='arm'){
    for(let y=3;y<=27;y++){const w=y<8?8:10,x0=y<8?12:11;for(let x=x0;x<x0+w;x++)P(x,y,x===x0?M.l:x===x0+w-1?M.m:((y-3)%5===4?M.d:M.b))}
    for(let y=6;y<=24;y+=4){P(15,y,AB);P(16,y,AL);P(16,y+1,AB)}
    P.box(7,12,4,8,M);P.box(21,12,4,8,M);P.l(9,13,9,18,M.d);P.l(23,13,23,18,M.d);
    for(const x of[12,15,18])P.r(x,28,2,3,M.d);P.r(12,3,8,1,H)}
  else if(s==='heart'){
    P.ball(11,12,6,6,M);P.ball(20,12,6,6,M);for(let y=13;y<=26;y++){const w=Math.round((26-y)*1.05);for(let x=15.5-w;x<=15.5+w;x++)P(x,y,x<12?M.l:x>19?M.m:M.b)}
    P.r(12,3,3,5,M.d);P.r(18,2,3,6,M.d);P.r(12,3,3,1,M.l);P.r(18,2,3,1,M.l);
    const pulse=[[5,15],[8,15],[10,12],[12,19],[14,9],[16,17],[18,15],[22,15],[26,15]];for(let i=0;i<pulse.length-1;i++)P.l(...pulse[i],...pulse[i+1],AL);
    P(14,9,'#ffffff')}
  else if(s==='spine'){
    for(let k=0;k<5;k++){const y=2+k*6;P.box(10,y,12,4,M);P.r(7,y+1,3,2,M.d);P.r(22,y+1,3,2,M.d);P(11,y,H);if(k<4){P.r(14,y+4,4,2,'#1c1a24');P(15,y+4,AB);P(16,y+5,AL)}}}
  else if(s==='shield'){
    for(let y=4;y<=28;y++){const w=y<8?6+(y-4)*2.2:y<18?14:Math.max(1,14-(y-18)*1.35);for(let x=Math.round(15.5-w);x<=Math.round(15.5+w);x++){const e=x<=Math.round(15.5-w)+1||x>=Math.round(15.5+w)-1||y===4;P(x,y,e?(x<16?M.l:M.m):(x<16?M.b:M.m))}}
    for(let y=8;y<=22;y++)for(let x=8;x<=23;x++){const d=Math.hypot(x-15.5,y-14.5);if(d<6&&d>4)P(x,y,AB);if(d<=2.6)P(x,y,AL)}P(14,13,'#ffffff')}
}
function implLines(it){
  if(it.t==='pas'){const a=[];
    if(it.def)a.push(`Защита +${it.def}`);if(it.hp)a.push(`HP +${it.hp}`);if(it.acc)a.push(`Точность +${Math.round(it.acc*100)}%`);
    if(it.crit)a.push(`Крит +${Math.round(it.crit*100)}%`);if(it.regen)a.push(`Реген +${it.regen} HP / 4 хода`);if(it.mp)a.push(`Энергия +${it.mp}`);
    return['Пассивный',...a];}
  const d={'Электро-разряд':`Урон ${it.pow}–${Math.round(it.pow*1.6)} всем в радиусе 2`,
    'Ракетный модуль':`Ракета: ${it.pow}–${Math.round(it.pow*1.5)} по цели + взрыв`,
    'Нано-ремонт':`Лечит ${Math.round(it.pow*100)}% HP`,
    'Оптический камуфляж':`Невидимость ${it.pow} ход.`,
    'Щит-проектор':`Щит на ${it.pow} урона, 6 ход.`,
    'Рефлекс-ускоритель':`Двойная скорость ${it.pow} ход.`}[it.eff];
  return['Боевой',d,`Энергия ${it.cost} · откат ${tsec(it.cd)}`];
}

// ---------- consumables ----------
function drawMedIcon(P,k,M,A){
  if(k==='стим-шприц'){
    const at=t=>[5+t,26-t];
    for(let t=0;t<4;t++){const[x,y]=at(t);P(x,y,M.d);P(x+1,y,M.m);P(x,y-1,M.l)}
    {const[x,y]=at(4);P.l(x-3,y-3,x+3,y+3,M.l);P.l(x-3,y-2,x+2,y+3,M.m)}
    for(let t=5;t<16;t++){const[x,y]=at(t);P(x,y,'#cfe8ff');P(x+1,y,t<13?A.b:'#a8c8e8');P(x,y+1,t<13?A.l:'#cfe8ff');P(x+1,y+1,t<13?A.d:'#8aa8c8');P(x-1,y,'#ffffff')}
    for(let t=7;t<13;t+=2){const[x,y]=at(t);P(x+2,y+2,'#e8f4ff')}
    for(let t=16;t<22;t++){const[x,y]=at(t);P(x,y,t>19?'#ffffff':'#d0d0d8')}return}
  const metal=k==='нано-аптечка',cs=metal?M:{l:'#ffffff',b:'#e6e2ea',m:'#b8b4c4',d:'#8a8698',h:'#ffffff'};
  P.r(11,5,10,2,'#3a3a46');P.r(11,7,2,3,'#3a3a46');P.r(19,7,2,3,'#3a3a46');P.r(12,5,8,1,'#5a5a6a');
  P.box(3,9,26,18,cs);P.r(4,10,24,1,rampH(cs));P.r(3,17,26,1,cs.m);
  const cc=metal?A.l:'#d8303f',cd=metal?A.b:'#a01a2a';
  P.r(13,11,6,14,cc);P.r(9,15,14,6,cc);P.r(18,11,1,14,cd);P.r(9,20,14,1,cd);P.r(13,11,6,1,mix(cc,'#ffffff',.4));
  P.r(4,12,2,3,'#c0c7d4');P.r(26,12,2,3,'#9aa3b5');if(metal){P(4,22,A.b);P(27,22,A.b)}
}
function drawBatteryIcon(P,M,A,n){
  P.r(13,3,6,3,M.l);P.r(13,3,6,1,rampH(M));P.r(17,3,2,3,M.m);
  P.box(9,6,14,23,M);P.r(11,8,10,19,'#14161c');
  for(let k=0;k<5;k++){const y=23-k*4;const on=k<n;P.r(12,y,8,3,on?(k===n-1?A.l:A.b):'#1e2028');if(on){P.r(12,y,8,1,mix(A.l,'#ffffff',.4));P.r(19,y,1,3,A.d)}}
  P.r(10,7,1,20,M.l);
}
function drawAmmoIcon(P,k,A){
  if(k==='пули'){
    for(const x of[8,12,16,20]){P.r(x,7,3,2,'#d07a4a');P(x,7,'#f0a070');P(x+1,6,'#d07a4a');P.r(x,9,3,8,'#e0c070');P(x,9,'#fff0b0');P.r(x+2,9,1,8,'#b08a40')}
    P.box(5,16,22,11,{l:'#7a8a50',b:'#5e7040',m:'#4a5a32',d:'#2e3a1e'});P.r(6,20,20,1,'#2a331c');P.r(12,22,8,3,'#e0c070');P.r(13,23,6,1,'#2a331c')}
  else if(k==='дробь'){
    for(const x of[6,13,20]){P.r(x,6,5,15,'#e85a5a');P.r(x,6,1,15,'#ff9a9a');P.r(x+4,6,1,15,'#a02828');P.r(x,6,5,1,'#ff8a8a');for(let y=9;y<20;y+=3)P.r(x+1,y,3,1,'#c83a3a');
      P.r(x,21,5,5,'#f0d080');P.r(x,21,1,5,'#fff0b0');P.r(x+4,21,1,5,'#b08a40');P.r(x,25,5,1,'#8a6a30');P(x+2,23,'#b08a40')}}
  else{
    for(const x of[7,14,21]){P.r(x,4,5,2,'#8f9bb0');P(x,4,'#c0c7d4');P.r(x,6,5,18,A.d);for(let y=7;y<23;y++){P(x+1,y,y%2?A.l:A.b);P(x+2,y,A.b);P(x+3,y,A.d)}P(x+1,7,'#ffffff');P.r(x,24,5,3,'#6c7385');P.r(x,26,5,1,'#4a4f5c')}}
}

// ---------- factory ----------
const ITEMGEN={
  melee(it,r,f){const kind=f.kind||r.pick(Object.keys(MELEE)),D=MELEE[kind];
    const M=ramp(r.pick(METALS).c),A=ramp(r.pick(NEON).c),G=r.pick(GRIPS),nails=kind==='бита'&&r.chance(.5);
    it.kind=kind;it.name=`${capF(kind)} «${r.pick(NICKS)}»`+(it.rar>=2?` Mk${r.int(2,9)}`:'');it.brand=r.pick(BRANDS);
    it.dmg=[sc(D.dmg[0],it),sc(D.dmg[1],it)];it.crit=Math.min(.5,D.crit+.02*it.rar);it.stun=D.stun||0;
    it.lines=[`Урон ${it.dmg[0]}–${it.dmg[1]}`,`Крит ${Math.round(it.crit*100)}%`+(it.stun?` · оглушение ${Math.round(it.stun*100)}%`:'')];
    it.icon=pixIcon(P=>drawMeleeIcon(P,D,M,A,G,{glow:it.rar>=2,nails}));
    it.fx=A.l;},
  ranged(it,r,f){const kind=f.kind||r.w([['пистолет',6],['револьвер',3.5],['ПП',1.2],['дробовик',1],['винтовка',.5],['лазер',.25]]),D=RANGED[kind];
    const M=ramp(r.pick(METALS).c),A=ramp(r.pick(NEON).c),G=r.pick(GRIPS);
    const scope=kind==='винтовка'&&r.chance(.6),sil=['пистолет','ПП'].includes(kind)&&r.chance(.3),ls=r.chance(.25+.1*it.rar);
    it.kind=kind;it.name=`${capF(kind)} «${r.pick(NICKS)}»`+(it.rar>=2?` Mk${r.int(2,9)}`:'');it.brand=r.pick(BRANDS);
    it.dmg=[sc(D.dmg[0],it),sc(D.dmg[1],it)];it.range=D.range+(scope?1:0);it.acc=Math.min(.98,D.acc+.02*it.rar+(ls?.04:0));it.ammo=D.ammo;it.burst=D.burst||1;
    it.tracer=D.ammo==='энергия'?A.l:'#ffe9a0';
    it.lines=[`Урон ${it.dmg[0]}–${it.dmg[1]}${it.burst>1?' ×'+it.burst:''}`,`Дальн. ${it.range} · точн. ${Math.round(it.acc*100)}%`,`Патроны: ${it.ammo}`];
    it.icon=pixIcon(P=>drawRangedIcon(P,kind,D.L,M,A,G,{scope,sil,ls,glow:it.rar>=2}));
    },
  armor(it,r,f){const kind=f.kind||r.w([['кевларовый жилет',4],['бронежилет',3],['тяжёлая броня',2+it.lvl*.3],['экзоброня',.6+it.lvl*.3]]),D=ARMORS[kind];
    const M=ramp(kind==='экзоброня'?r.pick(METALS).c:r.pick(MIL)),A=ramp(r.pick(NEON).c);
    it.kind=kind;it.name=`${capF(kind)} «${r.pick(NICKS)}»`;it.brand=r.pick(BRANDS);
    it.def=Math.max(1,Math.round(D.def*(1+.12*(it.lvl-1))*(1+.25*it.rar)));it.hp=Math.round(D.hp*mul(it));
    it.lines=[`Защита +${it.def}`+(it.hp?` · HP +${it.hp}`:'')];
    it.icon=pixIcon(P=>drawArmorIcon(P,kind,M,A,it.rar>=2));},
  clothes(it,r,f){const kind=f.kind||r.pick(Object.keys(CLOTHES)),D=CLOTHES[kind];
    const C1=ramp(r.w(CLOTH.map(c=>[c,c.w])).c),C2=ramp(r.pick(CLOTH).c),A=ramp(r.pick(NEON).c);
    it.kind=kind;it.name=`${capF(kind)} «${r.pick(NICKS)}»`;it.brand=r.pick(BRANDS);
    it.dodge=+Math.min(.3,D.dodge*(1+.3*it.rar)+.005*it.lvl).toFixed(3);it.def=D.def+(it.rar>=3?1:0);
    it.lines=[`Уклонение ${Math.round(it.dodge*100)}%`+(it.def?` · защита +${it.def}`:'')];
    it.icon=pixIcon(P=>drawClothesIcon(P,kind,C1,C2,A));},
  implant(it,r,f){const kind=f.kind||r.w(Object.keys(IMPL).map(k=>[k,k==='Электро-разряд'?3:k==='Ракетный модуль'?2.2:1])),D=IMPL[kind];const M=ramp(r.pick(METALS).c),A=ramp(r.pick(NEON).c);
    it.kind=kind;it.t=D.t;it.name=`${kind} «${r.pick(NICKS)}»`;it.brand=r.pick(BRANDS);
    if(D.t==='pas'){if(D.def)it.def=1+Math.floor(it.rar/2);if(D.hp)it.hp=sc(D.hp,it);if(D.acc)it.acc=+(D.acc*(1+.25*it.rar)).toFixed(2);
      if(D.crit)it.crit=+(D.crit*(1+.25*it.rar)).toFixed(2);if(D.regen)it.regen=1+Math.floor(it.rar/2);if(D.mp)it.mp=sc(D.mp,it)}
    else{it.cost=D.cost;it.cd=Math.max(3,D.cd-it.rar);it.eff=kind;
      it.pow=kind==='Нано-ремонт'?+(D.pow*(1+.12*it.rar)).toFixed(2):(kind==='Оптический камуфляж'||kind==='Рефлекс-ускоритель')?D.pow+it.rar:sc(D.pow,it)}
    it.lines=implLines(it);it.fx=A.l;
    it.icon=pixIcon(P=>drawImplantIcon(P,D.shape,M,A));},
  med(it,r,f){const kind=f.kind||(it.rar>=2?'нано-аптечка':r.pick(['аптечка','стим-шприц']));const M=ramp(r.pick(METALS).c),A=ramp(r.pick(NEON).c);
    it.kind=kind;it.name=capF(kind)+(it.rar>=1?` «${r.pick(NICKS)}»`:'');it.heal=Math.round((14+it.lvl*3)*(1+.35*it.rar));
    it.lines=[`Лечит ${it.heal} HP`];it.icon=pixIcon(P=>drawMedIcon(P,kind,M,A));},
  battery(it,r,f){const kind=it.rar>=3?'квантовый аккумулятор':it.rar>=1?'энергобатарея':'энергоячейка';const M=ramp(r.pick(METALS).c),A=ramp(r.pick(NEON).c);
    it.kind=kind;it.name=capF(kind)+(it.rar>=1?` «${r.pick(NICKS)}»`:'');it.energy=Math.round((10+it.lvl*2)*(1+.35*it.rar));
    it.lines=[`Энергия +${it.energy}`];it.icon=pixIcon(P=>drawBatteryIcon(P,M,A,Math.min(5,2+it.rar)));},
  ammo(it,r,f){const kind=f.kind||r.w([['пули',5],['дробь',3],['энергия',2]]);const A=ramp(r.pick(NEON).c);
    it.kind=kind;it.count=Math.round((kind==='пули'?r.int(6,12):kind==='дробь'?r.int(3,5):r.int(4,8))*(1+.3*it.rar));
    it.name={'пули':'Патроны','дробь':'Дробь','энергия':'Энергоячейки'}[kind]+` ×${it.count}`;
    it.lines=[`${kind}: +${it.count}`];it.icon=pixIcon(P=>drawAmmoIcon(P,kind,A));},
};
function mix32(h){h=Math.imul(h^h>>>16,0x85ebca6b);h=Math.imul(h^h>>>13,0xc2b2ae35);return(h^h>>>16)>>>0}
function makeItem(seed,cat,lvl,force={}){
  const r=RNG(mix32((seed>>>0)+0x9e3779b9));r.f();r.f();
  if(!cat)cat=r.w([['melee',3],['ranged',3],['armor',2],['clothes',2],['implant',2],['med',3],['battery',2],['ammo',3],['grenade',2]]);
  const rar=force.rar!=null?force.rar:r.w([0,1,2,3,4].map(i=>[i,[60,26,10,3.5,.8][i]*Math.pow(1+lvl*.15,i)]));
  let ff=force;
  if((cat==='melee'||cat==='ranged'||cat==='implant')&&!force.fx&&!force.nofx){const r2=RNG(mix32((seed^0x51f15e)>>>0));if(r2.f()<[.12,.4,.85,.9,1][rar]&&POOL[cat].length)ff={...force,fx:POOL[cat][(r2.f()*POOL[cat].length)|0]}}
  if(ff.fx&&!force.kind){if(cat==='melee')ff={...ff,kind:fxMeleeKind(ff.fx)};else if(cat==='ranged')ff={...ff,kind:fxRangedKind(ff.fx)};else if(cat==='implant')ff={...ff,kind:'Электро-разряд'}}
  const it={id:uid++,seed,cat,lvl,rar,f:force};
  ITEMGEN[cat](it,r,ff);if(ff.fx&&cat!=='grenade')fxDecorate(it,r,ff);if(cat==='melee'||cat==='ranged')initWpn(it);
  return it;
}
const rseed=()=>Math.floor(Math.random()*4294967296)>>>0;

// ---------- actor composite: character + weapon in hand ----------
// composite canvas in SPRITE pixels (RES× the world unit): the 32×32 body sits at (OX,OY)
const CW_=28*RES,CH_=22*RES,OX=6*RES,OY=5*RES;
function actorSprites(ch,weapon){
  const N=ch.g.N||16,dflt=[N*3/4,ch.g.legTop];
  const out={fr:[],w:[],weapon:weapon&&weapon.icon?weapon:null,hand:(()=>{const h=(ch.g.hands&&ch.g.hands.R)||dflt;return[h[0]+OX,h[1]+OY]})()}; // weapon is drawn separately, rotated
  for(let f=0;f<6;f++){
    const fr=frame(ch,f,true);
    const px=new Array(CW_*CH_).fill(null);
    for(let i=0;i<N*N;i++)if(fr.px[i])px[(((i/N)|0)+OY)*CW_+(i%N)+OX]=fr.px[i];
    const c=gridCanvas(px,CW_,CH_);out.fr.push(c);out.w.push(whiteOf(c));
  }
  return out;
}
function whiteOf(c){const w=document.createElement('canvas');w.width=c.width;w.height=c.height;const x=w.getContext('2d');x.drawImage(c,0,0);x.globalCompositeOperation='source-in';x.fillStyle='#fff';x.fillRect(0,0,w.width,w.height);return w}
function randomChar(density){
  const seeds={};['body','face','hair','cloth','impl','color'].forEach(g=>seeds[g]=rseed());
  const g=generate(seeds,density||'mid');
  const nr=RNG(rseed());const nm=nr.pick(NAMES);
  return{g,seeds,name:nr.chance(.55)?`${nm}-${String(nr.int(1,99)).padStart(2,'0')}`:`${nm} «${nr.pick(NAMES)}»`};
}
