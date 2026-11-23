// ================= DECOR / PROP & RESOURCE GENERATOR =================
// ---- components (named hideout parts, tiers 0..3)
const MATS={
  junk:{n:'Хлам',t:0,w:1,price:2,c:'#a89a7a'},
  bolts:{n:'Болты',t:0,w:1,price:4,c:'#c0c7d4',buy:1},
  spring:{n:'Пружины',t:0,w:1,price:4,c:'#b8bfcc',buy:1},
  tape:{n:'Изолента',t:0,w:1,price:5,c:'#3a8ac4',buy:1},
  wire:{n:'Провода',t:0,w:1,price:6,c:'#ff6a4a',buy:1},
  bulb:{n:'Лампы',t:0,w:1,price:5,c:'#f9f871',buy:1},
  boards:{n:'Доски',t:0,w:2,price:3,c:'#b88850',buy:1},
  bricks:{n:'Кирпичи',t:0,w:2,price:3,c:'#c4784a',buy:1},
  bandage:{n:'Бинты',t:0,w:1,price:5,c:'#e6e2ea',buy:1},
  cement:{n:'Цемент',t:1,w:3,price:6,c:'#b0aca0',buy:1},
  antisep:{n:'Антисептик',t:1,w:1,price:8,c:'#7dff4f',buy:1},
  fuel:{n:'Канистра (средняя)',t:1,w:2,price:25,c:'#ff3355',buy:1,fuelv:10},
  fuelS:{n:'Канистра (малая)',t:0,w:1,price:12,c:'#ff8a3a',fuelv:4},
  fuelL:{n:'Канистра (большая)',t:2,w:3,price:55,c:'#ffd23f',fuelv:24},
  rebar:{n:'Арматура',t:1,w:2,price:7,c:'#a0663a'},
  sheet:{n:'Лист металла',t:1,w:2,price:9,c:'#9aa3b5'},
  cap:{n:'Конденсаторы',t:1,w:1,price:12,c:'#3fa0ff'},
  chip:{n:'Микрочип',t:1,w:1,price:18,c:'#5fd35f'},
  battery:{n:'Аккумулятор',t:2,w:2,price:30,c:'#ffb02e'},
  servo:{n:'Сервопривод',t:2,w:2,price:40,c:'#c06bff'},
  cpu:{n:'Процессор',t:2,w:1,price:55,c:'#22e6ff'},
  gpu:{n:'Видеокарта',t:3,w:2,price:120,c:'#ff9a1f'},
  mag:{n:'Журнал',t:0,w:1,price:6,c:'#ff7ad0',lib:1,min:20},
  book:{n:'Книга',t:1,w:1,price:15,c:'#e0b070',lib:1,min:60},
  disk:{n:'Дата-диск',t:2,w:1,price:40,c:'#22e6ff',lib:1,min:180,holo:1}};
