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

function pixIcon(draw,o={}){
  // icons are authored on a 16-grid "plan" and re-detailed to a real 32×32 bitmap with a 1-px outline
  const px=new Array(256).fill(null);
  const P=(x,y,c)=>{x|=0;y|=0;if(x<0||x>15||y<0||y>15||!c)return;px[y*16+x]=c};
  draw(P);
  const q=hd2x(px,16,16,{bevel:true,tex:o.tex!=null?o.tex:.14,seed:o.seed||px.length});
  return gridCanvas(outline1(q,32,32,OUT),32,32);
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
  const sx=Math.floor((16-L-(o.sil?2:0))/2),ex=sx+L-1;
  const gA=(x,y)=>P(x,y,o.glow?A.l:A.b);
  const grip=(x,y0,y1)=>{for(let y=y0;y<=y1;y++){const s=y>y0+1?-1:0;P(x+s,y,G);P(x+1+s,y,mix(G,'#000000',.3))}};
  switch(k){
    case 'пистолет':
      for(let x=sx+1;x<=ex;x++)P(x,6,M.l);for(let x=sx;x<=ex;x++)P(x,7,M.b);for(let x=sx+2;x<=ex-1;x++)P(x,8,M.d);
      grip(sx+1,8,12);P(sx+4,9,M.d);P(sx+5,9,M.d);P(ex,5,M.d);gA(sx+3,7);break;
    case 'револьвер':
      for(let x=sx+5;x<=ex;x++){P(x,6,M.l);P(x,7,M.b)}P(ex,5,M.d);
      for(let y=5;y<=9;y++)for(let x=sx+2;x<=sx+4;x++)P(x,y,M.m);P(sx+3,6,M.d);P(sx+3,8,M.d);
      P(sx,5,M.d);P(sx+1,6,M.b);P(sx+1,7,M.b);grip(sx,9,12);P(sx+5,8,M.d);P(sx+5,9,M.d);gA(sx+6,7);break;
    case 'ПП':
      for(let x=sx+1;x<=ex-2;x++){P(x,5,M.l);P(x,6,M.b);P(x,7,M.b);P(x,8,M.d)}P(ex-1,6,M.d);P(ex,6,M.d);
      for(let y=5;y<=8;y++)P(sx,y,M.d);grip(sx+2,9,11);for(let y=9;y<=13;y++){P(sx+6,y,M.d);P(sx+7,y,M.m)}
      for(let x=sx+3;x<=sx+5;x++)gA(x,6);break;
    case 'дробовик':
      for(let x=sx+5;x<=ex;x++)P(x,6,M.l);for(let x=sx+5;x<=ex-1;x++)P(x,7,M.d);
      for(let y=6;y<=8;y++)for(let x=sx+3;x<=sx+5;x++)P(x,y,M.b);
      P(sx+2,6,G);P(sx+1,7,G);P(sx+2,7,G);for(let x=sx;x<=sx+2;x++)P(x,8,G);P(sx,9,G);P(sx+1,9,G);
      for(let x=sx+8;x<=sx+10;x++)P(x,8,G);P(sx+4,9,M.d);gA(sx+4,7);break;
    case 'винтовка':
      for(let x=sx+3;x<=sx+10;x++){P(x,6,M.l);P(x,7,M.b);P(x,8,M.m)}for(let x=sx+11;x<=ex;x++)P(x,7,M.d);P(ex-1,6,M.d);
      for(let y=6;y<=9;y++)for(let x=sx;x<=sx+2;x++)if(!(y===6&&x===sx))P(x,y,M.d);
      grip(sx+4,9,11);for(let y=9;y<=11;y++){P(sx+7,y,M.d);P(sx+8,y,M.m)}P(sx+8,12,M.d);P(sx+9,12,M.d);
      if(o.scope){for(let x=sx+5;x<=sx+9;x++)P(x,4,'#16141c');P(sx+6,5,M.d);P(sx+8,5,M.d);P(sx+9,4,A.l)}
      for(let x=sx+3;x<=sx+5;x++)gA(x,7);break;
    case 'лазер':
      for(let x=sx+2;x<=sx+7;x++){P(x,5,M.l);P(x,9,M.d)}for(let y=6;y<=8;y++)for(let x=sx+1;x<=sx+8;x++)P(x,y,M.b);
      for(let x=sx+9;x<=ex;x++)for(let y=6;y<=8;y++)P(x,y,(x%2)?(y===7?A.l:A.b):M.d);
      P(ex,7,A.l);P(sx+4,7,A.l);P(sx+5,7,A.l);grip(sx+2,10,12);break;
  }
  if(o.sil&&k!=='лазер'){P(ex+1,7,'#1b1d24');P(ex+2,7,'#1b1d24');P(ex+1,6,'#2a2d36');P(ex+2,6,'#2a2d36')}
  if(o.ls)P(sx+Math.floor(L/2),9,'#ff3355');
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
  const at=i=>[2+i,13-i];
  for(let i=0;i<D.h;i++){const[x,y]=at(i);P(x,y,i===0?M.d:(D.axe?G:(i%2?G:mix(G,'#ffffff',.15))))}
  if(D.axe){const[x,y]=at(D.h-1);
    P(x+1,y,M.b);P(x+1,y-1,M.l);P(x+2,y,M.b);P(x+2,y+1,M.m);P(x+1,y+1,M.m);P(x+3,y+1,M.l);P(x+3,y+2,M.l);P(x+2,y+2,M.b);P(x-1,y-1,M.d);P(x,y-1,M.m);
    if(o.glow){P(x+3,y,A.b)}return}
  const[gx,gy]=at(D.h);
  if(D.guard){P(gx,gy,o.glow?A.b:M.d);P(gx-1,gy-1,M.d);P(gx+1,gy+1,M.d);P(gx-2,gy-2,M.d);P(gx+2,gy+2,M.d)}else P(gx,gy,M.d);
  for(let i=D.h+1;i<=D.h+D.B;i++){const[x,y]=at(i),tip=i===D.h+D.B;
    if(D.energy){P(x,y,A.l);P(x+1,y,A.b);P(x,y+1,A.b)}
    else if(D.baton){P(x,y,tip?A.l:M.d);P(x+1,y,tip?A.b:M.m);if(i===D.h+2)P(x,y,A.b)}
    else if(D.thick){P(x,y,M.b);P(x+1,y,M.m);P(x,y-1,M.l);if(o.nails&&i%2)P(x+2,y-1,'#c8c8d0')}
    else{P(x,y,tip?'#ffffff':M.l);if(D.wide>=1&&!tip)P(x+1,y,M.b);if(D.wide>=2&&!tip)P(x+1,y+1,M.m);if(D.wide===0&&!tip)P(x+1,y,M.d)}
  }
  if(o.glow&&!D.energy&&!D.baton){const[x,y]=at(D.h+2);P(x+1,y,A.b)}
}

