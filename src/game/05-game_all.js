// ================= GAME =================
const $=id=>document.getElementById(id);
const rnd=a=>a[0]+Math.floor(Math.random()*(a[1]-a[0]+1));
const md=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const cheb=(a,b)=>Math.max(Math.abs(a.x-b.x),Math.abs(a.y-b.y));
const dst=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

// creature sprites
function spr(rows,pal){const c=document.createElement('canvas');c.width=c.height=16;const x=c.getContext('2d');
  const off=16-rows.length;rows.forEach((r,y)=>{for(let i=0;i<16;i++){const ch=r[i];if(ch&&ch!=='.'&&pal[ch]){x.fillStyle=pal[ch];x.fillRect(i,y+off,1,1)}}});return c}
const SP={};
SP.rat=spr(["..oo.oo.........",".oppoppo........",".oggggggooooo...","oeggggggglllgo..","oggggggggggggo..","opggggggggggggop",".oodgggggggddoop","..odo....odo..p.","................"],{o:'#1a1216',g:'#6d6a72',l:'#99969e',d:'#47434c',p:'#d98a96',e:'#ff3344'});
SP.slime=spr(["......oooo......","....oolwggoo....","...olwggggggo...","..oglgggggggdo..","..ogegggggegdo..",".ogggggggggggdo.",".oddddddddddddo.","..oooooooooooo.."],{o:'#0f1a12',g:'#4fbf5a',l:'#9af07f',d:'#2d7a3a',e:'#0f1a12',w:'#e8ffe0'});
SP.drone=spr(["..oooo....oooo..",".olllo....olllo.","...oo......oo...","....oooooooo....","...ollllllllo...","..ommmmmmmmmmo..","..omdrrdmmmmmo..","..ommmmmmmmmmo..","...oddddddddo...","....o.oyyo.o....","................","................","................"],{o:'#0c0a12',m:'#5a6070',l:'#9aa3b5',d:'#2e3240',r:'#ff2f4f',y:'#ffd23f'});
SP.dog=spr(["...oo...........","..oddo..........",".oeddddo........","oddddddooooooo..","oNdddddddddddo.o",".oodddddddddddo.d","...oddddlldddoo..","...odo.oo..odo...","...odo......odo..","...oo........oo.."],{o:'#140e0a',d:'#6a4a2c',l:'#8a6a4a',e:'#ff3344',N:'#14100c'});
SP.sentry=spr(["...oooooooooo...","..ommmmmmmmmmo..",".ommdddrrdddmmo.",".omddrRRRrddmo..",".ommdddrrdddmmo.","..ommmmmmmmmmo..","...oolo..olo....","....oo....oo....","................","................","................"],{o:'#0c0a12',m:'#4a3a44',d:'#2a1a22',r:'#ff2f4f',R:'#ffd0d8',l:'#8a6a7a'});
for(const k of['rat','slime','drone','dog','sentry'])SP[k+'W']=whiteOf(SP[k]);
const CREATURE={
  rat:{name:'Крыса',hp:7,hpF:2,w:{cat:'melee',dmg:[1,3],crit:.05}},
  slime:{name:'Слизень',hp:13,hpF:3,slow:true,w:{cat:'melee',dmg:[2,4],crit:.02}},
  drone:{name:'Дрон',hp:10,hpF:2,hover:true,w:{cat:'ranged',dmg:[2,4],range:4,acc:.75,burst:1,tracer:'#ff3355'}},
  dog:{name:'Бродячий пёс',hp:9,hpF:2,w:{cat:'melee',dmg:[2,4],crit:.1}},
  sentry:{name:'Страж-дрон',hp:18,hpF:4,hover:true,w:{cat:'ranged',dmg:[3,6],range:6,acc:.8,burst:1,tracer:'#ff3355'}}};
const FISTS={cat:'melee',name:'Кулаки',dmg:[1,3],crit:.05,stun:0};

const cv=$('cv'),ctx=cv.getContext('2d');
let DPR=1,S=4,CWd=0,CHd=0,zoom=0;
function resize(){DPR=Math.min(window.devicePixelRatio||1,2);CWd=cv.width=Math.round(innerWidth*DPR);CHd=cv.height=Math.round(innerHeight*DPR);
  S=Math.max(2,Math.floor(Math.min(CWd,CHd*.72)/(TS*9))+zoom)}
addEventListener('resize',resize);resize();

let G=null;const STEP=.34;
const idx=(x,y)=>y*G.M.W+x;
const TT=(x,y)=>{const M=G.M;return x<0||y<0||x>=M.W||y>=M.H?0:M.t[y*M.W+x]};
const clear=v=>v===1||v===3||v===4;
function rebuildSprites(a){a.spr={m:actorSprites(a.ch,a.eq?a.eq.melee:a.weapon),r:actorSprites(a.ch,a.eq?a.eq.ranged:a.weapon)}}
const avg=d=>(d[0]+d[1])/2;
function score(it,h){
  switch(it.cat){
    case 'melee':return avg(it.dmg)*(1+it.crit)*(1+(it.stun||0));
    case 'ranged':return avg(it.dmg)*(it.burst||1)*it.acc*(.7+it.range/20)*((h&&h.inv.ammo[it.ammo]>=6)?1:.3);
    case 'armor':return it.def*4+(it.hp||0)*.3;
    case 'clothes':return (it.def||0)*4+it.dodge*40;
    case 'implant':return mul(it);
  }return 0;
}
// ---------- enemies ----------
function makeEnemy(x,y,forceHuman){
  const B=BIOMES[G.biome],f=G.eff||G.floor;
  const human=forceHuman??(Math.random()<B.human);
  if(human){
    const ch=randomChar(B.density);const bi=['худощавое','среднее','крепкое','массивное'].indexOf(ch.g.traits['Телосложение']);
    const rngd=Math.random()<B.ranged;const wk=rngd?B.rk[(Math.random()*B.rk.length)|0]:B.mk[(Math.random()*B.mk.length)|0];
    const weapon=makeItem(rseed(),rngd?'ranged':'melee',f,{kind:wk});weapon.dur=Math.max(1,Math.round(weapon.mdur*(.25+.6*Math.random())));
    const armor=Math.random()<B.armor?makeItem(rseed(),'armor',f):null;
    const hp=10+f*4+bi*3+(G.biome==='core'?(f-4)*3:0);
    const e={id:G.uid++,human:true,ch,H:ch.g.H,name:`${B.titles[(Math.random()*B.titles.length)|0]} ${ch.name.split(' ')[0]}`,x,y,rx:x,ry:y,hp,mhp:hp,def:armor?armor.def:0,dodge:.03,weapon,armor,
      awake:false,flash:0,bump:null,dead:false,fade:0,face:-1,ph:Math.random()*6,stun:0};
    e.spr=actorSprites(ch,weapon);return lvlScale(e);
  }
  const type=B.creatures[(Math.random()*B.creatures.length)|0],C=CREATURE[type],hp=C.hp+C.hpF*(f-1);
  const w={...C.w,dmg:[C.w.dmg[0]+Math.floor((f-1)/2),C.w.dmg[1]+Math.floor((f-1)/2)]};
  return lvlScale({id:G.uid++,human:false,type,name:C.name,x,y,rx:x,ry:y,hp,mhp:hp,def:0,dodge:type==='rat'?.08:0,weapon:w,slow:!!C.slow,hover:!!C.hover,tick:0,
    awake:false,flash:0,bump:null,dead:false,fade:0,face:-1,ph:Math.random()*6,stun:0});
}
function lvlScale(e){const P=G&&G.p;if(!P)return e;const k=1+.03*Math.max(0,(P.lvl||1)-1)+.02*Math.max(0,(G.threat||0)-G.floor);if(k>1){e.hp=e.mhp=Math.round(e.mhp*k)}return e}
const enemyAt=(x,y)=>G.en.find(e=>!e.dead&&e.x===x&&e.y===y);
function freeTile(test){const M=G.M;for(let k=0;k<200;k++){const x=(Math.random()*M.W)|0,y=(Math.random()*M.H)|0;
  if(M.t[y*M.W+x]===1&&!(x===M.exit.x&&y===M.exit.y)&&!(x===G.p.x&&y===G.p.y)&&!enemyAt(x,y)&&test(x,y))return{x,y}}return null}

function roomTile(r){const M=G.M;for(let k=0;k<30;k++){const x=rnd([r.x,r.x+r.w-1]),y=rnd([r.y,r.y+r.h-1]);
  if(M.t[y*M.W+x]===1&&!isExit(x,y)&&!(x===M.start.x&&y===M.start.y)&&!enemyAt(x,y))return{x,y}}return null}
function pickCat(){const tab=[['med',4],['battery',3],['ammo',1.6],['melee',3.2],['ranged',.55],['armor',1.5],['clothes',1.5],['implant',2.2],['grenade',2]];
  let r=Math.random()*tab.reduce((a,b)=>a+b[1],0);for(const[c,w]of tab){if((r-=w)<0)return c}return 'ammo'}
function dropItem(it,x,y){it.x=x;it.y=y;it.ph=Math.random()*6;G.items.push(it)}
function los(x0,y0,x1,y1){const {W,t}=G.M;let dx=Math.abs(x1-x0),dy=-Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1,err=dx+dy,x=x0,y=y0;
  for(;;){if(x===x1&&y===y1)return true;if(!(x===x0&&y===y0)&&!clear(t[y*W+x]))return false;const e2=2*err;if(e2>=dy){err+=dy;x+=sx}if(e2<=dx){err+=dx;y+=sy}}}
function bfsMap(srcs,maxD){
  const {W,H,t}=G.M,d=new Int32Array(W*H).fill(9999),q=[];for(const[x,y]of srcs){const i=y*W+x;d[i]=0;q.push(i)}
  for(let h=0;h<q.length;h++){const c=q[h];if(d[c]>=maxD)continue;for(const[dx,dy]of DIRS){const n=c+dy*W+dx;if(t[n]===1&&d[n]===9999){d[n]=d[c]+1;q.push(n)}}}
  return d;
}

// ---------- combat ----------
function float(ent,text,col,dy=0){G.floats.push({x:ent.x*TS+8,y:ent.y*TS-4+dy,text:String(text),col,t:0})}
function hurt(def,dmg,att,crit){
  if(def.isHero){
    const P=G.p;
    if(Math.random()<P.st.dodge){float(P,'уклон','#9ad8ff');return}
    dmg=Math.max(1,dmg-P.st.def);
    if(G.shield>0){const a=Math.min(G.shield,dmg);G.shield-=a;dmg-=a;if(a)float(P,'щит','#22e6ff',-6)}
    P.flash=1;if(dmg<=0)return;dmg=Math.max(1,Math.round(dmg*(1-(P.st.dr||0))));P.hp-=dmg;float(P,'-'+dmg,'#ff4b4b');
    if(P.hp<=0){P.hp=0;G.dead=true;G.deadT=3;G.deadAt=performance.now();G.deadFace=P.face||1;G.killer=att&&att.name||'';log(`${att?att.name:'Что-то'} добивает героя`,'#ff4b4b')}
  } else {
    if(Math.random()<(def.dodge||0)){float(def,'мимо','#b9ad95');return}
    dmg=Math.max(1,dmg-(def.def||0));def.hp-=dmg;def.flash=1;def.awake=true;
    float(def,(crit?'!':'')+dmg,crit?'#ffd23f':'#ffffff');
    if(def.hp<=0)kill(def);
  }
}
function heroMelee(e){const P=G.p,w=P.eq.melee||FISTS;if(Math.random()<(P.st.selfMiss||0)){P.bump={dx:e.x-P.x,dy:e.y-P.y,t:0};P.showW='m';float(e,'промах','#b9ad95');return}let dmg=Math.round((rnd(w.dmg)+P.st.atk)*(P.st.meleeMul||1));const crit=Math.random()<(w.crit+P.st.crit);if(crit)dmg*=2;
  P.bump={dx:e.x-P.x,dy:e.y-P.y,t:0};if(e.x!==P.x)P.face=Math.sign(e.x-P.x);P.showW='m';
  hurt(e,dmg,P,crit);fxOnHit(P,e,w,crit);if(!e.dead&&w.stun&&Math.random()<w.stun){e.stun=1;float(e,'оглушён','#22e6ff',-6)}}
function heroShoot(e){const P=G.p,w=P.eq.ranged;if(!w)return;P.showW='r';if(e.x!==P.x)P.face=Math.sign(e.x-P.x);
  for(let s=0;s<(w.burst||1);s++){
    if(P.inv.ammo[w.ammo]<=0){log('Нет патронов: '+w.ammo,'#ffb04a');break}
    P.inv.ammo[w.ammo]--;const d=dst(P,e);
    const hit=Math.random()<w.acc+P.st.acc-.03*Math.max(0,d-2);
    tracer(P,e,w.tracer,hit,s*.06);fxOnShot(P,e,w,hit);
    if(e.dead)continue;
    if(hit){let dmg=rnd(w.dmg)+P.st.atk;if(w.kind==='дробовик'&&d<=2)dmg=Math.round(dmg*1.4);const crit=Math.random()<.06+P.st.crit;if(crit)dmg*=2;hurt(e,dmg,P,crit)}
    else float(e,'мимо','#b9ad95',-s*6);
  }}
const eMul=()=>{const f=G.eff||G.floor;return .65+.07*Math.min(f-1,7)+(f>4?.06*(f-4):0)};
function enemyMelee(e){const P=G.p,w=e.weapon.cat==='melee'?e.weapon:{dmg:[1,3],crit:.03};let dmg=Math.max(1,Math.round(rnd(w.dmg)*eMul()));const crit=Math.random()<(w.crit||0);if(crit)dmg=Math.round(dmg*1.6);
  e.bump={dx:P.x-e.x,dy:P.y-e.y,t:0};if(P.x!==e.x)e.face=Math.sign(P.x-e.x);hurt(P,dmg,e);fxOnHit(e,P,e.weapon&&e.weapon.cat==='melee'?e.weapon:null)}
function enemyShoot(e){const P=G.p,w=e.weapon;if(P.x!==e.x)e.face=Math.sign(P.x-e.x);
  for(let s=0;s<(w.burst||1);s++){const d=dst(P,e),hit=Math.random()<w.acc-.1-.04*Math.max(0,d-2);tracer(e,P,w.tracer||'#ffe9a0',hit,s*.06);fxOnShot(e,P,w,hit);
    if(G.dead)return;if(hit)hurt(P,Math.max(1,Math.round(rnd(w.dmg)*eMul())),e);else float(P,'мимо','#b9ad95',-s*6)}}
function tracer(a,b,col,hit,delay){a.aim={x:b.x,y:b.y,until:performance.now()+900};const ox=hit?0:(Math.random()-.5)*14,oy=hit?0:(Math.random()-.5)*14;
  G.fx.push({type:'shot',x0:a.x*TS+8+(a.face||1)*5,y0:a.y*TS+6,x1:b.x*TS+8+ox,y1:b.y*TS+6+oy,col,t:-delay*4})}
function kill(e){
  e.dead=true;e.fade=1;G.kills++;if(H&&H.stats)H.stats.kills++;try{deathFx(e)}catch(_){}const P=G.p;P.xp+=(P.st.xpMul||1);G.xpGain=(G.xpGain||0)+(P.st.xpMul||1);
  log(`${e.name} повержен`,'#d8cdb4');
  const drops=[];
  if(e.human){if(Math.random()<(e.weapon&&e.weapon.cat==='ranged'?.1:.4))drops.push(e.weapon);if(e.armor&&Math.random()<.35)drops.push(e.armor);if(Math.random()<.35)drops.push(makeItem(rseed(),Math.random()<.18?'ammo':Math.random()<.3?'grenade':(Math.random()<.55?'med':'battery'),G.floor))}
  else if(Math.random()<.22)drops.push(makeItem(rseed(),Math.random()<.2?'ammo':'med',G.floor));
  drops.forEach(it=>dropItem(it,e.x,e.y));
  if(P.xp>=6+P.lvl*2){P.xp=0;P.lvl++;P.pts=(P.pts||0)+1;recalc(P);P.hp=Math.min(P.st.mhp,P.hp+Math.round(P.st.mhp*.3));G.floats.push({x:P.x*TS+8,y:P.y*TS-14,text:'УРОВЕНЬ '+P.lvl,col:'#7dff4f',t:0});log('Новый уровень: '+P.lvl+' · +1 очко характеристик','#7dff4f')}
}

// ---------- player-triggered actions ----------
function useMed(){const P=G.p;if(!P.inv.meds.length){log('Нет аптечек','#ffb04a');return false}
  const miss=P.st.mhp-P.hp;P.inv.meds.sort((a,b)=>a.heal-b.heal);let i=P.inv.meds.findIndex(m=>m.heal>=miss);if(i<0)i=P.inv.meds.length-1;
  const m=P.inv.meds.splice(i,1)[0];const h=Math.min(miss,Math.round(m.heal*(P.st.healMul||1)));P.hp+=h;float(P,'+'+h,'#7dff4f');log(`${m.name}: +${h} HP`,'#7dff4f');return true}
