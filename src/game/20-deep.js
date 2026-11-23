// ================= DEEP SERVER BIOMES, NEW FAUNA, HAZARDS & TRAPS =================
// ---------- biomes ----------
const DEEP_BASE={frost:'server',biolab:'sewer',desert:'streets',fog:'core',factory:'server'};
Object.assign(BIOMES,{
  frost:{name:'КИБЕРСНЕГ',rw:[6,10],rh:[6,9],max:11,cw:[1,2],titles:['Морозный мародёр','Крио-техник','Ледяной отшельник','Снежный рейдер'],human:.35,creatures:['icewolf','cryojelly','frostcrab','icewolf'],density:'high',ranged:.6,rk:['винтовка','лазер','дробовик'],mk:['топор','энергоклинок','катана'],armor:.75},
  biolab:{name:'БИОЛАБОРАТОРИЯ',rw:[6,10],rh:[6,9],max:11,cw:[1,2,2],titles:['Биохакер','Садовник-мутант','Споровый культист','Лаборант'],human:.3,creatures:['vinecrawler','sporepod','mantis','vinecrawler'],density:'high',ranged:.5,rk:['лазер','ПП','дробовик'],mk:['мачете','энергоклинок','нож'],armor:.6},
  desert:{name:'ТЕХНОПУСТЫНЯ',rw:[7,12],rh:[6,9],max:9,cw:[2,3],titles:['Пустынный кочевник','Песчаный бандит','Мусорщик дюн','Пыльный пророк'],human:.35,creatures:['scorpion','sandworm','sandmite','sandmite'],density:'mid',ranged:.65,rk:['винтовка','револьвер','дробовик'],mk:['мачете','топор','катана'],armor:.6},
  fog:{name:'ТУМАННЫЕ СЕКТОРА',rw:[5,9],rh:[5,8],max:12,cw:[1,2],titles:['Слепой охотник','Туманный жнец','Шептун','Потерянный'],human:.4,creatures:['wraith','stalker','wraith'],density:'high',ranged:.2,rk:['дробовик','пистолет'],mk:['катана','топор','мачете','энергоклинок'],armor:.65},
  factory:{name:'ПРОИЗВОДСТВЕННЫЕ ЦЕХА',rw:[7,12],rh:[6,10],max:10,cw:[1,2],titles:['Заражённый рабочий','Мастер цеха','Кукловод','Сборщик'],human:.35,creatures:['toybot','vacbot','mannequin','toybot'],density:'high',ranged:.6,rk:['ПП','дробовик','лазер'],mk:['бита','топор','электродубинка'],armor:.7}});
const DEEP_LIST=['frost','biolab','desert','fog','factory','core'];
const DEEP_TINT={frost:['#8fc8ff',.5],biolab:['#4fd04a',.42],desert:['#e0a050',.55],fog:['#c8ccd8',.55],factory:['#e07a30',.45]};
const DEEP_LIGHT={frost:[140,200,255],biolab:[120,255,140],desert:[255,190,110],fog:[210,215,230],factory:[255,140,60]};
// ---------- props for the new biomes ----------
Object.assign(PROP_DEF,{
  furniture:{n:'Мебель',turns:2,rolls:[2,4],loot:[['boards',5],['bolts',3],['spring',4],['tape',2],['junk',3]]},
  toys:{n:'Коробка игрушек',turns:1,rolls:[2,4],loot:[['spring',4],['bolts',3],['chip',2],['battery',1],['junk',3]],item:.25},
  appliance:{n:'Бытовая техника',turns:3,rolls:[3,5],loot:[['wire',4],['sheet',3],['servo',1.5],['cap',3],['chip',2],['bulb',2]]},
  biopod:{n:'Биокапсула',turns:2,rolls:[2,3],loot:[['antisep',4],['bandage',3],['chip',2],['cap',2],['cpu',.8]],item:.3},
  cryo:{n:'Крио-камера',turns:3,rolls:[2,4],loot:[['cap',4],['chip',3],['servo',1.5],['battery',1.5],['cpu',1],['gpu',.6]],tall:1},
  dune:{n:'Занесённый механизм',turns:2,rolls:[2,4],loot:[['sheet',3],['servo',1.2],['spring',3],['bolts',3],['battery',1],['junk',3]]}});
Object.assign(PROP_BIOME,{
  frost:[['cache',1.2],['cryo',4],['rack',3],['compute',2],['power',2],['crate',1]],
  biolab:[['cache',1.2],['biopod',5],['terminal',2],['crate',2],['junk',1],['barrel',1]],
  desert:[['cache',1.2],['dune',5],['car',2],['junk',2],['barrel',1]],
  fog:[['cache',1.5],['rack',3],['junk',3],['crate',2],['terminal',2]],
  factory:[['cache',1.2],['furniture',4],['toys',4],['appliance',4],['build',1],['crate',1]]});
{const _dp=drawProp;drawProp=function(P,kind,r){const pk=a=>a[(r.f()*a.length)|0];
  if(kind==='furniture'){const c=pk(['#6a4a2c','#4a3a5a','#5a5040','#7a3a3a']),d='#1a120c';if(r.f()<.5){for(let y=10;y<18;y++)for(let x=1;x<15;x++)P(x,y,y===10||x===1||x===14?d:y<13?c:'#3a2a1a');for(let x=2;x<14;x++)P(x,11,'#ffffff22'.slice(0,7)==='#ffffff'?'#8a6a4a':c)}else{for(let y=3;y<19;y++)for(let x=3;x<13;x++)P(x,y,x===3||x===12||y===3||y===18||y===10?d:c);P(7,7,'#d8c070');P(8,14,'#d8c070')}return}
  if(kind==='toys'){for(let y=11;y<19;y++)for(let x=2;x<14;x++)P(x,y,y===11||x===2||x===13?'#3a2a14':'#c8a060');const cs=['#e04040','#ffd23f','#3fa0ff','#7dff4f','#ff2fa8'];for(let k=0;k<6;k++){const x=r.int(3,11),y=r.int(6,10);P(x,y,pk(cs));P(x+1,y,pk(cs));P(x,y+1,pk(cs))}P(5,5,'#ffd23f');P(6,4,'#ffd23f');P(10,6,'#e04040');P(10,5,'#1a0e0e');return}
  if(kind==='appliance'){const c=pk(['#d8dce4','#b8c0cc','#e8e0d0']),fr=r.f()<.5;for(let y=fr?2:8;y<19;y++)for(let x=3;x<13;x++)P(x,y,x===3||x===12||y===(fr?2:8)||y===18?'#4a5060':c);if(fr){for(let x=4;x<12;x++)P(x,9,'#4a5060');P(11,5,'#8a90a0');P(11,13,'#8a90a0')}else{for(let y=0;y<16;y++)for(let x=0;x<16;x++){const d=Math.hypot(x-7.5,y-13);if(d<3.6)P(x,y,d>2.6?'#4a5060':'#3fa0ff')}P(5,10,'#7dff4f');P(10,10,'#ff3344')}return}
  if(kind==='biopod'){for(let y=2;y<19;y++)for(let x=3;x<13;x++){const e=x===3||x===12;P(x,y,y<4||y>16?'#4a5060':e?'#9aa3b5':y>9?'#2a8a3a':'#5ad04a55'.slice(0,7))}for(let k=0;k<4;k++)P(r.int(5,10),r.int(9,15),'#9af07f');P(7,7,'#d8ffd0');P(8,6,'#7dff4f');return}
  if(kind==='cryo'){for(let y=1;y<19;y++)for(let x=3;x<13;x++){const e=x===3||x===12||y===1||y===18;P(x,y,e?'#6a8aa8':(x+y)%5===0?'#e8fbff':'#8fd8ff')}for(let y=5;y<15;y++)P(8,y,'#4a6a88');P(6,8,'#22e6ff');P(9,12,'#22e6ff');return}
  if(kind==='dune'){for(let y=8;y<19;y++)for(let x=0;x<16;x++){const h=8+Math.round(3*Math.sin(x*.6+1));if(y>=h)P(x,y,y===h?'#f0d090':'#d8b070')}for(let x=4;x<11;x++)P(x,10,'#6a6a72');P(5,9,'#8a8a92');P(9,8,'#8a8a92');P(10,7,'#6a6a72');P(7,11,'#ff6a1f');return}
  return _dp(P,kind,r)}}
