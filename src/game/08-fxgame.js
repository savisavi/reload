// ================= PIXELFX: 244 effects → weapons, implants, grenades =================
// Effects library: pixelfx by Patch (MIT), method and parts of its core by Hugo Duprez / Sprite Fusion (MIT).
const PFX_=window.PFX||null;
const FXC=PFX_?PFX_.core:null;
const FXALL=PFX_?PFX_.all.effects:{};
const FX_IDS=Object.keys(FXALL);
const fxMeta=id=>(FXALL[id]&&FXALL[id].meta)||{};
const fxTitle=id=>fxMeta(id).name||id.split('/')[1];
const FX_CAT_N={moves:'Приёмы',fire:'Огонь',explosions:'Взрывы',water:'Вода',ice:'Лёд',lightning:'Молнии',scifi:'Сай-фай',melee:'Ближний бой',impacts:'Удары',projectiles:'Снаряды',spawn:'Появление',arcane:'Аркана',holy:'Свет',shadow:'Тьма',status:'Статусы',nature:'Природа',weather:'Погода',ui:'Интерфейс',pickups:'Находки',transitions:'Переходы',critters:'Существа'};
const ELEM={
  fire:{c:'#ff8a1f',st:'burn',lab:'Пиро'},ice:{c:'#8fe8ff',st:'freeze',lab:'Крио'},lightning:{c:'#f9f871',st:'stun',lab:'Тесла'},
  arcane:{c:'#c06bff',st:'pierce',lab:'Арк'},holy:{c:'#ffe9a0',st:'drain',lab:'Свето'},shadow:{c:'#8a4dff',st:'bleed',lab:'Войд'},
  nature:{c:'#7dff4f',st:'poison',lab:'Био'},water:{c:'#3fa0ff',st:'slow',lab:'Гидро'},scifi:{c:'#22e6ff',st:'stun',lab:'ЭМИ'},
  explosions:{c:'#ff5a1f',st:null,lab:''},critters:{c:'#9af07f',st:'poison',lab:'Рой'},spawn:{c:'#b45cff',st:null,lab:'Варп'},
  weather:{c:'#cfe8ff',st:'slow',lab:'Климат'},transitions:{c:'#ff2fa8',st:'stun',lab:'Хак'},ui:{c:'#ff2fa8',st:null,lab:'Такт'},
  pickups:{c:'#ffd23f',st:null,lab:'Сапорт'},moves:{c:'#ff3355',st:null,lab:'Боевой'},melee:{c:'#e0e6f0',st:'bleed',lab:''},
  impacts:{c:'#ffffff',st:'stun',lab:''},projectiles:{c:'#ffe9a0',st:null,lab:''},status:{c:'#ff9aa8',st:null,lab:''}};
const STATUS_FROM={bleeding:'bleed',burning:'burn',charmed:'stun',confused:'stun',cursed:'bleed',frozen:'freeze',haste:'haste',petrified:'freeze',poisoned:'poison',rage:'rage',sleep:'freeze',slowed:'slow',stunned:'stun'};
const ST_N={burn:'горение',freeze:'заморозка',stun:'оглушение',poison:'яд',bleed:'кровотечение',slow:'замедление',drain:'вампиризм',pierce:'пробитие',haste:'ускорение',rage:'ярость'};
const ST_FX={burn:'status/burning',freeze:'status/frozen',stun:'status/stunned',poison:'status/poisoned',bleed:'status/bleeding',slow:'status/slowed'};
function fxRole(id){
  const[c,n]=id.split('/'),m=fxMeta(id),tg=m.tags||[];
  if(c==='explosions'||c==='critters')return'grenade';
  if(c==='projectiles')return'ranged';
  if(c==='melee'||c==='impacts'||c==='status')return'melee';
  if(c==='moves'||c==='weather'||c==='transitions'||c==='ui'||c==='pickups')return'implant';
  if(c==='spawn')return['poof','egg-hatch','summon-rise','spawn-portal','coin-drop'].includes(n)?'grenade':['disintegrate','dissolve-burn','shatter-death'].includes(n)?'ranged':'implant';
  if(tg.includes('heal')||tg.includes('buff')||tg.includes('shield'))return'implant';
  if(tg.includes('projectile')||tg.includes('beam')||(tg.includes('directional')&&!m.actor))return'ranged';
  if(tg.includes('explosion')||tg.includes('aoe')||tg.includes('shockwave'))return'grenade';
  if(m.loop&&m.size&&m.size[0]<=150&&!m.actor)return'melee';
  return'implant';
}
function implTmpl(id){
  const[c,n]=id.split('/'),m=fxMeta(id),tg=m.tags||[];
  if(c==='weather')return'storm';if(c==='transitions')return'stunall';
  if(/heal|bless|resurrection|heart|potion|soul-rise|respawn|bloom/.test(n)||tg.includes('heal'))return'heal';
  if(/shield|force-field|halo|power-star|divine/.test(n)||tg.includes('shield'))return'shield';
  if(/haste|jetpack|blink|warp|teleport|xp-orb|combo|level-up|achievement|portal|time-stop/.test(n))return'haste';
  if(/hologram|glitch|fog|eclipse|smoke|exclamation/.test(n))return'camo';
  if(/energy|gem|crystal|coin|mana|charge|key|spell/.test(n))return'energy';
  if(/chest|loot|scanner|quest|countdown|confetti/.test(n))return'scan';
  if(m.actor||tg.includes('aoe')||/nova|ring|ground|quake|stomp|pound|burst|storm|tornado|vortex/.test(n))return'nova';
  return'strike';
}
const TMPL={
  strike:{lab:'Ударный модуль',cost:12,cd:6,pow:12,d:'Удар по ближайшей цели'},
  nova:{lab:'Импульсный модуль',cost:14,cd:7,pow:8,d:'Урон всем вокруг (радиус 2)'},
  heal:{lab:'Мед-модуль',cost:14,cd:10,pow:.3,d:'Лечит часть HP'},
  shield:{lab:'Щит-модуль',cost:10,cd:12,pow:14,d:'Энергощит на 2 с'},
  haste:{lab:'Ускоритель',cost:14,cd:12,pow:3,d:'Двойная скорость'},
  camo:{lab:'Маскировщик',cost:12,cd:14,pow:4,d:'Невидимость'},
  energy:{lab:'Энерго-модуль',cost:0,cd:12,pow:12,d:'Восстанавливает энергию'},
  scan:{lab:'Сканер',cost:8,cd:15,pow:0,d:'Показывает весь лут уровня'},
  stunall:{lab:'Хак-протокол',cost:18,cd:14,pow:2,d:'Оглушает всех видимых врагов'},
  storm:{lab:'Климат-модуль',cost:18,cd:14,pow:5,d:'Урон и статус всем видимым врагам'}};