function useBat(){const P=G.p;if(!P.inv.bats.length){log('Нет батарей','#ffb04a');return false}
  const miss=P.st.mmp-P.mp;P.inv.bats.sort((a,b)=>a.energy-b.energy);let i=P.inv.bats.findIndex(m=>m.energy>=miss);if(i<0)i=P.inv.bats.length-1;
  const m=P.inv.bats.splice(i,1)[0];const h=Math.min(miss,m.energy);P.mp+=h;float(P,'+'+h+' EN','#4c9fff');log(`${m.name}: +${h} энергии`,'#4c9fff');return true}
function useImplant(s){
  const P=G.p,it0=P.eq.act[s];if(!it0)return false;
  const it={...it0,cost:Math.max(1,Math.round(it0.cost*(P.st.costMul||1))),pow:it0.pow<1?+(it0.pow*(P.st.impMul||1)).toFixed(2):Math.round(it0.pow*(P.st.impMul||1))};
  if(it0.fxt){if(P.cds[s]>0){log(`${it0.kind}: перезарядка ${tsec(P.cds[s])}`,'#ffb04a');return false}if(P.mp<it.cost){log('Мало энергии','#ffb04a');return false}return fxImplant(s,it0,it)}
  if(P.cds[s]>0){log(`${it.kind}: перезарядка ${tsec(P.cds[s])}`,'#ffb04a');return false}
  if(P.mp<it.cost){log('Мало энергии','#ffb04a');return false}
  const vis=G.en.filter(e=>!e.dead&&G.vis[idx(e.x,e.y)]);
  switch(it.eff){
    case 'Электро-разряд':{const tg=vis.filter(e=>cheb(e,P)<=2);G.fx.push({type:'ring',x:P.x*TS+8,y:P.y*TS+8,col:'34,230,255',t:0,r:36});
      tg.forEach(e=>hurt(e,rnd([it.pow,Math.round(it.pow*1.6)]),P));log(`Электро-разряд: целей ${tg.length}`,'#22e6ff');break}
    case 'Ракетный модуль':{const tg=vis.filter(e=>los(P.x,P.y,e.x,e.y)).sort((a,b)=>dst(a,P)-dst(b,P))[0];if(!tg){log('Нет цели для ракеты','#ffb04a');return false}
      G.fx.push({type:'shot',x0:P.x*TS+8,y0:P.y*TS+4,x1:tg.x*TS+8,y1:tg.y*TS+8,col:'#ff8a1f',t:0,thick:1});G.fx.push({type:'ring',x:tg.x*TS+8,y:tg.y*TS+8,col:'255,138,31',t:-.25,r:26});
      const tx=tg.x,ty=tg.y;hurt(tg,rnd([it.pow,Math.round(it.pow*1.5)]),P);
      G.en.filter(e=>!e.dead&&e!==tg&&Math.max(Math.abs(e.x-tx),Math.abs(e.y-ty))<=1).forEach(e=>hurt(e,Math.round(it.pow/2),P));log('Ракета выпущена','#ff8a1f');break}
    case 'Нано-ремонт':{const h=Math.min(P.st.mhp-P.hp,Math.round(P.st.mhp*it.pow));P.hp+=h;float(P,'+'+h,'#7dff4f');G.fx.push({type:'ring',x:P.x*TS+8,y:P.y*TS+8,col:'125,255,79',t:0,r:18});log(`Нано-ремонт: +${h} HP`,'#7dff4f');break}
    case 'Оптический камуфляж':G.camo=it.pow;G.en.forEach(e=>e.awake=false);log(`Камуфляж: ${tsec(it.pow)}`,'#b45cff');break;
    case 'Щит-проектор':G.shield=it.pow;G.shieldT=6;log(`Щит: ${it.pow}`,'#22e6ff');break;
    case 'Рефлекс-ускоритель':G.haste=it.pow;log(`Ускорение: ${tsec(it.pow)}`,'#f9f871');break;
  }
  P.mp-=it.cost;P.cds[s]=it.cd+1;return true;
}

// ---- real-time: every enemy acts on its own timer ----
function enemyTempo(e){if(e.tempo)return e.tempo;let t=1;const n=(e.name||'')+' '+(e.type||'');
  if(!e.human){if(/крыс|rat|пёс|пес|собак|dog|дрон|drone|скорпион|паук|волк|лис|летуч|мотыл|жук/i.test(n))t=.72;else if(/слиз|slime|голем|улит|кокон|танк|гриб|туш/i.test(n))t=1.35}
  else{const w=e.weapon;if(w&&w.cat==='melee'&&w.wind)t*=.85+.15*Math.min(2,w.wind)}
  return e.tempo=t*(.9+Math.random()*.2)}
function enemyDM(){const P=G.p,k=P.x+','+P.y+','+G.turn;if(G._dmK!==k){G._dmK=k;G._dm=bfsMap([[P.x,P.y]],20)}return G._dm}
function enemyStep(e){
  const P=G.p,{W,t}=G.M;
  if(e.dead||G.dead)return;
  if(tickStatus(e))return;if(e.stun){e.stun--;return}
  const visible=G.vis[idx(e.x,e.y)],d=md(e,P);
  if(G.camo>0){e.awake=false;if(Math.random()<.3)wander(e);return}
  if(!e.awake&&visible&&cheb(e,P)<=8)e.awake=true;
  if(!e.awake){if(Math.random()<.15)wander(e);return}
  if(e.slow){e.tick^=1;if(e.tick)return}
  const w=e.weapon;
  if(w.cat==='ranged'&&visible&&dst(e,P)<=w.range+.5&&los(e.x,e.y,P.x,P.y)){
    if(d===1&&Math.random()<.4)enemyMelee(e);else enemyShoot(e);return}
  if(d===1){enemyMelee(e);return}
  if(d>18){e.awake=false;return}
  const dm=enemyDM();
  const i=idx(e.x,e.y);let best=null,bd=dm[i];
  for(const[dx,dy]of DIRS){const nx=e.x+dx,ny=e.y+dy,n=ny*W+nx;if(t[n]!==1||enemyAt(nx,ny)||(nx===P.x&&ny===P.y))continue;if(dm[n]<bd){bd=dm[n];best=[nx,ny]}}
  if(best){if(best[0]!==e.x)e.face=Math.sign(best[0]-e.x);e.x=best[0];e.y=best[1]}
}
// legacy "enemies get an extra turn" = the merc loses one beat of time
function enemiesAct(){if(G)G.heroDelay=(G.heroDelay||0)+1}
function enemiesTick(dt){let acted=0;
  for(const e of G.en){if(e.dead||G.dead||G.descend>0)continue;
    if(e.cd==null)e.cd=Math.random()*STEP;
    e.cd-=dt;if(e.cd>0)continue;
    const ox=e.x,oy=e.y;enemyStep(e);acted=1;const step=STEP*enemyTempo(e)*(.92+Math.random()*.16);e.cd+=step;if(e.cd<0)e.cd=0;if(e.x!==ox||e.y!==oy)e.mvDur=step}
  if(acted&&!G.dead){const n=performance.now();if(n-(G._hudT||0)>120){G._hudT=n;updateHUD()}}
}
function wander(e){const[dx,dy]=DIRS[(Math.random()*4)|0],nx=e.x+dx,ny=e.y+dy;if(TT(nx,ny)===1&&!enemyAt(nx,ny)&&!(nx===G.p.x&&ny===G.p.y)){if(dx)e.face=dx;e.x=nx;e.y=ny}}

// ---------- UI ----------
function log(m,col){const l=$('log');const d=document.createElement('div');d.textContent=m;if(col)d.style.color=col;l.append(d);while(l.children.length>3)l.firstChild.remove();setTimeout(()=>{d.style.opacity=0;setTimeout(()=>d.remove(),600)},3200)}
function banner(h){const b=$('banner');b.innerHTML=h;b.style.opacity=1;clearTimeout(banner.t);banner.t=setTimeout(()=>b.style.opacity=0,1800)}
let slotCache={};
function setSlotIcon(id,it){const el=$(id);const key=it?it.id:'none';if(slotCache[id]===key)return;slotCache[id]=key;el.innerHTML=it?`<img src="${iconURL(it)}">`:'<span class="empty">—</span>'}
function updateSlots(){
  if(!G)return;const P=G.p;
  const med=P.inv.meds.slice().sort((a,b)=>b.heal-a.heal)[0],bat=P.inv.bats.slice().sort((a,b)=>b.energy-a.energy)[0];
  setSlotIcon('iMed',med||{id:'medph',icon:MEDPH});setSlotIcon('iBat',bat||{id:'batph',icon:BATPH});
  const gr=(P.inv.grens||[]).slice().sort((a,b)=>((b.dmg||[0,0])[0]+(b.dmg||[0,0])[1])-((a.dmg||[0,0])[0]+(a.dmg||[0,0])[1]))[0];setSlotIcon('iGr',gr||{id:'grph',icon:GRPH()});$('cGr').textContent=(P.inv.grens||[]).length;$('sGr').classList.toggle('dis',!(P.inv.grens||[]).length);
  $('cMed').textContent=P.inv.meds.length;$('cBat').textContent=P.inv.bats.length;
  $('sMed').classList.toggle('dis',!P.inv.meds.length);$('sBat').classList.toggle('dis',!P.inv.bats.length);
  for(let s=0;s<2;s++){const it=P.eq.act[s];setSlotIcon('iA'+s,it);
    $('cdA'+s).textContent=it&&P.cds[s]>0?csec(P.cds[s]):'';$('cdA'+s).style.display=it&&P.cds[s]>0?'flex':'none';
    $('cA'+s).textContent=it?it.cost:'';$('cA'+s).style.display=it?'block':'none';
    $('sA'+s).classList.toggle('dis',!it||P.cds[s]>0||P.mp<(it?it.cost:0))}
  setSlotIcon('iHero',{id:'hero'+(P.eq.ranged?P.eq.ranged.id:0),icon:posed(P.spr.r)});
}
const MEDPH=makeItem(1,'med',1,{rar:0,kind:'аптечка'}).icon,BATPH=makeItem(2,'battery',1,{rar:0}).icon;

function showOv(html,wide){if(typeof SHEET!=='undefined'&&SHEET){SHEET=false;$('ov').classList.remove('dock');$('panel').classList.remove('sheet')}
  const dockBase=typeof MODE!=='undefined'&&MODE==='base';
  if(dockBase&&!html.includes('id="hpX"'))html=`<div class="sxbar"><button class="btn sx" id="sheetX">✕</button></div>`+html;
  $('panel').innerHTML=html;$('panel').classList.toggle('wide',!!wide);$('ov').classList.add('on');
  if(dockBase){$('panel').classList.add('sheet');$('ov').classList.add('dock');SHEET=true;$('panel').scrollTop=0;const x=$('sheetX');if(x)x.onclick=()=>hideOv()}}
function hideOv(){$('ov').classList.remove('on','dock');$('panel').classList.remove('sheet');SHEET=false}
function eqRow(label,it){return`<div class="eqr"><div class="ic">${it?`<img src="${iconURL(it)}">`:''}</div><div class="tx"><div class="lb">${label}</div>${it?`<div style="color:${RAR[it.rar].c}">${it.name}</div><div class="st">${it.lines.join(' · ')}</div>`:'<div class="st">— пусто —</div>'}</div></div>`}
// ---------- light ----------
const lightC=document.createElement('canvas'),lctx=lightC.getContext('2d'),colC=document.createElement('canvas'),cctx=colC.getContext('2d');
function neonOn(s,t){return Math.sin(t*2.3+s.ph)+Math.sin(t*13+s.ph*3)*.6>-1.25}
function buildLight(time){
  const {W,H}=G.M;if(lightC.width!==W||lightC.height!==H){lightC.width=colC.width=W;lightC.height=colC.height=H}
  const L=lctx.createImageData(W,H),C=cctx.createImageData(W,H),ld=L.data,cd=C.data;
  const px=G.p.rx+.5,py=G.p.ry+.5;
  const ls=[];for(const l of G.lights){if(Math.abs(l.x-px)>15||Math.abs(l.y-py)>15)continue;if(!G.seen[idx(l.x|0,Math.min(G.M.H-1,l.y|0))]&&!G.seen[idx(l.x|0,Math.max(0,(l.y|0)-1))])continue;
    let f=l.int;if(l.kind==='neon')f*=neonOn(l.ref,time)?1:.15;else if(l.kind==='lamp')f*=.85+.12*Math.sin(time*5+l.ref.ph);else if(l.kind==='water')f*=.7+.3*Math.sin(time*1.5+l.ph);else if(l.kind==='exit')f*=.75+.25*Math.sin(time*3);
    ls.push([l.x,l.y,l.c,l.rad,f])}
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    const i=y*W+x,o=i*4;if(!G.seen[i]){ld[o+3]=255;continue}
    let r=0,g=0,b=0,s=0;for(const[lx,ly,c,rad,f]of ls){const dx=x+.5-lx,dy=y+.5-ly,d=Math.sqrt(dx*dx+dy*dy);if(d<rad){const k=Math.pow(1-d/rad,1.5)*f;r+=c[0]*k;g+=c[1]*k;b+=c[2]*k;s+=k}}
    let br;if(G.vis[i]){const dx=x+.5-px,dy=y+.5-py,pl=Math.max(0,1-Math.sqrt(dx*dx+dy*dy)/7.5);br=.12+.82*Math.pow(pl,1.15)+s*.75}else br=.07+s*.25;
    ld[o]=4;ld[o+1]=3;ld[o+2]=8;ld[o+3]=Math.round((1-Math.min(1,br))*255);
    if(s>0){cd[o]=r/s;cd[o+1]=g/s;cd[o+2]=b/s;cd[o+3]=Math.min(120,s*(G.vis[i]?100:45))}
  }
  lctx.putImageData(L,0,0);cctx.putImageData(C,0,0);
}