// ---------- fauna ----------
SP.icewolf=spr(["...oo...........","..ollo..m.m.m...",".oellllo........","olllllllooooooo.","oNllllllllcllllo",".oollllllllllllo","...ollllcclllloo","...olo.oo..olo..","...olo......olo.","...oo........oo."],{o:'#0e1420',l:'#cfe4f2',c:'#22e6ff',e:'#22e6ff',N:'#0e1420',m:'#8a9aaa'});
SP.cryojelly=spr(["......oooo......","....oolwggoo....","...olwggggggo...","..oglgggggggdo..","..ogegggggegdo..",".ogggggggggggdo.",".oddddddddddddo.","..oooooooooooo.."],{o:'#0e1a24',g:'#8fd8ff',l:'#e8fbff',d:'#4a90c0',e:'#0e1a24',w:'#ffffff'});
SP.frostcrab=spr(["..o..........o..",".oco........oco.","..o.oooooooo.o..","...owwwwwwwwo...","..owwbwwwwbwwo..",".oowwwwwwwwwwoo.","o.osssssssssso.o","..o.o.o..o.o.o.."],{o:'#0e1420',c:'#9fe8ff',w:'#d8eef8',b:'#22e6ff',s:'#6a8aa8'});
SP.vinecrawler=spr(["........ooo.....",".......ogggo....","......ogeggo....","......oggggo....",".......oggo.....","..ooo...ogo.....",".oglgo..ogo.ooo.","oglcglooggooglgo","oggggggggggggggo",".oooooooooooooo."],{o:'#0a140c',g:'#3f9a3a',l:'#7dff4f',c:'#22e6ff',e:'#ff3344'});
SP.sporepod=spr(["......oo........","....oopppoo.....","...opppwpppo....","..oppwpppwppo...","..opppppppppo...","...opppppppo....","....ooggggo.....","......oggo......","....oogggoo.....","...ogggggggo....","...ooooooooo...."],{o:'#140a14',p:'#c84a9a',w:'#ffd0f0',g:'#3f8a3a'});
SP.mantis=spr(["..o.......o.....","...o.....o......","....ooooo.......","...ogegego......","....ogggo.......",".....ogo..o.....","....oggggo.o....","...ogogggggo....","..og.oggggo.....",".og..oggggo.....","....o.o..o.o....","...o..o..o..o..."],{o:'#0a140a',g:'#5ad04a',e:'#ff3344'});
SP.scorpion=spr(["...........oo...","..........otso..","...........oto..","..o.o......oto..",".oto.oooooooto..","..ottttttttttto.","..ottettttttto..","...ottttttttto..","..o.o.o.o.o.o...",".o.o.o.o.o.o...."],{o:'#1a0e06',t:'#d8902a',s:'#ff3344',e:'#ff3344'});
SP.sandworm=spr([".....oooo.......","....ottttoo.....","...otwttwtto....","...ottrrrtto....","...otrrrrrto....","....otttttto....","....ottttto.....","....otttto......","..yyyottttoyyy..",".yyyyyyyyyyyyyy."],{o:'#1a1008',t:'#b07a40',w:'#ffffff',r:'#5a1010',y:'#e0c070'});
SP.sandmite=spr(["......o..o......",".......oo.......",".....oyyyyo.....","....oyhyyhyo....","...oyyyyyyyyo...","...oyyyyyyyyo...","...ooyyyyyyoo...","..o.o.oooo.o.o.."],{o:'#1a1008',y:'#c8a040',h:'#ff6a1f'});
SP.wraith=spr(["....oooooo......","...owwwwwwo.....","..owwewwewwo....","..owwwwwwwwo....","..owwwwwwwwo....","..owwwwwwwwo....","..owwwwwwwwo....","..owowwowwow....","...o..o..o......"],{o:'#8a90a0',w:'#e8ecf4',e:'#22e6ff'});
SP.stalker=spr([".....ooo........","....owwwo.......","....oewewo......","....owwwo.......",".....owo........","...oowwwoo......","..ow.owwo.wo....",".ow..owwo..wo...",".....owwo.......",".....o.o........","....ow.wo.......","....ow.wo.......","...oo...oo......"],{o:'#2a2a34',w:'#d8d4e0',e:'#ff3344'});
SP.toybot=spr([".......k........","......kkk.......","....oooooooo....","...orrrrrrrro...","...orwrrrrwro...","...orrrrrrrro...","...oyyyyyyyyo...","....oooooooo....","...oryyyyyyro...","...oryryyryro...","....oooooooo....",".....o....o.....","....oo....oo...."],{o:'#1a0e0e',r:'#e04040',w:'#ffffff',y:'#ffd23f',k:'#c0c7d4'});
SP.vacbot=spr([".....oooooo.....","...oommmmmmoo...","..ommmmmmmmmmo..","..omrmmmmmmmmo..","..ommmmmmmmmmo..","...odddddddddo..","....oooooooo...."],{o:'#0c0a12',m:'#9aa3b5',r:'#ff2f4f',d:'#4a5060'});
SP.mannequin=spr([".....oooo.......","....obbbbo......","....obbbbo......",".....obbo.......","...oobbbboo.....","..obobbbbobo....","..ob.obgbo.bo...","..ob.obbbo.c....",".....obbbo......",".....ob.bo......",".....ob.bo......","....oo..oo......"],{o:'#2a1e14',b:'#d8b890',g:'#7dff4f',c:'#22e6ff'});
const NEW_CRE=['icewolf','cryojelly','frostcrab','vinecrawler','sporepod','mantis','scorpion','sandworm','sandmite','wraith','stalker','toybot','vacbot','mannequin'];
for(const k of NEW_CRE)SP[k+'W']=whiteOf(SP[k]);
Object.assign(CREATURE,{
  icewolf:{name:'Кибер-волк',hp:16,hpF:3,w:{cat:'melee',dmg:[3,6],crit:.15},st:['bleed',.25,3]},
  cryojelly:{name:'Криослизь',hp:20,hpF:4,slow:true,w:{cat:'melee',dmg:[2,5],crit:.02},st:['freeze',.3,1]},
  frostcrab:{name:'Снежный краб',hp:22,hpF:4,def:3,w:{cat:'melee',dmg:[3,5],crit:.05}},
  vinecrawler:{name:'Лозный змей',hp:14,hpF:3,w:{cat:'melee',dmg:[2,5],crit:.08},st:['poison',.35,4]},
  sporepod:{name:'Споровик',hp:18,hpF:4,slow:true,w:{cat:'ranged',dmg:[2,4],range:4,acc:.7,burst:1,tracer:'#c84a9a'},st:['poison',.4,3]},
  mantis:{name:'Мехабогомол',hp:16,hpF:3,w:{cat:'melee',dmg:[4,7],crit:.2},st:['bleed',.3,3]},
  scorpion:{name:'Техноскорпион',hp:18,hpF:4,def:2,w:{cat:'melee',dmg:[3,6],crit:.1},st:['poison',.4,4]},
  sandworm:{name:'Песчаный червь',hp:26,hpF:5,slow:true,w:{cat:'melee',dmg:[4,8],crit:.05},st:['slow',.3,3]},
  sandmite:{name:'Песчаный клещ',hp:8,hpF:2,w:{cat:'melee',dmg:[1,3],crit:.05},st:['bleed',.2,2]},
  wraith:{name:'Мглистый призрак',hp:12,hpF:3,hover:true,dodge:.2,w:{cat:'melee',dmg:[3,5],crit:.1},st:['blind',.35,3]},
  stalker:{name:'Туманный сталкер',hp:20,hpF:4,w:{cat:'melee',dmg:[4,7],crit:.15}},
  toybot:{name:'Заводной солдатик',hp:12,hpF:3,w:{cat:'ranged',dmg:[2,4],range:4,acc:.7,burst:2,tracer:'#ffd23f'}},
  vacbot:{name:'Пылесос-убийца',hp:16,hpF:3,w:{cat:'melee',dmg:[2,5],crit:.05},st:['bleed',.2,2]},
  mannequin:{name:'Заражённый манекен',hp:22,hpF:4,w:{cat:'melee',dmg:[3,6],crit:.08},st:['stun',.15,1]}});