const POOL={melee:[],ranged:[],implant:[],grenade:[]};
for(const id of FX_IDS)POOL[fxRole(id)].push(id);
function fxElem(id){const[c,n]=id.split('/');return ELEM[c]||ELEM.melee}
function fxStatus(id){const[c,n]=id.split('/');if(c==='status')return STATUS_FROM[n]||'stun';if(c==='explosions')return n==='smoke-bomb'?'camo':n==='implosion'?'stun':n==='plasma-explosion'?'stun':'burn';
  if(c==='melee')return/slash|cleave|scythe|claw|dagger/.test(n)?'bleed':'stun';if(c==='impacts')return/blunt|slam|landing|crit|impact/.test(n)?'stun':null;
  if(c==='weather'){return/blizzard|snow/.test(n)?'freeze':/storm/.test(n)?'stun':/rain|fog|clouds/.test(n)?'slow':'slow'}
  return fxElem(id).st}
function fxMeleeKind(id){const n=id.split('/')[1],c=id.split('/')[0];
  if(/sword|spin|double|slash|combo/.test(n))return'катана';if(/dagger|claw|thrust/.test(n))return'нож';if(/hammer|blunt|slam|landing|uppercut|ground/.test(n))return'бита';
  if(/cleave|scythe|reap/.test(n))return'топор';if(/spear|sweep/.test(n))return'мачете';if(/whip|zap|spark/.test(n))return'электродубинка';
  if(['fire','ice','lightning','arcane','holy','shadow','nature','water','scifi'].includes(c))return'энергоклинок';
  const ks=Object.keys(MELEE);return ks[(hashStr(id)>>>3)%ks.length]}
function fxRangedKind(id){const n=id.split('/')[1];
  if(n==='muzzle-pistol')return'пистолет';if(n==='muzzle-smg')return'ПП';if(n==='muzzle-shotgun')return'дробовик';
  if(/tracer|arrow|cannon|flare|rocket|missile/.test(n)&&!/magic/.test(n))return n==='bullet-tracer'||n==='arrow'?'винтовка':'винтовка';
  return'лазер'}