// ---------- render ----------
function drawShadow(x,y,w){ctx.fillStyle='rgba(0,0,0,.4)';ctx.fillRect(x+8-w,y+13,w*2,2);ctx.fillRect(x+9-w,y+12,w*2-2,1)}
function drawActor(e,time){
  const isP=e.isHero;let bx=0,by=0;
  if(e.bump){const s=Math.sin(Math.min(1,Math.max(0,e.bump.t))*Math.PI)*4;bx=e.bump.dx*s;by=e.bump.dy*s}
  const x=Math.round(e.rx*TS+bx),ty=Math.round(e.ry*TS+by);
  ctx.save();
  if(e.dead)ctx.globalAlpha=Math.max(0,e.fade);
  if(isP&&MODE==='raid'&&G&&G.dead){if(G.shattered){ctx.restore();return}const el=(performance.now()-G.deadAt)/1000,k=Math.min(1,el/.55),ease=k*k,bounce=k>=1?Math.max(0,Math.sin((el-.55)*14)*.08*Math.exp(-(el-.55)*6)):0;
    const px=x+8,py=ty+14,a=(Math.PI/2)*(ease-bounce)*(G.deadFace>0?-1:1);ctx.translate(px,py);ctx.rotate(a);ctx.translate(-px,-py);e.flash=Math.max(e.flash||0,el<.3?1-el/.3:0)}
  if(isP&&MODE==='raid'&&G&&G.camo>0)ctx.globalAlpha=.4+.1*Math.sin(time*8);
  if(isP||e.human){
    const moving=Math.abs(e.rx-e.x)+Math.abs(e.ry-e.y)>.05;
    const f=moving?(set0=>set0.fr.length>=6?2+(Math.floor((e.rx+e.ry)*2.2+8)&3):(Math.floor((e.rx+e.ry)*3)&1))(isP?e.spr[e.showW]:e.spr):(Math.floor(time*2.1+(e.ph||0))&1);
    const set=isP?e.spr[e.showW]:e.spr;
    drawShadow(x,ty,5);
    const flip=e.face<0;const dx=x-OX,dy=ty-2-OY;
    if(flip){ctx.translate(dx+CW_,dy);ctx.scale(-1,1)}else ctx.translate(dx,dy);
    ctx.drawImage(set.fr[f],0,0);
    if(e.flash>0){const ga=ctx.globalAlpha;ctx.globalAlpha*=e.flash;ctx.drawImage(set.w[f],0,0);ctx.globalAlpha=ga}
    drawWeapon(e,set,time);
  } else {
    const mvg=Math.abs(e.rx-e.x)+Math.abs(e.ry-e.y)>.05,st=Math.floor((e.rx+e.ry)*4+8)&3;
    let yo=0,sq=1;if(e.hover){yo=-3+Math.round(Math.sin(time*(mvg?7:4)+e.ph)*1.2);drawShadow(x,ty,3)}else{yo=e.type==='slime'?0:mvg?(st&1?-1:0):((Math.floor(time*2+e.ph)&1)?0:-1);if(mvg&&e.type!=='slime')sq=st===1||st===3?.94:1;drawShadow(x,ty,5)}
    const flip=e.face>0;if(flip){ctx.translate(x+16,ty+yo);ctx.scale(-1,1)}else ctx.translate(x,ty+yo);
    if(sq!==1){ctx.translate(0,16*(1-sq));ctx.scale(1/sq>1.04?1.04:1,sq)}
    if(e.type==='slime'&&(Math.floor(time*2+e.ph)&1))ctx.drawImage(SP.slime,0,0,16,16,-1,1,18,15);else ctx.drawImage(SP[e.type],0,0);
    if(e.flash>0){ctx.globalAlpha*=e.flash;ctx.drawImage(SP[e.type+'W'],0,0)}
  }
  ctx.restore();
}
// ================= PERSISTENT STATE (hero, stash, base) =================
const SAVE_KEY='neongen_cyberdungeon_v2';
let H=null;   // hero runtime (persists between raids)
let ST=null;  // persistent world: stash, credits, base, depth
let MODE='base';
let BS=null;  // base scene
const ser=it=>it?{s:it.seed,c:it.cat,l:it.lvl,f:it.f||{},...(it.mdur?{m:{d:it.dur,u:it.up||0,c:it.clip,x:it.mloss||1}}:{})}:null;
const de=o=>{if(!o)return null;const it=makeItem(o.s,o.c,o.l,o.f||{});if(o.m&&it.mdur){it.up=o.m.u||0;it.mloss=o.m.x||1;applyWpn(it);it.dur=Math.min(it.mdur,o.m.d!=null?o.m.d:it.mdur);if(it.cat==='ranged')it.clip=Math.min(it.mag,o.m.c!=null?o.m.c:it.mag)}return it};
const ITEM_W={melee:3,ranged:3,armor:4,clothes:2,implant:1,med:0,battery:0,ammo:0};
const BASEV={melee:20,ranged:25,armor:22,clothes:15,implant:30,med:10,battery:9,ammo:6};
const itemValue=it=>Math.max(1,Math.round(BASEV[it.cat]*(1+.7*it.rar)*(1+.15*(it.lvl-1))*(it.cat==='ammo'?it.count/10:1)));
const sellPrice=it=>Math.max(1,Math.round(itemValue(it)*.45));
const buyPrice=it=>Math.round(itemValue(it)*1.3);
const UP={
  gen:{n:'Генератор',max:3,start:0,power:0,lv:['не построен','Дизель-генератор','Генератор с баком','Гибридная установка'],
    eff:l=>l?`Питание модулей. Расход ${[0,2,1.5,1][l]} ед. топлива в час. Энергия героя +${10*l}`:'Питание для модулей, работает на топливе',
    L:[null,{it:{bolts:4,wire:3,junk:6},cr:100,req:{},raids:0},{it:{servo:1,wire:6,sheet:4},cr:350,req:{bench:1},raids:1},{it:{battery:2,cap:4,servo:2},cr:800,req:{bench:2,light:1},raids:2}]},
  light:{n:'Освещение',max:2,start:0,power:1,lv:['нет','Лампы','Неон'],
    eff:l=>l>=2?'Неоновые вывески: продажа в терминале +10%':l?'Свет в убежище. Нужно для майнинг-фермы':'Свет и уют',
    L:[null,{it:{bulb:4,wire:3,tape:2},cr:60,req:{gen:1},raids:0},{it:{bulb:6,wire:4,chip:1},cr:250,req:{light:1},raids:1}]},
  bed:{n:'Кровать',max:3,start:1,power:0,lv:['—','Матрас','Койка','Капсула сна'],
    eff:l=>l<=1?'Отдых восстанавливает HP и энергию':`Отдых: полное восстановление + бонус на рейд +${10*(l-1)} HP, +${5*(l-1)} EN`,
    L:[null,null,{it:{boards:4,bolts:4,bandage:2},cr:80,req:{},raids:0},{it:{chip:2,wire:4,sheet:4,servo:1},cr:500,req:{gen:1},raids:1}]},
  crate:{n:'Ящик',max:6,start:1,power:0,lv:['—','Деревянный ящик','Ящик с полками','Металлический шкаф','Стеллажи','Сейф-хранилище','Склад'],eff:l=>`Вместимость: ${CRATE_CAP[l]} предметов`,
    L:[null,null,{it:{boards:3,bolts:3},cr:40,req:{},raids:0},{it:{boards:5,bolts:5,tape:2},cr:120,req:{},raids:0},{it:{sheet:4,rebar:2,tape:3},cr:280,req:{bench:1},raids:0},{it:{sheet:7,rebar:4,servo:1},cr:550,req:{bench:1},raids:0},{it:{sheet:10,rebar:6,cpu:1,cement:3},cr:950,req:{bench:2},raids:1}]},
  bench:{n:'Верстак',max:2,start:0,power:0,lv:['не построен','Верстак','Мастерская'],
    eff:l=>l>=2?'Рюкзак +30, разбор декораций быстрее, крафт топлива':l?'Рюкзак +15, разбор предметов на компоненты, крафт батарей':'Рюкзак и разбор предметов',
    L:[null,{it:{boards:4,bolts:6,tape:2},cr:50,req:{},raids:0},{it:{servo:1,wire:4,sheet:4},cr:300,req:{gen:1},raids:1}]},
  med:{n:'Медблок',max:2,start:0,power:1,lv:['не построен','Медпункт','Медблок'],
    eff:l=>l>=2?'Крафт нано-аптечек; +2 аптечки перед рейдом':l?'Крафт аптечек; +1 аптечка перед рейдом':'Аптечки перед рейдом и крафт',
    L:[null,{it:{bandage:3,antisep:2,tape:1},cr:80,req:{},raids:0},{it:{antisep:4,chip:2,sheet:2},cr:300,req:{gen:1,bench:1},raids:1}]},
  wrack:{n:'Патронный станок',max:2,start:0,power:1,lv:['не построен','Станок','Оружейная'],
    eff:l=>l>=2?'Крафт энергоячеек; патроны перед каждым рейдом':l?'Крафт пуль и дроби из хлама':'Крафт патронов',
    L:[null,{it:{bolts:6,spring:4,junk:8},cr:80,req:{bench:1},raids:0},{it:{servo:1,cap:2,sheet:3},cr:300,req:{gen:1},raids:1}]},
  recycler:{n:'Переработчик',max:1,start:0,power:1,lv:['не построен','Переработчик'],eff:l=>'Хлам ×5 → случайные компоненты',
    L:[null,{it:{servo:1,sheet:6,bolts:8},cr:250,req:{bench:1,gen:1},raids:1}]},
  farm:{n:'Майнинг-ферма',max:3,start:0,power:1,lv:['не построена','Ферма I','Ферма II','Ферма III'],
    eff:l=>l?`Слоты видеокарт: ${2*l}. Доход 20₵ за карту за рейд`:'Пассивный доход от видеокарт',
    L:[null,{it:{chip:3,wire:6,sheet:4,cpu:1},cr:500,req:{gen:2,light:1},raids:1},{it:{cpu:2,cap:6,sheet:4},cr:900,req:{farm:1,bench:2},raids:2},{it:{cpu:3,battery:2,servo:2},cr:1500,req:{farm:2,gen:3},raids:2}]}};
const capacity=()=>((H&&H.st&&H.st.cap)||30)+15*ST.base.bench;
const CRATE_CAP=[0,20,30,45,65,90,120];const stashCap=()=>CRATE_CAP[Math.min(6,ST.base.crate||1)];

function freshState(){
  const b={};for(const k in UP)b[k]=UP[k].start;
  return{stash:[],mats:{junk:0,parts:0,elec:0,build:0,cpu:0},credits:60,base:b,maxDepth:1,raids:0,buff:null,shopSeed:rseed(),shopBought:[],deaths:0,recSeed:rseed(),recTaken:[],fallen:[]};
}
function saveGame(){
  try{
    const h=H;const o={v:2,hero:{stats:h.stats,dead:!!h.dead,attr:h.attr,pts:h.pts||0,seeds:h.ch.seeds,name:h.name,lvl:h.lvl,xp:h.xp,hp:h.hp,mp:h.mp,
      eq:{melee:ser(h.eq.melee),ranged:ser(h.eq.ranged),armor:ser(h.eq.armor),clothes:ser(h.eq.clothes),pas:h.eq.pas.map(ser),act:h.eq.act.map(ser)},
      bag:(h.bag||[]).map(ser),bagMats:h.bagMats||{},inv:{meds:h.inv.meds.map(ser),bats:h.inv.bats.map(ser),grens:(h.inv.grens||[]).map(ser),ammo:h.inv.ammo}},
      st:{...ST,stash:ST.stash.map(ser)}};
    localStorage.setItem(SAVE_KEY,JSON.stringify(o));
  }catch(e){}
}
function loadGame(){
  try{
    const raw=localStorage.getItem(SAVE_KEY);if(!raw)return false;const o=JSON.parse(raw);if(o.v!==2)return false;
    const hs=o.hero;const g=generate(hs.seeds,'mid');
    const h=heroShell({g,seeds:hs.seeds,name:hs.name});
    h.lvl=hs.lvl;h.xp=hs.xp;h.dead=!!hs.dead;if(hs.stats)h.stats=hs.stats;if(hs.attr)h.attr=hs.attr;h.pts=hs.pts||0;
    h.eq={melee:de(hs.eq.melee),ranged:de(hs.eq.ranged),armor:de(hs.eq.armor),clothes:de(hs.eq.clothes),pas:hs.eq.pas.map(de),act:hs.eq.act.map(de)};
    h.bag=(hs.bag||[]).map(de);h.bagMats=hs.bagMats||{};h.inv={meds:hs.inv.meds.map(de),bats:hs.inv.bats.map(de),grens:(hs.inv.grens||[]).map(de),ammo:hs.inv.ammo};
    ST={...freshState(),...o.st,stash:o.st.stash.map(de)};
    for(const k in UP)if(ST.base[k]==null)ST.base[k]=UP[k].start;
    H=h;recalc(h);h.hp=Math.min(hs.hp,h.st.mhp);h.mp=Math.min(hs.mp,h.st.mmp);rebuildSprites(h);
    return true;
  }catch(e){return false}
}
function heroShell(ch){
  const g=ch.g;const bi=['худощавое','среднее','крепкое','массивное'].indexOf(g.traits['Телосложение']);
  const nImpl=g.traits['Импланты'][0]==='нет'?0:g.traits['Импланты'].length;
  return{isHero:true,ch,name:ch.name,traits:g.traits,H:g.H,x:0,y:0,rx:0,ry:0,face:1,flash:0,bump:null,lvl:1,xp:0,
    stats:{raids:0,earned:0,kills:0,turns:0,deep:0,born:Date.now()},base:{hp:46+bi*8,mp:24+nImpl*5},hp:0,mp:0,eq:{melee:null,ranged:null,armor:null,clothes:null,pas:[null,null],act:[null,null]},cds:[0,0],
    inv:{meds:[],bats:[],grens:[],ammo:{'пули':0,'дробь':0,'энергия':0}},showW:'r',st:{}};
}
function newHero(){
  const h=heroShell(randomChar('mid'));
  h.eq.melee=makeItem(rseed(),'melee',1,{rar:0});
  h.eq.ranged=makeItem(rseed(),'ranged',1,{rar:0,kind:Math.random()<.6?'пистолет':'револьвер'});
  h.inv.ammo['пули']=30;
  h.eq.act[0]=makeItem(rseed(),'implant',1,{rar:0,kind:'Электро-разряд'});
  h.inv.meds.push(makeItem(rseed(),'med',1,{rar:0,kind:'аптечка'}),makeItem(rseed(),'med',1,{rar:0,kind:'аптечка'}));
  h.inv.bats.push(makeItem(rseed(),'battery',1,{rar:0}));
  H=h;recalc(h);h.hp=h.st.mhp;h.mp=h.st.mmp;rebuildSprites(h);return h;
}
function recalc(h){
  const e=h.eq,pas=e.pas.filter(Boolean),bf=ST&&ST.buff;
  const st={def:(e.armor?.def||0)+(e.clothes?.def||0)+pas.reduce((s,i)=>s+(i.def||0),0),
    dodge:e.clothes?.dodge||0,
    mhp:h.base.hp+(e.armor?.hp||0)+pas.reduce((s,i)=>s+(i.hp||0),0)+(h.lvl-1)*5+(bf?bf.hp:0),
    mmp:h.base.mp+pas.reduce((s,i)=>s+(i.mp||0),0)+(ST?ST.base.gen*10:0)+(bf?bf.en:0),
    acc:pas.reduce((s,i)=>s+(i.acc||0),0),crit:pas.reduce((s,i)=>s+(i.crit||0),0),regen:pas.reduce((s,i)=>s+(i.regen||0),0),atk:h.lvl-1};
  h.st=st;h.hp=Math.min(h.hp,st.mhp);h.mp=Math.min(h.mp,st.mmp);
}
// equip helper: returns replaced item (or the item itself if it was not an upgrade)
function equipIfBetter(it){
  const h=H;
  if(it.cat==='implant'){
    const arr=it.t==='act'?h.eq.act:h.eq.pas;let slot=arr.indexOf(null);
    if(slot<0){let mi=0;arr.forEach((x,i)=>{if(score(x)<score(arr[mi]))mi=i});if(score(it)>score(arr[mi]))slot=mi}
    if(slot<0)return it;const old=arr[slot];arr[slot]=it;if(it.t==='act')h.cds[slot]=0;recalc(h);return old||null;
  }
  const cur=h.eq[it.cat];
  if(cur&&score(it,h)<=score(cur,h))return it;
  h.eq[it.cat]=it;recalc(h);if(it.cat==='melee'||it.cat==='ranged'){rebuildSprites(h);h.showW=it.cat==='melee'?'m':'r'}
  return cur||null;
}
function forceEquip(it){
  const h=H;let old=null;
  if(it.cat==='implant'){const arr=it.t==='act'?h.eq.act:h.eq.pas;let slot=arr.indexOf(null);
    if(slot<0){let mi=0;arr.forEach((x,i)=>{if(score(x)<score(arr[mi]))mi=i});slot=mi}old=arr[slot];arr[slot]=it}
  else{old=h.eq[it.cat];h.eq[it.cat]=it}
  recalc(h);rebuildSprites(h);return old;
}