Object.assign(DEATH_MAT,{toybot:'mech',vacbot:'mech',mannequin:'mech',frostcrab:'mech',cryojelly:'goo',sporepod:'goo',wraith:'goo',vinecrawler:'goo'});
{const _me=makeEnemy;makeEnemy=function(x,y,h){const e=_me(x,y,h);const C=!e.human&&CREATURE[e.type];if(C){if(C.def)e.def=C.def;if(C.dodge)e.dodge=C.dodge}return e}}
// ---------- map generation & look ----------
{const _gm=genMap;genMap=function(seed,floor,biome){const base=DEEP_BASE[biome];if(!base)return _gm(seed,floor,biome);
  const M=_gm(seed,floor,base);M.biome=biome;M.base=base;const{W,H,t}=M,R=RNG((seed^0xdeed)>>>0),fl=[];for(let i=0;i<W*H;i++)if(t[i]===1)fl.push(i);
  const walk=(mask,n,len)=>{for(let k=0;k<n;k++){let i=fl[(R.f()*fl.length)|0];for(let s=0;s<len;s++){if(t[i]===1)mask[i]=1;const d=DIRS[(R.f()*4)|0],j=i+d[1]*W+d[0];if(t[j]===1)i=j}}};
  if(biome==='frost'){M.ice=new Uint8Array(W*H);walk(M.ice,M.rooms.length*3,16)}
  if(biome==='desert'){M.dune=new Uint8Array(W*H);walk(M.dune,M.rooms.length*2,14)}
  if(biome==='biolab'){M.grass=new Uint8Array(W*H);walk(M.grass,M.rooms.length*4,20)}
  if(biome==='factory'){M.conv=new Int8Array(W*H);for(const r of M.rooms){if(r.w<6||R.f()<.35)continue;const y=r.y+1+((R.f()*(r.h-2))|0),dir=R.f()<.5?1:-1;for(let x=r.x+1;x<r.x+r.w-1;x++){const i=y*W+x;if(t[i]===1)M.conv[i]=dir}}}
  return M}}
{const _rm=renderMap;renderMap=function(M){const base=DEEP_BASE[M.biome];if(!base)return _rm(M);const b=M.biome;M.biome=base;let res;try{res=_rm(M)}finally{M.biome=b}
  const c=res.c,x=c.getContext('2d'),{W,H,t}=M,R=RNG((M.seed^0x51ee)>>>0),T=(a,bb)=>a<0||bb<0||a>=W||bb>=H?0:t[bb*W+a];
  const[tc,ta]=DEEP_TINT[b];const keep=document.createElement('canvas');keep.width=c.width;keep.height=c.height;keep.getContext('2d').drawImage(c,0,0);
  x.globalCompositeOperation='color';x.globalAlpha=ta;x.fillStyle=tc;x.fillRect(0,0,c.width,c.height);x.globalAlpha=1;x.globalCompositeOperation='destination-in';x.drawImage(keep,0,0);x.globalCompositeOperation='source-over'; // tint only the baked tiles
  // biome dressing, drawn in sprite pixels (the baked map is SPX per tile)
  const N=SPX,px=(X,Y,col)=>{x.fillStyle=col;x.fillRect(X,Y,1,1)},rc=(X,Y,w,h,col)=>{x.fillStyle=col;x.fillRect(X,Y,w,h)};
  for(let ty=0;ty<H;ty++)for(let tx=0;tx<W;tx++){const v=T(tx,ty),i=ty*W+tx,bx=tx*N,by=ty*N;if(!v)continue;
    if(b==='frost'){if(v===1){for(let k=0;k<14;k++)px(bx+R.int(0,31),by+R.int(0,31),R.f()<.5?'#e8f4ff':'#c8e0f0');
        if(M.ice[i]){x.globalAlpha=.45;rc(bx,by,N,N,'#bfe9ff');x.globalAlpha=.85;for(let k=0;k<4;k++){const sx=R.int(2,20),sy=R.int(4,27),l=R.int(4,10);rc(bx+sx,by+sy,l,1,'#ffffff');px(bx+sx+l,by+sy+1,'#d8f2ff')}x.globalAlpha=1}}
      else if(v===2&&(T(tx,ty+1)===1||T(tx,ty+1)===3)){rc(bx,by,N,3,'#eef8ff');rc(bx,by+3,N,1,'#c8e4f4');for(let k=0;k<4;k++){const ix=bx+R.int(2,29),l=R.int(3,9);for(let j=0;j<l;j++)px(ix,by+28+j-(l-3),j===l-1?'#ffffff':'#a8dcf8');px(ix+1,by+28-(l-3),'#d8f2ff')}}}
    if(b==='biolab'){if(v===1&&M.grass[i]){for(let k=0;k<30;k++){const gx=bx+R.int(0,31),gy=by+R.int(4,31),h=R.int(1,3);for(let j=0;j<h;j++)px(gx,gy-j,j===h-1?'#7dff4f':R.f()<.5?'#3f9a3a':'#5ad04a');px(gx,gy+1,'#2a6a2a')}if(R.f()<.3){const fx=bx+R.int(4,26),fy=by+R.int(4,26),fc=R.f()<.5?'#ff6ad0':'#ffd23f';px(fx,fy,fc);px(fx-1,fy+1,fc);px(fx+1,fy+1,fc);px(fx,fy+2,fc);px(fx,fy+1,'#ffffff')}}
      else if(v===2&&(T(tx,ty+1)===1||T(tx,ty+1)===3)){for(let k=0;k<2;k++){const vx=bx+R.int(2,28),l=R.int(12,32);for(let j=0;j<l;j++){const sw=Math.round(Math.sin(j*.45+k)*1.2);px(vx+sw,by+j,'#2f7a2a');if(j%6===3){px(vx+sw+1,by+j,'#5ad04a');px(vx+sw+2,by+j-1,'#3f9a3a')}}if(R.f()<.4){px(vx,by+l-1,'#22e6ff');px(vx,by+l-2,'#a8f8ff')}}}
      else if(v===2&&T(tx,ty+1)===2&&R.f()<.25){x.fillStyle='#1e4a1e';x.beginPath();x.arc(bx+16,by+16,14,0,7);x.fill();x.fillStyle='#2f7a2a';x.beginPath();x.arc(bx+12,by+12,8,0,7);x.fill();x.fillStyle='#3f9a3a';x.beginPath();x.arc(bx+10,by+10,3,0,7);x.fill()}}
    if(b==='desert'){if(v===1){for(let py=0;py<N;py+=6){x.globalAlpha=.32;for(let k=0;k<N;k++){const off=Math.round(3*Math.sin((tx*N+k)*.12+py));px(bx+k,by+py+off,'#f0d090')}}x.globalAlpha=1;
        if(M.dune[i]){x.globalAlpha=.6;x.fillStyle='#d8b070';x.beginPath();x.ellipse(bx+16,by+20,16,10,0,0,7);x.fill();rc(bx+6,by+12,20,1,'#f0d090');rc(bx+9,by+11,14,1,'#f8e0a8');x.globalAlpha=1}}
      else if(v===2&&(T(tx,ty+1)===1)){for(let k=0;k<N;k++){const h=4+Math.round(4*Math.sin(k*.25+tx));rc(bx+k,by+N-h,1,h,'#d8b070');px(bx+k,by+N-h,'#f0d090')}}}
    if(b==='fog'&&v===1&&R.f()<.15){x.globalAlpha=.22;rc(bx+R.int(0,16),by+R.int(0,24),R.int(8,16),3,'#ffffff');x.globalAlpha=1}
    if(b==='factory'){if(v===1&&M.conv&&M.conv[i]){rc(bx,by+6,N,20,'#1a1a20');rc(bx,by+6,N,1,'#4a4a54');rc(bx,by+7,N,1,'#2a2a32');rc(bx,by+25,N,1,'#3a3a44');for(let k=0;k<N;k+=4)rc(bx+k,by+8,1,17,'#14141a')}
      else if(v===1&&R.f()<.06){for(let k=0;k<N;k++){px(bx+k,by+29,((k>>2)&1)?'#ffd23f':'#1a1a1a');px(bx+k,by+30,((k>>2)&1)?'#c8a020':'#141414')}}
      else if(v===2&&(T(tx,ty+1)===1)&&R.f()<.2){rc(bx+4,by+18,24,2,'#8a4a20');rc(bx+4,by+18,24,1,'#b06a30');rc(bx+4,by+24,24,2,'#8a4a20');rc(bx+4,by+24,24,1,'#b06a30');rc(bx+8,by+16,2,2,'#c06a30')}}}
  const L=DEEP_LIGHT[b];for(const l of res.lights)if(l.kind!=='exit'&&l.kind!=='water')l.c=L.slice();
  return res}}