const MAT_KEYS=Object.keys(MATS);
const TIER_N=['обычный','ценный','редкий','особо ценный'];
function pixGrid(W,H,draw,o={}){
  // props/decor are authored on a world-unit grid "plan" (W×H) and re-detailed to a real RES× bitmap with a 1-px outline
  const px=new Array(W*H).fill(null);
  const P=(x,y,c)=>{x|=0;y|=0;if(x<0||y<0||x>=W||y>=H||!c)return;px[y*W+x]=c};
  draw(P);
  const q=hd2x(px,W,H,{bevel:true,tex:o.tex!=null?o.tex:.16,seed:W*131+H});
  return gridCanvas(outline1(q,W*2,H*2,OUT),W*2,H*2);
}
const MAT_ICON={};
function buildMatIcons(){
  const circ=(P,cx,cy,r1,r0,f)=>{for(let y=0;y<16;y++)for(let x=0;x<16;x++){const d=Math.hypot(x-cx,y-cy);if(d<=r1&&d>=r0)P(x,y,f(x,y,d))}};
  const D={
    junk:P=>{for(let x=3;x<=8;x++){P(x,10,'#8a8f9a');P(x,11,'#5a5e68')}P(9,9,'#8a8f9a');P(10,8,'#8a8f9a');for(let y=5;y<=9;y++){P(11,y,'#c43a3a');P(12,y,'#8a2a2a')}P(11,4,'#d0d0d8');[[3,6],[4,5],[5,5],[6,6],[7,7]].forEach(([x,y])=>P(x,y,'#d6b02f'));for(let x=4;x<=10;x++)P(x,13,'#6a4a2c');P(13,12,'#3a8ac4')},
    bolts:P=>{circ(P,5.5,6.5,3.6,1.2,(x,y)=>x+y<12?'#d0d6e2':'#8f9bb0');for(let y=6;y<=13;y++){P(11,y,y%2?'#b8bfcc':'#7a8292');P(12,y,'#5a6070')}for(let x=9;x<=14;x++){P(x,4,'#d0d6e2');P(x,5,'#8f9bb0')}},
    spring:P=>{for(let k=0;k<6;k++){const y=3+k*2;for(let x=4;x<=11;x++)P(x,y+((x-4)>3?1:0),k%2?'#8f9bb0':'#c0c7d4')}},
    tape:P=>circ(P,7.5,7.5,5.5,2.4,(x,y,d)=>d>4.6?'#2a5a9a':d<3.2?'#1a3a6a':'#3a8ac4'),
    wire:P=>{circ(P,7.5,7.5,5.6,3.4,(x,y,d)=>((x+y)%3===0)?'#a03a2a':'#ff6a4a');for(let x=11;x<=14;x++)P(x,12,'#ff6a4a');P(14,13,'#d0a040')},
    bulb:P=>{circ(P,7.5,6,4.2,0,(x,y,d)=>d<1.5?'#ffffff':'#f9f871');for(let y=10;y<=13;y++)for(let x=6;x<=9;x++)P(x,y,y%2?'#8f9bb0':'#c0c7d4');P(7,14,'#3a3a46');P(8,14,'#3a3a46')},
    boards:P=>{for(let k=0;k<3;k++){const y=5+k*3;for(let x=1+k;x<=13-k+1;x++){P(x,y,'#c89a5a');P(x,y+1,'#8a6a3a')}P(1+k,y+1,'#5a3a1a')}},
    bricks:P=>{const B=(x0,y0,c)=>{for(let y=y0;y<y0+3;y++)for(let x=x0;x<x0+6;x++)P(x,y,y===y0?mix(c,'#ffffff',.25):x===x0+5?mix(c,'#000000',.3):c)};B(2,11,'#b0583a');B(8,11,'#a4502f');B(5,8,'#b8603f');B(3,5,'#b0583a')},
    bandage:P=>{circ(P,6.5,8.5,5,0,(x,y,d)=>d<1.5?'#c8c4b8':'#f0ece4');for(let x=10;x<=14;x++){P(x,12,'#f0ece4');P(x,13,'#c8c4b8')}P(6,6,'#d8303f');P(5,7,'#d8303f');P(6,7,'#d8303f');P(7,7,'#d8303f');P(6,8,'#d8303f')},
    cement:P=>{for(let y=4;y<=13;y++)for(let x=3;x<=12;x++){if((y===4||y===13)&&(x===3||x===12))continue;P(x,y,y===4?'#d0ccc0':x===12?'#8a8678':'#b0aca0')}for(let x=5;x<=10;x++)P(x,8,'#c43a3a');P(6,10,'#5a5650');P(9,10,'#5a5650')},
    antisep:P=>{for(let y=6;y<=13;y++)for(let x=5;x<=10;x++)P(x,y,x===5?'#a0d080':x===10?'#3a7a2a':'#5aa040');for(let y=3;y<=5;y++){P(7,y,'#e6e2ea');P(8,y,'#b8b4c4')}for(let y=8;y<=10;y++)for(let x=6;x<=9;x++)P(x,y,'#e6e2ea');P(7,9,'#d8303f');P(8,9,'#d8303f')},
    fuel:P=>{for(let y=4;y<=13;y++)for(let x=3;x<=12;x++)P(x,y,y===4?'#ff6a7a':x===12?'#8a1a2a':'#d8303f');for(let x=5;x<=9;x++)P(x,2,'#3a3a46');P(5,3,'#3a3a46');P(9,3,'#3a3a46');P(11,3,'#d0b040');P(11,2,'#d0b040');for(let k=0;k<6;k++){P(5+k,6+k,'#8a1a2a');P(10-k,6+k,'#8a1a2a')}},
    rebar:P=>{for(let k=0;k<3;k++)for(let i=0;i<12;i++){P(2+i,12-i+k*2-2,i%2?'#a0663a':'#7a4a2a')}P(7,7,'#c0c7d4');P(8,8,'#c0c7d4')},
    sheet:P=>{for(let y=4;y<=12;y++)for(let x=2;x<=13;x++)P(x,y,(x-y===2||x-y===3)?'#e0e6f0':y===12||x===13?'#6a7282':'#9aa3b5');P(3,5,'#6a7282');P(12,5,'#6a7282');P(3,11,'#6a7282')},
    cap:P=>{for(const cx of[4,8,12]){for(let y=4;y<=10;y++){P(cx-1,y,'#5ab0ff');P(cx,y,'#2a70c0')}P(cx-1,4,'#c0c7d4');P(cx,4,'#c0c7d4');P(cx-1,12,'#c0c7d4');P(cx,12,'#c0c7d4');P(cx-1,11,'#c0c7d4');P(cx,13,'#c0c7d4')}},
    chip:P=>{for(let y=4;y<=11;y++)for(let x=4;x<=11;x++)P(x,y,y===4?'#3a3d48':'#15171c');for(const i of[5,7,9,10]){P(i,3,'#c0c7d4');P(i,12,'#c0c7d4');P(3,i,'#c0c7d4');P(12,i,'#c0c7d4')}P(6,6,'#5fd35f');P(9,9,'#2a2d36')},
    battery:P=>{for(let y=5;y<=13;y++)for(let x=2;x<=13;x++)P(x,y,y===5?'#4a4e58':x===13?'#14161c':'#2a2d36');for(let x=2;x<=13;x++)P(x,8,'#ffb02e');P(4,4,'#c43a3a');P(5,4,'#c43a3a');P(10,4,'#3a3d48');P(11,4,'#3a3d48');P(4,3,'#c43a3a');P(11,3,'#3a3d48');P(5,11,'#e0e0e0');P(10,11,'#e0e0e0');P(4,11,'#e0e0e0');P(6,11,'#e0e0e0')},
    servo:P=>{for(let y=5;y<=13;y++)for(let x=2;x<=10;x++)P(x,y,y===5?'#d090ff':x===10?'#5a2a7a':'#8a4dbf');circ(P,7,9,2.5,0,(x,y,d)=>d<1?'#14161c':'#c0c7d4');for(let x=11;x<=14;x++){P(x,9,'#c0c7d4');P(x,10,'#8f9bb0')}for(let x=3;x<=9;x++)P(x,13,'#3a1a4a')},
    cpu:P=>{for(let y=2;y<=13;y++)for(let x=2;x<=13;x++)P(x,y,(x===2||y===2||x===13||y===13)?'#d0b040':'#2a5a3a');for(let y=5;y<=10;y++)for(let x=5;x<=10;x++)P(x,y,y===5?'#c0c7d4':'#8f9bb0');P(7,7,'#22e6ff');P(8,8,'#22e6ff')},
    gpu:P=>{for(let y=4;y<=11;y++)for(let x=1;x<=14;x++)P(x,y,y===4?'#4a4e58':'#1c1f28');circ(P,5,7.5,2.6,0,(x,y,d)=>d<1?'#ff9a1f':((x+y)%2?'#3a3f4e':'#5a6070'));circ(P,11,7.5,2.6,0,(x,y,d)=>d<1?'#ff9a1f':((x+y)%2?'#3a3f4e':'#5a6070'));for(let x=3;x<=12;x+=2)P(x,12,'#d0b040');P(14,5,'#ff9a1f')}};
  D.mag=P=>{for(let y=2;y<=13;y++)for(let x=3;x<=12;x++)P(x,y,x===3?'#b03a8a':y<=5?'#ff7ad0':'#f0e6f2');for(let x=4;x<=11;x++)P(x,4,'#ffffff');for(let y=7;y<=11;y+=2)for(let x=5;x<=10;x++)P(x,y,x%3===0?'#c8b8d0':'#8a7a9a');for(let y=6;y<=9;y++)P(11,y,'#22e6ff')};
  D.book=P=>{for(let y=3;y<=13;y++)for(let x=3;x<=12;x++)P(x,y,x<=4?'#5a2a1a':y===3||y===13?'#7a3a22':'#a0522d');for(let y=4;y<=12;y++)P(12,y,'#f0e6d0');for(let x=6;x<=10;x++){P(x,6,'#e0b070');P(x,8,'#e0b070')}P(8,10,'#ffd23f')};
  D.disk=P=>{circ(P,7.5,7.5,6,0,(x,y,d)=>d<1.2?'#14161c':d<2?'#c0c7d4':((x*3+y)%7<2?'#ffffff':d>5.2?'#2a7a9a':'#22e6ff'));P(4,5,'#ff2fa8');P(5,4,'#ff2fa8')};
  D.fuelS=P=>{for(let y=7;y<=13;y++)for(let x=5;x<=10;x++)P(x,y,y===7?'#ffb07a':x===10?'#9a3a10':'#ff7a2a');for(let x=6;x<=8;x++)P(x,5,'#3a3a46');P(6,6,'#3a3a46');P(8,6,'#3a3a46');P(10,6,'#d0b040');for(let x=6;x<=9;x++)P(x,10,'#ffd8a0')};
  D.fuelL=P=>{for(let y=3;y<=14;y++)for(let x=1;x<=14;x++)P(x,y,y===3?'#ffe27a':x===14?'#8a6a10':(x+y)%7===0?'#e0b030':'#f0c030');for(let x=4;x<=10;x++)P(x,1,'#3a3a46');P(4,2,'#3a3a46');P(10,2,'#3a3a46');P(13,2,'#c0c7d4');
    for(let y=6;y<=11;y++){P(4,y,'#2a2d36');P(11,y,'#2a2d36')}for(let x=4;x<=11;x++){P(x,6,'#2a2d36');P(x,11,'#2a2d36')}for(let i=5;i<=10;i++){P(i,i+1>11?11:i+1,'#2a2d36')}};
  for(const k in D)MAT_ICON[k]=pixIcon(D[k]);
}
// ---- props
const PROP_DEF={
  rack:{n:'Серверная стойка',turns:3,rolls:[2,4],loot:[['wire',5],['chip',4],['cap',4],['bolts',2],['cpu',1.5],['gpu',1]],tall:1},
  compute:{n:'Вычислительный блок',turns:2,rolls:[2,3],loot:[['chip',5],['cap',4],['wire',3],['cpu',2],['gpu',1.4]]},
  terminal:{n:'Старый терминал',turns:2,rolls:[2,3],loot:[['wire',4],['bulb',3],['chip',3],['cap',2],['junk',3]]},
  crate:{n:'Ящик',turns:1,rolls:[2,4],loot:[['bolts',4],['spring',3],['tape',3],['bandage',3],['antisep',2],['junk',3]],item:.3},
  build:{n:'Стройматериалы',turns:2,rolls:[2,4],loot:[['boards',4],['bricks',4],['cement',3],['rebar',3],['sheet',2]]},
  junk:{n:'Куча хлама',turns:2,rolls:[3,5],loot:[['junk',8],['bolts',3],['spring',3],['tape',2],['bulb',2],['wire',2]]},
  barrel:{n:'Бочка',turns:1,rolls:[1,3],loot:[['junk',4],['fuel',3],['antisep',1],['bolts',2]]},
  cache:{n:'Тайник',turns:1,rolls:[1,3],loot:[['chip',3],['cap',3],['antisep',2],['fuel',2],['battery',1.5],['cpu',1],['gpu',.6]],item:.85},
  car:{n:'Брошенная машина',turns:3,rolls:[3,5],loot:[['sheet',4],['wire',3],['battery',2],['fuel',2],['spring',3],['bolts',3],['servo',1]]},
  power:{n:'Трансформатор',turns:3,rolls:[2,4],loot:[['wire',5],['cap',3],['tape',3],['battery',2],['servo',1.5]]}};