// ================= RAID =================
const packW=()=>{const p=G.pack;let w=0;for(const it of p.items)w+=ITEM_W[it.cat]||1;for(const k in p.mats)w+=p.mats[k]*MATS[k].w;return w};
const packFree=()=>capacity()-packW();
function startRaid(){
  if(!H)return;
  // pre-raid supplies from base
  const L=Math.max(1,ST.maxDepth);
  for(let i=0;i<ST.base.med;i++)H.inv.meds.push(makeItem(rseed(),'med',L,{rar:ST.base.med>1?1:0}));
  if(ST.base.wrack){H.inv.ammo['пули']+=12*ST.base.wrack;H.inv.ammo['дробь']+=4*ST.base.wrack;H.inv.ammo['энергия']+=6*ST.base.wrack}
  recalc(H);
  G={p:H,floor:0,biome:null,kills:0,mode:{goal:'explore',stance:'fight'},speed:G0speed,cool:.3,turn:0,dead:false,deadT:0,paused:false,
    floats:[],fx:[],cam:{x:0,y:0},descend:0,exitTo:null,time:0,buf:null,camo:0,haste:0,shield:0,shieldT:0,uid:1,
    pack:{items:[],mats:{}},idle:0,looted:0};
  MODE='raid';hideOv();setModeUI();newFloor();updateHUD();updateSlots();
  if(ST.base.med||ST.base.wrack)log('База выдала припасы на рейд','#7dff4f');
}
let G0speed=1;
function newFloor(){
  G.floor++;ST.maxDepth=Math.max(ST.maxDepth,G.floor);
  G.biome=biomeFor(G.floor);
  const seed=rseed();const M=genMap(seed,G.floor,G.biome);G.M=M;
  const baked=renderMap(M);G.mapC=baked.c;G.lights=baked.lights;G.neons=baked.neons;G.leds=baked.leds;G.lamps=baked.lamps;G.waters=baked.waters;
  G.seen=new Uint8Array(M.W*M.H);G.vis=new Uint8Array(M.W*M.H);G.seen[idx(M.exit.x,M.exit.y)]=1;G.seen[idx(M.evac.x,M.evac.y)]=1;
  const P=G.p;P.x=P.rx=M.start.x;P.y=P.ry=M.start.y;G.cam.x=P.x*TS+8;G.cam.y=P.y*TS+8;
  G.en=[];G.items=[];G.props=[];FXL=[];G.gibs=[];G.decals=[];
  placeProps();
  G.eff=effFloor();G.threat=threatLevel();const T=G.threat;if(G.eff>G.floor)setTimeout(()=>log(`Слишком лёгкий этаж для ур. ${G.p.lvl}: обитатели как на глубине ${G.eff}, угроза ${T}`,'#ff6a3a'),400);
  for(const r of M.rooms){
    if(r!==M.startRoom){const n=G.en.length>=8+T*2?0:rnd([T>6?1:0,1+Math.min(7,Math.floor(T/2.5))]);
      for(let k=0;k<n;k++){const p=roomTile(r);if(p)G.en.push(makeEnemy(p.x,p.y))}}
    const ni=rnd([0,1]);for(let k=0;k<ni;k++){const p=roomTile(r);if(p)dropItem(makeItem(rseed(),pickCat(),G.floor),p.x,p.y)}
  }
  {const ov=overLvl(),extra=Math.round(ov*1.5);for(let k=0;k<extra;k++){const p=freeTile((x,y)=>Math.abs(x-P.x)+Math.abs(y-P.y)>=8&&!isExit(x,y));if(p)G.en.push(makeEnemy(p.x,p.y))}}
  G.maxAlive=Math.max(4,G.en.length+Math.floor(T/3));G.respawnT=Math.max(8,Math.round(rnd([26,40])-T*1.6));
  G.camo=0;G.haste=0;G.idle=0;
  computeFOV();
  if(G.floor>1){P.hp=Math.min(P.st.mhp,P.hp+Math.round(P.st.mhp*.15));}
  banner(`ЭТАЖ ${G.floor}<small>${BIOMES[G.biome].name}${G.biome==='core'?` · глубина −${G.floor-4}`:''}</small>`);updateHUD();
}
function isExit(x,y){const M=G.M;return(x===M.exit.x&&y===M.exit.y)||(x===M.evac.x&&y===M.evac.y)}
function placeProps(){
  const M=G.M,{W,t}=M;
  const total=()=>{let n=0;for(let i=0;i<t.length;i++)if(t[i]===1)n++;return n};
  const reach=()=>{const s=M.start.y*W+M.start.x,seen=new Uint8Array(t.length),q=[s];seen[s]=1;
    for(let h=0;h<q.length;h++){const c=q[h];for(const[dx,dy]of DIRS){const n=c+dy*W+dx;if(t[n]===1&&!seen[n]){seen[n]=1;q.push(n)}}}return q.length};
  const tab=PROP_BIOME[G.biome];
  for(const r of M.rooms){
    if(r===M.startRoom)continue;
    const n=rnd([0,2])+(G.biome==='server'?1:0);
    for(let k=0;k<n;k++){
      let ok=null;
      for(let a=0;a<25&&!ok;a++){
        const x=rnd([r.x,r.x+r.w-1]),y=rnd([r.y,r.y+r.h-1]),i=y*W+x;
        if(t[i]!==1||isExit(x,y)||(x===M.start.x&&y===M.start.y))continue;
        if(Math.abs(x-M.exit.x)+Math.abs(y-M.exit.y)<=1||Math.abs(x-M.evac.x)+Math.abs(y-M.evac.y)<=1)continue;
        if(a<15&&t[i-W]!==2)continue; // prefer against wall
        const before=total();t[i]=4;
        if(reach()===before-1)ok={x,y};else t[i]=1;
      }
      if(ok){let kind=tab[0][0];let s=Math.random()*tab.reduce((a,b)=>a+b[1],0);for(const[k2,w]of tab){if((s-=w)<0){kind=k2;break}}
        const pr=makeProp(rseed(),kind);G.props.push({x:ok.x,y:ok.y,P:pr,hp:Math.max(1,pr.turns-(ST.base.bench>=2?1:0)),max:Math.max(1,pr.turns-(ST.base.bench>=2?1:0)),ign:false})}
    }
  }
}
function lootProp(pr){
  const P=G.p;P.bump={dx:pr.x-P.x,dy:pr.y-P.y,t:0};if(pr.x!==P.x)P.face=Math.sign(pr.x-P.x);
  pr.hp--;G.fx.push({type:'spark',x:pr.x*TS+8,y:pr.y*TS+6,t:0});
  if(pr.hp>0){float(pr,'разбор…','#c0c7d4');return}
  const loot=rollLoot(pr.P.kind,G.floor);const got=[];let lost=0;
  if(P.st.lootLoss){let lost=0;for(const m in loot){for(let q=loot[m];q>0;q--)if(Math.random()<P.st.lootLoss){loot[m]--;lost++}if(loot[m]<=0)delete loot[m]}if(lost)float(pr,'упущено '+lost,'#ff8a8a',-8)}
  if(Math.random()<(P.st.perBonus||0)){const b2=rollLoot(pr.P.kind,G.floor);for(const m in b2)loot[m]=(loot[m]||0)+b2[m];float(pr,'внимательность!','#f9f871',-8)}
  for(const m in loot){let n=loot[m];const fit=Math.max(0,Math.floor(packFree()/MATS[m].w));const take=Math.min(n,fit);
    if(take>0){G.pack.mats[m]=(G.pack.mats[m]||0)+take;got.push(`${MATS[m].n} ×${take}`)}lost+=n-take}
  G.M.t[idx(pr.x,pr.y)]=1;G.props.splice(G.props.indexOf(pr),1);G.looted++;
  if(PROP_DEF[pr.P.kind].item&&Math.random()<PROP_DEF[pr.P.kind].item)dropItem(makeItem(rseed(),pickCat(),G.floor),pr.x,pr.y);
  log(got.length?`${pr.P.name}: ${got.join(', ')}`:`${pr.P.name}: рюкзак полон`,got.length?'#e0c070':'#ffb04a');
  if(lost)log('Часть добычи не влезла в рюкзак','#ffb04a');
}
function pickupAt(x,y){
  for(let i=G.items.length-1;i>=0;i--){const it=G.items[i];if(it.x!==x||it.y!==y||it.ign)continue;
    const rc=RAR[it.rar].c;
    if(it.cat==='med'){H.inv.meds.push(it);log(`+ ${it.name}`,rc)}
    else if(it.cat==='battery'){H.inv.bats.push(it);log(`+ ${it.name}`,rc)}
    else if(it.cat==='grenade'){H.inv.grens.push(it);log(`+ ${it.name}`,rc)}
    else if(it.cat==='ammo'){H.inv.ammo[it.kind]+=it.count;log(`+ ${it.name} (${it.kind})`,rc)}
    else{
      const old=equipIfBetter(it);
      if(old!==it){log(it.cat==='implant'?`Имплант установлен: ${it.name}`:`Экипировано: ${it.name}`,rc);G.items.splice(i,1);
        if(old){if(keepWorth(old)&&packFree()>=ITEM_W[old.cat]){G.pack.items.push(old);log(`${old.name} → в рюкзак`,'#a8a0c6')}else scrapToPack(old,x,y)}
        updateSlots();continue}
      if(keepWorth(it)&&packFree()>=ITEM_W[it.cat]){G.pack.items.push(it);log(`${it.name} → в рюкзак`,rc)}
      else scrapToPack(it,x,y);
    }
    G.items.splice(i,1);
  }
}
function endRaid(success){
  const P=H,pk=G.pack;MODE='base';
  let lines=[];
  if(success){
    for(const m in pk.mats){ST.mats[m]=(ST.mats[m]||0)+pk.mats[m];lines.push(`<span style="color:${MATS[m].c}">${MATS[m].n} ×${pk.mats[m]}</span>`)}
    let sold=0;for(const it of pk.items){if(ST.stash.length<stashCap()){ST.stash.push(it);lines.push(`<span style="color:${RAR[it.rar].c}">${it.name}</span>`)}else{const p=sellPrice(it);ST.credits+=p;sold+=p}}
    if(sold)lines.push(`Ящик полон — лишнее продано за ${sold}₵`);
    if(ST.base.farm){const c=25*ST.base.farm;ST.credits+=c;lines.push(`Майнинг-ферма: +${c}₵`)}
  } else {
    ST.deaths++;P.hp=Math.max(1,Math.round(P.st.mhp*.25));
  }
  ST.raids++;ST.buff=null;recalc(P);ST.shopSeed=rseed();ST.shopBought=[];
  P.cds=[0,0];
  enterBase();
  const head=success?'<h2>РЕЙД ЗАВЕРШЁН</h2>':'<h2>РЕЙД ПРОВАЛЕН</h2>';
  const body=success?`<p>Глубина: ${G.floor} · уничтожено: ${G.kills} · разобрано: ${G.looted}</p><p style="font-size:8px;line-height:2.2">${lines.join('<br>')||'Ничего не вынесено'}</p>`
    :`<p>Эвакуационный дрон вытащил героя на базу. Рюкзак потерян.<br>Глубина: ${G.floor} · уничтожено: ${G.kills}</p><p>Отдохните на кровати перед новым рейдом.</p>`;
  showOv(`${head}${body}<div class="row"><button class="btn" id="oClose">На базу</button></div>`);bindOv();
  saveGame();
}

// ---------- FOV with props ----------
function computeFOV(){
  const {W,H:MH,t}=G.M,P=G.p,R=(MODE==='raid'&&P.st.sight)||8,vis=new Uint8Array(W*MH);
  for(let y=P.y-R;y<=P.y+R;y++)for(let x=P.x-R;x<=P.x+R;x++){if(x<0||y<0||x>=W||y>=MH)continue;const dx=x-P.x,dy=y-P.y;if(dx*dx+dy*dy>R*R+R)continue;if(los(P.x,P.y,x,y))vis[y*W+x]=1}
  const add=[];for(let i=0;i<W*MH;i++)if(vis[i]&&clear(t[i])){const x=i%W,y=(i/W)|0;for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){const j=(y+oy)*W+x+ox;if(t[j]===2)add.push(j)}}
  add.forEach(j=>vis[j]=1);G.vis=vis;for(let i=0;i<W*MH;i++)if(vis[i])G.seen[i]=1;
}
// pathfinding: walls/props/water block; only VISIBLE enemies block (invisible ones are bumped into = attacked)
function bfs(sx,sy,goal,knownOnly=true,ignoreEnemies=false){
  const {W,t}=G.M,prev=new Int32Array(W*G.M.H).fill(-1),s0=sy*W+sx,q=[s0];prev[s0]=s0;
  for(let h=0;h<q.length;h++){const c=q[h],cx=c%W,cy=(c/W)|0;
    if(h>0&&goal(cx,cy)){const path=[];let k=c;while(k!==s0){path.push([k%W,(k/W)|0]);k=prev[k]}return path.reverse()}
    for(const[dx,dy]of DIRS){const nx=cx+dx,ny=cy+dy,n=ny*W+nx;
      if(prev[n]!==-1||t[n]!==1||(knownOnly&&!G.seen[n]))continue;
      if(typeof TRAPAVOID!=='undefined'&&TRAPAVOID&&G.trapMap&&!goal(nx,ny)&&trapTileBlocked(n))continue;
      if(!goal(nx,ny)){if(!ignoreEnemies&&G.vis[n]&&enemyAt(nx,ny))continue;if(isExit(nx,ny))continue}
      prev[n]=c;q.push(n)}}
  return null;
}
const bfsAny=(goal,knownOnly)=>bfs(H.x,H.y,goal,knownOnly)||bfs(H.x,H.y,goal,knownOnly,true);

// ---------- hero AI ----------
function goalPlan(){
  const P=G.p,M=G.M,W=M.W,goal=G.mode.goal;
  const free=packFree();
  const its=G.items.filter(i=>!i.ign&&!isExit(i.x,i.y)&&G.seen[idx(i.x,i.y)]);
  const props=G.props.filter(p=>!p.ign&&G.seen[idx(p.x,p.y)]&&free>=Math.min(2,MATS.junk.w+1));
  // keep dismantling whatever is next to us
  const adjP=props.find(p=>md(p,P)===1);
  if(adjP)return{a:{loot:adjP},path:null};
  // "distraction": loot the hero can see (or that is close) pulls him off the route; in explore mode — all known loot
  const near=o=>goal==='explore'||G.vis[idx(o.x,o.y)]||md(o,P)<=5;
  const tI=its.filter(near),tP=props.filter(near);
  if(tI.length||tP.length){
    const isGoal=(x,y)=>tI.some(i=>i.x===x&&i.y===y)||tP.some(q=>Math.abs(q.x-x)+Math.abs(q.y-y)===1);
    // walk over the real map (not only explored tiles): loot is often seen across unexplored floor
    const p=bfs(P.x,P.y,isGoal,false)||bfs(P.x,P.y,isGoal,false,true);
    const maxLen=goal==='explore'?999:goal==='deeper'?14:12;
    if(p&&p.length<=maxLen)return{a:{dx:p[0][0]-P.x,dy:p[0][1]-P.y},path:p};
    if(!p){ // truly unreachable on the whole map — stop considering it
      tI.forEach(i=>{if(!bfs(P.x,P.y,(x,y)=>x===i.x&&y===i.y,false,true))i.ign=true});
      tP.forEach(q=>{if(!bfs(P.x,P.y,(x,y)=>Math.abs(q.x-x)+Math.abs(q.y-y)===1,false,true))q.ign=true});
    }
  }
  if(goal==='explore'){
    const fr=bfsAny((x,y)=>{for(const[dx,dy]of DIRS){if(!G.seen[(y+dy)*W+x+dx])return true}return false},true);
    if(fr)return{a:{dx:fr[0][0]-P.x,dy:fr[0][1]-P.y},path:fr};
  }
  const ex=goal==='home'?M.evac:M.exit;
  const p=bfs(P.x,P.y,(x,y)=>x===ex.x&&y===ex.y,false)||bfs(P.x,P.y,(x,y)=>x===ex.x&&y===ex.y,false,true);
  if(p)return{a:{dx:p[0][0]-P.x,dy:p[0][1]-P.y},path:p};
  return{a:{wait:1,stuck:1},path:null};
}
function heroDecide(){
  const P=G.p;
  const foes=G.en.filter(e=>!e.dead&&G.vis[idx(e.x,e.y)]);
  const w=P.eq.ranged,hasGun=w&&w.dur>0&&(w.clip>0||P.inv.ammo[w.ammo]>0);
  if(w&&!foes.length&&w.dur>0&&w.clip<w.mag*.6&&P.inv.ammo[w.ammo]>0)return{reload:1};
  const canShoot=e=>hasGun&&dst(e,P)<=w.range+.5&&los(P.x,P.y,e.x,e.y);
  const adj=foes.filter(e=>md(e,P)===1);
  if(P.inv.grens&&P.inv.grens.length&&!G.manual){const hot=P.inv.grens.filter(x=>x.st!=='camo');
    if(hot.length&&foes.some(t=>dst(t,P)>=2&&dst(t,P)<=7&&los(P.x,P.y,t.x,t.y)&&(foes.filter(o=>cheb(o,t)<=1).length>=2||(P.hp<P.st.mhp*.45&&t.awake))))return{use:'gren'};
    if(G.mode.stance==='flee'&&P.hp<P.st.mhp*.35&&adj.length&&P.inv.grens.some(x=>x.st==='camo')&&G.camo<=0)return{use:'gren'}}
  if(G.mode.stance==='flee'&&G.camo<=0&&!(G.braveT>0&&G.braveT--)){
    const reach=bfsMap([[P.x,P.y]],8);
    const threats=foes.filter(e=>(e.awake||md(e,P)<=2)&&((reach[idx(e.x,e.y)]<=4)||(e.weapon.cat==='ranged'&&los(e.x,e.y,P.x,P.y)&&dst(e,P)<=e.weapon.range+.5)));
    if(threats.length){
      G.fleeT=(G.fleeT||0)+1;
      if(G.fleeT>14){G.fleeT=0;G.braveT=10;log('Путь перекрыт — прорыв!','#ffb04a')}
      else{
        const plan=goalPlan();
        const mv=fleeStep(threats,plan.path);if(mv)return mv;
        if(adj.length)return(P.eq.melee||!hasGun)?{melee:adj[0]}:{shoot:adj[0]};
        const t=threats.find(canShoot);if(t)return{shoot:t};
        return plan.a;
      }
    } else {G.fleeT=Math.max(0,(G.fleeT||0)-1);return goalPlan().a}
  }
  let targets=G.camo>0?foes.filter(e=>md(e,P)===1):foes;
  if(G.mode.goal!=='explore')targets=targets.filter(e=>(e.awake&&cheb(e,P)<=5)||md(e,P)===1);
  if(targets.length){
    targets.sort((a,b)=>dst(a,P)-dst(b,P));const t=targets[0];
    if(md(t,P)===1){if(hasGun&&w.kind==='дробовик')return{shoot:t};return(P.eq.melee||!hasGun)?{melee:t}:{shoot:t}}
    const sh=targets.find(e=>canShoot(e)&&md(e,P)>1);if(sh)return{shoot:sh};
    const p=bfs(P.x,P.y,(x,y)=>x===t.x&&y===t.y,true);if(p&&p.length<=14)return{dx:p[0][0]-P.x,dy:p[0][1]-P.y};
  }
  return goalPlan().a;
}
function fleeStep(threats,path){
  const P=G.p,M=G.M,W=M.W;
  const dz=bfsMap(threats.map(e=>[e.x,e.y]),14);
  if(path&&path.length){const[nx,ny]=path[0];const i=ny*W+nx;
    if(dz[i]>=3&&!enemyAt(nx,ny)&&!threats.some(e=>md(e,{x:nx,y:ny})<=1))return{dx:nx-P.x,dy:ny-P.y}}
  const end=path&&path.length?path[path.length-1]:null;const gd=end?bfsMap([end],90):null;
  const sc=(x,y)=>{const i=y*W+x;let s=Math.min(dz[i],15)*3;if(gd)s-=Math.min(gd[i],90)*1.2;
    if(threats.some(e=>md(e,{x,y})===1))s-=10;if(threats.some(e=>e.weapon&&e.weapon.cat==='ranged'&&los(e.x,e.y,x,y)))s-=1.5;return s};
  let best=null,bs=sc(P.x,P.y);
  for(const[dx,dy]of DIRS){const nx=P.x+dx,ny=P.y+dy;if(TT(nx,ny)!==1||enemyAt(nx,ny))continue;
    if(end&&nx===end[0]&&ny===end[1]&&isExit(nx,ny))return{dx,dy};
    if(isExit(nx,ny))continue;
    const s=sc(nx,ny)+Math.random()*.3;if(s>bs){bs=s;best={dx,dy}}}
  return best;
}