const GRENADE_LAB=id=>{const[c,n]=id.split('/');if(n==='smoke-bomb')return'Дымовая шашка';if(c==='explosions')return n==='nuke'?'Мини-заряд':'Граната';if(c==='critters')return'Рой-капсула';if(c==='spawn')return'Капсула';return(fxElem(id).lab||'')+'-граната'};
function drawGrenadeIcon(P,M,A){
  for(let y=0;y<16;y++)for(let x=0;x<16;x++){const d=Math.hypot(x-7.5,y-9.5);if(d<=4.8)P(x,y,d<1.6?A.l:(x+y<16?A.b:A.d))}
  for(let x=5;x<=10;x++)P(x,9,A.d);P(7,4,M.b);P(8,4,M.b);P(7,3,M.l);P(8,3,M.l);for(let y=2;y<=5;y++)P(10,y,M.m);P(9,2,M.l);
  P(11,4,M.l);P(12,4,M.l);P(12,5,M.l);P(11,6,M.l);P(6,8,'#ffffff');
}
function fxItem(id,lvl,rar){const role=fxRole(id);return makeItem(hashStr(id),role,lvl||1,{fx:id,rar:rar==null?Math.min(4,1+(hashStr(id)%3)):rar})}
// decorate an item generated by ITEMGEN with its signature effect
function fxDecorate(it,r,f){
  const id=f.fx;if(!id||!FXALL[id])return;
  const E=fxElem(id),title=fxTitle(id);it.fx=id;
  if(it.cat==='melee'||it.cat==='ranged'){
    it.st=fxStatus(id);const lab=it.cat==='ranged'&&E.lab&&!['projectiles','spawn'].includes(id.split('/')[0])?`${E.lab}-пушка`:capF(it.kind);
    it.name=`${lab} «${title}»`+(it.rar>=2?` Mk${r.int(2,9)}`:'');
    if(it.cat==='melee'){it.dmg=[it.dmg[0]+1,it.dmg[1]+1]}
    it.lines=[...it.lines,`FX: ${title}${it.st&&ST_N[it.st]?` · ${ST_N[it.st]} 35%`:''}`];
  } else if(it.cat==='implant'){
    const tm=implTmpl(id),T=TMPL[tm];it.t='act';it.fxt=tm;it.eff='fx';it.kind=T.lab;it.st=tm==='storm'||tm==='strike'||tm==='nova'?fxStatus(id):null;
    it.cost=T.cost;it.cd=Math.max(3,T.cd-it.rar);it.pow=T.pow<1?+(T.pow*(1+.12*it.rar)).toFixed(2):(tm==='haste'||tm==='camo'||tm==='stunall')?T.pow+Math.floor(it.rar/2):T.pow?sc(T.pow,it):0;
    it.name=`${T.lab} «${title}»`;
    const pw=tm==='heal'?`${Math.round(it.pow*100)}% HP`:tm==='shield'?`щит ${it.pow}`:tm==='energy'?`+${it.pow} EN`:tm==='scan'?'':(tm==='haste'||tm==='camo'||tm==='stunall')?tsec(it.pow):`урон ${it.pow}–${Math.round(it.pow*1.5)}`;
    it.lines=['Боевой · '+T.d,[pw,it.st&&ST_N[it.st]?ST_N[it.st]:''].filter(Boolean).join(' · '),`Энергия ${it.cost} · откат ${it.cd}`,`FX: ${title}`];
    const M=ramp(r.pick(METALS).c),A=ramp(E.c);const shape={fire:'heart',holy:'heart',shadow:'eye',arcane:'spine',nature:'shield',water:'shield',lightning:'chip',scifi:'chip',ui:'chip',pickups:'chip',moves:'arm',weather:'eye',transitions:'eye',spawn:'spine'}[id.split('/')[0]]||'arm';
    it.icon=pixIcon(P=>drawImplantIcon(P,shape,M,A));it.url=null;
  }
}
ITEMGEN.grenade=function(it,r,f){
  const id=f.fx&&FXALL[f.fx]?f.fx:(POOL.grenade.length?POOL.grenade[(r.f()*POOL.grenade.length)|0]:null);
  const E=id?fxElem(id):ELEM.explosions,M=ramp(r.pick(METALS).c),A=ramp(E.c);
  const n=id?id.split('/')[1]:'grenade';
  it.kind='граната';it.fx=id;it.st=id?fxStatus(id):'burn';
  it.radius=/nuke|big|barrel/.test(n)?2:(id&&id.startsWith('critters'))?1:r.chance(.5)?2:1;
  it.dmg=it.st==='camo'?[0,0]:[sc(id&&id.startsWith('critters')?4:7,it),sc(id&&id.startsWith('critters')?7:12,it)];
  it.name=`${GRENADE_LAB(id||'explosions/grenade')} «${id?fxTitle(id):'Frag'}»`;
  it.lines=[it.st==='camo'?`Дым: невидимость ${tsec(4)}`:`Урон ${it.dmg[0]}–${it.dmg[1]} · радиус ${it.radius}`,it.st&&it.st!=='camo'&&ST_N[it.st]?`Статус: ${ST_N[it.st]}`:'',id?`FX: ${fxTitle(id)}`:''].filter(Boolean);
  it.icon=pixIcon(P=>drawGrenadeIcon(P,M,A));
};
CAT_N.grenade='Гранаты';ITEM_W.grenade=0;BASEV.grenade=14;