// ---------- hero statuses ----------
const HST_N={burn:'горение',poison:'яд',bleed:'кровотечение',slow:'замедление',blind:'ослепление',freeze:'заморозка',stun:'оглушение',net:'сеть'};
function heroSt(st,turns,src){const P=G.p;if(!P||G.dead)return;P.hsts=P.hsts||{};const T=Math.max(1,Math.round(turns*(1-((P.attr&&P.attr.vit||5)-5)*.08)));
  if(st==='freeze'||st==='stun'||st==='net'){G.heroLock=Math.min(8,Math.max(G.heroLock||0,T))}else P.hsts[st]=Math.max(P.hsts[st]||0,T);
  float(P,HST_N[st]||st,'#ff9aa8',-10);if(ST_FX[st]&&G.vis[idx(P.x,P.y)]){const f=spawnFx(ST_FX[st],P.x*TS+8,P.y*TS+14,{target:P,follow:P,life:Math.min(3,T*.6),k:.5})}}
function heroDmg(d,src){const P=G.p;if(G.dead||d<=0)return;if(window.__god){P.flash=1;return}P.hp-=d;P.flash=1;float(P,'-'+d,'#ff6a7a');if(P.hp<=0){P.hp=0;G.dead=true;G.deadT=3;G.deadAt=performance.now();G.deadFace=P.face||1;G.killer=src||'';log(`${src||'Ловушка'} добивает наёмника`,'#ff4b4b')}}
{const _em=enemyMelee;enemyMelee=function(e){const hp0=G.p.hp;_em(e);const C=!e.human&&CREATURE[e.type];if(C&&C.st&&G.p.hp<hp0&&Math.random()<C.st[1])heroSt(C.st[0],C.st[2])}}
{const _es=enemyShoot;enemyShoot=function(e){const hp0=G.p.hp;_es(e);const C=!e.human&&CREATURE[e.type];if(C&&C.st&&G.p.hp<hp0&&Math.random()<C.st[1])heroSt(C.st[0],C.st[2])}}
// ---------- traps ----------
// kinds: plate (hidden, on step) · pit (hidden) · mine (hidden, proximity, delayed blast) · laser (hidden tripwire)
//        timed (vent on its own tile) · spike (from a wall) · line (hazard running along a floor slit) · door (slamming) · field (zone)
const TRAPS=[];
const TP=(id,n,kind,bio,el,eff,d)=>TRAPS.push({id,n,kind,bio,el,eff,d});
TP('plate','Нажимная плита','plate','*','crush',{dmg:6},'Скрытая плита: удар грузом сверху.');
TP('bear','Капкан','plate','*','bleed',{dmg:4,st:['bleed',3],lock:2},'Зажимает ногу: кровотечение и обездвиживание.');
TP('net','Сеть-ловушка','plate','*','net',{lock:3},'Опутывает сетью на несколько секунд.');
TP('needle','Ядовитая игла','plate','*','poison',{dmg:2,st:['poison',5]},'Укол токсином.');
TP('shock','Шоковая пластина','plate','server,core,factory,fog','elec',{dmg:3,lock:1,drain:8},'Разряд: оглушение и потеря энергии.');
TP('acidspray','Кислотный распылитель','plate','biolab,sewer,factory','acid',{dmg:3,wear:12},'Кислота разъедает оружие.');
TP('glue','Клеевая лужа','plate','factory,biolab,alley','net',{st:['slow',5]},'Липкая масса замедляет.');
TP('alarmplate','Сигнальная плита','plate','*','alarm',{alarm:1},'Поднимает тревогу: враги сбегаются.');
TP('magnet','Магнитная ловушка','plate','server,core,factory,streets','elec',{wear:18,ammo:6},'Магнит портит оружие и вырывает патроны.');
TP('flash','Световая вспышка','plate','*','blind',{st:['blind',4]},'Ослепляет на несколько секунд.');
TP('sonic','Звуковая мина','plate','server,core,fog,factory','elec',{lock:2,area:2},'Оглушает всех вокруг, и врагов тоже.');
TP('pitfall','Провал в полу','pit','*','crush',{dmg:7,lock:1},'Подгнивший настил: падение.');
TP('teleglitch','Телепорт-сбойник','plate','server,core,fog','tele',{tele:1},'Забрасывает в случайную точку этажа.');
TP('cryoplate','Крио-плита','plate','frost','ice',{dmg:3,st:['freeze',2]},'Мгновенное обморожение.');
TP('fireplate','Огненная плита','plate','*','fire',{dmg:3,st:['burn',3]},'Поджигает.');
TP('sporemine','Споровый гриб','plate','biolab','poison',{st:['poison',4],area:1},'Облако спор вокруг.');
TP('quicksand','Зыбучий песок','pit','desert','sand',{lock:3,st:['slow',3]},'Засасывает: несколько секунд на выбирание.');
TP('cavein','Обрушение потолка','plate','factory,server,core,sewer','crush',{dmg:10},'Сверху падают обломки.');
TP('nest','Гнездо','plate','*','alarm',{spawn:2},'Разворошённое гнездо выпускает тварей.');
TP('gridfloor','Электропол','plate','server,core,factory','elec',{drain:15,dmg:2},'Высасывает энергию из имплантов.');
TP('tripwire','Растяжка','mine','*','boom',{boom:9},'Граната на леске.');
TP('cluster','Кассетная мина','mine','streets,core,factory,desert','boom',{boom:7,st:['bleed',3]},'Взрыв с осколками.');
TP('cryomine','Крио-мина','mine','frost,core','ice',{boom:5,st:['freeze',2]},'Ледяной взрыв.');
TP('emp','ЭМИ-мина','mine','server,core,factory,fog','elec',{boom:3,drain:20,emp:1},'Выбивает энергию и глушит машин.');
TP('napalm','Напалм-мина','mine','streets,desert,factory','fire',{boom:6,st:['burn',4]},'Огненный разлёт.');
TP('laserwire','Лазерная растяжка','laser','server,core,streets,factory','plasma',{dmg:8},'Турель стреляет при пересечении луча.');
TP('lasergrid','Лазерная сетка','laser','core,server,fog','plasma',{dmg:4,st:['bleed',3]},'Режет при проходе.');
TP('photocell','Фотоэлемент','laser','*','alarm',{alarm:1,spawn:1},'Сирена и подкрепление.');
TP('steam','Паровой клапан','timed','sewer,factory,server,frost','steam',{dmg:3,push:1},'Периодически бьёт струёй пара.');
TP('nozzle','Огненная форсунка','timed','*','fire',{dmg:4,st:['burn',2]},'Периодический выброс пламени.');
TP('arc','Электродуга','timed','server,core,factory,fog','elec',{dmg:3,lock:1},'Разряд между контактами.');
TP('geyser','Гейзер','timed','sewer,biolab','water',{dmg:3,push:1},'Бьёт струёй из-под пола.');
TP('cryogeyser','Ледяной гейзер','timed','frost','ice',{dmg:3,st:['freeze',1]},'Выброс жидкого азота.');
TP('icicle','Сосульки','timed','frost','ice',{dmg:6},'Срываются с потолка.');
TP('press','Пресс','timed','factory','crush',{dmg:12},'Многотонный пресс опускается по циклу.');
TP('shredder','Дробилка','timed','factory','bleed',{dmg:6,st:['bleed',3]},'Вращающиеся ножи.');
TP('plasmavent','Плазменный вентиль','timed','core','plasma',{dmg:9,st:['burn',2]},'Выброс плазмы охлаждения.');
TP('flytrap','Хищный цветок','timed','biolab','poison',{dmg:3,st:['poison',4]},'Захлопывается на проходящих.');
TP('sandspout','Песчаный вихрь','timed','desert','sand',{dmg:2,st:['blind',3],push:1},'Крутит и ослепляет.');
TP('fogpuff','Сгусток мглы','timed','fog','blind',{st:['blind',4]},'Плотный выброс тумана.');
TP('radvent','Излучатель','timed','desert,core','plasma',{dmg:3,wear:8},'Загадочное излучение: всё обращается в песок.');
TP('wallspike','Пики из стены','spike','*','bleed',{dmg:5,st:['bleed',2]},'Выдвигаются из стены по циклу.');
TP('blades','Лезвия в стене','spike','factory,core,alley','bleed',{dmg:7},'Выезжающие лезвия.');
TP('elecspike','Электрошипы','spike','server,core,factory','elec',{dmg:4,lock:1},'Шипы под напряжением.');
TP('icespike','Ледяные шипы','spike','frost','ice',{dmg:4,st:['freeze',1]},'Нарастают из стены.');
TP('thornvine','Шипастые лозы','spike','biolab','poison',{dmg:3,st:['poison',3]},'Хлещут из стены.');
TP('flameslit','Огонь в щели','line','*','fire',{dmg:4,st:['burn',2]},'Пламя бежит по щели в полу.');
TP('plasmaflow','Плазменный поток','line','core,server','plasma',{dmg:8},'Сгусток плазмы по желобу.');
TP('elecwave','Электрическая волна','line','server,factory,fog','elec',{dmg:3,lock:1},'Ток бежит по рельсе.');
TP('railsaw','Пила по рельсу','line','factory,streets,alley','bleed',{dmg:7,st:['bleed',2]},'Дисковая пила ездит по направляющей.');
TP('coldflow','Холодный поток','line','frost','ice',{dmg:3,st:['freeze',1]},'Струя хладагента по желобу.');
TP('sandwave','Песчаная волна','line','desert','sand',{dmg:2,st:['blind',2],push:1},'Пески перекатываются волной.');
TP('slamdoor','Хлопающая дверь','door','*','crush',{dmg:6,push:1},'Створки захлопываются по циклу.');
TP('blastdoor','Гермозатвор','door','server,core,factory','crush',{dmg:12,push:1},'Тяжёлый затвор сбоит.');
TP('beltgate','Ворота конвейера','door','factory','crush',{dmg:5,push:1},'Ворота линии сборки.');
TP('icegate','Ледяная створка','door','frost','ice',{dmg:4,st:['freeze',1]},'Обледеневший шлюз.');
TP('coldzone','Морозная зона','field','frost','ice',{drain:2,st:['slow',2]},'Холод высасывает энергию и замедляет.');
TP('toxic','Токсичное облако','field','biolab,sewer','poison',{st:['poison',2]},'Ядовитые испарения.');
TP('static','Статическое поле','field','server,core,factory','elec',{drain:3},'Наводки разряжают импланты.');
TP('radspot','Радиационное пятно','field','desert,core','plasma',{dmg:1,wear:2},'Медленно портит снаряжение и здоровье.');
TP('whiteout','Белая мгла','field','fog','blind',{st:['blind',2]},'Видимость падает до шага.');
TP('oil','Масляное пятно','field','factory,streets','net',{st:['slow',2]},'Скользко: замедляет.');
TP('spores','Споровый ковёр','field','biolab','poison',{st:['poison',1],drain:1},'Медленное отравление.');
const TR_COL={crush:'#c0c7d4',bleed:'#ff4b6a',net:'#c8b070',poison:'#7dff4f',elec:'#f9f871',acid:'#9af04f',alarm:'#ff3355',blind:'#ffffff',tele:'#b45cff',ice:'#9fe8ff',fire:'#ff8a1f',sand:'#e0c070',boom:'#ff6a1f',plasma:'#ff2fa8',steam:'#e0e6f0',water:'#3fa0ff'};
const TR_FX={crush:'impacts/ground-slam',bleed:'impacts/hit-spark',poison:'nature/spore-burst',acid:'nature/acid-splash',elec:'lightning/zap-hit',ice:'ice/ice-spikes',fire:'fire/fire-ring',boom:'explosions/small-explosion',sand:'explosions/dirt-explosion',blind:'explosions/smoke-bomb',plasma:'explosions/plasma-explosion',steam:'water/geyser',water:'water/splash',tele:'spawn/poof',net:'nature/root-snare',alarm:'impacts/hit-flash'};
const TR_SND={crush:'hitMetal',bleed:'hitMetal',poison:'slime',acid:'slime',elec:'zap',ice:'hitEnergy',fire:'smoke',boom:'explosion',sand:'smoke',blind:'smoke',plasma:'laser',steam:'smoke',water:'splash',tele:'zap',net:'dryfire',alarm:'drone'};
const HIDDEN=new Set(['plate','pit','mine','laser']);
let TRAPAVOID=true;
function trapAt(i){const m=G&&G.trapMap;if(!m)return null;const k=m[i];return k>=0?G.traps[k]:null}
function trapTileBlocked(n){const tr=trapAt(n);return!!(tr&&tr.armed&&(tr.known||!HIDDEN.has(tr.def.kind))&&(HIDDEN.has(tr.def.kind)||tr.def.kind==='field'))}
function trapActive(tr,i,turn){const d=tr.def,k=d.kind;if(!tr.armed)return false;
  if(k==='timed'||k==='spike')return((turn+tr.off)%tr.per)<1;
  if(k==='door')return((turn+tr.off)%tr.per)===0;
  if(k==='line'){const pos=(turn+tr.off)%(tr.tiles.length+2);return tr.tiles[pos]===i}
  if(k==='field')return true;return false}