// ---------- turn ----------
function act(a){
  const P=G.p,M=G.M;
  if(a.use==='med')return useMed()&&endTurn();
  if(a.use==='bat')return useBat()&&endTurn();
  if(a.use==='gren')return useGrenade()&&endTurn();
  if(a.use==='imp')return useImplant(a.slot)&&endTurn();
  if(a.wait){
    if(!G.manual&&!G.en.some(e=>!e.dead&&G.vis[idx(e.x,e.y)]))G.idle++;
    if(G.idle>=3){rescueStep();}
    return endTurn();
  }
  G.idle=0;
  if(a.loot){lootProp(a.loot);return endTurn()}
  if(a.melee){heroMelee(a.melee);return endTurn()}
  if(a.shoot){heroShoot(a.shoot);return endTurn()}
  if(a.reload){return reloadWpn()?endTurn():false}
  const nx=P.x+a.dx,ny=P.y+a.dy;if(a.dx)P.face=a.dx;
  const e=enemyAt(nx,ny);if(e){e.awake=true;heroMelee(e);return endTurn()}
  if(TT(nx,ny)!==1)return a.manual?false:endTurn();
  P.x=nx;P.y=ny;
  pickupAt(nx,ny);
  if(nx===M.exit.x&&ny===M.exit.y){G.descend=.6;G.exitTo='down';log('Спуск ниже…','#ff7ad8')}
  else if(nx===M.evac.x&&ny===M.evac.y){G.descend=.6;G.exitTo='home';log('Эвакуация на базу…','#7dff4f')}
  return endTurn();
}
// last-resort fix if the hero has nothing to do: walk to the target exit through anything, or hop next to it
function rescueStep(){
  const P=G.p,M=G.M,ex=G.mode.goal==='home'?M.evac:M.exit;G.idle=0;
  const p=bfs(P.x,P.y,(x,y)=>x===ex.x&&y===ex.y,false,true);
  if(p){G.forcePath=p;log('Пересчёт маршрута…','#8a83ab');return}
  for(const[dx,dy]of DIRS){const nx=ex.x+dx,ny=ex.y+dy;if(TT(nx,ny)===1&&!enemyAt(nx,ny)){P.x=P.rx=nx;P.y=P.ry=ny;log('Обходной путь найден','#8a83ab');return}}
}
function endTurn(){
  const P=G.p;G.turn++;
  const sk=P.st.spdSkip||0;
  {const ac=G.actCost||1;G.actCost=1;G.debt=0;let rate=1+sk;if(G.haste>0)rate*=1.6;
    const ov0=packW()/capacity();if(ov0>.75)rate/=1+Math.min(.6,(ov0-.75)*1.6);G.heroCost=ac/Math.max(.35,rate)}
  G.en=G.en.filter(e=>!e.dead||e.fade>0);
  computeFOV();updateHUD();updateSlots();return true;
}
// ---- world clock: runs every TICK seconds of game time, independent of the merc ----
function worldTick(){
  const P=G.p;G.wt=(G.wt||0)+1;const wt=G.wt;
  if(G.haste>0)G.haste--;if(G.camo>0)G.camo--;if(G.shieldT>0&&--G.shieldT===0)G.shield=0;
  P.cds=P.cds.map(c=>Math.max(0,c-1));
  if(wt%(P.st.mpEvery||4)===0)P.mp=Math.min(P.st.mmp,P.mp+1);
  if(wt%4===0&&P.st.regen&&P.hp>0)P.hp=Math.min(P.st.mhp,P.hp+P.st.regen);
  if(packW()/capacity()>.75&&wt%25===0)log('Перегруз — наёмник двигается медленнее','#ffb04a');
  if(P.hp>0&&P.st.vitRegen&&wt%P.st.vitRegen===0)P.hp=Math.min(P.st.mhp,P.hp+1);
  if(--G.respawnT<=0){const T=G.threat||threatLevel();G.respawnT=Math.max(T>20?5:8,Math.round(rnd([26,40])-T*1.6));
    const n=1+(Math.random()<Math.min(.6,T*.04)?1:0)+(T>12&&Math.random()<.3?1:0)+(T>20?1:0);
    for(let k=0;k<n;k++)if(G.en.filter(e=>!e.dead).length<G.maxAlive){const p=freeTile((x,y)=>Math.abs(x-P.x)+Math.abs(y-P.y)>=10&&!G.vis[idx(x,y)]&&!isExit(x,y));
      if(p){G.en.push(makeEnemy(p.x,p.y));log(n>1?'Где-то появилась группа врагов':'Где-то появился новый враг','#ff8a8a')}}}
  updateSlots();
}

// ================= BASE =================
const BASE_POS={bed:[2,2],crate:[4,2],terminal:[7,2],med:[10,2],wrack:[12,2],gen:[12,7],bench:[12,5],farm:[[2,6],[3,6],[4,6]]};
function enterBase(){
  MODE='base';
  const W=15,Hh=12,t=new Uint8Array(W*Hh).fill(2),room=new Uint8Array(W*Hh).fill(1);
  for(let y=2;y<=9;y++)for(let x=1;x<=13;x++)t[y*W+x]=1;
  t[10*W+7]=1;
  const M={W,H:Hh,t,room,seed:777,biome:'base',exit:{x:7,y:10},evac:null,rooms:[]};
  const baked=renderMap(M);
  const objs=[];const add=(kind,x,y,spr,lv)=>{objs.push({kind,x,y,spr,lv});t[y*W+x]=4};
  const b=ST.base;
  add('bed',...BASE_POS.bed,baseSprite('bed',b.bed),b.bed);
  add('crate',...BASE_POS.crate,baseSprite('crate',b.crate),b.crate);
  add('terminal',...BASE_POS.terminal,baseSprite('terminal',1),1);
  if(b.med)add('med',...BASE_POS.med,baseSprite('med',b.med),b.med);
  if(b.wrack)add('wrack',...BASE_POS.wrack,baseSprite('wrack',b.wrack),b.wrack);
  if(b.gen)add('gen',...BASE_POS.gen,baseSprite('gen',b.gen),b.gen);
  if(b.bench)add('bench',...BASE_POS.bench,baseSprite('bench',b.bench),b.bench);
  for(let i=0;i<b.farm;i++)add('farm',...BASE_POS.farm[i],makeProp(1000+i*17,'rack').spr,b.farm);
  const neons=[];if(b.neon){const pts=[];const word=[[0,0],[0,1],[0,2],[1,0],[2,0],[2,1],[2,2],[4,0],[4,1],[4,2],[5,2],[6,0],[6,1],[6,2],[8,0],[8,1],[8,2],[9,1],[10,0],[10,1],[10,2]];word.forEach(([x,y])=>pts.push([3+x,5+y]));
    neons.push({x:5,y:1,col:'#ff2fa8',pts,ph:1});neons.push({x:9,y:1,col:'#22e6ff',pts:makeSign(RNG(5)),ph:4})}
  const lights=[{x:7.5,y:5,c:[255,190,120],rad:9,int:.6,kind:'win'}];
  if(b.neon)lights.push({x:5.5,y:2.3,c:[255,47,168],rad:5,int:.8,kind:'neon',ref:neons[0]},{x:9.5,y:2.3,c:[34,230,255],rad:5,int:.7,kind:'neon',ref:neons[1]});
  lights.push({x:7.5,y:3,c:[255,47,168],rad:3,int:.5,kind:'win'});
  BS={M,mapC:baked.c,objs,neons,lights,hero:{x:7,y:8,rx:7,ry:8},path:[],pending:null,cool:0,time:BS?BS.time:0,cam:{x:7*TS+8,y:6*TS+8}};
  H.x=H.rx=7;H.y=H.ry=8;
  setModeUI();updateHUD();
}
function baseWalkTo(kind){
  const o=BS.objs.find(o=>o.kind===kind)||(kind==='door'?{x:7,y:10}:null);
  if(!o){openBasePanel(kind);return}
  const M=BS.M,W=M.W,s0=H.y*W+H.x,prev=new Int32Array(W*M.H).fill(-1),q=[s0];prev[s0]=s0;let end=-1;
  const goal=(x,y)=>kind==='door'?(x===7&&y===9):md({x,y},o)===1;
  if(goal(H.x,H.y)){openBasePanel(kind);return}
  for(let h=0;h<q.length&&end<0;h++){const c=q[h];for(const[dx,dy]of DIRS){const n=c+dy*W+dx,x=n%W,y=(n/W)|0;if(prev[n]!==-1||M.t[n]!==1||(x===7&&y===10))continue;prev[n]=c;q.push(n);if(goal(x,y)){end=n;break}}}
  if(end<0){openBasePanel(kind);return}
  const path=[];let k=end;while(k!==s0){path.push([k%W,(k/W)|0]);k=prev[k]}
  BS.path=path.reverse();BS.pending=kind;BS.face=o;
}
function matLine(cost){return Object.entries(cost).map(([m,n])=>{const have=ST.mats[m]||0;return`<span style="color:${have>=n?'#7dff4f':'#ff6a7a'}"><img class="mi" src="${MAT_ICON[m].toDataURL()}">${MATS[m].n} ${have}/${n}</span>`}).join(' ')}
const canPay=c=>Object.entries(c).every(([m,n])=>(ST.mats[m]||0)>=n);
function openBasePanel(kind){
  if(kind==='bed')return bedPanel();if(kind==='crate')return stashPanel();if(kind==='terminal')return tradePanel();if(kind==='door')return raidPanel();
  return buildPanel();
}
function bedPanel(){
  const l=ST.base.bed;
  showOv(`<h2>${UP.bed.lv[l].toUpperCase()}</h2><div class="hero-top"><img class="big" src="${baseSprite('bed',l).toDataURL()}"><div><p>HP ${H.hp}/${H.st.mhp} · EN ${H.mp}/${H.st.mmp}<br>${UP.bed.eff(l)}</p>${ST.buff?`<p style="color:#7dff4f">Бонус на рейд активен: +${ST.buff.hp} HP, +${ST.buff.en} EN</p>`:''}</div></div>
  <div class="row"><button class="btn" id="bRest">Отдохнуть</button><button class="btn" id="oClose">Закрыть</button></div>`);
  $('bRest').onclick=()=>{if(l>=2)ST.buff={hp:10*(l-1),en:5*(l-1)};recalc(H);H.hp=H.st.mhp;H.mp=H.st.mmp;saveGame();updateHUD();log('Герой отдохнул: HP и энергия восстановлены','#7dff4f');bedPanel()};bindOv();
}
let STSEL=-1;
function stashPanel(){
  const mats=MAT_KEYS.map(m=>`<div class="mat"><img src="${MAT_ICON[m].toDataURL()}"><span>${MATS[m].n}</span><b>${ST.mats[m]||0}</b></div>`).join('');
  const grid=ST.stash.map((it,i)=>`<button class="cell ${i===STSEL?'on':''}" data-i="${i}" style="--rc:${RAR[it.rar].c}"><img src="${iconURL(it)}"></button>`).join('');
  const sel=ST.stash[STSEL];
  let det='';
  if(sel){const gear=['melee','ranged','armor','clothes','implant'].includes(sel.cat);
    det=`<div class="det"><img class="big" src="${iconURL(sel)}"><div><div class="nm" style="color:${RAR[sel.rar].c}">${sel.name}</div><p>${CAT_N[sel.cat]} · ${RAR[sel.rar].n} · ур. ${sel.lvl}<br>${sel.lines.join('<br>')}</p>
    <div class="row">${gear?'<button class="btn" id="sEq">Надеть</button>':'<button class="btn" id="sTake">В сумку</button>'}${gear?'<button class="btn" id="sDis">Разобрать</button>':''}</div></div></div>`}
  showOv(`<h2>${UP.crate.lv[ST.base.crate].toUpperCase()}</h2><div class="mats">${mats}</div>
  <p>Предметы ${ST.stash.length}/${stashCap()} · Кредиты ${ST.credits}₵</p>${det}<div class="agrid">${grid||'<p>Пусто. Принесите добычу из рейда.</p>'}</div>
  <div class="sect">СНАРЯЖЕНИЕ ГЕРОЯ</div>${eqRow('Ближний бой',H.eq.melee)}${eqRow('Дальний бой',H.eq.ranged)}${eqRow('Броня',H.eq.armor)}${eqRow('Одежда',H.eq.clothes)}
  ${eqRow('Боевой имплант 1',H.eq.act[0])}${eqRow('Боевой имплант 2',H.eq.act[1])}${eqRow('Пассивный 1',H.eq.pas[0])}${eqRow('Пассивный 2',H.eq.pas[1])}
  <p>Сумка: аптечки ${H.inv.meds.length} · батареи ${H.inv.bats.length} · пули ${H.inv.ammo['пули']} · дробь ${H.inv.ammo['дробь']} · энергия ${H.inv.ammo['энергия']}</p>
  <div class="row"><button class="btn" id="sBest">Надеть лучшее</button><button class="btn" id="oClose">Закрыть</button></div>`,true);
  document.querySelectorAll('.cell').forEach(b=>b.onclick=()=>{STSEL=+b.dataset.i;stashPanel()});
  const b=(id,f)=>{const e=$(id);if(e)e.onclick=f};
  b('sEq',()=>{const it=ST.stash.splice(STSEL,1)[0];const old=forceEquip(it);if(old)ST.stash.push(old);STSEL=-1;after()});
  b('sTake',()=>{const it=ST.stash.splice(STSEL,1)[0];if(it.cat==='med')H.inv.meds.push(it);else if(it.cat==='battery')H.inv.bats.push(it);else H.inv.ammo[it.kind]+=it.count;STSEL=-1;after()});
  b('sDis',()=>{const it=ST.stash.splice(STSEL,1)[0];const g={parts:rnd([1,3])+it.rar};if(it.cat==='ranged'||it.cat==='implant')g.elec=rnd([1,2])+it.rar;if(it.cat==='implant'&&Math.random()<.2+.15*it.rar)g.cpu=1;if(it.cat==='armor'||it.cat==='clothes')g.junk=rnd([1,3]);
    for(const m in g)ST.mats[m]+=g[m];log('Разобрано: '+Object.entries(g).map(([m,n])=>`${MATS[m].n} ×${n}`).join(', '),'#e0c070');STSEL=-1;after()});
  b('sBest',()=>{let changed=0;for(let i=ST.stash.length-1;i>=0;i--){const it=ST.stash[i];if(!['melee','ranged','armor','clothes','implant'].includes(it.cat))continue;const old=equipIfBetter(it);if(old!==it){ST.stash.splice(i,1);if(old)ST.stash.push(old);changed++}}
    rebuildSprites(H);log(changed?`Обновлено снаряжения: ${changed}`:'Лучшее уже надето','#7dff4f');after()});
  function after(){recalc(H);rebuildSprites(H);saveGame();updateHUD();stashPanel()}
  bindOv();
}
let TRTAB='sell',TRSEL=-1;
function shopStock(){const out=[];const r=RNG(ST.shopSeed);const L=Math.max(1,ST.maxDepth);for(let i=0;i<6;i++){out.push(makeItem(ST.shopSeed+i*977,r.pick(['melee','melee','ranged','armor','clothes','implant','implant']),L))}return out}
const SHOP_FIX=[{n:'Аптечка',cat:'med',p:18},{n:'Граната',cat:'grenade',p:25},{n:'Энергобатарея',cat:'battery',p:15},{n:'Пули ×20',ammo:'пули',cnt:20,p:20},{n:'Дробь ×8',ammo:'дробь',cnt:8,p:20},{n:'Энергоячейки ×12',ammo:'энергия',cnt:12,p:24}];
function tradePanel(){
  const tabs=`<div class="chips"><button class="chip ${TRTAB==='sell'?'on':''}" data-t="sell">Продать</button><button class="chip ${TRTAB==='buy'?'on':''}" data-t="buy">Купить</button></div>`;
  let body='';
  if(TRTAB==='sell'){
    body=`<div class="sect">РЕСУРСЫ</div>`+MAT_KEYS.map(m=>`<div class="trow"><img src="${MAT_ICON[m].toDataURL()}"><span>${MATS[m].n} ×${ST.mats[m]||0}</span><b>${MATS[m].price}₵/шт</b><button class="btn sm" data-sm="${m}" ${ST.mats[m]?'':'disabled'}>Продать 1</button><button class="btn sm" data-sa="${m}" ${ST.mats[m]?'':'disabled'}>Все</button></div>`).join('')+
      `<div class="sect">ПРЕДМЕТЫ ИЗ ЯЩИКА</div>`;
    const sel=ST.stash[TRSEL];
    if(sel)body+=`<div class="det"><img class="big" src="${iconURL(sel)}"><div><div class="nm" style="color:${RAR[sel.rar].c}">${sel.name}</div><p>${sel.lines.join('<br>')}</p><button class="btn" id="tSell">Продать за ${sellPrice(sel)}₵</button></div></div>`;
    body+=`<div class="agrid">${ST.stash.map((it,i)=>`<button class="cell ${i===TRSEL?'on':''}" data-i="${i}" style="--rc:${RAR[it.rar].c}"><img src="${iconURL(it)}"><em>${sellPrice(it)}</em></button>`).join('')||'<p>Ящик пуст</p>'}</div>`;
  } else {
    const stock=shopStock();
    body=`<div class="sect">РАСХОДНИКИ</div>`+SHOP_FIX.map((f,i)=>`<div class="trow"><span>${f.n}</span><b>${f.p}₵</b><button class="btn sm" data-bf="${i}" ${ST.credits>=f.p?'':'disabled'}>Купить</button></div>`).join('')+`<div class="sect">ВИТРИНА (обновляется после рейда)</div>`;
    const sel=stock[TRSEL];
    if(sel&&!ST.shopBought.includes(TRSEL))body+=`<div class="det"><img class="big" src="${iconURL(sel)}"><div><div class="nm" style="color:${RAR[sel.rar].c}">${sel.name}</div><p>${CAT_N[sel.cat]} · ${RAR[sel.rar].n} · ур. ${sel.lvl}<br>${sel.lines.join('<br>')}</p><button class="btn" id="tBuy" ${ST.credits>=buyPrice(sel)?'':'disabled'}>Купить за ${buyPrice(sel)}₵</button></div></div>`;
    body+=`<div class="agrid">${stock.map((it,i)=>ST.shopBought.includes(i)?`<div class="cell sold">продано</div>`:`<button class="cell ${i===TRSEL?'on':''}" data-i="${i}" style="--rc:${RAR[it.rar].c}"><img src="${iconURL(it)}"><em>${buyPrice(it)}</em></button>`).join('')}</div>`;
  }
  showOv(`<h2>ТОРГОВЫЙ ТЕРМИНАЛ</h2><p class="cr">Кредиты: <b>${ST.credits}₵</b></p>${tabs}${body}<div class="row"><button class="btn" id="oClose">Закрыть</button></div>`,true);
  document.querySelectorAll('.chip').forEach(b=>b.onclick=()=>{TRTAB=b.dataset.t;TRSEL=-1;tradePanel()});
  document.querySelectorAll('.cell[data-i]').forEach(b=>b.onclick=()=>{TRSEL=+b.dataset.i;tradePanel()});
  document.querySelectorAll('[data-sm]').forEach(b=>b.onclick=()=>{const m=b.dataset.sm;if(ST.mats[m]>0){ST.mats[m]--;ST.credits+=MATS[m].price}fin()});
  document.querySelectorAll('[data-sa]').forEach(b=>b.onclick=()=>{const m=b.dataset.sa;ST.credits+=MATS[m].price*(ST.mats[m]||0);ST.mats[m]=0;fin()});
  document.querySelectorAll('[data-bf]').forEach(b=>b.onclick=()=>{const f=SHOP_FIX[+b.dataset.bf];if(ST.credits<f.p)return;ST.credits-=f.p;const L=Math.max(1,ST.maxDepth);
    if(f.cat==='med')H.inv.meds.push(makeItem(rseed(),'med',L,{rar:0,kind:'аптечка'}));else if(f.cat==='battery')H.inv.bats.push(makeItem(rseed(),'battery',L,{rar:1}));else H.inv.ammo[f.ammo]+=f.cnt;log(`Куплено: ${f.n}`,'#7dff4f');fin()});
  const ts=$('tSell');if(ts)ts.onclick=()=>{const it=ST.stash.splice(TRSEL,1)[0];ST.credits+=sellPrice(it);log(`Продано: ${it.name} (+${sellPrice(it)}₵)`,'#f9f871');TRSEL=-1;fin()};
  const tb=$('tBuy');if(tb)tb.onclick=()=>{const it=shopStock()[TRSEL];const p=buyPrice(it);if(ST.credits<p)return;if(ST.stash.length>=stashCap()){log('Ящик полон','#ffb04a');return}
    ST.credits-=p;ST.stash.push(it);ST.shopBought.push(TRSEL);log(`Куплено: ${it.name} → в ящик`,'#7dff4f');TRSEL=-1;fin()};
  function fin(){saveGame();updateHUD();tradePanel()}
  bindOv();
}
function buildPanel(){
  const rows=Object.entries(UP).map(([k,u])=>{const l=ST.base[k],maxed=l>=u.max,cost=maxed?null:u.cost[l];
    const icon=k==='farm'?makeProp(1000,'rack').spr:k==='neon'?MAT_ICON.elec:k==='terminal'?null:baseSprite(k,Math.max(1,maxed?l:l+1));
    return`<div class="brow"><img src="${icon.toDataURL()}"><div class="tx"><div class="nm">${u.n} <span class="lvl">ур. ${l}/${u.max}</span></div><p>${u.lv[l]} — ${u.eff(l)}</p>
      ${maxed?'<p style="color:#7dff4f">Максимальный уровень</p>':`<p>След.: <b>${u.lv[l+1]}</b> — ${u.eff(l+1)}</p><p class="bcost">${matLine(cost)}</p><button class="btn sm" data-up="${k}" ${canPay(cost)?'':'disabled'}>Построить</button>`}</div></div>`}).join('');
  showOv(`<h2>СТРОЙКА</h2><div class="mats">${MAT_KEYS.map(m=>`<div class="mat"><img src="${MAT_ICON[m].toDataURL()}"><span>${MATS[m].n}</span><b>${ST.mats[m]||0}</b></div>`).join('')}</div>${rows}<div class="row"><button class="btn" id="oClose">Закрыть</button></div>`,true);
  document.querySelectorAll('[data-up]').forEach(b=>b.onclick=()=>{const k=b.dataset.up,u=UP[k],c=u.cost[ST.base[k]];if(!canPay(c))return;for(const m in c)ST.mats[m]-=c[m];ST.base[k]++;
    recalc(H);saveGame();log(`Построено: ${u.n} — ${u.lv[ST.base[k]]}`,'#7dff4f');enterBase();buildPanel()});
  bindOv();
}
function raidPanel(){
  const warn=H.hp<H.st.mhp*.6?'<p style="color:#ff6a7a">Герой ранен. Стоит отдохнуть на кровати.</p>':'';
  showOv(`<h2>ВЫХОД В РЕЙД</h2><div class="hero-top"><img class="big" src="${heroCanvasURL()}"><div><div class="nm">${H.name}</div><p>ур. ${H.lvl} · HP ${H.hp}/${H.st.mhp} · EN ${H.mp}/${H.st.mmp}<br>рюкзак: ${capacity()} веса · аптечки ${H.inv.meds.length} · батареи ${H.inv.bats.length}<br>рекорд глубины: ${ST.maxDepth} · рейдов: ${ST.raids}</p></div></div>${warn}
  <p>На каждом этаже два выхода: <span style="color:#ff7ad8">спуск ниже</span> (больше добычи, опаснее) и <span style="color:#7dff4f">эвакуация</span> на базу. Погибнете — рюкзак потерян.</p>
  <div class="row"><button class="btn" id="rGo">Начать рейд</button><button class="btn" id="oClose">Остаться</button></div>`);
  $('rGo').onclick=()=>startRaid();bindOv();
}