// ---------- runtime: playing effects in the world ----------
let FXL=[];
// build a pixelfx 'actor' (mask + pixels, feet at 0,0) from one of our sprites, upscaled 2x
const _ac=document.createElement('canvas');_ac.width=40;_ac.height=32;const _ax=_ac.getContext('2d',{willReadFrequently:true});
function actorFor(e){
  if(!e)return null;_ax.clearRect(0,0,40,32);let fx0;
  if(e.isHero||e.human){const set=e.isHero?e.spr[e.showW]:e.spr;if(!set)return null;const flip=e.face<0;_ax.save();if(flip){_ax.translate(CW_,0);_ax.scale(-1,1)}_ax.drawImage(set.fr[0],0,0);_ax.restore();fx0=flip?CW_-OX-8:OX+8}
  else if(SP[e.type]){const flip=e.face>0;_ax.save();if(flip){_ax.translate(16,0);_ax.scale(-1,1)}_ax.drawImage(SP[e.type],0,0);_ax.restore();fx0=8}
  else return null;
  const d=_ax.getImageData(0,0,40,32).data;let x0=99,y0=99,x1=-1,y1=-1;
  for(let y=0;y<32;y++)for(let x=0;x<40;x++)if(d[(y*40+x)*4+3]>127){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}
  if(x1<0)return null;const K=2,w=(x1-x0+1)*K,h=(y1-y0+1)*K,mask=new Uint8Array(w*h),px=new Uint32Array(w*h);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=((y0+(y/K|0))*40+x0+(x/K|0))*4;if(d[i+3]>127){mask[y*w+x]=1;px[y*w+x]=(255<<24)|(d[i+2]<<16)|(d[i+1]<<8)|d[i]}}
  const ax=(x0-fx0)*K,ay=-h;
  return{mask:{w,h,data:mask},pixels:px,x:ax,y:ay,w,h,k:1,head:[0,ay],chest:[0,ay+Math.round(h*.45)]};
}
const FX_DEFAULT_K=.55;
function fxScale(id){const m=fxMeta(id),w=(m.size||[100])[0],c=id.split('/')[0];
  if(c==='weather'||c==='transitions')return null; // screen-wide
  let k=FX_DEFAULT_K;if(c==='explosions')k=.42;if(c==='moves')k=.45;
  return Math.min(k,130/w)}
function spawnFx(id,wx,wy,o={}){
  if(!FXC||!FXALL[id]||typeof G==='undefined'||!G)return null;
  const mod=FXALL[id],m=mod.meta||{},size=m.size||[96,96],org=m.origin||[size[0]/2,size[1]];
  let act=null;if(m.actor&&o.target){try{act=actorFor(o.target)}catch(_){}}
  if(m.actor&&!act&&!o.allowStock)return null; // never draw the stock dummy over our sprites
  const fx=FXC.createFx(mod,{x:0,y:0,flip:!!o.flip,angle:o.angle||0,seed:(Math.random()*1e6)|0,...(o.opts||{}),...(act?{actor:act}:{})});
  if(act)o={...o,k:.5};
  const frame=FXC.createFrame(size[0],size[1],-org[0],-org[1]);
  const c=document.createElement('canvas');c.width=size[0];c.height=size[1];const cx=c.getContext('2d');
  const e={id,fx,frame,c,cx,img:cx.createImageData(size[0],size[1]),org,size,x:wx,y:wy,k:o.k!=null?o.k:fxScale(id),follow:o.follow||null,tgt:o.target||null,life:o.life||Math.min(m.loop?.9:(m.duration||1),o.maxLife||2.6),t:-(o.delay||0),screen:fxScale(id)===null};
  const big=size[0]*size[1]>50000;e.big=big;
  if(big){const bigs=FXL.filter(f=>f.big&&!f.stopped);if(bigs.length>=3)bigs[0].stopped=1}
  FXL.push(e);while(FXL.filter(f=>!f.stopped).length>24){const f=FXL.find(f=>!f.stopped&&!f.follow)||FXL.find(f=>!f.stopped);f.stopped=1}
  FXL=FXL.filter(f=>!f.stopped);return e;
}
function fxUpdate(dt){
  if(!FXL.length)return;
  for(const e of FXL){e.t+=dt;if(e.t<0)continue;e.fx.update(dt);if(e.t>=e.life&&!e.stopping){e.fx.stop();e.stopping=1}
    if(e.follow){e.x=e.follow.rx*TS+8;e.y=e.follow.ry*TS+14;if(e.follow.dead)e.fx.stop()}}
  FXL=FXL.filter(e=>!e.fx.done()&&!e.stopped&&!(e.follow&&e.follow.dead&&e.t>e.life+.4)&&!(e.follow&&e.follow.stOff&&e.follow.stOff[e.id]));
}
// compositing a pixelfx frame is pure JS over every pixel of the frame, so it is rationed:
// each effect is re-composited at most ~30 times a second, and all of them share a per-frame budget.
const FX_BUDGET_MS=3.5,FX_HZ=1000/30;
function fxDraw(){
  if(!FXL.length)return;const now=performance.now();let spent=0;
  const order=FXL.filter(e=>e.t>=0).sort((a,b)=>(a.lastC||0)-(b.lastC||0));
  for(const e of order){
    if(e.lastC&&now-e.lastC<FX_HZ)continue;if(spent>FX_BUDGET_MS&&e.lastC)continue;
    const t0=performance.now();FXC.clearFrame(e.frame);e.fx.draw(e.frame);FXC.composite(e.frame,e.img.data,null);e.cx.putImageData(e.img,0,0);e.lastC=now;spent+=performance.now()-t0;
  }
  for(const e of FXL){if(e.t<0||!e.lastC)continue;
    if(e.screen){const vw=CWd/S,k=vw/e.size[0];ctx.drawImage(e.c,G.cam.x-vw/2,G.cam.y-e.size[1]*k/2,e.size[0]*k,e.size[1]*k)}
    else ctx.drawImage(e.c,e.x-e.org[0]*e.k,e.y-e.org[1]*e.k,e.size[0]*e.k,e.size[1]*e.k)}
}
const feet=a=>[a.x*TS+8,a.y*TS+14];