const PROP_BIOME={server:[['cache',1.2],['rack',5],['compute',4],['terminal',3],['power',2],['crate',1],['junk',1]],
  streets:[['cache',1.2],['car',4],['junk',2],['crate',2],['barrel',2],['build',2],['terminal',1],['power',2]],
  core:[['cache',1.2],['rack',5],['compute',5],['power',3],['terminal',2]],
  alley:[['cache',1.2],['junk',4],['crate',3],['barrel',3],['build',3],['terminal',1],['power',1]],
  sewer:[['cache',1.2],['barrel',4],['junk',4],['crate',2],['build',2],['power',2]]};
function drawProp(P,kind,r){
  const pk=a=>a[(r.f()*a.length)|0];
  switch(kind){
    case 'rack':{const w=pk([8,10]),x0=(16-w)>>1,h=r.int(15,19),y0=20-h,fr=pk(['#1c2029','#2a2d36','#3a3a40','#b8b098']);
      const F=ramp(fr),broken=r.chance(.45);
      for(let y=y0;y<20;y++)for(let x=x0;x<x0+w;x++){let c;
        if(y===y0)c=F.l;else if(x===x0||x===x0+w-1)c=F.d;else if(y===19)c='#0a0b0e';
        else{const k=(y-y0-1)%3;c=k===0?mix(fr,'#3a4150',.5):k===1?mix(fr,'#232830',.6):'#14171d'}
        P(x,y,c)}
      for(let y=y0+1;y<19;y+=3)for(let k=0;k<r.int(1,3);k++)P(x0+1+r.int(0,3),y,pk(['#3aff6a','#22e6ff','#ffb02e','#ff3355']));
      if(broken){const yy=y0+1+3*r.int(1,Math.max(1,((19-y0)/3|0)-1));for(let x=x0+1;x<x0+w-1;x++){P(x,yy,'#07080a');P(x,yy+1,'#07080a')}
        const cx=x0+r.int(2,w-3);for(let y=yy;y<Math.min(19,yy+r.int(3,6));y++)P(cx,y,pk(['#2f6fd6','#d6b02f','#c43a3a']))}
      break}
    case 'compute':{const B=ramp(pk(['#2a2d36','#3a3f4e','#1c1f28','#4a4038']));const A=pk(['#22e6ff','#ff2fa8','#7dff4f','#ffb02e']);
      for(let y=10;y<20;y++)for(let x=1;x<15;x++)P(x,y,y<=11?B.l:x===14?B.d:y===19?B.d:B.b);
      const fans=r.chance(.6)?[[5,15],[11,15]]:[[8,15]];
      for(const[fx,fy]of fans)for(let y=fy-3;y<=fy+3;y++)for(let x=fx-3;x<=fx+3;x++){const d=Math.hypot(x-fx,y-fy);if(d<=2.8)P(x,y,d<1?'#5a6070':(((Math.atan2(y-fy,x-fx)*3/Math.PI+3)|0)%2?'#14161c':'#2e323c'))}
      for(let x=2;x<14;x++)P(x,12,A);if(r.chance(.5))for(let x=2;x<6;x++)P(x,18,'#c8c4b8');break}
    case 'terminal':{const C=ramp(pk(['#3a3f4e','#b8b098','#2a2d36','#5a4a3a']));const scr=pk(['#3aff6a','#22e6ff','#ffb02e']),cracked=r.chance(.35);
      for(let y=4;y<=13;y++)for(let x=3;x<=12;x++)P(x,y,y===4?C.l:x===12?C.d:C.b);
      for(let y=5;y<=11;y++)for(let x=4;x<=11;x++)P(x,y,cracked?'#0a0c10':'#06120c');
      if(!cracked)for(let y=6;y<=10;y+=2)for(let x=5;x<5+r.int(2,6);x++)P(x,y,scr);else{P(6,6,'#5a6070');P(7,7,'#5a6070');P(8,8,'#5a6070');P(9,8,'#5a6070');P(8,9,'#5a6070')}
      P(7,14,C.d);P(8,14,C.d);for(let y=16;y<=18;y++)for(let x=2;x<=13;x++)P(x,y,y===16?C.l:C.m);for(let x=3;x<=12;x+=2)P(x,17,'#14161c');break}
    case 'crate':{const mat=pk(['wood','wood','plastic','metal']),col=mat==='wood'?pk(['#7a5a34','#6a4a2c','#8a6a3a']):mat==='plastic'?pk(['#2f5aa0','#a03a2f','#3a7a3a','#c8a030']):pk(['#5a6070','#4a4e58']);
      const C=ramp(col),h=r.int(10,12),y0=20-h;
      for(let y=y0;y<20;y++)for(let x=2;x<14;x++)P(x,y,y<=y0+1?C.l:x===13?C.d:((y-y0)%4===1&&mat==='wood')?C.m:C.b);
      if(mat==='wood'){for(let k=0;k<h-2;k++){P(3+((k*10/(h-2))|0),y0+2+k,C.d)}}
      if(mat!=='wood'){for(let x=5;x<=10;x++)P(x,y0+5,C.d);P(7,y0+6,C.l);P(8,y0+6,C.l)}
      P(4,19-2,pk(['#f9f871','#ff3355','#ffffff']));
      if(r.chance(.4)){const tx=r.int(4,10);for(let y=y0-3;y<y0;y++)P(tx,y,'#8f9bb0');P(tx+1,y0-3,'#c0c7d4')}break}
    case 'build':{const sub=pk(['bricks','rebar','bags','planks','pipes']);
      if(sub==='bricks'){for(let row=0;row<4;row++){const y=18-row*2,off=row%2*2;for(let x=2+off;x<14-(row>1?2:0);x++){P(x,y,(x-off)%4===3?'#5a2a1a':'#b0583a');P(x,y+1,(x-off)%4===3?'#5a2a1a':'#8a4028')}}}
      else if(sub==='rebar'){for(let k=0;k<5;k++)for(let x=1;x<15;x++)P(x,13+k+((x+k)%5===0?1:0),k%2?'#8a4a2a':'#a0663a');P(5,13,'#c0c7d4');P(5,18,'#c0c7d4');P(10,13,'#c0c7d4');P(10,18,'#c0c7d4')}
      else if(sub==='bags'){const bag=(x0,y0)=>{for(let y=y0;y<y0+4;y++)for(let x=x0;x<x0+7;x++)if(!((y===y0||y===y0+3)&&(x===x0||x===x0+6)))P(x,y,y===y0?'#d0ccc0':x===x0+6?'#8a8678':'#b0aca0')};bag(1,16);bag(8,16);bag(4,12);if(r.chance(.5))P(7,14,'#c43a3a')}
      else if(sub==='planks'){for(let k=0;k<4;k++){const y=17-k*2+1,x0=1+r.int(0,2),x1=14-r.int(0,2);for(let x=x0;x<=x1;x++){P(x,y,'#9a7040');P(x,y-1,'#b88850')}P(x0,y,'#5a3a1a')}}
      else{const C=pk(['#8f9bb0','#a0663a','#4a5a6a']);for(let row=0;row<3;row++)for(let k=0;k<3-row;k++){const cx=4+k*4+row*2,cy=17-row*3;for(let y=cy-1;y<=cy+1;y++)for(let x=cx-1;x<=cx+1;x++)P(x,y,(x===cx&&y===cy)?'#0a0b0e':C)}}
      break}
    case 'junk':{const pal=['#5a5e68','#8a8f9a','#6a4a2c','#3a3d45','#a0663a','#2a2d36','#c8c4b8','#4a5a3a'];
      for(let y=9;y<20;y++){const hw=Math.min(7,((y-8)*.9)|0);for(let x=8-hw;x<=7+hw;x++)P(x,y,pk(pal))}
      if(r.chance(.6)){const cx=r.int(5,10),cy=16;for(let y=cy-2;y<=cy+2;y++)for(let x=cx-2;x<=cx+2;x++){const d=Math.hypot(x-cx,y-cy);if(d>1.2&&d<2.6)P(x,y,'#14151a')}}
      if(r.chance(.5))for(let k=0;k<4;k++)P(r.int(4,11),r.int(11,18),pk(['#22e6ff','#c43a3a','#d6b02f','#3a8ac4']));
      P(8,9,'#c0c7d4');break}
    case 'barrel':{const col=pk(['#2f5aa0','#a03a2f','#c8a030','#3a7a3a','#4a4e58']),C=ramp(col),toxic=col==='#3a7a3a'&&r.chance(.6);
      for(let y=7;y<20;y++)for(let x=4;x<12;x++)P(x,y,y<=8?(toxic?'#7dff4f':C.l):x===4?C.l:x===11?C.d:(y===11||y===16)?C.d:C.b);
      if(r.chance(.5)){P(7,13,'#f9f871');P(8,13,'#f9f871');P(7,14,'#14161c');P(8,14,'#f9f871')}
      if(r.chance(.4)){P(10,10,C.d);P(10,12,C.d)}break}
    case 'cache':{const sub=pk(['bag','hatch','box']);
      if(sub==='bag'){for(let y=12;y<20;y++)for(let x=3;x<13;x++){if((y===12||y===19)&&(x===3||x===12))continue;P(x,y,y===12?'#5a6a4a':x===12?'#2a3420':'#3e4a32')}for(let x=5;x<11;x++)P(x,11,'#2a3420');P(5,10,'#2a3420');P(10,10,'#2a3420');for(let x=4;x<12;x++)P(x,15,'#1a2014');P(7,16,'#c8a030')}
      else if(sub==='hatch'){for(let y=13;y<20;y++)for(let x=2;x<14;x++)P(x,y,(x===2||x===13||y===13||y===19)?'#6a6e78':'#2a2d36');for(let x=4;x<12;x+=2)P(x,16,'#14161c');P(7,14,'#c8a030');P(8,14,'#c8a030');P(12,17,'#3aff6a')}
      else{for(let y=10;y<20;y++)for(let x=3;x<13;x++)P(x,y,y===10?'#9a8a60':x===12?'#4a3a20':'#6a5a38');for(let x=3;x<13;x++)P(x,13,'#3a2a14');P(7,15,'#ff2fa8');P(8,15,'#ff2fa8');P(7,16,'#ff2fa8')}
      P(r.int(4,11),r.int(9,11),'#fff6c0');break}
    case 'car':{const C=ramp(pk(['#8a2a2a','#2a4a7a','#3a3a40','#c8a030','#5a6a5a','#d0d0d8']));const rust=r.chance(.5);
      for(let y=12;y<=17;y++)for(let x=0;x<16;x++){if((y===12||y===17)&&(x===0||x===15))continue;P(x,y,y===12?C.l:y>=16?C.d:(rust&&(x*y)%7===0?'#7a4a2a':C.b))}
      for(let y=8;y<=11;y++)for(let x=3+(11-y);x<=12-(11-y)+1;x++)P(x,y,y===8?C.l:C.m);
      for(let y=9;y<=11;y++)for(let x=5+(11-y);x<=11-(11-y)+1;x++)if(x!==8)P(x,y,r.chance(.3)?'#0a0c10':'#3a5a7a');
      for(const wx of[3,12]){for(let y=16;y<=19;y++)for(let x=wx-2;x<=wx+1;x++){const d=Math.hypot(x-wx+.5,y-17.5);if(d<2.2)P(x,y,d<1?'#8f9bb0':'#14151a')}}
      P(0,14,'#ffd98a');P(15,14,'#c43a3a');if(r.chance(.5)){P(6,13,'#14151a');P(7,14,'#14151a')}break}
    case 'power':{const C=ramp(pk(['#4a5a4a','#5a6070','#6a6a50'])),h=r.int(12,14),y0=20-h;
      for(let y=y0;y<20;y++)for(let x=2;x<14;x++)P(x,y,y===y0?C.l:x===13?C.d:C.b);
      for(let x=2;x<14;x++)P(x,y0+3,((x+y0)%4<2)?'#f9d030':'#14161c');
      for(let y=y0+6;y<y0+10;y++)for(let x=6;x<10;x++)P(x,y,'#2a2d36');P(7,y0+7,'#f9d030');P(8,y0+8,'#f9d030');
      P(11,y0+5,pk(['#ff3355','#3aff6a']));for(let y=y0-3;y<y0;y++)P(4,y,'#14161c');break}
  }
}
function makeProp(seed,kind){const r=RNG(mix32(seed>>>0));r.f();const D=PROP_DEF[kind];
  return{kind,name:D.n,turns:D.turns,spr:pixGrid(16,20,P=>drawProp(P,kind,r)),seed}}