// ---------- UI glue ----------
function setModeUI(){
  document.body.classList.toggle('base',MODE==='base');document.body.classList.toggle('raid',MODE==='raid');
}
function updateHUD(){
  if(!H)return;const P=H;
  $('hpf').style.width=(P.hp/P.st.mhp*100)+'%';$('hpt').textContent=`${P.hp}/${P.st.mhp}`;
  $('mpf').style.width=(P.mp/P.st.mmp*100)+'%';$('mpt').textContent=`${P.mp}/${P.st.mmp}`;
  if(MODE==='base'){
    $('fl').textContent='БАЗА';$('biome').textContent='';$('foes').textContent=`${ST.credits}₵`;
    $('winfo').innerHTML=`<span style="color:#f9f871">${H.name}</span> · ур. ${H.lvl}<br><span class="st">рейдов ${ST.raids} · рекорд глубины ${ST.maxDepth} · в ящике ${ST.stash.length}/${stashCap()}</span><br><span class="st">${MAT_KEYS.map(m=>`${MATS[m].n.split(' ')[0]} ${ST.mats[m]||0}`).join(' · ')}</span>`;
    $('lowhp').style.opacity=0;return;
  }
  $('fl').textContent='ЭТАЖ '+G.floor;$('biome').textContent=BIOMES[G.biome].name;
  $('foes').textContent=`враги ${G.en.filter(e=>!e.dead).length}`;
  const w=P.eq.ranged;
  $('winfo').innerHTML=`<span style="color:${P.eq.melee?RAR[P.eq.melee.rar].c:'#b9ad95'}">⚔ ${P.eq.melee?P.eq.melee.name:'кулаки'}</span><br>`+
    (w?`<span style="color:${RAR[w.rar].c}">➶ ${w.name}</span> <b>${P.inv.ammo[w.ammo]}</b> ${w.ammo}`:'➶ —')+
    `<br><span class="st">рюкзак <b>${packW()}/${capacity()}</b>${[G.shield>0?`щит ${G.shield}`:'',G.camo>0?`камуфляж ${tsec(G.camo)}`:'',G.haste>0?`ускорение ${tsec(G.haste)}`:'',`защ ${P.st.def}`,`убито ${G.kills}`].filter(Boolean).map(s=>' · '+s).join('')}</span>`;
  const gl={explore:['ИССЛЕ-<br>ДОВАТЬ','c1'],deeper:['ГЛУБЖЕ<br>↓','c5'],home:['ДОМОЙ<br>⌂','c2']}[G.mode.goal];
  $('bGoal').innerHTML=gl[0];$('bGoal').className='btn mode '+gl[1];
  $('bStance').innerHTML=G.mode.stance==='fight'?'ДРАТЬ-<br>СЯ':'БЕ-<br>ЖАТЬ';$('bStance').className='btn mode '+(G.mode.stance==='fight'?'c3':'c4');
  $('bSpeed').textContent=G.speed+'×';
  $('lowhp').style.opacity=P.hp<P.st.mhp*.3&&!G.dead?1:0;
}
let HP_TAB='eq',HP_SEL='melee';
const SLOT_DEF=[['melee','Ближний'],['ranged','Дальний'],['armor','Броня'],['clothes','Одежда'],['act0','Боевой 1'],['act1','Боевой 2'],['pas0','Пассив 1'],['pas1','Пассив 2']];
const slotItem=k=>k.startsWith('act')?H.eq.act[+k[3]]:k.startsWith('pas')?H.eq.pas[+k[3]]:H.eq[k];
const bar=(v,m,c)=>`<div class="mbar"><i style="width:${Math.max(0,Math.min(100,v/m*100))}%;background:${c}"></i><span>${v}/${m}</span></div>`;
function itemDet(it,extra=''){return it?`<div class="det sm"><img src="${iconURL(it)}"><div><div class="nm" style="color:${RAR[it.rar].c}">${it.name}</div><p>${CAT_N[it.cat]} · ${RAR[it.rar].n} · ур. ${it.lvl}<br>${it.lines.join(' · ')}${extra}</p></div></div>`:'<div class="det sm empty">Пустой слот</div>'}
function packValue(){let v=0;for(const it of G.pack.items)v+=sellPrice(it);for(const m in G.pack.mats)v+=MATS[m].price*G.pack.mats[m];return v}
function heroPanel(){
  const P=H,raid=MODE==='raid'&&G,T=P.traits;
  const head=`<div class="hp-head"><img src="${heroCanvasURL()}"><div class="hp-info"><div class="nm">${P.name} <span class="lvl">ур. ${P.lvl}</span></div>
    ${bar(P.hp,P.st.mhp,'linear-gradient(90deg,#a82a4e,#ff4b6a)')}${bar(P.mp,P.st.mmp,'linear-gradient(90deg,#1f4fb8,#22b6ff)')}
    <p>защ ${P.st.def} · уклон ${Math.round(P.st.dodge*100)}% · крит +${Math.round(P.st.crit*100)}% · рюкзак ${capacity()}</p>${attrHTML(true)}</div></div>`;
  const invLabel=raid?`Рюкзак ${packW()}/${capacity()}`:`Ящик ${ST.stash.length}/${stashCap()}`;
  const tabs=`<div class="tabs"><button class="tab ${HP_TAB==='eq'?'on':''}" data-tab="eq">Снаряжение</button><button class="tab ${HP_TAB==='inv'?'on':''}" data-tab="inv">${invLabel}</button></div>`;
  let body='';
  if(HP_TAB==='eq'){
    const cells=SLOT_DEF.map(([k,n])=>{const it=slotItem(k);let badge='';
      if(it&&k.startsWith('act')){const cd=P.cds[+k[3]];badge=cd>0?`<em class="cd">${csec(cd)}с</em>`:`<em class="en">${it.cost}</em>`}
      return`<button class="scell ${HP_SEL===k?'on':''}" data-slot="${k}" style="--rc:${it?RAR[it.rar].c:'#2e2748'}">${it?`<img src="${iconURL(it)}">`:'<span class="ph">—</span>'}${badge}<small>${n}</small></button>`}).join('');
    const sel=slotItem(HP_SEL);
    const a=P.inv.ammo,cur=P.eq.ranged?P.eq.ranged.ammo:null;
    const medSum=P.inv.meds.reduce((s,m)=>s+m.heal,0),batSum=P.inv.bats.reduce((s,m)=>s+m.energy,0);
    body=`<div class="slots8">${cells}</div>${itemDet(sel)}
    <div class="sect">РАСХОДНИКИ</div>
    <div class="cons">
      <div class="cc"><img src="${(P.inv.meds[0]?iconURL(P.inv.meds[0]):MEDPH.toDataURL())}"><b>${P.inv.meds.length}</b><span>аптечки<br>+${medSum} HP</span>${raid?`<button class="btn sm" id="cMedU" ${P.inv.meds.length?'':'disabled'}>Исп.</button>`:''}</div>
      <div class="cc"><img src="${(P.inv.bats[0]?iconURL(P.inv.bats[0]):BATPH.toDataURL())}"><b>${P.inv.bats.length}</b><span>батареи<br>+${batSum} EN</span>${raid?`<button class="btn sm" id="cBatU" ${P.inv.bats.length?'':'disabled'}>Исп.</button>`:''}</div>
      <div class="cc"><img src="${(P.inv.grens&&P.inv.grens[0]?iconURL(P.inv.grens[0]):GRPH().toDataURL())}"><b>${(P.inv.grens||[]).length}</b><span>гранаты</span>${raid?`<button class="btn sm" id="cGrU" ${(P.inv.grens||[]).length?'':'disabled'}>Бросок</button>`:''}</div>
      <div class="cc ammo">${['пули','дробь','энергия'].map(k=>`<span class="${k===cur?'cur':''}">${k} <b>${a[k]}</b></span>`).join('')}</div>
    </div>`;
  } else if(raid){
    const w=packW(),cap=capacity(),val=packValue();
    const M=G.M;const pe=bfs(P.x,P.y,(x,y)=>x===M.evac.x&&y===M.evac.y,false,true),pd=bfs(P.x,P.y,(x,y)=>x===M.exit.x&&y===M.exit.y,false,true);
    const hpR=P.hp/P.st.mhp;
    let rec,rc;
    if(hpR<.35&&!P.inv.meds.length){rec='Мало здоровья и нет аптечек — лучше эвакуироваться';rc='#ff6a7a'}
    else if(w>=cap*.85){rec='Рюкзак почти полон — пора выносить добычу';rc='#ffb04a'}
    else if(val>=120&&hpR<.5){rec='Хорошая добыча и потрёпанный герой — стоит уйти';rc='#ffb04a'}
    else {rec='Можно продолжать: место и силы есть';rc='#7dff4f'}
    const matsH=MAT_KEYS.some(m=>G.pack.mats[m])?compGrid(G.pack.mats):'';
    const sel=HP_SEL&&HP_SEL[0]==='p'?G.pack.items[+HP_SEL.slice(1)]:null;
    body=`<div class="wrow"><span>Вес</span>${bar(w,cap,w>=cap*.85?'#ffb04a':'#e0c070')}</div>
    <div class="risk"><div><small>Ценность</small><b>≈${val}₵</b></div><div><small>До эвакуации</small><b style="color:#7dff4f">${pe?pe.length:'?'} шаг.</b></div><div><small>До спуска</small><b style="color:#ff7ad8">${pd?pd.length:'?'} ход.</b></div><div><small>Глубина</small><b>${G.floor}</b></div></div>
    <p class="rec" style="color:${rc}">${rec}. При гибели рюкзак будет потерян.</p>
    ${matsH||'<p>Компонентов пока нет</p>'}
    ${sel?itemDet(sel,`<br>продажа ${sellPrice(sel)}₵`):''}
    <div class="agrid">${G.pack.items.map((it,i)=>`<button class="cell ${HP_SEL==='p'+i?'on':''}" data-pi="${i}" style="--rc:${RAR[it.rar].c}"><img src="${iconURL(it)}"><em>${sellPrice(it)}</em></button>`).join('')||'<p>Предметов пока нет</p>'}</div>`;
  } else {
    body=`${compGrid(ST.mats)}
    <p>Кредиты ${ST.credits}₵ · рейдов ${ST.raids} · рекорд глубины ${ST.maxDepth}</p>
    <div class="agrid">${ST.stash.map(it=>`<div class="cell" style="--rc:${RAR[it.rar].c}"><img src="${iconURL(it)}"></div>`).join('')||'<p>Ящик пуст</p>'}</div>
    <div class="row"><button class="btn" id="hpStash">Открыть ящик</button></div>`;
  }
  const sbarH=raid?`<div class="sbar"><button class="btn" id="hpPause">${G.paused?'▶':'❚❚'}</button><button class="btn gH ${G.mode.goal==='home'?'on':''}" id="gHome">⌂ Домой</button><button class="btn gD ${G.mode.goal==='deeper'?'on':''}" id="gDeep">↓ Глубже</button><button class="btn gE ${G.mode.goal==='explore'?'on':''}" id="gExp">⌕ Исслед.</button><button class="btn" id="oArs">⚙</button><button class="btn" id="hpX">✕</button></div>`
    :`<div class="sbar"><button class="btn" id="oArs">Арсенал</button><button class="btn" id="oReset">Сброс</button><button class="btn" id="hpX">✕</button></div>`;
  const sc=$('panel').classList.contains('sheet')?$('panel').scrollTop:0;
  showOv(`${sbarH}${head}${tabs}${body}${HP_TAB==='eq'?`<div class="sect">ХАРАКТЕРИСТИКИ</div>${attrHelp()}`:''}`,true);
  $('panel').classList.add('sheet');$('ov').classList.add('dock');SHEET=true;$('panel').scrollTop=sc;
  document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{HP_TAB=b.dataset.tab;HP_SEL=HP_TAB==='eq'?'melee':null;heroPanel()});
  document.querySelectorAll('[data-slot]').forEach(b=>b.onclick=()=>{HP_SEL=b.dataset.slot;heroPanel()});
  document.querySelectorAll('[data-pi]').forEach(b=>b.onclick=()=>{HP_SEL='p'+b.dataset.pi;heroPanel()});
  const on=(id,f)=>{const e=$(id);if(e)e.onclick=f};
  const goal=g=>()=>{G.manual=false;G.mode.goal=g;G.idle=0;updateHUD();heroPanel()};
  on('gHome',goal('home'));on('gDeep',goal('deeper'));on('gExp',goal('explore'));
  on('hpPause',()=>{G.paused=!G.paused;heroPanel()});
  on('hpX',()=>closeSheet());
  on('cGrU',()=>{G.buf={use:'gren'};if(G.paused)G.paused=false;setTimeout(heroPanel,50)});on('cMedU',()=>{G.buf={use:'med'};if(G.paused)G.paused=false;setTimeout(heroPanel,50)});on('cBatU',()=>{G.buf={use:'bat'};if(G.paused)G.paused=false;setTimeout(heroPanel,50)});
  on('hpStash',()=>{closeSheet();stashPanel()});
  bindAttr(heroPanel);
  bindOv();
}
let SHEET=false;
function closeSheet(){SHEET=false;$('ov').classList.remove('dock');$('panel').classList.remove('sheet');hideOv();if(MODE==='raid'&&G)G.paused=false}
function openSheet(){if(MODE==='raid'&&(!G||G.dead))return;if(H&&H.dead){TTAB='hire';return tradePanel()}heroPanel()}
function togglePause(force){
  if(MODE!=='raid'||!G||G.dead)return;G.paused=force!=null?force:!G.paused;
  if(G.paused)heroPanel();else closeSheet();
}
function bindOv(){const b=(id,f)=>{const e=$(id);if(e)e.onclick=f};
  b('oCont',()=>togglePause(false));b('oArs',()=>openArsenal());b('oBack',()=>{if(MODE==='raid')togglePause(true);else baseMenu()});
  b('oHome',()=>{G.mode.goal='home';updateHUD();togglePause(false)});
  b('oClose',()=>{hideOv();if(MODE==='raid'&&G)G.paused=false});
  b('oReset',()=>{try{localStorage.removeItem(SAVE_KEY)}catch(e){}ST=freshState();newHero();enterBase();saveGame();hideOv()});
}
function baseMenu(){heroPanel()}