// ---------- statuses ----------
function applyStatus(e,st,turns){
  if(!st||e.dead||e.isHero)return;
  e.sts=e.sts||{};const T=turns||({burn:3,poison:5,bleed:3,freeze:2,stun:1,slow:3}[st]||0);if(!T)return;
  if(st==='stun'){e.stun=Math.max(e.stun||0,T)}else e.sts[st]=Math.max(e.sts[st]||0,T);
  float(e,ST_N[st]||st,'#9ad8ff',-8);
  if(ST_FX[st]&&FXALL[ST_FX[st]]&&G.vis[idx(e.x,e.y)]){e.stFx=e.stFx||{};if(!e.stFx[st]||e.stFx[st].stopped||e.stFx[st].fx.done()){const f=spawnFx(ST_FX[st],...feet(e),{target:e,follow:e,life:T*STEP*1.2+.6,k:.5});if(f)e.stFx[st]=f}}
}
// returns true if the enemy loses its turn
function tickStatus(e){
  if(!e.sts)return false;const f=G.floor;let skip=false;
  const dot=(k,dmg,col)=>{if(e.sts[k]>0){e.sts[k]--;if(!e.dead){e.hp-=dmg;e.flash=.6;float(e,dmg,col,4);if(e.hp<=0)kill(e)}}};
  dot('burn',2+Math.floor(f/2),'#ff8a1f');dot('poison',1+Math.floor(f/3),'#7dff4f');dot('bleed',2,'#ff4b6a');
  if(e.dead)return true;
  if(e.sts.freeze>0){e.sts.freeze--;skip=true}
  if(e.sts.slow>0){e.sts.slow--;if(G.turn%2===0)skip=true}
  return skip;
}
// hooks from combat
function fxOnHit(att,def,w,crit){
  if(!w||!w.fx||!G||def.dead)return;
  const[c]=w.fx.split('/');const flip=def.x<att.x;
  if(c==='status'||c==='melee'||c==='impacts')spawnFx(w.fx,...feet(def),{target:def,flip,maxLife:1.2});
  else spawnFx(w.fx,...feet(def),{target:def,flip,maxLife:.9,k:Math.min(.45,(fxScale(w.fx)||.4))});
  if(w.st&&!def.isHero){
    if(w.st==='drain'){G.p.hp=Math.min(G.p.st.mhp,G.p.hp+2);float(G.p,'+2','#7dff4f')}
    else if(w.st==='pierce'){if(!def.dead&&Math.random()<.35){def.hp-=2;float(def,'+2','#c06bff',6)}}
    else if(w.st==='haste'){if(Math.random()<.2&&att.isHero){G.haste=Math.max(G.haste,2)}}
    else if(w.st==='rage'){if(!def.dead&&Math.random()<.25){def.hp-=3;float(def,'ярость','#ff3355',6);if(def.hp<=0)kill(def)}}
    else if(Math.random()<.35)applyStatus(def,w.st);
  }
}
function fxOnShot(att,def,w,hit){
  if(!w||!w.fx||!G)return;
  const[ax,ay]=feet(att),[dx,dy]=feet(def),flip=dx<ax,ang=Math.max(-.6,Math.min(.6,Math.atan2(dy-ay,Math.abs(dx-ax)||1)))*(flip?-1:1);
  const n=w.fx.split('/')[1],c=w.fx.split('/')[0];
  if(c==='projectiles'&&/muzzle/.test(n))spawnFx(w.fx,ax+(flip?-4:4),ay,{target:att,flip,angle:ang,k:.4,maxLife:.9,opts:{height:8}});
  else if(def.dead)return;
  else if(c==='projectiles'){spawnFx(w.fx,(ax+dx)/2,(ay+dy)/2-6,{flip,angle:ang,k:.45,maxLife:.5})}
  else spawnFx(w.fx,dx,dy,{target:def,flip,k:.42,maxLife:.8});
  if(hit&&FXALL['impacts/hit-spark'])spawnFx('impacts/hit-spark',dx,dy-6,{flip,k:.35,maxLife:.5});
  if(hit&&w.st&&!def.isHero&&!def.dead&&Math.random()<.35)applyStatus(def,w.st);
}
// implants with an effect
function fxImplant(s,it0,it){
  const P=G.p,vis=G.en.filter(e=>!e.dead&&G.vis[idx(e.x,e.y)]);
  const near=vis.filter(e=>los(P.x,P.y,e.x,e.y)).sort((a,b)=>dst(a,P)-dst(b,P))[0];
  const pw=it.pow,tm=it0.fxt;
  switch(tm){
    case'strike':{if(!near){log('Нет цели','#ffb04a');return false}
      spawnFx(it0.fx,...(it0.fx.startsWith('moves')?feet(P):feet(near)),{target:it0.fx.startsWith('moves')?P:near,flip:near.x<P.x,maxLife:2.2});
      hurt(near,rnd([pw,Math.round(pw*1.5)]),P);if(it0.st&&!near.dead)applyStatus(near,it0.st);log(`${it0.name}: удар`,'#ff7ad8');break}
    case'nova':{spawnFx(it0.fx,...feet(P),{target:P,maxLife:1.8});const tg=vis.filter(e=>cheb(e,P)<=2);tg.forEach(e=>{hurt(e,rnd([pw,Math.round(pw*1.5)]),P);if(it0.st&&!e.dead&&Math.random()<.6)applyStatus(e,it0.st)});log(`${it0.name}: целей ${tg.length}`,'#22e6ff');break}
    case'heal':{spawnFx(it0.fx,...feet(P),{target:P,maxLife:1.6});const h=Math.min(P.st.mhp-P.hp,Math.round(P.st.mhp*pw));P.hp+=h;float(P,'+'+h,'#7dff4f');break}
    case'shield':{spawnFx(it0.fx,...feet(P),{target:P,follow:P,life:2.4});G.shield=pw;G.shieldT=6;log(`Щит: ${pw}`,'#22e6ff');break}
    case'haste':{spawnFx(it0.fx,...feet(P),{target:P,maxLife:1.4});G.haste=pw;log(`Ускорение: ${pw}`,'#f9f871');break}
    case'camo':{spawnFx(it0.fx,...feet(P),{target:P,follow:P,life:1.6});G.camo=pw;G.en.forEach(e=>e.awake=false);log(`Невидимость: ${pw}`,'#b45cff');break}
    case'energy':{spawnFx(it0.fx,...feet(P),{target:P,maxLife:1.4});const g=Math.min(P.st.mmp-P.mp,pw);P.mp+=g;float(P,'+'+g+' EN','#4c9fff');break}
    case'scan':{spawnFx(it0.fx,...feet(P),{target:P,maxLife:1.6});let n=0;for(const i of G.items){G.seen[idx(i.x,i.y)]=1;n++}for(const q of G.props){G.seen[idx(q.x,q.y)]=1;n++}log(`Сканер: найдено ${n} точек лута`,'#ffd23f');break}
    case'stunall':{spawnFx(it0.fx,0,0,{maxLife:1.2});vis.forEach(e=>{e.stun=Math.max(e.stun||0,pw);float(e,'взлом','#ff2fa8',-8)});log(`${it0.name}: оглушено ${vis.length}`,'#ff2fa8');break}
    case'storm':{spawnFx(it0.fx,0,0,{life:2.2});vis.forEach(e=>{hurt(e,rnd([pw,Math.round(pw*1.5)]),P);if(it0.st&&!e.dead)applyStatus(e,it0.st)});log(`${it0.name}: целей ${vis.length}`,'#cfe8ff');break}
  }
  P.mp-=it.cost;P.cds[s]=it.cd+1;return true;
}
// grenades
function useGrenade(){
  const P=G.p;if(!P.inv.grens||!P.inv.grens.length){log('Нет гранат','#ffb04a');return false}
  const tg=G.en.filter(e=>!e.dead&&G.vis[idx(e.x,e.y)]&&dst(e,P)<=7&&los(P.x,P.y,e.x,e.y)).sort((a,b)=>dst(a,P)-dst(b,P))[0];
  P.inv.grens.sort((a,b)=>((b.dmg||[0,0])[0]+(b.dmg||[0,0])[1])-((a.dmg||[0,0])[0]+(a.dmg||[0,0])[1]));
  const gi=P.inv.grens.findIndex(g=>g.st==='camo');
  let it;
  if(!tg){if(gi>=0){it=P.inv.grens.splice(gi,1)[0];G.camo=4;G.en.forEach(e=>e.awake=false);if(it.fx)spawnFx(it.fx,...feet(P),{target:P,maxLife:2});log(`${it.name}: дымовая завеса`,'#b45cff');return true}
    log('Нет цели для гранаты','#ffb04a');return false}
  it=P.inv.grens.splice(P.inv.grens[0].st==='camo'&&P.inv.grens.length>1?1:0,1)[0];
  if(tg.x!==P.x)P.face=Math.sign(tg.x-P.x);P.bump={dx:Math.sign(tg.x-P.x),dy:Math.sign(tg.y-P.y),t:0};
  G.fx.push({type:'shot',x0:P.x*TS+8,y0:P.y*TS+4,x1:tg.x*TS+8,y1:tg.y*TS+8,col:'#c0c7d4',t:0});
  if(it.fx)spawnFx(it.fx,...feet(tg),{target:tg,delay:.18,maxLife:2.4});
  if(it.st==='camo'){G.camo=4;G.en.forEach(e=>e.awake=false);log(`${it.name}: дымовая завеса`,'#b45cff');return true}
  const hit=G.en.filter(e=>!e.dead&&Math.max(Math.abs(e.x-tg.x),Math.abs(e.y-tg.y))<=it.radius);
  hit.forEach(e=>{hurt(e,rnd(it.dmg),P);if(it.st&&!e.dead)applyStatus(e,it.st)});
  if(Math.max(Math.abs(P.x-tg.x),Math.abs(P.y-tg.y))<=it.radius-1)hurt(P,Math.round(rnd(it.dmg)/2),{name:'Своя граната'});
  log(`${it.name}: задето ${hit.length}`,'#ff8a1f');return true;
}

