const MOD_ORDER=['gen','bench','research','printer','med','lib','gym','recycler'];
// ================= SHELTER v2: the room grows with the base, a candle until there is power =================
function baseLayout(){
  const b=ST.base,mods=['gen','bench','med','wrack','recycler','lib','gym'].filter(k=>b[k]),farm=b.farm||0,need=mods.length+(farm?1:0);
  const lit=(b.light||0)>=1;
  if(need===0&&!lit)return{size:'small',W:8,H:7,in:[1,2,6,4],exit:[4,5],rug:null,bed:[1,2],crate:[2,2],terminal:[5,2],slots:[],farm:[],hero:[3,4]};
  if(need<=3)return{size:'medium',W:11,H:10,in:[1,2,9,7],exit:[5,8],rug:[3,4,7,6],bed:[1,2],crate:[2,2],terminal:[5,2],slots:[[8,2],[9,4],[1,5],[9,6],[6,2]],farm:[[1,7],[2,7],[3,7]],hero:[6,7]};
  return{size:'large',W:15,H:12,in:[1,2,13,9],exit:[7,10],rug:[4,4,10,7],bed:BPOS.bed,crate:BPOS.crate,terminal:BPOS.terminal,slots:null,farm:BPOS.farm,hero:[13,9]};
}
const candleOn=()=>!(((ST.base.light||0)>=1)&&powered());
function enterBase(){
  MODE='base';migrateST();
  const L=baseLayout(),W=L.W,Hh=L.H,t=new Uint8Array(W*Hh).fill(2),room=new Uint8Array(W*Hh).fill(1);
  for(let y=L.in[1];y<=L.in[3];y++)for(let x=L.in[0];x<=L.in[2];x++)t[y*W+x]=1;t[L.exit[1]*W+L.exit[0]]=1;if(L.walls)for(const[x,y]of L.walls)t[y*W+x]=2;
  const M={W,H:Hh,t,room,seed:777,biome:'base',exit:{x:L.exit[0],y:L.exit[1]},evac:null,rooms:[],rug:L.rug};
  const baked=renderMap(M);
  const objs=[];const add=(kind,x,y,spr,lv)=>{objs.push({kind,x,y,spr,lv});t[y*W+x]=4};
  const b=ST.base,pw=powered();
  add('bed',...L.bed,baseSprite('bed',b.bed),b.bed);
  add('crate',...L.crate,baseSprite('crate',b.crate),b.crate);
  add('terminal',...L.terminal,baseSprite('terminal',1),1);
  const mods=MOD_ORDER.filter(k=>UP[k]&&b[k]);
  mods.forEach((k,i)=>{const pos=L.slots?L.slots[i]:BPOS[k];if(pos)add(k,...pos,baseSprite(k,b[k]),b[k])});
  for(let i=0;i<(b.farm||0);i++)if(L.farm[i])add('farm',...L.farm[i],makeProp(1000+i*17,'rack').spr,b.farm);
  if(ST.building&&!b[ST.building.k]){const free=[];for(let y=L.in[1];y<=L.in[3];y++)for(let x=L.in[0];x<=L.in[2];x++)if(t[y*W+x]===1&&!(L.doors||[]).some(([a,c])=>Math.abs(a-x)+Math.abs(c-y)<=1)&&!(x===L.hero[0]&&y===L.hero[1])&&y>L.in[1])free.push([x,y]);
    const p=free.length?free[free.length-1]:null;
    if(p){objs.push({kind:ST.building.k,x:p[0],y:p[1],spr:pixGrid(16,20,P=>{for(let y=8;y<20;y++)for(let x=1;x<15;x++)if((x+y)%4===0||y===8||y===19)P(x,y,(x+y)%8<4?'#f9d030':'#14161c')}),lv:0,site:1});t[p[1]*W+p[0]]=4}}
  const neons=[],lights=[];const cx=(W/2),candle=candleOn();
  if(candle){lights.push({x:L.crate[0]+.6,y:L.crate[1]+.1,c:[255,170,90],rad:3.4,int:.9,kind:'candle'})}
  else{lights.push({x:cx,y:Hh/2,c:[255,190,120],rad:Math.max(W,Hh)*.6,int:.75,kind:'win'});
    if(b.light>=1){lights.push({x:2.5,y:3,c:[255,210,140],rad:5,int:.5,kind:'win'},{x:W-2.5,y:3,c:[255,210,140],rad:5,int:.5,kind:'win'})}
    if(b.light>=2&&L.size==='large'){const pts=[];[[0,0],[0,1],[0,2],[1,0],[2,0],[2,1],[2,2],[4,0],[4,1],[4,2],[5,2],[6,0],[6,1],[6,2],[8,0],[8,1],[8,2],[9,1],[10,0],[10,1],[10,2]].forEach(([x,y])=>pts.push([3+x,5+y]));
      neons.push({x:5,y:1,col:'#ff2fa8',pts,ph:1},{x:9,y:1,col:'#22e6ff',pts:makeSign(RNG(5)),ph:4});
      lights.push({x:5.5,y:2.3,c:[255,47,168],rad:5,int:.8,kind:'neon',ref:neons[0]},{x:9.5,y:2.3,c:[34,230,255],rad:5,int:.7,kind:'neon',ref:neons[1]})}}
  lights.push({x:L.terminal[0]+.5,y:L.terminal[1]+.2,c:[255,47,168],rad:candle?1.6:3,int:candle?.6:.5,kind:'win'});
  BS={M,L,mapC:baked.c,objs,neons,lights,candle,hero:{x:L.hero[0],y:L.hero[1],rx:L.hero[0],ry:L.hero[1]},path:[],pending:null,cool:0,time:BS?BS.time:0,cam:{x:W*TS/2,y:Hh*TS/2},dark:!pw&&needsPower()&&!candle};
  H.x=H.rx=L.hero[0];H.y=H.ry=L.hero[1];H.face=-1;
  // coming home is rest: full HP/EN, a better bed leaves a buff for the next raid
  if(!H.dead){const l=ST.base.bed||1;if(l>=2&&!ST.buff)ST.buff={hp:10*(l-1),en:5*(l-1)};recalc(H);H.hp=H.st.mhp;H.mp=H.st.mmp}
  if(H.dead&&typeof SHEET!=='undefined'&&SHEET)closeSheet();
  setModeUI();updateHUD();
}
let _dark=null;
function crateTop(spr){if(spr._top!=null)return spr._top;const d=spr.getContext('2d').getImageData(0,0,spr.width,spr.height).data;let t=spr.height;for(let y=0;y<spr.height&&t===spr.height;y++)for(let x=8;x<13;x++)if(d[(y*spr.width+x)*4+3]>100){t=y;break}spr._top=t;return t}
function renderBase(time){
  const B=BS,M=B.M;const[ox,oy]=camOrigin();const s=curS();
  ctx.setTransform(s,0,0,s,ox,oy);ctx.imageSmoothingEnabled=false;ctx.drawImage(B.mapC,0,0);
  const list=B.objs.map(o=>({obj:o,ry:o.y-.01}));list.push(H);list.sort((a,b)=>a.ry-b.ry);
  let cand=null;
  for(const e of list){if(e.obj){const o=e.obj;ctx.fillStyle='rgba(0,0,0,.35)';ctx.fillRect(o.x*TS+1,o.y*TS+13,14,3);ctx.drawImage(o.spr,o.x*TS,o.y*TS-4);
      if(B.candle&&o.kind==='crate'){const top=o.y*TS-4+crateTop(o.spr),cx=o.x*TS+10;ctx.fillStyle='#d8cfb4';ctx.fillRect(cx,top-4,2,4);ctx.fillStyle='#a89a7a';ctx.fillRect(cx+1,top-4,1,4);ctx.fillStyle='#000';ctx.fillRect(cx,top-1,3,1);
        const fl=Math.sin(time*13)+Math.sin(time*7.3)*.6;ctx.fillStyle='#ff8a1f';ctx.fillRect(cx,top-6,2,2);ctx.fillStyle='#ffe9a0';ctx.fillRect(cx+(fl>.4?1:0),top-7-(fl>1?1:0),1,2);cand={x:cx+1,y:top-6,f:fl}}}
    else if(!H.dead)drawActor(H,time)}
  ctx.imageSmoothingEnabled=true;
  if(B.candle){
    // darkness with a flickering circle of candle light
    const w=M.W*TS,h=M.H*TS;if(!_dark||_dark.width!==w||_dark.height!==h){_dark=document.createElement('canvas');_dark.width=w;_dark.height=h}
    const d=_dark.getContext('2d');d.globalCompositeOperation='source-over';d.clearRect(0,0,w,h);d.fillStyle='rgba(3,2,10,.93)';d.fillRect(0,0,w,h);
    d.globalCompositeOperation='destination-out';
    const hole=(x,y,r,a)=>{const g=d.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(0,0,0,${a})`);g.addColorStop(.5,`rgba(0,0,0,${a*.7})`);g.addColorStop(1,'rgba(0,0,0,0)');d.fillStyle=g;d.fillRect(x-r,y-r,r*2,r*2)};
    if(cand)hole(cand.x,cand.y+6,(3.3+.12*cand.f)*TS,1);
    const tl=B.objs.find(o=>o.kind==='terminal');if(tl)hole(tl.x*TS+8,tl.y*TS+4,1.4*TS,.55);
    hole(M.exit.x*TS+8,M.exit.y*TS+4,1.1*TS,.45);
    ctx.drawImage(_dark,0,0);
    ctx.globalCompositeOperation='lighter';
    if(cand){const r=(2.6+.1*cand.f)*TS,g=ctx.createRadialGradient(cand.x,cand.y,0,cand.x,cand.y,r);g.addColorStop(0,'rgba(255,170,80,.28)');g.addColorStop(1,'rgba(255,120,40,0)');ctx.fillStyle=g;ctx.fillRect(cand.x-r,cand.y-r,r*2,r*2)}
    if(tl){const g=ctx.createRadialGradient(tl.x*TS+8,tl.y*TS+4,0,tl.x*TS+8,tl.y*TS+4,TS*1.3);g.addColorStop(0,'rgba(255,47,168,.22)');g.addColorStop(1,'rgba(255,47,168,0)');ctx.fillStyle=g;ctx.fillRect(tl.x*TS-14,tl.y*TS-18,44,44)}
  } else {
    ctx.globalCompositeOperation='lighter';
    for(const l of B.lights){const cx=l.x*TS,cy=l.y*TS,r=l.rad*TS;let f=l.int;if(l.kind==='neon')f*=neonOn(l.ref,time)?1:.2;const g=ctx.createRadialGradient(cx,cy,0,cx,cy,r);g.addColorStop(0,`rgba(${l.c.join(',')},${.18*f})`);g.addColorStop(1,`rgba(${l.c.join(',')},0)`);ctx.fillStyle=g;ctx.fillRect(cx-r,cy-r,r*2,r*2)}
    drawEmissive({neons:B.neons,seen:null,M},time);
    if(B.dark){ctx.globalCompositeOperation='source-over';ctx.fillStyle='rgba(0,0,10,.35)';ctx.fillRect(0,0,M.W*TS,M.H*TS);ctx.globalCompositeOperation='lighter'}
    for(const o of B.objs)if(o.kind==='farm'&&!B.dark){for(let k=0;k<4;k++){if(Math.sin(time*3+k*2+o.x)>0){ctx.fillStyle=['#3aff6a','#22e6ff','#ffb02e','#3aff6a'][k];ctx.fillRect(o.x*TS+5+k,o.y*TS-2+k*3,1,1)}}}
  }
  if(!H.dead){const a=.5+.5*Math.sin(time*3),ex=M.exit.x*TS,ey=M.exit.y*TS;ctx.fillStyle=`rgba(80,255,140,${.4+.4*a})`;ctx.fillRect(ex+6,ey-7-Math.round(a*2),4,1);ctx.fillRect(ex+7,ey-6-Math.round(a*2),2,1)}
  ctx.globalCompositeOperation='source-over';ctx.imageSmoothingEnabled=false;
  heroMarker(H,time);
}
// loadout = the same inventory sheet as in the raid, plus the launch block
function loadoutPanel(){if(H.dead){TTAB='hire';return tradePanel()}heroPanel()}
function launchHTML(){
  const n=Math.max(5,Math.min(ST.maxDepth+1,8)),route=[];for(let f=1;f<=n;f++)route.push(`${f}.${BIOMES[biomeFor(f)].name}`);
  const warn=H.hp<H.st.mhp*.6?'<span style="color:#ff6a7a">ранен</span> · ':'';
  return`<div class="launch"><p class="route">${warn}Маршрут: ${route.join(' › ')}${n<ST.maxDepth+1?'':' › …'}</p><button class="btn go" id="hGo">▶ НАЧАТЬ РЕЙД</button></div>`;
}