// ---------- armor / clothes ----------
const ARMORS={'кевларовый жилет':{def:1,hp:0},'бронежилет':{def:2,hp:0},'тяжёлая броня':{def:3,hp:4},'экзоброня':{def:4,hp:10}};
function drawArmorIcon(P,k,M,A,glow){
  const rows={2:[[4,5],[10,11]],3:[[3,5],[10,12]],4:[[3,6],[9,12]],5:[[3,12]],6:[[4,11]],7:[[4,11]],8:[[4,11]],9:[[4,11]],10:[[4,11]],11:[[4,11]],12:[[4,11]],13:[[5,10]]};
  for(const y in rows)for(const[a,b]of rows[y])for(let x=a;x<=b;x++)P(x,+y,x===b?M.m:M.b);
  for(const y of[6,10]){for(let x=5;x<=10;x++){P(x,y,M.l);P(x,y+1,M.b)}}
  for(let x=4;x<=11;x++)P(x,9,M.d);
  if(k==='бронежилет'){for(const x of[5,9]){P(x,11,M.d);P(x+1,11,M.d);P(x,12,M.m);P(x+1,12,M.m)}}
  if(k==='тяжёлая броня'||k==='экзоброня'){for(let y=3;y<=6;y++){P(2,y,M.l);P(13,y,M.m)}P(2,7,M.d);P(13,7,M.d)}
  if(k==='экзоброня'){for(let y=5;y<=12;y++)P(7,y,M.d);P(7,6,A.l);P(8,6,A.l);P(7,7,A.b);P(8,7,A.b)}
  if(glow){P(4,5,A.b);P(11,5,A.b)}
}
const CLOTHES={'куртка':{dodge:.04,def:0},'худи':{dodge:.06,def:0},'плащ':{dodge:.03,def:1},'бомбер':{dodge:.05,def:0}};
function drawClothesIcon(P,k,C1,C2,A){
  const bottom=k==='плащ'?14:12;
  for(let y=4;y<=10;y++){P(2,y,C1.m);P(3,y,C1.b);P(12,y,C1.b);P(13,y,C1.m)}
  P(2,10,C1.d);P(3,10,C1.d);P(12,10,C1.d);P(13,10,C1.d);
  for(let y=3;y<=bottom;y++){const a=k==='плащ'&&y>10?3:4,b=k==='плащ'&&y>10?12:11;for(let x=a;x<=b;x++)P(x,y,x===b?C1.m:C1.b)}
  P(6,3,C1.l);P(9,3,C1.l);P(7,3,C2.d);P(8,3,C2.d);
  if(k==='худи'){for(let x=5;x<=10;x++)P(x,2,C1.m);P(5,3,C1.m);P(10,3,C1.m);for(let x=6;x<=9;x++){P(x,1,C1.m);P(x,10,C1.d)}P(7,4,A.b);P(8,5,A.b)}
  else{for(let y=4;y<=bottom;y++){P(7,y,C2.b);P(8,y,C2.m)}}
  if(k==='бомбер'){for(let x=2;x<=13;x++)if(x<4||x>11)P(x,6,A.b);for(let x=4;x<=11;x++)P(x,bottom,C1.d)}
  if(k==='плащ'){for(let x=4;x<=11;x++)P(x,9,C1.d);P(7,9,'#c9a35a');P(4,3,C1.l);P(11,3,C1.l)}
  if(k==='куртка'){P(5,4,C1.l);P(10,4,C1.l);P(5,9,A.b);P(10,9,A.b)}
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
  if(s==='chip'){
    for(let y=4;y<=11;y++)for(let x=4;x<=11;x++)P(x,y,(x===4||y===4)?M.l:(x===11||y===11)?M.d:'#1c2a24');
    for(const i of[5,7,9]){P(i,3,M.l);P(i,12,M.d);P(3,i,M.l);P(12,i,M.d)}
    P(7,7,A.l);P(8,7,A.b);P(7,8,A.b);P(8,8,A.l);P(5,6,A.d);P(6,6,A.d);P(9,9,A.d);P(10,9,A.d);P(6,9,A.d);
  } else if(s==='eye'){
    for(let y=0;y<16;y++)for(let x=0;x<16;x++){const d=Math.hypot(x-7.5,y-7.5);
      if(d<=5.6)P(x,y,d>4.4?(x+y<15?M.l:M.m):d>2.2?(d>3.4?A.d:A.b):'#0a0a12')}
    P(6,6,'#ffffff');P(9,9,A.l);
  } else if(s==='arm'){
    for(let y=2;y<=13;y++)for(let x=5;x<=10;x++)P(x,y,x===5?M.l:x===10?M.m:((y-2)%3===2?M.d:M.b));
    for(let y=4;y<=11;y+=2)P(7,y,A.b);P(8,3,A.l);P(4,7,M.d);P(11,7,M.d);P(4,8,M.d);P(11,8,M.d);
  } else if(s==='heart'){
    for(let y=4;y<=12;y++)for(let x=3;x<=12;x++){if((y===4||y===12)&&(x===3||x===12))continue;P(x,y,y===4?M.l:x===12?M.m:M.b)}
    [[4,8],[5,8],[6,7],[7,10],[8,5],[9,8],[10,8],[11,8]].forEach(([x,y])=>P(x,y,A.l));P(7,9,A.b);P(8,6,A.b);P(8,7,A.b);
  } else if(s==='spine'){
    for(let k=0;k<4;k++){const y=2+k*3;for(let x=5;x<=10;x++){P(x,y,M.l);P(x,y+1,x===10?M.m:M.b)}P(4,y+1,M.d);P(11,y+1,M.d);if(k<3){P(7,y+2,A.b);P(8,y+2,A.l)}}
  } else if(s==='shield'){
    const w={3:[6,9],4:[4,11],5:[3,12],6:[3,12],7:[3,12],8:[3,12],9:[3,12],10:[4,11],11:[5,10],12:[7,8]};
    for(const y in w)for(let x=w[y][0];x<=w[y][1];x++)P(x,+y,x===w[y][0]||x===w[y][1]||+y===3?M.l:M.m);
    for(let y=5;y<=10;y++)for(let x=5;x<=10;x++){const d=Math.hypot(x-7.5,y-7.5);if(d<2.9&&d>1.6)P(x,y,A.b);if(d<=1.2)P(x,y,A.l)}
  }
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
    const at=i=>[3+i,12-i];
    for(let i=0;i<2;i++){const[x,y]=at(i);P(x,y,M.d);P(x+1,y,M.m)}
    for(let i=2;i<8;i++){const[x,y]=at(i);P(x,y,'#cfe8ff');P(x+1,y,i<6?A.b:'#a8c8e8');P(x,y+1,i<6?A.l:'#cfe8ff')}
    const[gx,gy]=at(2);P(gx-1,gy-1,M.l);P(gx+1,gy+1,M.l);
    for(let i=8;i<11;i++){const[x,y]=at(i);P(x,y,'#d0d0d8')}
    return;}
  const metal=k==='нано-аптечка';
  const cs=metal?M:{l:'#ffffff',b:'#e6e2ea',m:'#b8b4c4',d:'#8a8698'};
  for(let y=5;y<=12;y++)for(let x=2;x<=13;x++)P(x,y,y===5?cs.l:x===13||y===12?cs.m:cs.b);
  for(let x=6;x<=9;x++)P(x,3,'#3a3a46');P(6,4,'#3a3a46');P(9,4,'#3a3a46');
  const cc=metal?A.l:'#d8303f';
  for(let y=6;y<=11;y++){P(7,y,cc);P(8,y,cc)}for(let x=5;x<=10;x++){P(x,8,cc);P(x,9,cc)}
  if(metal){P(2,8,A.b);P(13,8,A.b)}
}
function drawBatteryIcon(P,M,A,n){
  for(let y=4;y<=13;y++)for(let x=5;x<=10;x++)P(x,y,x===5?M.l:x===10?M.m:M.b);
  for(let y=2;y<=3;y++){P(7,y,M.l);P(8,y,M.m)}
  for(let k=0;k<n;k++){const y=12-k*2;for(let x=6;x<=9;x++)P(x,y,k===n-1?A.l:A.b)}
  for(let k=n;k<5;k++){const y=12-k*2;for(let x=6;x<=9;x++)P(x,y,'#14161c')}
}
function drawAmmoIcon(P,k,A){
  if(k==='пули'){
    for(let y=9;y<=13;y++)for(let x=3;x<=12;x++)P(x,y,y===9?'#5e7040':x===12?'#3a4628':'#4a5a32');
    for(let x=4;x<=11;x++)P(x,11,'#2a331c');
    for(const x of[4,6,8,10]){P(x,5,'#d07a4a');P(x+1,5,'#b0603a');for(let y=6;y<=8;y++){P(x,y,'#e0c070');P(x+1,y,'#c9a35a')}}
  } else if(k==='дробь'){
    for(const x of[3,7,11]){for(let y=4;y<=10;y++){P(x,y,'#e85a5a');P(x+1,y,'#b83030')}for(let y=11;y<=12;y++){P(x,y,'#f0d080');P(x+1,y,'#c9a040')}P(x,4,'#ff8a8a')}
  } else {
    for(const x of[4,7,10]){P(x,3,'#8f9bb0');P(x+1,3,'#6c7385');for(let y=4;y<=11;y++){P(x,y,y%2?A.l:A.b);P(x+1,y,A.d)}P(x,12,'#6c7385');P(x+1,12,'#4a4f5c')}
  }
}