function rollLoot(kind,floor=1){const D=PROP_DEF[kind],out={};const n=D.rolls[0]+Math.floor(Math.random()*(D.rolls[1]-D.rolls[0]+1));
  const tab=D.loot.map(([m,w])=>[m,w*[1,.55,.22,.08][MATS[m].t]*Math.pow(1+.3*(floor-1),MATS[m].t)]);const tot=tab.reduce((a,b)=>a+b[1],0);
  for(let i=0;i<n;i++){let r=Math.random()*tot;for(const[m,w]of tab){if((r-=w)<0){out[m]=(out[m]||0)+(MATS[m].t===0&&Math.random()<.4?2:1);break}}}return out}

// ---- base furniture sprites
function baseSprite(kind,lv){
  return pixGrid(16,20,P=>{
    switch(kind){
      case 'bed':
        if(lv<=1){for(let y=9;y<20;y++)for(let x=2;x<14;x++)P(x,y,y<=12?(y===9?'#d8d0c0':'#c8c0b0'):(y===19?'#4a3a2a':(x===13?'#2a3450':'#3a4a6a')));for(let x=3;x<13;x+=3)P(x,15,'#2a3450');P(5,17,'#6a5a4a')}
        else if(lv===2){for(let y=6;y<20;y++)for(let x=1;x<15;x++){let c=y<=7?'#8f9bb0':y<=10?'#e0dcd0':y>=18?'#5a6070':(x===14?'#4a1f3a':'#6a2a52');if(x===1||x===14)c=y>=18?'#3a3f4e':'#8f9bb0';P(x,y,c)}for(let x=3;x<13;x+=2)P(x,14,'#8a3a6a')}
        else{for(let y=3;y<20;y++)for(let x=1;x<15;x++){const edge=x===1||x===14||y===3||y===19;let c=edge?'#c0c7d4':(y<10?'#163a4a':'#2a2d36');if(!edge&&y<10&&(x+y)%5===0)c='#22e6ff';P(x,y,c)}for(let x=3;x<13;x++)P(x,12,'#22e6ff');P(3,16,'#3aff6a');P(5,16,'#3aff6a')}
        break;
      case 'crate':
        if(lv<=1){for(let y=9;y<20;y++)for(let x=2;x<14;x++)P(x,y,y<=10?'#a07a4a':x===13?'#5a3a1a':(y-9)%3===2?'#6a4a2c':'#8a6a3a');for(let k=0;k<9;k++)P(3+k,11+k*.9,'#5a3a1a')}
        else if(lv===2){for(let y=3;y<20;y++)for(let x=3;x<13;x++)P(x,y,y===3?'#9aa3b5':x===12?'#3a3f4e':x===7||x===8?'#2a2d36':'#5a6070');for(let y=6;y<10;y+=2){P(5,y,'#2a2d36');P(10,y,'#2a2d36')}P(6,12,'#c0c7d4');P(9,12,'#c0c7d4')}
        else{for(let y=6;y<20;y++)for(let x=1;x<15;x++)P(x,y,y===6?'#8f9bb0':x===14?'#2a2d36':'#4a4e58');for(let y=0;y<16;y++)for(let x=0;x<16;x++){const d=Math.hypot(x-7.5,y-12.5);if(d<3.5&&d>2.3)P(x,y,'#c0c7d4');if(d<1)P(x,y,'#2a2d36')}P(12,8,'#3aff6a')}
        break;
      case 'terminal':
        for(let y=1;y<20;y++)for(let x=3;x<13;x++)P(x,y,y===1?'#4a4e5a':x===12?'#15171c':'#2a2d36');
        for(let y=3;y<10;y++)for(let x=4;x<12;x++)P(x,y,'#160a1a');
        [[6,4],[7,4],[8,4],[5,5],[9,5],[5,6],[5,7],[9,7],[6,8],[7,8],[8,8],[7,3],[7,9]].forEach(([x,y])=>P(x,y,'#ff2fa8'));
        for(let y=11;y<15;y++)for(let x=5;x<11;x+=2)P(x,y,'#5a6070');for(let x=5;x<11;x++)P(x,16,'#14161c');P(10,12,'#22e6ff');break;
      case 'med':
        for(let y=4;y<20;y++)for(let x=3;x<13;x++)P(x,y,y===4?'#ffffff':x===12?'#a09cb0':'#e6e2ea');
        for(let y=7;y<12;y++){P(7,y,lv>1?'#22e6ff':'#d8303f');P(8,y,lv>1?'#22e6ff':'#d8303f')}for(let x=5;x<11;x++){P(x,9,lv>1?'#22e6ff':'#d8303f')}
        for(let x=4;x<12;x++)P(x,14,'#b8b4c4');break;
      case 'wrack':
        for(let y=3;y<16;y++)for(let x=1;x<15;x++)P(x,y,(x===1||x===14||y===3||y===15)?'#5a3a22':'#3a2a1a');
        for(let k=0;k<Math.min(3,lv+1);k++){const y=6+k*3;for(let x=3;x<12;x++)P(x,y,'#5a6070');P(4,y+1,'#2a2433');P(10,y-1,'#8f9bb0')}
        for(let y=16;y<20;y++){P(3,y,'#3a2a1a');P(12,y,'#3a2a1a')}break;
      case 'gen':
        for(let y=8;y<20;y++)for(let x=1;x<15;x++)P(x,y,y===8?'#8a9a6a':x===14?'#3a4a2a':'#5a6a3a');
        for(let x=1;x<15;x++)P(x,11,((x)%4<2)?'#f9d030':'#14161c');for(let y=13;y<18;y++)for(let x=4;x<11;x++)P(x,y,(x+y)%2?'#2a2d36':'#3a3f4e');
        P(12,14,'#3aff6a');for(let y=4;y<8;y++)P(3,y,'#5a6070');P(3,3,'#8f9bb0');break;
      case 'recycler':
        for(let y=6;y<20;y++)for(let x=2;x<14;x++)P(x,y,y===6?'#8f9bb0':x===13?'#3a3f4e':'#5a6070');
        for(let y=1;y<6;y++)for(let x=4;x<12;x++)if(x-4>=5-y&&11-x>=5-y)P(x,y,y===1?'#9aa3b5':'#6c7385');
        for(let y=9;y<14;y++)for(let x=5;x<11;x++)P(x,y,(x+y)%2?'#14161c':'#2a2d36');P(11,16,'#f9d030');P(4,16,'#3aff6a');for(let x=2;x<14;x++)P(x,18,(x%4<2)?'#f9d030':'#14161c');break;
      case 'bench':
        for(let y=9;y<12;y++)for(let x=0;x<16;x++)P(x,y,y===9?'#a07a4a':'#7a5a34');for(let y=12;y<20;y++){P(1,y,'#5a3a1a');P(14,y,'#5a3a1a')}
        for(let x=2;x<6;x++)P(x,8,'#8f9bb0');P(8,7,'#c43a3a');P(8,8,'#5a6070');P(11,8,'#d6b02f');P(12,7,'#d6b02f');
        if(lv>1){for(let y=13;y<18;y++)for(let x=3;x<13;x++)P(x,y,y===13?'#6a6e78':'#4a4e58')}break;
    }
  });
}
