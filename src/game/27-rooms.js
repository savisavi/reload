// ================= SHELTER LEVEL: the shelter itself is upgraded — it grows and gains rooms =================
{const old={...UP};for(const k in UP)delete UP[k];
  UP.room={n:'Убежище',max:3,start:1,power:0,lv:['—','Комнатушка','Бункер · 2 комнаты','Комплекс · 3 комнаты'],
    eff:l=>l>=3?'Жилая, мастерская и серверная. Место под всё, включая майнинг-ферму':l>=2?'Вторая комната: медблок, библиотека, тренажёр, переработчик':'Одна комната: генератор, верстак, станок и принтер',
    L:[null,null,{it:{boards:8,bricks:8,bolts:8,tape:4},cr:150,req:{bench:1},raids:1},{it:{cement:6,rebar:6,sheet:6,chip:2},cr:600,req:{room:2,gen:2},raids:2}]};
  Object.assign(UP,old)}
const ROOM_REQ={gen:1,bench:1,research:1,printer:1,light:1,med:2,lib:2,gym:2,recycler:2,farm:3};
for(const k in ROOM_REQ)if(UP[k]&&UP[k].L[1]){UP[k].L[1].req={...UP[k].L[1].req};if(ROOM_REQ[k]>1)UP[k].L[1].req.room=ROOM_REQ[k]}
const vline=(x,y0,y1,skip)=>{const o=[];for(let y=y0;y<=y1;y++)if(!skip.includes(y))o.push([x,y]);return o};
const hline=(y,x0,x1,skip)=>{const o=[];for(let x=x0;x<=x1;x++)if(!skip.includes(x))o.push([x,y]);return o};
baseLayout=function(){const lv=Math.max(1,ST.base.room||1);
  if(lv<=1)return{size:'s1',W:9,H:7,in:[1,2,7,4],exit:[4,5],rug:null,bed:[1,2],crate:[2,2],terminal:[5,2],slots:[[7,2],[7,4],[1,4],[6,2]],farm:[],hero:[4,4]};
  if(lv===2)return{size:'s2',W:13,H:10,in:[1,2,11,7],exit:[3,8],rug:null,bed:[1,2],crate:[2,2],terminal:[4,2],walls:vline(6,2,7,[5]),doors:[[6,5]],
    slots:[[5,2],[1,5],[7,2],[8,2],[10,2],[11,2],[11,4],[11,7],[9,7],[1,7]],farm:[],hero:[3,6]};
  return{size:'s3',W:17,H:13,in:[1,2,15,10],exit:[3,11],rug:null,bed:[1,2],crate:[2,2],terminal:[4,2],walls:[...vline(6,2,10,[4,9]),...hline(6,7,15,[11])],doors:[[6,4],[6,9],[11,6]],
    slots:[[5,2],[1,5],[1,8],[7,2],[8,2],[10,2],[12,2],[14,2],[15,4],[15,8],[15,10],[7,10]],farm:[[9,8],[10,8],[12,8]],hero:[3,9]}};
// house icon for the build list
{const _bs=baseSprite;baseSprite=function(kind,lv){if(kind==='room')return pixGrid(16,20,P=>{const w=[8,11,14][Math.min(2,lv-1)],x0=8-(w>>1);
  for(let y=8;y<19;y++)for(let x=x0;x<x0+w;x++)P(x,y,y===8?'#8f9bb0':(x===x0||x===x0+w-1||y===18)?'#3a3f4e':'#2a2436');for(let i=0;i<w/2+1;i++){P(8-i,8-i/2|0,'#c0c7d4');P(7+i,8-i/2|0,'#c0c7d4')}
  for(let r=0;r<lv;r++){const dx=x0+2+r*4;if(dx+2<x0+w){P(dx,12,'#ffd27a');P(dx+1,12,'#ffd27a');P(dx,13,'#ffb04a');P(dx+1,13,'#ffb04a')}}P(8,17,'#5a3a1a');P(8,16,'#5a3a1a')});return _bs(kind,lv)}}
// saves made before rooms existed: give them the room their modules already need
{const _lg=loadGame;loadGame=function(){const r=_lg.apply(this,arguments);if(ST&&ST.base){let need=1;for(const k in ROOM_REQ)if(ST.base[k]>0&&k!=='light')need=Math.max(need,ROOM_REQ[k]);ST.base.room=Math.max(ST.base.room||1,need)}return r}}
{const _eb=enterBase;enterBase=function(){if(ST&&ST.base){for(const k in UP)if(ST.base[k]==null)ST.base[k]=UP[k].start;if(!ST.known)ST.known={}}return _eb()}}