// ---------- factory ----------
const ITEMGEN={
  melee(it,r,f){const kind=f.kind||r.pick(Object.keys(MELEE)),D=MELEE[kind];
    const M=ramp(r.pick(METALS).c),A=ramp(r.pick(NEON).c),G=r.pick(GRIPS),nails=kind==='бита'&&r.chance(.5);
    it.kind=kind;it.name=`${capF(kind)} «${r.pick(NICKS)}»`+(it.rar>=2?` Mk${r.int(2,9)}`:'');it.brand=r.pick(BRANDS);
    it.dmg=[sc(D.dmg[0],it),sc(D.dmg[1],it)];it.crit=Math.min(.5,D.crit+.02*it.rar);it.stun=D.stun||0;
    it.lines=[`Урон ${it.dmg[0]}–${it.dmg[1]}`,`Крит ${Math.round(it.crit*100)}%`+(it.stun?` · оглушение ${Math.round(it.stun*100)}%`:'')];
    it.icon=pixIcon(P=>drawMeleeIcon(P,D,M,A,G,{glow:it.rar>=2,nails}));
    it.held=(P,hx,hy)=>{const L=D.held;P(hx+1,hy,G);
      for(let i=1;i<=L;i++){const x=hx+1+i,y=hy-i;let c;
        if(D.axe)c=i<L?G:M.d;else if(D.energy)c=i===1?M.d:A.l;else if(D.baton)c=i>=L-1?A.l:M.d;else if(D.thick)c=M.b;else c=(i===1&&D.guard)?M.d:M.l;
        P(x,y,c);if(D.thick&&i>=2)P(x+1,y,M.m);if(D.energy&&i>=2)P(x+1,y,A.b);if(!D.thick&&!D.energy&&!D.axe&&D.wide>=1&&i>=2)P(x+1,y,M.b)}
      if(D.axe){const x=hx+1+L,y=hy-L;P(x+1,y,M.l);P(x+1,y+1,M.b);P(x,y-1,M.b);P(x+2,y+1,M.l)}};
    it.fx=A.l;},
  ranged(it,r,f){const kind=f.kind||r.w([['пистолет',6],['револьвер',3.5],['ПП',1.2],['дробовик',1],['винтовка',.5],['лазер',.25]]),D=RANGED[kind];
    const M=ramp(r.pick(METALS).c),A=ramp(r.pick(NEON).c),G=r.pick(GRIPS);
    const scope=kind==='винтовка'&&r.chance(.6),sil=['пистолет','ПП'].includes(kind)&&r.chance(.3),ls=r.chance(.25+.1*it.rar);
    it.kind=kind;it.name=`${capF(kind)} «${r.pick(NICKS)}»`+(it.rar>=2?` Mk${r.int(2,9)}`:'');it.brand=r.pick(BRANDS);
    it.dmg=[sc(D.dmg[0],it),sc(D.dmg[1],it)];it.range=D.range+(scope?1:0);it.acc=Math.min(.98,D.acc+.02*it.rar+(ls?.04:0));it.ammo=D.ammo;it.burst=D.burst||1;
    it.tracer=D.ammo==='энергия'?A.l:'#ffe9a0';
    it.lines=[`Урон ${it.dmg[0]}–${it.dmg[1]}${it.burst>1?' ×'+it.burst:''}`,`Дальн. ${it.range} · точн. ${Math.round(it.acc*100)}%`,`Патроны: ${it.ammo}`];
    it.icon=pixIcon(P=>drawRangedIcon(P,kind,D.L,M,A,G,{scope,sil,ls,glow:it.rar>=2}));
    it.held=(P,hx,hy)=>{const L=D.held;for(let i=1;i<=L;i++)P(hx+i,hy-1,i===L?M.d:(i===1?M.m:M.b));P(hx+1,hy,G);
      if(kind==='ПП'||kind==='винтовка')P(hx+3,hy,M.d);if(kind==='лазер')P(hx+L,hy-1,A.l);if(scope)P(hx+3,hy-2,'#16141c');if(kind==='дробовик')P(hx+L-1,hy-1,M.l)};},
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