// ---------- arsenal: every effect as an item with a live preview ----------
let FXCAT='all',FXSEL=0,FXPREV=null;
function fxCatalogItems(){const L=Math.max(1,ARS.lvl);return FX_IDS.filter(id=>FXCAT==='all'||id.startsWith(FXCAT+'/')).map(id=>({id,it:fxItem(id,L)}))}
function renderFxArsenal(){
  if(!FX_IDS.length){showOv('<h2>ЭФФЕКТЫ</h2><p>Библиотека эффектов не загрузилась.</p><div class="row"><button class="btn" id="oBack">Назад</button></div>',true);bindOv();return}
  const list=fxCatalogItems();FXSEL=Math.min(FXSEL,list.length-1);const sel=list[FXSEL];
  const roleN={melee:'ближний бой',ranged:'дальний бой',implant:'боевой имплант',grenade:'граната'};
  const cats=['all',...Object.keys(FX_CAT_N)].map(k=>`<option value="${k}" ${FXCAT===k?'selected':''}>${k==='all'?`Все эффекты (${FX_IDS.length})`:`${FX_CAT_N[k]} (${FX_IDS.filter(i=>i.startsWith(k+'/')).length})`}</option>`).join('');
  showOv(`<h2>АРСЕНАЛ · ЭФФЕКТЫ</h2><div class="chips">${ARS_TABS.map(([k,n])=>`<button class="chip ${k==='fx'?'on':''}" data-c="${k}">${n}</button>`).join('')}</div>
  <div class="fxrow"><select id="fxCat">${cats}</select></div>
  ${sel?`<div class="det fxdet"><canvas id="fxPrev" width="200" height="150"></canvas><div><div class="nm" style="color:${RAR[sel.it.rar].c}">${sel.it.name}</div><p>${roleN[fxRole(sel.id)]} · ${RAR[sel.it.rar].n} · ${sel.id}<br>${sel.it.lines.join('<br>')}</p><button class="btn sm" id="fxReplay">▶ Повтор</button></div></div>`:''}
  <div class="agrid">${list.map((o,i)=>`<button class="cell ${i===FXSEL?'on':''}" data-fi="${i}" style="--rc:${RAR[o.it.rar].c}" title="${o.id}"><img src="${iconURL(o.it)}"></button>`).join('')}</div>
  <div class="row"><button class="btn" id="oBack">Назад</button></div>
  <p class="help">Эффекты: pixelfx by Patch (MIT), метод и часть ядра — Hugo Duprez / Sprite Fusion (MIT).</p>`,true);
  document.querySelectorAll('.chip').forEach(b=>b.onclick=()=>{ARS.cat=b.dataset.c;ARS.sel=0;if(ARS.cat==='fx')return renderFxArsenal();arsBuild();renderArsenal()});
  document.querySelectorAll('[data-fi]').forEach(b=>b.onclick=()=>{FXSEL=+b.dataset.fi;renderFxArsenal()});
  $('fxCat').onchange=e=>{FXCAT=e.target.value;FXSEL=0;renderFxArsenal()};
  bindOv();
  if(sel)startPreview(sel.id);const rp=$('fxReplay');if(rp)rp.onclick=()=>startPreview(sel.id);
}
function startPreview(id){
  const cv=$('fxPrev');if(!cv||!FXC)return;const mod=FXALL[id],m=mod.meta||{},size=m.size||[200,150],org=m.origin||[size[0]/2,size[1]];
  cv.width=size[0];cv.height=size[1];const x=cv.getContext('2d'),img=x.createImageData(size[0],size[1]);
  const frame=FXC.createFrame(size[0],size[1],-org[0],-org[1]);let fx=FXC.createFx(mod,{x:0,y:0}),last=performance.now(),tok={};FXPREV=tok;
  const bg=0xff1a0c0b;
  (function step(now){if(FXPREV!==tok||!document.body.contains(cv))return;const dt=Math.min(.05,(now-last)/1000);last=now;fx.update(dt);
    if(fx.done()||(m.loop&&fx.t>4))fx=FXC.createFx(mod,{x:0,y:0});
    FXC.clearFrame(frame);fx.draw(frame);FXC.composite(frame,img.data,bg);x.putImageData(img,0,0);requestAnimationFrame(step)})(last);
}