function trapScale(v){return Math.max(1,Math.round(v*(1+.15*(G.floor-1))*(.75+Math.random()*.5)))}
function placeTraps(){
  const M=G.M,{W,H,t}=M,pool=TRAPS.filter(d=>d.bio==='*'||d.bio.split(',').includes(G.biome));G.traps=[];G.trapMap=new Int16Array(W*H).fill(-1);if(!pool.length)return;
  const n=Math.min(22,3+Math.floor(G.floor*1.1)+Math.floor(Math.random()*3));
  const free=i=>t[i]===1&&G.trapMap[i]<0&&!isExit(i%W,(i/W)|0)&&Math.abs(i%W-M.start.x)+Math.abs(((i/W)|0)-M.start.y)>4&&!(M.conv&&M.conv[i]);
  const rndFloor=()=>{for(let a=0;a<60;a++){const x=2+((Math.random()*(W-4))|0),y=2+((Math.random()*(H-4))|0),i=y*W+x;if(free(i))return i}return-1};
  const corridor=i=>{const x=i%W,y=(i/W)|0;return(t[i-1]===2&&t[i+1]===2)?'v':(t[i-W]===2&&t[i+W]===2)?'h':null};
  for(let k=0;k<n;k++){const d=pool[(Math.random()*pool.length)|0],kind=d.kind;let tiles=[],extra={};
    for(let a=0;a<40&&!tiles.length;a++){const i=rndFloor();if(i<0)continue;const x=i%W,y=(i/W)|0;
      if(kind==='spike'){const dirs=[[0,-1],[0,1],[-1,0],[1,0]].filter(([dx,dy])=>t[i+dy*W+dx]===2);if(!dirs.length)continue;extra.wd=dirs[(Math.random()*dirs.length)|0];tiles=[i]}
      else if(kind==='door'||kind==='laser'){const c=corridor(i);if(!c&&a<30)continue;extra.ori=c||'h';tiles=[i]}
      else if(kind==='line'){const hor=Math.random()<.5,L=4+((Math.random()*3)|0),run=[];for(let s=0;s<L;s++){const j=hor?i+s:i+s*W;if(!free(j))break;run.push(j)}if(run.length<3)continue;extra.ori=hor?'h':'v';tiles=run}
      else if(kind==='field'){const run=[i];for(const[dx,dy]of[[1,0],[0,1],[1,1],[-1,0],[0,-1]])if(Math.random()<.7){const j=i+dy*W+dx;if(free(j))run.push(j)}tiles=run}
      else tiles=[i]}
    if(!tiles.length)continue;const tr={def:d,tiles,armed:true,known:!HIDDEN.has(kind),per:kind==='door'?4:3+((Math.random()*3)|0),off:(Math.random()*6)|0,fuse:0,...extra};
    const idx2=G.traps.length;G.traps.push(tr);for(const i of tiles)G.trapMap[i]=idx2}
}
function trapEffect(tr,who,i){const d=tr.def,e=d.eff,P=G.p,isH=who===P,x=i%G.M.W,y=(i/G.M.W)|0,name=d.n;
  if(G.vis[i]){const fx=TR_FX[d.el];if(fx)spawnFx(fx,x*TS+8,y*TS+14,{k:.3,maxLife:.9});AUD.at(x,y,TR_SND[d.el]||'hitMetal',{vol:.8})}
  if(e.boom){const r=1;for(const o of[P,...G.en])if(!o.dead&&Math.max(Math.abs(o.x-x),Math.abs(o.y-y))<=r){if(o===P)hurt(P,trapScale(e.boom),{name});else hurt(o,trapScale(e.boom),P);if(e.st&&o===P)heroSt(e.st[0],e.st[1]);else if(e.st&&o!==P)applyStatus(o,e.st[0]);if(e.emp&&o!==P&&!o.human&&(o.type==='drone'||o.type==='sentry'))o.stun=Math.max(o.stun||0,3)}
    if(e.drain&&Math.max(Math.abs(P.x-x),Math.abs(P.y-y))<=r)P.mp=Math.max(0,P.mp-e.drain);log(`${name}: взрыв!`,'#ff8a1f');return}
  if(!isH){if(e.dmg)hurt(who,trapScale(e.dmg),P);if(e.st)applyStatus(who,e.st[0]);if(e.lock)who.stun=Math.max(who.stun||0,e.lock);return}
  if(e.dmg)hurt(P,trapScale(e.dmg),{name});
  if(e.st)heroSt(e.st[0],e.st[1]);if(e.lock)heroSt(d.el==='net'?'net':'stun',e.lock);
  if(e.drain){const g=Math.min(P.mp,e.drain);P.mp-=g;if(g)float(P,'-'+g+' EN','#4c9fff',-4)}
  if(e.wear){for(const w of[P.eq.melee,P.eq.ranged])if(w&&w.mdur)w.dur=Math.max(0,w.dur-e.wear);float(P,'износ','#ff8a3a',-14)}
  if(e.ammo&&P.eq.ranged){const a=P.eq.ranged.ammo,l=Math.min(P.inv.ammo[a],e.ammo);P.inv.ammo[a]-=l;if(l)log(`${name}: потеряно ${l} патр.`,'#ffb04a')}
  if(e.area){for(const o of G.en)if(!o.dead&&Math.max(Math.abs(o.x-x),Math.abs(o.y-y))<=e.area){if(e.lock)o.stun=Math.max(o.stun||0,e.lock);if(e.st)applyStatus(o,e.st[0])}}
  if(e.alarm){let n=0;for(const o of G.en)if(!o.dead&&Math.hypot(o.x-x,o.y-y)<=11){o.awake=true;n++}log(`${name}: тревога! (${n} врагов)`,'#ff3355')}
  if(e.spawn){for(let k=0;k<e.spawn;k++){const p=freeTile((xx,yy)=>Math.abs(xx-x)+Math.abs(yy-y)>=3&&Math.abs(xx-x)+Math.abs(yy-y)<=7&&!isExit(xx,yy));if(p){const en=makeEnemy(p.x,p.y,false);en.awake=true;G.en.push(en)}}}
  if(e.tele){const p=freeTile((xx,yy)=>Math.abs(xx-P.x)+Math.abs(yy-P.y)>8&&!isExit(xx,yy));if(p){P.x=P.rx=p.x;P.y=P.ry=p.y;log(`${name}: переброшен!`,'#b45cff')}}
  if(e.push){const dirs=DIRS.filter(([dx,dy])=>TT(P.x+dx,P.y+dy)===1&&!enemyAt(P.x+dx,P.y+dy));if(dirs.length){const[dx,dy]=dirs[(Math.random()*dirs.length)|0];P.x+=dx;P.y+=dy}}
  if(!e.dmg&&!e.boom)log(name,'#ffb04a');
}
function tryAvoid(tr){const A=G.p.attr||{},c=Math.max(0,Math.min(.75,.05+((A.agi||5)-3)*.06+(tr.known?.35:0)));return Math.random()<c}
function disarmChance(tr){const A=G.p.attr||{};return Math.max(.1,Math.min(.95,.25+(A.int||5)*.07+(A.agi||5)*.02-(G.floor>6?.1:0)))}
const TR_SALV={crush:['spring','bolts','rebar'],bleed:['spring','sheet','bolts'],net:['tape','spring'],poison:['antisep','cap'],elec:['wire','cap','chip'],acid:['antisep','cap'],alarm:['chip','wire','bulb'],blind:['bulb','cap'],tele:['chip','cap','cpu'],ice:['cap','wire'],fire:['fuel','wire'],sand:['spring','junk'],boom:['cap','chip','spring'],plasma:['cap','chip'],steam:['bolts','sheet'],water:['bolts']};
function doDisarm(tr){const P=G.p,ok=Math.random()<disarmChance(tr);const i=tr.tiles[0],x=i%G.M.W,y=(i/G.M.W)|0;P.bump={dx:x-P.x,dy:y-P.y,t:0};
  if(ok){tr.armed=false;const s=TR_SALV[tr.def.el]||['bolts'];const got={};for(let k=0;k<1+((Math.random()*2)|0);k++){const m=s[(Math.random()*s.length)|0];if(packFree()>=MATS[m].w){G.pack.mats[m]=(G.pack.mats[m]||0)+1;got[m]=(got[m]||0)+1}}
    log(`Обезврежено: ${tr.def.n}${Object.keys(got).length?' → '+Object.entries(got).map(([m,n])=>MATS[m].n+' ×'+n).join(', '):''}`,'#7dff4f');AUD.play('scrap');float({x,y},'обезврежено','#7dff4f',-6)}
  else{log(`Не удалось обезвредить: ${tr.def.n}`,'#ff6a7a');trapEffect(tr,P,i);if(HIDDEN.has(tr.def.kind)&&tr.def.kind!=='mine')tr.armed=Math.random()<.5}}