// ---------- Arsenal ----------
const ARS={cat:'all',lvl:3,seed:rseed(),sel:0,list:[]};
const ARS_TABS=[['all','Всё'],['fx','Эффекты 244'],...Object.entries(CAT_N),['fighters','Бойцы'],['decor','Декор'],['mats','Ресурсы']];
function arsBuild(){
  ARS.list=[];
  if(ARS.cat==='fighters'){for(let i=0;i<12;i++){const ch=randomChar(['mid','high'][i%2]);const w=makeItem(ARS.seed+i*7,i%2?'ranged':'melee',ARS.lvl);ARS.list.push({fighter:1,ch,w,s:actorSprites(ch,w)})}return}
  if(ARS.cat==='decor'){const ks=Object.keys(PROP_DEF);for(let i=0;i<24;i++){const k=ks[i%ks.length];ARS.list.push({decor:1,p:makeProp(ARS.seed+i*31,k)})}return}
  if(ARS.cat==='mats'){MAT_KEYS.forEach(m=>ARS.list.push({mat:m}));return}
  for(let i=0;i<40;i++)ARS.list.push(makeItem(ARS.seed+i*131,ARS.cat==='all'?null:ARS.cat,ARS.lvl));
}
let _grph=null;function GRPH(){return _grph||(_grph=makeItem(3,'grenade',1,{rar:0,fx:'explosions/grenade'}).icon)}
function openArsenal(){if(ARS.cat==='fx')return renderFxArsenal();arsBuild();renderArsenal()}
function renderArsenal(){
  const tabs=ARS_TABS.map(([k,n])=>`<button class="chip ${ARS.cat===k?'on':''}" data-c="${k}">${n}</button>`).join('');
  const sel=ARS.list[ARS.sel]||ARS.list[0];let det='';
  if(sel&&sel.fighter)det=`<div class="det"><img class="bigf" src="${posed(sel.s).toDataURL()}"><div><div class="nm">${sel.ch.name}</div><div style="color:${RAR[sel.w.rar].c}">${sel.w.name}</div><p>${RAR[sel.w.rar].n} · ${sel.w.lines.join(' · ')}<br>${sel.ch.g.traits['Причёска']}, ${sel.ch.g.traits['Верх']}</p></div></div>`;
  else if(sel&&sel.decor){const D=PROP_DEF[sel.p.kind];det=`<div class="det"><img class="bigd" src="${sel.p.spr.toDataURL()}"><div><div class="nm">${sel.p.name}</div><p>Разбор: ${tsec(sel.p.turns)}<br>Добыча (${D.rolls[0]}–${D.rolls[1]} шт.): ${D.loot.map(([m])=>`<span style="color:${MATS[m].c}">${MATS[m].n}</span>`).join(', ')}${D.item?`<br>шанс предмета ${Math.round(D.item*100)}%`:''}</p></div></div>`}
  else if(sel&&sel.mat){const M=MATS[sel.mat];det=`<div class="det"><img class="big" src="${MAT_ICON[sel.mat].toDataURL()}"><div><div class="nm" style="color:${M.c}">${M.n}</div><p>${TIER_N[M.t]} · вес ${M.w} · цена ${M.price}₵${M.buy?' · есть в терминале':' · только из рейдов'}<br>Где искать: ${Object.entries(PROP_DEF).filter(([k,d])=>d.loot.some(l=>l[0]===sel.mat)).map(([k,d])=>d.n).join(', ')}<br>Нужен для: ${Object.entries(UP).filter(([k,u])=>u.L.some(x=>x&&x.it[sel.mat])).map(([k,u])=>u.n).join(', ')||'крафта'}</p></div></div>`}
  else if(sel)det=`<div class="det"><img class="big" src="${iconURL(sel)}"><div><div class="nm" style="color:${RAR[sel.rar].c}">${sel.name}</div><p>${CAT_N[sel.cat]} · ${RAR[sel.rar].n} · ур. ${sel.lvl}${sel.brand?' · '+sel.brand:''}<br>${sel.lines.join('<br>')}<br>цена ${buyPrice(sel)}₵</p></div></div>`;
  const grid=ARS.list.map((it,i)=>{const on=i===ARS.sel?'on':'';
    if(it.fighter)return`<button class="cell f ${on}" data-i="${i}"><img src="${posed(it.s).toDataURL()}"></button>`;
    if(it.decor)return`<button class="cell d ${on}" data-i="${i}"><img src="${it.p.spr.toDataURL()}"></button>`;
    if(it.mat)return`<button class="cell ${on}" data-i="${i}"><img src="${MAT_ICON[it.mat].toDataURL()}"></button>`;
    return`<button class="cell ${on}" data-i="${i}" style="--rc:${RAR[it.rar].c}"><img src="${iconURL(it)}"></button>`}).join('');
  showOv(`<h2>АРСЕНАЛ</h2><div class="chips">${tabs}</div>${det}<div class="agrid">${grid}</div>
   <div class="row"><label class="lv">Уровень <select id="aLvl">${[1,2,3,4,5,6,8,10].map(v=>`<option ${v===ARS.lvl?'selected':''}>${v}</option>`).join('')}</select></label><button class="btn" id="aNew">Новый набор</button><button class="btn" id="oBack">Назад</button></div>`,true);
  document.querySelectorAll('.chip').forEach(b=>b.onclick=()=>{ARS.cat=b.dataset.c;ARS.sel=0;if(ARS.cat==='fx')return renderFxArsenal();arsBuild();renderArsenal()});
  document.querySelectorAll('.cell').forEach(b=>b.onclick=()=>{ARS.sel=+b.dataset.i;renderArsenal()});
  $('aNew').onclick=()=>{ARS.seed=rseed();ARS.sel=0;arsBuild();renderArsenal()};
  $('aLvl').onchange=e=>{ARS.lvl=+e.target.value;arsBuild();renderArsenal()};
  bindOv();
}

// ---------- input ----------
function baseScale(){const W=BS?BS.M.W:15,Hh=BS?BS.M.H:12;return Math.max(2,Math.min(S+(W<12?1:0),Math.floor(CWd/((W+.5)*TS)),Math.floor(CHd*.6/(Hh*TS))))}
function curS(){return MODE==='base'?baseScale():S}
function camOrigin(){const cam=MODE==='raid'?G.cam:BS.cam,s=curS();return[Math.round(CWd/2-cam.x*s),Math.round(CHd*(MODE==='base'?(SHEET?.3:.47):(SHEET?.3:.5))-cam.y*s)]}
function screenToTile(cx,cy){const[ox,oy]=camOrigin(),s=curS();return[Math.floor((cx*DPR-ox)/s/TS),Math.floor((cy*DPR-oy)/s/TS)]}
cv.addEventListener('pointerdown',ev=>{
  const[tx,ty]=screenToTile(ev.clientX,ev.clientY);
  if(MODE==='base'){if($('ov').classList.contains('on'))return;const o=BS.objs.find(o=>o.x===tx&&o.y===ty);if(o){baseWalkTo(o.kind)}else if(tx===7&&ty===10)baseWalkTo('door');return}
  if(!G||G.paused)return;if(tx<0||ty<0||tx>=G.M.W||ty>=G.M.H)return;
  const e=enemyAt(tx,ty);if(e&&G.vis[idx(tx,ty)]){const w=e.weapon;log(`${e.name} · HP ${e.hp}/${e.mhp} · ${w.name||'когти/зубы'}${e.armor?' · '+e.armor.name:''}`,'#ff8a8a');return}
  const pr=G.props.find(p=>p.x===tx&&p.y===ty&&G.seen[idx(tx,ty)]);if(pr){const D=PROP_DEF[pr.P.kind];log(`${pr.P.name}: ${D.loot.map(l=>MATS[l[0]].n).join(', ')}`,'#e0c070');return}
  const its=G.items.filter(i=>i.x===tx&&i.y===ty&&G.seen[idx(tx,ty)]);if(its.length){its.forEach(i=>log(`${i.name} — ${i.lines.join(', ')}`,RAR[i.rar].c));return}
  if(tx===G.M.exit.x&&ty===G.M.exit.y)log('Спуск на следующий этаж','#ff7ad8');
  if(tx===G.M.evac.x&&ty===G.M.evac.y)log('Точка эвакуации на базу','#7dff4f');
});
const queue=a=>{if(MODE==='raid'&&G&&!G.dead&&!G.paused)G.buf=a};
$('sMed').onclick=()=>queue({use:'med'});$('sGr').onclick=()=>queue({use:'gren'});$('sBat').onclick=()=>queue({use:'bat'});
$('sA0').onclick=()=>queue({use:'imp',slot:0});$('sA1').onclick=()=>queue({use:'imp',slot:1});
$('sHero').onclick=()=>{if(SHEET)closeSheet();else openSheet()};$('pause').onclick=()=>{if(MODE==='raid')togglePause();else{if(SHEET)closeSheet();else if(H&&!H.dead)heroPanel()}};
setInterval(()=>{if(SHEET&&MODE==='raid'&&G&&!G.paused&&!G.dead&&$('ov').classList.contains('dock'))heroPanel()},900);
$('bGoal').onclick=()=>{G.manual=false;G.mode.goal={explore:'deeper',deeper:'home',home:'explore'}[G.mode.goal];G.idle=0;updateHUD()};
$('bStance').onclick=()=>{G.manual=false;G.mode.stance=G.mode.stance==='fight'?'flee':'fight';updateHUD()};
$('bSpeed').onclick=()=>{G.speed=G.speed>=4?1:G.speed*2;G0speed=G.speed;updateHUD()};
$('bZoom').onclick=()=>{zoom=zoom>=2?-1:zoom+1;resize()};
document.querySelectorAll('[data-base]').forEach(b=>b.onclick=()=>{if(MODE==='base')baseWalkTo(b.dataset.base)});
const NUMDIR={Numpad8:[0,-1],ArrowUp:[0,-1],Numpad2:[0,1],ArrowDown:[0,1],Numpad4:[-1,0],ArrowLeft:[-1,0],Numpad6:[1,0],ArrowRight:[1,0]};
function interact(){
  const P=G.p;
  const adjE=G.en.filter(e=>!e.dead&&md(e,P)===1);if(adjE.length)return{melee:adjE[0]};
  const it=G.items.find(i=>md(i,P)===1&&!isExit(i.x,i.y));if(it){it.ign=false;return{dx:it.x-P.x,dy:it.y-P.y,manual:1}}
  const pr=G.props.find(q=>md(q,P)===1);if(pr){if(packFree()<1){log('Рюкзак полон','#ffb04a');return null}return{loot:pr}}
  const w=P.eq.ranged;
  const vis=G.en.filter(e=>!e.dead&&G.vis[idx(e.x,e.y)]).sort((a,b)=>dst(a,P)-dst(b,P));
  if(vis.length){if(!w){log('Нет оружия дальнего боя','#ffb04a');return null}if(broken(w)){log(`${w.name} сломан`,'#ff3355');return null}if(w.clip<=0&&P.inv.ammo[w.ammo]<=0){log('Нет патронов: '+w.ammo,'#ffb04a');return null}
    const t=vis.find(e=>dst(e,P)<=w.range+.5&&los(P.x,P.y,e.x,e.y));if(t)return{shoot:t};log('Враг вне досягаемости','#8a83ab');return null}
  log('Рядом нечего делать','#8a83ab');return null;
}
function setManual(on){if(!G)return;if(on&&!G.manual){G.manual=true;G.forcePath=null;log('Ручное управление · Num0 — вернуть автопилот','#ff7ad8')}else if(!on&&G.manual){G.manual=false;log('Автопилот','#7dff4f')}updateHUD()}
addEventListener('keydown',ev=>{
  if(MODE!=='raid'||!G||G.dead||G.paused)return;
  const c=ev.code;
  if(NUMDIR[c]){ev.preventDefault();ev.stopImmediatePropagation();setManual(true);const[dx,dy]=NUMDIR[c];if(dx)G.p.face=dx;G.buf={dx,dy,manual:1};return}
  if(c==='Numpad5'||c==='Clear'){ev.preventDefault();ev.stopImmediatePropagation();setManual(true);G.buf={wait:1};return}
  if(c==='NumpadEnter'||c==='Enter'){ev.preventDefault();ev.stopImmediatePropagation();setManual(true);const a=interact();if(a)G.buf=a;return}
  if(c==='Numpad0'||c==='Insert'){ev.preventDefault();ev.stopImmediatePropagation();setManual(false);return}
  if(/^Numpad[1379]$/.test(c)){ev.preventDefault();ev.stopImmediatePropagation();return}
},true);
addEventListener('keydown',ev=>{const k=ev.key.toLowerCase();
  if(MODE!=='raid'||!G)return;
  if(k==='escape'||k==='p'){togglePause();return}if(G.paused)return;
  if(k==='r'||k==='к'||ev.code==='KeyR'||ev.code==='NumpadDecimal')queue({reload:1});else if(k==='1')queue({use:'med'});else if(k==='2')queue({use:'bat'});else if(k==='5')queue({use:'gren'});else if(k==='3')queue({use:'imp',slot:0});else if(k==='4')queue({use:'imp',slot:1});
  else if(k==='g'||k==='п')$('bGoal').click();else if(k==='f'||k==='а')$('bStance').click();
  else if(k==='+'||k==='='){zoom=Math.min(6,zoom+1);resize()}else if(k==='-'){zoom=Math.max(-3,zoom-1);resize()}});