// ---------- death: pixel shatter + splat (replaces fade-out) ----------
const SKY_RE=/pillar|beam|smite|lightning-strike|lightning-call|soul-rise|god-rays|teleport|meteor|holy-pillar|summon-rise|spawn-portal/;
const DEATH_MAT={rat:'blood',dog:'blood',slime:'goo',drone:'mech',sentry:'mech'};
const MAT_COL={blood:['#7a0f1c','#a3162a','#5a0a14'],goo:['#3fae2a','#6fe04a','#2a7a1c'],mech:['#16141f','#2a2733','#0d0c12']};
const _dc=document.createElement('canvas');_dc.width=40;_dc.height=32;const _dx=_dc.getContext('2d',{willReadFrequently:true});
function deathFx(e){
  if(!G)return;const P=G.p,dir=Math.sign(e.x-P.x)||(e.face>0?1:-1);
  const mat=e.human?'blood':(DEATH_MAT[e.type]||'blood');
  // grab the current sprite
  _dx.clearRect(0,0,40,32);let ox,oy;
  if(e.isHero){const set=e.spr[e.showW],dir0=G.deadFace>0?-1:1;_dx.save();_dx.translate(20,28);_dx.rotate((Math.PI/2)*dir0);if(e.face<0)_dx.scale(-1,1);_dx.translate(-(OX+8),-(OY+16));_dx.drawImage(set.fr[0],0,0);_dx.restore();ox=e.x*TS+8-20;oy=e.y*TS+14-28}
  else if(e.human&&e.spr){const flip=e.face<0;_dx.save();if(flip){_dx.translate(CW_,0);_dx.scale(-1,1)}_dx.drawImage(e.spr.fr[0],0,0);_dx.restore();ox=e.x*TS-OX;oy=e.y*TS-2-OY}
  else if(SP[e.type]){const flip=e.face>0;_dx.save();if(flip){_dx.translate(16,0);_dx.scale(-1,1)}_dx.drawImage(SP[e.type],0,0);_dx.restore();ox=e.x*TS;oy=e.y*TS+(e.hover?-3:0)}
  else return;
  const d=_dx.getImageData(0,0,40,32).data,floorY=e.y*TS+14,cx=e.x*TS+8;
  G.gibs=G.gibs||[];
  for(let y=0;y<32;y++)for(let x=0;x<40;x++){const i=(y*40+x)*4;if(d[i+3]<128)continue;
    const wx=ox+x,wy=oy+y,hi=(floorY-wy)/16;
    G.gibs.push({x:wx,y:wy,vx:dir*(8+Math.random()*38)*(.4+hi)+(wx-cx)*1.6+(Math.random()-.5)*14,vy:-(10+Math.random()*55)*(.5+hi),
      c:`rgb(${d[i]},${d[i+1]},${d[i+2]})`,fl:floorY-1+Math.random()*4,t:0,life:1.4+Math.random()*1.4,rest:false});}
  if(mat==='mech'){for(let k=0;k<14;k++)G.gibs.push({x:cx,y:floorY-8,vx:(Math.random()-.5)*120,vy:-30-Math.random()*80,c:Math.random()<.5?'#ffd23f':'#fff6c0',fl:floorY+2,t:0,life:.5+Math.random()*.5,spark:1});
    spawnFx('explosions/plasma-explosion',cx,floorY,{k:.16,maxLife:1.2})}
  // splat decal
  G.decals=G.decals||[];const C=MAT_COL[mat],px=[];const n=mat==='mech'?18:26;
  for(let k=0;k<n;k++){const a=Math.random()*Math.PI*2,r=Math.sqrt(Math.random())*(mat==='goo'?6:5);px.push([Math.round(cx+Math.cos(a)*r*1.4+dir*2),Math.round(floorY-1+Math.sin(a)*r*.55),C[(Math.random()*C.length)|0]])}
  for(let k=0;k<(mat==='mech'?2:5);k++){const L=2+Math.random()*7;for(let s=0;s<L;s++)px.push([Math.round(cx+dir*(4+s)),Math.round(floorY-1+(Math.random()-.5)*3+s*.2*(k-2)),C[0]])}
  G.decals.push({px,x:e.x,y:e.y,t:0});if(G.decals.length>70)G.decals.shift();
  // no beams from the sky over a corpse
  const fx=cx,fy=floorY;FXL=FXL.filter(f=>!((SKY_RE.test(f.id)||f.tgt===e)&&(f.tgt===e||(f.t<.06&&Math.abs(f.x-fx)<14&&Math.abs(f.y-fy)<14))));
  if(e.stFx)for(const k in e.stFx){const f=e.stFx[k];if(f)f.stopped=1}
  e.fade=0;
}
function gibsUpdate(dt){const L=G&&G.gibs;if(!L||!L.length)return;
  for(const g of L){g.t+=dt;if(g.rest)continue;g.vy+=260*dt;g.x+=g.vx*dt;g.y+=g.vy*dt;
    if(g.y>=g.fl){g.y=g.fl;if(g.spark){g.t=g.life;continue}if(Math.abs(g.vy)<30){g.rest=true;g.vx=0;g.vy=0}else{g.vy*=-.32;g.vx*=.55}}}
  G.gibs=L.filter(g=>g.t<g.life+.6);}
function decalsDraw(){const L=G&&G.decals;if(!L)return;for(const d of L){if(!G.seen[idx(d.x,d.y)])continue;for(const[x,y,c]of d.px){ctx.fillStyle=c;ctx.fillRect(x,y,1,1)}}}
function gibsDraw(){const L=G&&G.gibs;if(!L||!L.length)return;for(const g of L){ctx.globalAlpha=g.t>g.life?Math.max(0,1-(g.t-g.life)/.6):1;ctx.fillStyle=g.c;ctx.fillRect(Math.round(g.x),Math.round(g.y),1,1)}ctx.globalAlpha=1}