// one world tick of hazards (after enemies acted)
function hazardsTick(moved,dir,mode){
  const P=G.p,M=G.M,W=M.W,i=P.y*W+P.x,turn=G.wt||0;if(!G.traps)return;const T=mode==='time',S0=!T;
  // detection of hidden traps
  const A=P.attr||{},det=.04+(A.per||5)*.035+(A.int||5)*.015;
  if(T)for(const tr of G.traps)if(tr.armed&&!tr.known&&G.vis[tr.tiles[0]]&&Math.random()<det){tr.known=true;const j=tr.tiles[0];float({x:j%W,y:(j/W)|0},'!','#ffb04a',-6);log(`Замечена ловушка: ${tr.def.n}`,'#ffb04a')}
  // stepping on hidden traps
  const here=trapAt(i);
  if(S0&&moved&&here&&here.armed&&HIDDEN.has(here.def.kind)&&here.def.kind!=='mine'){if(tryAvoid(here)){here.known=true;float(P,'увернулся','#9ad8ff',-10);log(`${here.def.n}: наёмник успел отскочить`,'#9ad8ff')}else{here.known=true;trapEffect(here,P,i);if(here.def.kind!=='laser')here.armed=here.def.kind==='pit'?true:Math.random()<.3}}
  // proximity mines: arm, beep, blow next tick
  if(T)for(const tr of G.traps){if(tr.def.kind!=='mine'||!tr.armed)continue;const j=tr.tiles[0],mx=j%W,my=(j/W)|0;
    if(tr.fuse>0){tr.fuse--;if(tr.fuse===0){tr.armed=false;trapEffect(tr,P,j)}}
    else if(Math.max(Math.abs(P.x-mx),Math.abs(P.y-my))<=1&&!(tr.known&&tryAvoid(tr))){tr.fuse=1;tr.known=true;float({x:mx,y:my},'бип!','#ff3355',-6);log(`${tr.def.n}: щелчок! Бежать!`,'#ff3355');AUD.at(mx,my,'dryfire')}}
  // periodic hazards hit whoever stands on active tiles
  if(T)for(const tr of G.traps){const k=tr.def.kind;if(HIDDEN.has(k)||!tr.armed)continue;
    for(const j of tr.tiles){if(!trapActive(tr,j,turn))continue;
      if(k==='field'){if(P.y*W+P.x===j&&turn%2===0)trapEffect(tr,P,j);continue}
      if(G.vis[j]&&(k!=='line'))AUD.at(j%W,(j/W)|0,TR_SND[tr.def.el]||'hitMetal',{vol:.35,gap:.2});
      if(P.y*W+P.x===j){if(Math.random()<Math.max(0,((A.agi||5)-4)*.05)){float(P,'увернулся','#9ad8ff',-10)}else trapEffect(tr,P,j)}
      for(const o of G.en)if(!o.dead&&o.y*W+o.x===j&&Math.random()<.6)trapEffect(tr,o,j)}}
  // environment: ice, dunes, conveyors
  if(S0&&moved&&M.ice&&M.ice[i]&&!G.dead){const slip=Math.max(.05,.42-((A.agi||5)-3)*.05);if(Math.random()<slip){const[dx,dy]=dir;if(TT(P.x+dx,P.y+dy)===1&&!enemyAt(P.x+dx,P.y+dy)&&!(dx===0&&dy===0)){P.x+=dx;P.y+=dy;float(P,'скольжу','#bfe9ff',-10)}else{float(P,'поскользнулся','#bfe9ff',-10);G.heroLock=Math.max(G.heroLock||0,1);heroDmg(1,'Лёд')}}}
  if(S0&&moved&&M.dune&&M.dune[i]&&Math.random()<Math.max(.05,.35-((A.agi||5)-3)*.04)){float(P,'вязнет в песке','#e0c070',-10);enemiesAct()}
  if(T&&M.conv&&(G.wt%2===0)){const push=o=>{const j=o.y*W+o.x,d=M.conv[j];if(!d)return;const nx=o.x+d;if(TT(nx,o.y)===1&&!enemyAt(nx,o.y)&&!(P.x===nx&&P.y===o.y)){o.x=nx}};push(P);for(const o of G.en)if(!o.dead)push(o)}
  // hero statuses
  if(!T)return;const S=P.hsts||{};const f=G.floor;
  const dot=(k,d,c)=>{if(S[k]>0){S[k]--;heroDmg(d,HST_N[k])}};dot('burn',2+Math.floor(f/3));dot('poison',1+Math.floor(f/4));dot('bleed',2);
  if(S.slow>0){S.slow--;if(Math.random()<.5)enemiesAct()}
  if(S.blind>0)S.blind--;
}
// hook the turn: detect the hero's move, run hazards
{const _et=endTurn;endTurn=function(){const P=G&&G.p;const pre=G._hp0;const r=_et.apply(this,arguments);if(!P||G.dead||MODE!=='raid')return r;
  const moved=!!pre&&(pre[0]!==P.x||pre[1]!==P.y),dir=pre?[Math.sign(P.x-pre[0]),Math.sign(P.y-pre[1])]:[0,0];
  const bx=P.x,by=P.y;hazardsTick(moved,dir,'step');if(P.x!==bx||P.y!==by)computeFOV();G._hp0=[P.x,P.y];updateHUD();return r}}
{const _act=act;act=function(a){if(MODE==='raid'&&G&&!G.dead){G._hp0=G._hp0||[G.p.x,G.p.y];
  if(G.heroLock>0){G.heroLock--;if(G.heroLock%2===0)float(G.p,'обездвижен','#ff9aa8',-10);a={hold:1}}
  if(a&&a.hold){G._hp0=[G.p.x,G.p.y];return endTurn()}
  if(a&&a.disarm){G._hp0=[G.p.x,G.p.y];doDisarm(a.disarm);return endTurn()}
  G._hp0=[G.p.x,G.p.y]}return _act(a)}}