// ================= RENDER =================
function drawProps(list,time){}
function render(time){
  ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#040308';ctx.fillRect(0,0,CWd,CHd);
  if(MODE==='base'&&BS)return renderBase(time);
  if(!G)return;const {W,H:MH}=G.M;
  const[ox,oy]=camOrigin();
  ctx.setTransform(S,0,0,S,ox,oy);ctx.imageSmoothingEnabled=false;
  ctx.drawImage(G.mapC,0,0);
  for(const[wx,wy]of G.waters){if(!G.vis[idx(wx,wy)])continue;const k=Math.floor(time*1.5+wx*1.7+wy)%6;ctx.fillStyle='#4f8a3a';ctx.fillRect(wx*TS+2+k*2,wy*TS+5+(k%3)*3,2,1);ctx.fillStyle='#2c5a2e';ctx.fillRect(wx*TS+11-k,wy*TS+11,3,1)}
  decalsDraw();
  for(const it of G.items){if(!G.seen[idx(it.x,it.y)])continue;const x=it.x*TS,y=it.y*TS,b=(Math.floor(time*1.5+it.ph)&1);
    ctx.fillStyle=RAR[it.rar].c;ctx.globalAlpha=it.ign?.15:.35;ctx.fillRect(x+3,y+13,10,2);ctx.globalAlpha=it.ign?.55:1;ctx.drawImage(it.icon,x+2,y+1-b,12,12);ctx.globalAlpha=1}
  const list=[];
  for(const p of G.props)if(G.seen[idx(p.x,p.y)])list.push({prop:p,ry:p.y-.01});
  for(const e of G.en)if(G.vis[idx(e.x,e.y)])list.push(e);
  list.push(G.p);list.sort((a,b)=>a.ry-b.ry);
  for(const e of list){if(e.prop){const p=e.prop;ctx.fillStyle='rgba(0,0,0,.35)';ctx.fillRect(p.x*TS+2,p.y*TS+13,12,3);ctx.drawImage(p.P.spr,p.x*TS,p.y*TS-4)}else drawActor(e,time)}
  gibsDraw();
  buildLight(time);ctx.imageSmoothingEnabled=true;
  ctx.drawImage(lightC,0,0,W*TS,MH*TS);
  ctx.globalCompositeOperation='lighter';ctx.drawImage(colC,0,0,W*TS,MH*TS);
  drawEmissive(G,time);
  // exit beacons
  for(const[e,c]of[[G.M.exit,'255,90,210'],[G.M.evac,'80,255,140']]){const a=.5+.5*Math.sin(time*3);ctx.fillStyle=`rgba(${c},${.35+.4*a})`;const bx=e.x*TS,by=e.y*TS-6-Math.round(a*2);
    if(e===G.M.exit){ctx.fillRect(bx+6,by,4,1);ctx.fillRect(bx+7,by+1,2,1)}else{ctx.fillRect(bx+7,by,2,1);ctx.fillRect(bx+6,by+1,4,1)}
    ctx.strokeStyle=`rgba(${c},${.25+.3*a})`;ctx.lineWidth=1;ctx.strokeRect(e.x*TS+.5,e.y*TS+.5,15,15)}
  for(const f of G.fx){if(f.t<0)continue;
    if(f.type==='shot'){const k=Math.min(1,f.t*3),x=f.x0+(f.x1-f.x0)*k,y=f.y0+(f.y1-f.y0)*k,x2=f.x0+(f.x1-f.x0)*Math.max(0,k-.25),y2=f.y0+(f.y1-f.y0)*Math.max(0,k-.25);
      ctx.strokeStyle=f.col;ctx.globalAlpha=1-f.t*.8;ctx.lineWidth=f.thick?2:1;ctx.beginPath();ctx.moveTo(x2,y2);ctx.lineTo(x,y);ctx.stroke();
      if(f.t<.12){ctx.fillStyle='#fff6c0';ctx.fillRect(f.x0-1,f.y0-1,3,3)}ctx.globalAlpha=1}
    else if(f.type==='ring'){ctx.strokeStyle=`rgba(${f.col},${1-f.t})`;ctx.lineWidth=2;ctx.beginPath();ctx.arc(f.x,f.y,4+f.t*f.r,0,Math.PI*2);ctx.stroke()}
    else if(f.type==='spark'){for(let k=0;k<5;k++){const a=k*1.3+f.x,r=f.t*10;ctx.fillStyle=k%2?'#ffd23f':'#fff6c0';ctx.globalAlpha=1-f.t;ctx.fillRect(f.x+Math.cos(a)*r,f.y+Math.sin(a)*r-f.t*4,1,1)}ctx.globalAlpha=1}}
  ctx.globalCompositeOperation='source-over';ctx.imageSmoothingEnabled=false;
  fxDraw();
  if(G.shield>0){const P=G.p;ctx.strokeStyle=`rgba(34,230,255,${.4+.2*Math.sin(time*6)})`;ctx.lineWidth=1;ctx.beginPath();ctx.arc(P.rx*TS+8,P.ry*TS+6,10,0,Math.PI*2);ctx.stroke()}
  for(const p of G.props){if(p.hp>=p.max||!G.vis[idx(p.x,p.y)])continue;const x=p.x*TS,y=p.y*TS;ctx.fillStyle='#000';ctx.fillRect(x+2,y-7,12,3);ctx.fillStyle='#e0c070';ctx.fillRect(x+3,y-6,Math.round(10*(1-p.hp/p.max)),1)}
  for(const e of G.en){if(e.dead||!G.vis[idx(e.x,e.y)])continue;const x=Math.round(e.rx*TS),y=Math.round(e.ry*TS);
    ctx.fillStyle='#000';ctx.fillRect(x+2,y+15,12,3);ctx.fillStyle='#3a0d12';ctx.fillRect(x+3,y+16,10,1);ctx.fillStyle=e.awake?'#e8344a':'#a06a70';ctx.fillRect(x+3,y+16,Math.max(1,Math.round(10*e.hp/e.mhp)),1)}
  heroMarker(G.p,time);drawFloats(G.floats);
}
function drawEmissive(W_,time){
  for(const s of W_.neons){if(W_.seen&&!W_.seen[s.y*W_.M.W+s.x])continue;if(!neonOn(s,time))continue;ctx.fillStyle=s.col;for(const[px,py]of s.pts)ctx.fillRect(s.x*TS+px,s.y*TS+py,1,1);
    const g=ctx.createRadialGradient(s.x*TS+8,s.y*TS+6,0,s.x*TS+8,s.y*TS+6,16);g.addColorStop(0,s.col+'55');g.addColorStop(1,s.col+'00');ctx.fillStyle=g;ctx.fillRect(s.x*TS-8,s.y*TS-10,32,32)}
  for(const l of W_.leds||[]){if(!W_.seen[l.y*W_.M.W+l.x])continue;for(const[px,py,c,rate,ph]of l.pts){if(Math.sin(time*rate*.6+ph)>-.2){ctx.fillStyle=c;ctx.fillRect(l.x*TS+px,l.y*TS+py,1,1)}}}
  for(const s of W_.lamps||[]){if(!W_.seen[s.y*W_.M.W+s.x])continue;const cx=s.x*TS+8,cy=s.y*TS+5;ctx.fillStyle=s.col;ctx.fillRect(cx-1,cy,3,2);ctx.fillStyle='#ffffff';ctx.fillRect(cx,cy,1,1);
    const g=ctx.createRadialGradient(cx,cy,0,cx,cy,12);g.addColorStop(0,s.col+'66');g.addColorStop(1,s.col+'00');ctx.fillStyle=g;ctx.fillRect(cx-12,cy-12,24,24)}
}
function heroMarker(P,time){if(P.dead||(MODE==="raid"&&G&&G.dead))return;const x=Math.round(P.rx*TS),y=Math.round(P.ry*TS)-2+(15-P.H)-6+(Math.floor(time*1.5)&1);ctx.fillStyle='#000';ctx.fillRect(x+5,y-1,6,4);ctx.fillStyle='#22e6ff';ctx.fillRect(x+6,y,4,1);ctx.fillRect(x+7,y+1,2,1)}
function drawFloats(fl){ctx.font='7px "Press Start 2P", monospace';ctx.textAlign='center';ctx.textBaseline='middle';
  for(const f of fl){const y=f.y-f.t*12;ctx.globalAlpha=Math.min(1,2-f.t*2);ctx.lineWidth=2;ctx.strokeStyle='#000';ctx.strokeText(f.text,f.x,y);ctx.fillStyle=f.col;ctx.fillText(f.text,f.x,y)}ctx.globalAlpha=1}
function renderBase(time){
  const B=BS,M=B.M;const[ox,oy]=camOrigin();const s=curS();
  ctx.setTransform(s,0,0,s,ox,oy);ctx.imageSmoothingEnabled=false;ctx.drawImage(B.mapC,0,0);
  const list=B.objs.map(o=>({obj:o,ry:o.y-.01}));list.push(H);list.sort((a,b)=>a.ry-b.ry);
  for(const e of list){if(e.obj){const o=e.obj;ctx.fillStyle='rgba(0,0,0,.35)';ctx.fillRect(o.x*TS+1,o.y*TS+13,14,3);ctx.drawImage(o.spr,o.x*TS,o.y*TS-4)}else if(!H.dead)drawActor(H,time)}
  // soft vignette + warm light
  ctx.imageSmoothingEnabled=true;ctx.globalCompositeOperation='lighter';
  for(const l of B.lights){const cx=l.x*TS,cy=l.y*TS,r=l.rad*TS;let f=l.int;if(l.kind==='neon')f*=neonOn(l.ref,time)?1:.2;const g=ctx.createRadialGradient(cx,cy,0,cx,cy,r);g.addColorStop(0,`rgba(${l.c.join(',')},${.18*f})`);g.addColorStop(1,`rgba(${l.c.join(',')},0)`);ctx.fillStyle=g;ctx.fillRect(cx-r,cy-r,r*2,r*2)}
  drawEmissive({neons:B.neons,seen:null,M},time);
  // farm LEDs
  if(B.dark){ctx.globalCompositeOperation='source-over';ctx.fillStyle='rgba(0,0,10,.35)';ctx.fillRect(0,0,M.W*TS,M.H*TS);ctx.globalCompositeOperation='lighter'}
  for(const o of B.objs)if(o.kind==='farm'&&!B.dark){for(let k=0;k<4;k++){if(Math.sin(time*3+k*2+o.x)>0){ctx.fillStyle=['#3aff6a','#22e6ff','#ffb02e','#3aff6a'][k];ctx.fillRect(o.x*TS+5+k,o.y*TS-2+k*3,1,1)}}}
  // door beacon
  {const a=.5+.5*Math.sin(time*3);ctx.fillStyle=`rgba(80,255,140,${.4+.4*a})`;ctx.fillRect(7*TS+6,10*TS-7-Math.round(a*2),4,1);ctx.fillRect(7*TS+7,10*TS-6-Math.round(a*2),2,1)}
  ctx.globalCompositeOperation='source-over';ctx.imageSmoothingEnabled=false;
  ctx.font='5px "Press Start 2P", monospace';ctx.textAlign='center';ctx.textBaseline='middle';
  for(const o of B.objs){if(o.kind==='farm'&&o!==B.objs.find(q=>q.kind==='farm'))continue;const lab=o.site?'СТРОЙКА':{bed:'КРОВАТЬ',crate:'ЯЩИК',terminal:'ТЕРМИНАЛ',med:'МЕДБЛОК',wrack:'СТАНОК',gen:'ГЕНЕРАТОР',bench:'ВЕРСТАК',farm:'ФЕРМА',recycler:'ПЕРЕРАБОТКА'}[o.kind];
    ctx.lineWidth=2;ctx.strokeStyle='#000';ctx.strokeText(lab,o.x*TS+8,o.y*TS+19);ctx.fillStyle='#cfc8e4';ctx.fillText(lab,o.x*TS+8,o.y*TS+19)}
  ctx.lineWidth=2;ctx.strokeStyle='#000';ctx.strokeText('В РЕЙД',7*TS+8,10*TS+19);ctx.fillStyle='#7dff4f';ctx.fillText('В РЕЙД',7*TS+8,10*TS+19);
  heroMarker(H,time);
}

// ================= LOOP =================
let last=performance.now();
function loop(now){
  const dt=Math.min(.05,(now-last)/1000);last=now;
  if(MODE==='base'&&BS){
    BS.time+=dt;const mv=dt*4.5;
    const dx=H.x-H.rx,dy=H.y-H.ry;H.rx=Math.abs(dx)<=mv?H.x:H.rx+Math.sign(dx)*mv;H.ry=Math.abs(dy)<=mv?H.y:H.ry+Math.sign(dy)*mv;
    if(H.bump){H.bump.t+=dt*3;if(H.bump.t>=1)H.bump=null}
    BS.cool-=dt;
    if(BS.cool<=0&&Math.abs(H.rx-H.x)+Math.abs(H.ry-H.y)<.001){
      if(BS.path.length){const[nx,ny]=BS.path.shift();if(nx!==H.x)H.face=Math.sign(nx-H.x);H.x=nx;H.y=ny;BS.cool=0}
      else if(BS.pending){const k=BS.pending;BS.pending=null;if(BS.face&&BS.face.x!==H.x)H.face=Math.sign(BS.face.x-H.x);openBasePanel(k)}
    }
    const tx=BS.M.W*TS/2,ty=BS.M.H*TS/2;const k=1-Math.exp(-dt*4);BS.cam.x+=(tx-BS.cam.x)*k;BS.cam.y+=(ty-BS.cam.y)*k;
    render(BS.time);requestAnimationFrame(loop);return;
  }
  if(G&&!G.paused){
    G.time+=dt;const sp=G.speed;
    for(const e of [G.p,...G.en]){const dx=e.x-e.rx,dy=e.y-e.ry,dist=Math.abs(dx)+Math.abs(dy);if(dist<1e-4){e.moving=0}
      else{let v=1/Math.max(.08,e.mvDur||STEP);if(dist>1.2)v*=dist*1.5;const mv=dt*sp*v;e.moving=1;
      e.rx=Math.abs(dx)<=mv?e.x:e.rx+Math.sign(dx)*mv;e.ry=Math.abs(dy)<=mv?e.y:e.ry+Math.sign(dy)*mv}
      if(e.bump){e.bump.t+=dt*3*sp;if(e.bump.t>=1)e.bump=null}if(e.flash>0)e.flash=Math.max(0,e.flash-dt*3);if(e.dead&&e.fade>0)e.fade-=dt*1.2;}
    for(const f of G.floats)f.t+=dt*.7;G.floats=G.floats.filter(f=>f.t<1);
    for(const f of G.fx)f.t+=dt*1.6*sp;G.fx=G.fx.filter(f=>f.t<1);fxUpdate(dt*Math.min(sp,2));gibsUpdate(dt*Math.min(sp,1.5));
    const k=1-Math.exp(-dt*6);G.cam.x+=(G.p.rx*TS+8-G.cam.x)*k;G.cam.y+=(G.p.ry*TS+8-G.cam.y)*k;
    if(G.dead){G.deadT-=dt;if(!G.shattered&&G.deadT<=1.75){G.shattered=1;try{deathFx(G.p)}catch(_){}}if(G.deadT<=0&&!G.ended){G.ended=1;endRaid(false)}}
    else if(G.descend>0){G.descend-=dt;if(G.descend<=0){if(G.exitTo==='home'){G.ended=1;endRaid(true)}else newFloor()}}
    else{G.cool-=dt*sp;if(G.cool<=0){let a=null;
      if(G.buf){a=G.buf;G.buf=null}
      else if(G.manual){a=null}
      else if(G.forcePath&&G.forcePath.length){const[nx,ny]=G.forcePath.shift();a={dx:nx-G.p.x,dy:ny-G.p.y};if(Math.abs(a.dx)+Math.abs(a.dy)!==1){G.forcePath=null;a=heroDecide()}}
      else a=heroDecide();
      if(a){const before=G.turn,ox=G.p.x,oy=G.p.y;act(a);if(G.turn!==before){G.cool=STEP*((G.heroCost||1)+(G.heroDelay||0));G.heroDelay=0;if(G.p.x!==ox||G.p.y!==oy)G.p.mvDur=G.cool}}}
      if(!G.dead&&!(G.descend>0)){enemiesTick(dt*sp);G.wclk=(G.wclk||0)+dt*sp;let g=0;while(G.wclk>=TICK&&g++<8&&!G.dead){G.wclk-=TICK;worldTick()}}}
  }
  render(G?G.time:0);requestAnimationFrame(loop);
}
let started=false;
const go=()=>{if(started)return;started=true;buildMatIcons();requestAnimationFrame(loop);
  if(typeof startTitle==='function')startTitle();else bootGame()};
function bootGame(){
  if(!loadGame()){ST=freshState();newHero();saveGame()}
  enterBase();
  if(ST.raids===0)setTimeout(()=>{showOv(`<h2>ДОБРО ПОЖАЛОВАТЬ</h2><img class="big" style="display:block;margin:0 auto 8px" src="${heroCanvasURL()}"><p>Это ваша база: кровать для отдыха и ящик для добычи. Торговый терминал покупает хлам и продаёт припасы.</p><p>Выходите в рейд через дверь внизу. Герой сам исследует уровни, дерётся и разбирает стойки, блоки и хлам на ресурсы. Доберитесь до <span style="color:#7dff4f">эвакуации</span> — добыча попадёт в ящик. Из ресурсов стройте улучшения базы.</p><div class="row"><button class="btn" id="oClose">Понятно</button></div>`);bindOv()},300);
};
setTimeout(go,1200);if(document.fonts&&document.fonts.load)document.fonts.load('10px "Press Start 2P"').finally(go);else go();

function heroCanvasURL(){return posed(H.spr[H.showW]).toDataURL()}