// AI: avoid known traps in pathing, wait out cycles, disarm when calm
{const _bfs=bfs;bfs=function(sx,sy,goal,kn,ig){TRAPAVOID=true;let p=_bfs(sx,sy,goal,kn,ig);if(!p){TRAPAVOID=false;p=_bfs(sx,sy,goal,kn,ig);TRAPAVOID=true}return p}}
{const _hd=heroDecide;heroDecide=function(){const P=G.p,W=G.M.W,A=P.attr||{};
  if(G.heroLock>0)return{hold:1};
  const calm=!G.en.some(e=>!e.dead&&e.awake&&G.vis[idx(e.x,e.y)]&&dst(e,P)<6);
  if(calm&&(A.int||5)>=4&&G.traps){for(const tr of G.traps){if(!tr.armed||!tr.known||!HIDDEN.has(tr.def.kind)||tr.fuse)continue;const j=tr.tiles[0];if(md({x:j%W,y:(j/W)|0},P)===1&&packFree()>=1)return{disarm:tr}}}
  const a=_hd();
  if(a&&(a.dx||a.dy)&&!a.manual&&G.traps){const nx=P.x+a.dx,ny=P.y+a.dy,j=ny*W+nx,tr=trapAt(j);
    if(tr&&!HIDDEN.has(tr.def.kind)&&tr.def.kind!=='field'&&(A.int||5)>=4&&trapActive(tr,j,(G.wt||0)+2)&&!G.en.some(e=>!e.dead&&md(e,P)===1)&&(G._wtr===tr?++G._wcnt:(G._wtr=tr,G._wcnt=1))<=10){if(!G._wl||G.turn-G._wl>12){G._wl=G.turn;log(`Жду цикл: ${tr.def.n}`,'#a8a0c6')}return{hold:1}}}
  // fog: close quarters — prefer the blade
  if(a&&a.shoot&&G.biome==='fog'&&P.eq.melee&&!broken(P.eq.melee)&&dst(a.shoot,P)<=2.2){const t=a.shoot;if(md(t,P)===1)return{melee:t}}
  return a}}
// fog of the fog sectors, blindness
{const _fov=computeFOV;computeFOV=function(){const P=G&&G.p;if(!P||MODE!=='raid')return _fov();const keep=P.st.sight;let s=keep;
  if(G.biome==='fog')s=Math.min(s,2+Math.floor(((P.attr&&P.attr.per)||5)/4));if(P.hsts&&P.hsts.blind>0)s=Math.min(s,2);P.st.sight=s;try{_fov()}finally{P.st.sight=keep}}}
// place traps on every new floor
{const _nf=newFloor;newFloor=function(){_nf();G.heroLock=0;G.p.hsts={};placeTraps();G._hp0=[G.p.x,G.p.y];G.atmo=[];
  if(DEEP_BASE[G.biome])setTimeout(()=>log({frost:'Киберснег: лёд скользкий — ловкость помогает удержаться',biolab:'Биолаборатория: джунгли и споры',desert:'Технопустыня: песок вязнет под ногами',fog:'Туманные сектора: видно на пару шагов — ближний бой решает',factory:'Производственные цеха: конвейеры двигают всех'}[G.biome],'#9ad8ff'),600)}}
// ---------- drawing: traps (under actors) & atmosphere (on top) ----------
{const _dd=decalsDraw;decalsDraw=function(){_dd();if(!G||!G.traps||MODE!=='raid')return;const W=G.M.W,turn=G.wt||0,now=performance.now()/1000;
  for(const tr of G.traps){const d=tr.def,k=d.kind,col=TR_COL[d.el]||'#fff';if(HIDDEN.has(k)&&!tr.known)continue;
    for(const j of tr.tiles){if(!G.seen[j])continue;const x=(j%W)*TS,y=((j/W)|0)*TS,act=trapActive(tr,j,turn),warn=trapActive(tr,j,turn+1);ctx.globalAlpha=tr.armed?1:.35;
      if(k==='plate'||k==='pit'){ctx.fillStyle=k==='pit'?'#08060a':'#3a3d48';ctx.fillRect(x+3,y+4,10,9);ctx.fillStyle='#1a1c22';ctx.fillRect(x+3,y+12,10,1);ctx.fillStyle=col;ctx.fillRect(x+7,y+7,2,2);if(k==='pit'){ctx.fillStyle='#2a2430';ctx.fillRect(x+4,y+6,1,4);ctx.fillRect(x+10,y+5,1,3)}}
      else if(k==='mine'){ctx.fillStyle='#1a1c22';ctx.fillRect(x+5,y+8,6,4);ctx.fillRect(x+6,y+7,4,1);ctx.fillStyle=((now*(tr.fuse?8:2))|0)%2?'#ff3355':'#5a1020';ctx.fillRect(x+7,y+8,2,1)}
      else if(k==='laser'){ctx.globalAlpha*=.5+.4*Math.sin(now*10+j);ctx.fillStyle=col;if(tr.ori==='v')ctx.fillRect(x,y+8,16,1);else ctx.fillRect(x+8,y,1,16)}
      else if(k==='timed'){ctx.fillStyle='#22242c';ctx.fillRect(x+4,y+6,8,6);ctx.fillStyle='#3a3d48';ctx.fillRect(x+5,y+7,6,1);ctx.fillRect(x+5,y+9,6,1);
        if(warn&&!act){ctx.globalAlpha*=.4+.3*Math.sin(now*12);ctx.fillStyle=col;ctx.fillRect(x+5,y+6,6,6)}
        if(act){ctx.fillStyle=col;for(let q=0;q<26;q++){const a=q*2.4+now*6,r=(q%7)+1;ctx.fillRect(x+8+Math.round(Math.cos(a)*r),y+8-Math.round(Math.abs(Math.sin(a))*r*1.3),1,1)}}}
      else if(k==='spike'){const[dx,dy]=tr.wd||[0,-1];ctx.fillStyle='#14161c';for(let s=0;s<3;s++){const o=3+s*5;if(dy)ctx.fillRect(x+o,dy<0?y:y+15,3,1);else ctx.fillRect(dx<0?x:x+15,y+o,1,3)}
        if(act||warn){ctx.fillStyle=act?'#e0e6f0':'#5a5e6a';const L=act?7:2;for(let s=0;s<3;s++){const o=4+s*5;for(let q=0;q<L;q++){const w=Math.max(1,3-Math.floor(q/2.5));if(dy<0)ctx.fillRect(x+o-(w>>1),y+q,w,1);else if(dy>0)ctx.fillRect(x+o-(w>>1),y+15-q,w,1);else if(dx<0)ctx.fillRect(x+q,y+o-(w>>1),1,w);else ctx.fillRect(x+15-q,y+o-(w>>1),1,w)}}if(act){ctx.fillStyle=col;ctx.fillRect(dy<0?x+4:x+4,y+(dy<0?6:9),1,1)}}}
      else if(k==='line'){ctx.fillStyle='#0a0a0e';if(tr.ori==='h')ctx.fillRect(x,y+7,16,2);else ctx.fillRect(x+7,y,2,16);
        if(act){ctx.fillStyle=col;for(let q=0;q<22;q++){const ox=tr.ori==='h'?(q*3+((now*20)|0))%16:7+((q*5)%3)-1,oy=tr.ori==='h'?7-((q*7)%6):(q*3+((now*20)|0))%16;ctx.fillRect(x+ox,y+oy,1,1+((q%3)?1:0))}ctx.globalAlpha*=.35;ctx.fillRect(x,y,16,16)}
        else if(warn){ctx.globalAlpha*=.5;ctx.fillStyle=col;if(tr.ori==='h')ctx.fillRect(x,y+7,16,1);else ctx.fillRect(x+7,y,1,16)}}
      else if(k==='door'){const shut=act?8:warn?4:1;ctx.fillStyle='#5a5e6a';if(tr.ori==='v'){ctx.fillRect(x,y,16,2);ctx.fillRect(x,y+14,16,2);ctx.fillStyle=act?'#9aa3b5':'#6a7080';ctx.fillRect(x,y,shut,16);ctx.fillRect(x+16-shut,y,shut,16)}else{ctx.fillRect(x,y,2,16);ctx.fillRect(x+14,y,2,16);ctx.fillStyle=act?'#9aa3b5':'#6a7080';ctx.fillRect(x,y,16,shut);ctx.fillRect(x,y+16-shut,16,shut)}ctx.fillStyle='#ffd23f';ctx.fillRect(x+(tr.ori==='v'?7:1),y+(tr.ori==='v'?1:7),2,1)}
      else if(k==='field'){ctx.globalAlpha*=.18+.06*Math.sin(now*2+j);ctx.fillStyle=col;ctx.fillRect(x,y,16,16);ctx.globalAlpha=tr.armed?.7:.2;for(let q=0;q<3;q++)ctx.fillRect(x+((j*7+q*5+((now*3)|0))%15),y+((j*3+q*7+((now*4)|0))%15),1,1)}
      ctx.globalAlpha=1}}
  // conveyor chevrons
  const M=G.M;if(M.conv){ctx.fillStyle='#ffd23f';const sh=((now*6)|0)%4;for(let j=0;j<M.conv.length;j++){const d=M.conv[j];if(!d||!G.seen[j])continue;const x=(j%W)*TS,y=((j/W)|0)*TS;for(let q=0;q<4;q++){const cx=x+((q*4+sh*d+16)%16);ctx.fillRect(cx,y+6,1,1);ctx.fillRect(cx+d,y+7,1,1);ctx.fillRect(cx,y+8,1,1)}}}
}}
{const _fd=fxDraw;fxDraw=function(){_fd();if(!G||MODE!=='raid'||!DEEP_BASE[G.biome])return;const b=G.biome,vw=CWd/S,vh=CHd/S,cx=G.cam.x,cy=G.cam.y,x0=cx-vw/2,y0=cy-vh/2;
  G.atmo=G.atmo||[];const A=G.atmo;const want={frost:120,desert:90,biolab:50,factory:30,fog:0}[b]||0;
  while(A.length<want)A.push({x:x0+Math.random()*vw,y:y0+Math.random()*vh,v:Math.random(),p:Math.random()*6});
  const t=performance.now()/1000;
  for(const p of A){if(b==='frost'){p.y+=.35+p.v*.5;p.x+=Math.sin(t+p.p)*.2;ctx.fillStyle=p.v>.7?'#ffffff':'#d8ecff';ctx.fillRect(p.x|0,p.y|0,p.v>.85?2:1,p.v>.85?2:1)}
    else if(b==='desert'){p.x+=1.1+p.v*1.4;p.y+=Math.sin(t*2+p.p)*.15;ctx.fillStyle=p.v>.5?'#e0c070':'#b08a50';ctx.fillRect(p.x|0,p.y|0,p.v>.8?2:1,1)}
    else if(b==='biolab'){p.y-=.12+p.v*.15;p.x+=Math.sin(t*.8+p.p)*.25;ctx.globalAlpha=.6;ctx.fillStyle=p.v>.5?'#c8ff9a':'#ff9ad0';ctx.fillRect(p.x|0,p.y|0,1,1);ctx.globalAlpha=1}
    else if(b==='factory'){p.y-=.25+p.v*.3;ctx.globalAlpha=.25;ctx.fillStyle='#e0e6f0';ctx.fillRect(p.x|0,p.y|0,2+(p.v*2|0),2);ctx.globalAlpha=1}
    if(p.x<x0-4||p.x>x0+vw+4||p.y<y0-4||p.y>y0+vh+4){p.x=b==='desert'?x0-2:x0+Math.random()*vw;p.y=b==='frost'?y0-2:b==='biolab'||b==='factory'?y0+vh+2:y0+Math.random()*vh}}
  if(b==='fog'){const P=G.p,hx=P.rx*TS+8,hy=P.ry*TS+8,r1=(2.2+Math.floor(((P.attr&&P.attr.per)||5)/4))*TS,g=ctx.createRadialGradient(hx,hy,r1*.35,hx,hy,r1*1.25);
    g.addColorStop(0,'rgba(225,228,236,0)');g.addColorStop(1,'rgba(225,228,236,.88)');ctx.fillStyle=g;ctx.fillRect(x0,y0,vw,vh);
    ctx.globalAlpha=.08;ctx.fillStyle='#ffffff';for(let k=0;k<6;k++){const fx=x0+((t*12+k*97)%vw),fy=y0+((k*53)%vh);ctx.fillRect(fx,fy,40,6)}ctx.globalAlpha=1}
}}
// ---------- zones & music for the new areas ----------
ZONES.push({b:'frost',f:6,lv:'11+',rar:4,tier:3},{b:'biolab',f:7,lv:'13+',rar:4,tier:3},{b:'desert',f:8,lv:'15+',rar:4,tier:3},{b:'fog',f:9,lv:'17+',rar:4,tier:3},{b:'factory',f:10,lv:'19+',rar:4,tier:3});
// trap handbook in settings
function trapBook(){const K={plate:'плита',pit:'провал',mine:'мина',laser:'луч',timed:'по циклу',spike:'из стены',line:'по щели',door:'дверь',field:'зона'};
  showOv(`<h2>ЛОВУШКИ · ${TRAPS.length}</h2><p class="help">Скрытые ловушки замечает Внимательность (и немного Интеллект). Ловкость помогает отскочить и увернуться от циклических. Интеллект от 4 позволяет выжидать цикл и обезвреживать найденные ловушки — за это дают детали.</p>
  <div class="tbook">${TRAPS.map(d=>`<div class="tb"><i style="background:${TR_COL[d.el]}"></i><b>${d.n}</b><span>${K[d.kind]} · ${d.bio==='*'?'везде':d.bio.split(',').map(x=>BIOMES[x]?BIOMES[x].name.split(':')[0].toLowerCase():x).join(', ')}</span><p>${d.d}</p></div>`).join('')}</div>
  <div class="row"><button class="btn" id="oBackS">Назад</button></div>`,true);$('oBackS').onclick=()=>settingsPanel();bindOv()}
{const _sp=settingsPanel;settingsPanel=function(){_sp();const p=$('panel'),s=p.querySelector('.setg');if(s){const b=document.createElement('button');b.className='btn';b.textContent=`Ловушки (${TRAPS.length})`;b.onclick=trapBook;s.appendChild(b)}}}

{const _wt=worldTick;worldTick=function(){_wt();if(MODE==='raid'&&G&&!G.dead&&G.p){const P=G.p,bx=P.x,by=P.y;hazardsTick(false,[0,0],'time');if(P.x!==bx||P.y!==by){P.mvDur=STEP;computeFOV()}}}}
