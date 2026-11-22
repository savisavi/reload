// ================= WEAPONS: durability, swing time, magazines, repair & upgrades =================
const WPN_K={
  melee:{'нож':{dur:60,wind:.7},'мачете':{dur:75,wind:.9},'катана':{dur:70,wind:.85},'топор':{dur:95,wind:1.35},'бита':{dur:110,wind:1.2},'электродубинка':{dur:65,wind:1.0},'энергоклинок':{dur:55,wind:.9}},
  ranged:{'пистолет':{dur:150,mag:8,rl:1},'револьвер':{dur:170,mag:6,rl:1.6},'ПП':{dur:130,mag:24,rl:1.4},'дробовик':{dur:95,mag:5,rl:2.2},'винтовка':{dur:120,mag:5,rl:1.8},'лазер':{dur:85,mag:12,rl:1.2}}};
const UP_MAX=5;
function initWpn(it){
  if(it.cat!=='melee'&&it.cat!=='ranged')return;const K=WPN_K[it.cat][it.kind]||{dur:80,wind:1,mag:8,rl:1.4};
  it.b0={dmg:it.dmg.slice(),acc:it.acc,crit:it.crit,name:it.name,extra:it.lines.filter(l=>/^FX:/.test(l))};
  it.mdur0=Math.round(K.dur*(1+.2*it.rar)*(1+.04*(it.lvl-1)));
  if(it.cat==='melee')it.wind0=+(K.wind*(1-.03*it.rar)).toFixed(2);
  else{it.mag0=Math.max(1,Math.round(K.mag*(1+.1*it.rar)));it.rl0=K.rl}
  it.up=0;it.mloss=1;applyWpn(it);it.dur=it.mdur;if(it.cat==='ranged')it.clip=it.mag;
}
function applyWpn(it){
  const u=it.up||0;
  it.dmg=it.b0.dmg.map(v=>Math.round(v*(1+.12*u)));
  it.mdur=Math.max(5,Math.round(it.mdur0*(1+.15*u)*(it.mloss||1)));
  const st=it.st&&ST_N[it.st]?` · ${ST_N[it.st]} 35%`:'';
  if(it.cat==='melee'){it.wind=+(it.wind0*(1-.05*u)).toFixed(2);it.crit=Math.min(.6,it.b0.crit+.01*u);
    it.lines=[`Урон ${it.dmg[0]}–${it.dmg[1]} · крит ${Math.round(it.crit*100)}%`+(it.stun?` · оглуш. ${Math.round(it.stun*100)}%`:''),`Замах ${tsec(it.wind)} · прочность ${it.mdur}`,...it.b0.extra]}
  else{it.mag=Math.round(it.mag0*(1+.2*u));it.rl=+(it.rl0*(1-.06*u)).toFixed(2);it.acc=Math.min(.98,it.b0.acc+.02*u);
    it.lines=[`Урон ${it.dmg[0]}–${it.dmg[1]}${it.burst>1?' ×'+it.burst:''} · дальн. ${it.range} · точн. ${Math.round(it.acc*100)}%`,`Обойма ${it.mag} · перезарядка ${tsec(it.rl)} · ${it.ammo}`,`Прочность ${it.mdur}`,...it.b0.extra]}
  if(it.clip!=null)it.clip=Math.min(it.clip,it.mag);if(it.dur!=null)it.dur=Math.min(it.dur,it.mdur);
  it.name=it.b0.name+(u?` +${u}`:'');
}
const cond=w=>w&&w.mdur?Math.max(0,w.dur)/w.mdur:1;
const broken=w=>w&&w.mdur&&w.dur<=0;
const condCol=c=>c>.6?'#7dff4f':c>.3?'#ffd23f':c>0?'#ff8a3a':'#ff3355';
function wear(w,base){if(!w||!w.mdur)return;const P=G.p,v=base*(P.st.wearMul||1);let n=Math.floor(v);if(Math.random()<v-n)n++;
  const was=w.dur;w.dur=Math.max(0,w.dur-n);
  if(was>0&&w.dur<=0){log(`${w.name} сломан!`,'#ff3355');float(P,'сломано','#ff3355',-10)}
  else if(was/w.mdur>.25&&w.dur/w.mdur<=.25)log(`${w.name}: износ, нужен ремонт`,'#ff8a3a')}
const condDmg=w=>{const c=cond(w);return c>=.5?1:.55+.9*c};

// ---- scoring (equipping AI) knows about condition ----
function score(it,h){
  const c=it.mdur?(it.dur<=0?0:.35+.65*cond(it)):1;
  switch(it.cat){
    case 'melee':return avg(it.dmg)*(1+it.crit)*(1+(it.stun||0))/Math.max(.6,it.wind||1)*c;
    case 'ranged':{const am=h?h.inv.ammo[it.ammo]+(it.clip||0):99;return avg(it.dmg)*(it.burst||1)*it.acc*(.7+it.range/20)*(am>=6?1:.3)*c*(1+(it.mag||6)/60)}
    case 'armor':return it.def*4+(it.hp||0)*.3;
    case 'clothes':return (it.def||0)*4+it.dodge*40;
    case 'implant':return mul(it);
  }return 0;
}
// ---- hero combat ----
function heroMelee(e){
  const P=G.p;let w=P.eq.melee||FISTS;const brk=broken(w);if(brk)w=FISTS;
  G.actCost=(w.wind||.8)*(P.st.windMul||1);
  P.bump={dx:e.x-P.x,dy:e.y-P.y,t:0};if(e.x!==P.x)P.face=Math.sign(e.x-P.x);P.showW='m';
  if(Math.random()<(P.st.selfMiss||0)){float(e,'промах','#b9ad95');return}
  let dmg=Math.round((rnd(w.dmg)+P.st.atk)*(P.st.meleeMul||1)*condDmg(w));const crit=Math.random()<(w.crit+P.st.crit);if(crit)dmg*=2;
  hurt(e,dmg,P,crit);fxOnHit(P,e,w,crit);if(!e.dead&&w.stun&&Math.random()<w.stun){e.stun=1;float(e,'оглушён','#22e6ff',-6)}
  if(!brk&&P.eq.melee)wear(P.eq.melee,1);
}
function reloadWpn(){
  const P=G.p,w=P.eq.ranged;if(!w)return false;const have=P.inv.ammo[w.ammo];
  if(w.clip>=w.mag){return false}if(have<=0){log('Нет патронов: '+w.ammo,'#ffb04a');return false}
  const t=Math.min(w.mag-w.clip,have);w.clip+=t;P.inv.ammo[w.ammo]-=t;
  G.actCost=w.rl*(P.st.reloadMul||1);P.showW='r';float(P,'перезарядка','#ffd23f',-10);
  if(G.actCost>=2)log(`Перезарядка ${w.name}: ${(G.actCost*STEP).toFixed(1)} с`,'#a8a0c6');return true;
}
function heroShoot(e){
  const P=G.p,w=P.eq.ranged;if(!w)return;P.showW='r';if(e.x!==P.x)P.face=Math.sign(e.x-P.x);
  if(broken(w)){log(`${w.name} сломан — нужен ремонт`,'#ff3355');return}
  if(w.clip<=0){reloadWpn();return}
  // jam on a worn gun (внимательность замечает неисправность заранее)
  const c=cond(w);if(c<.35&&Math.random()<(.35-c)*1.3*(P.st.jamMul||1)){float(P,'осечка','#ff8a3a',-10);log(`${w.name}: осечка`,'#ff8a3a');G.actCost=1.3;wear(w,1);return}
  for(let s=0;s<(w.burst||1);s++){
    if(w.clip<=0)break;w.clip--;const d=dst(P,e);
    const hit=Math.random()<w.acc+P.st.acc-.03*Math.max(0,d-2)-(c<.5?(.5-c)*.3:0);
    tracer(P,e,w.tracer,hit,s*.06);fxOnShot(P,e,w,hit);wear(w,.5);
    if(e.dead)continue;
    if(hit){let dmg=Math.round((rnd(w.dmg)+P.st.atk)*condDmg(w));if(w.kind==='дробовик'&&d<=2)dmg=Math.round(dmg*1.4);const crit=Math.random()<.06+P.st.crit;if(crit)dmg*=2;hurt(e,dmg,P,crit)}
    else float(e,'мимо','#b9ad95',-s*6);
  }
}
// ---- enemies: heavy swings may whiff a turn, guns run dry and reload ----
function enemyMelee(e){const P=G.p,w=e.weapon.cat==='melee'?e.weapon:{dmg:[1,3],crit:.03};
  if(w.wind&&w.wind>1&&Math.random()<(w.wind-1)*.8&&!e.windup){e.windup=1;float(e,'замах','#ffb04a',-8);return}e.windup=0;
  let dmg=Math.max(1,Math.round(rnd(w.dmg)*eMul()*condDmg(w)));const crit=Math.random()<(w.crit||0);if(crit)dmg=Math.round(dmg*1.6);
  e.bump={dx:P.x-e.x,dy:P.y-e.y,t:0};if(P.x!==e.x)e.face=Math.sign(P.x-e.x);hurt(P,dmg,e);fxOnHit(e,P,e.weapon&&e.weapon.cat==='melee'?e.weapon:null)}
function enemyShoot(e){const P=G.p,w=e.weapon;if(P.x!==e.x)e.face=Math.sign(P.x-e.x);
  if(w.mag){if(e.clip==null)e.clip=w.mag;if(e.clip<=0){e.clip=w.mag;e.stun=Math.max(e.stun||0,Math.max(0,Math.round(w.rl)-1));float(e,'перезарядка','#ffd23f',-8);return}}
  for(let s=0;s<(w.burst||1);s++){if(w.mag){if(e.clip<=0)break;e.clip--}
    const d=dst(P,e),hit=Math.random()<w.acc-.1-.04*Math.max(0,d-2);tracer(e,P,w.tracer||'#ffe9a0',hit,s*.06);fxOnShot(e,P,w,hit);
    if(G.dead)return;if(hit)hurt(P,Math.max(1,Math.round(rnd(w.dmg)*eMul())),e);else float(P,'мимо','#b9ad95',-s*6)}}

// ---- recipes: random but stable combinations of everything in the loot tables ----
const REC_POOL={melee:['bolts','tape','sheet','rebar','spring','junk','wire','cement','servo','boards'],ranged:['spring','bolts','wire','cap','chip','tape','sheet','servo','cpu','battery','bulb']};
function pickMats(r,cat,n,maxT){const pool=REC_POOL[cat].concat(MAT_KEYS.filter(k=>k!=='fuel')).filter(k=>MATS[k].t<=maxT);const out=[];
  while(out.length<n&&out.length<pool.length){const k=pool[(r.f()*pool.length)|0];if(!out.includes(k))out.push(k)}return out}
function repairCost(w){
  const P=H,r=RNG(mix32((w.seed^0xBEEF1)>>>0)),miss=1-cond(w),ks=pickMats(r,w.cat,2+(w.rar>=3?1:0),Math.min(2,1+(w.rar>>1)));
  const k=(P.st.craftMul||1),cost={};ks.forEach((m,i)=>{const base=(i===0?4:2)*(1+w.rar*.4)*(1+(w.up||0)*.2)/Math.max(1,MATS[m].t*1.5);cost[m]=Math.max(1,Math.round(base*miss*k*1.6))});return cost;
}
function upgradeCost(w){
  const P=H,u=(w.up||0),r=RNG(mix32((w.seed+(u+1)*7919)>>>0)),maxT=Math.min(3,Math.floor(u/1.5+w.rar/2)),ks=pickMats(r,w.cat,2+Math.floor(u/2),Math.max(1,maxT));
  const k=(P.st.craftMul||1),cost={};ks.forEach((m,i)=>{const base=(i===0?5:3)*(1+u)*(1+w.rar*.3)/Math.max(1,MATS[m].t*2);cost[m]=Math.max(1,Math.round(base*k))});return cost;
}
const upgChance=w=>Math.max(.25,Math.min(.98,.97-.12*(w.up||0)+(H.st.upgBonus||0)));
const benchNeed=w=>Math.min(2,Math.ceil(((w.up||0)+1)/2));
const matSrc=()=>MODE==='raid'&&G&&G.pack?G.pack.mats:ST.mats;
const wCanPay=(c,src)=>Object.entries(c).every(([m,n])=>(src[m]||0)>=n);
const wPay=(c,src)=>{for(const m in c){src[m]-=c[m];if(src[m]<=0)delete src[m]}};
function costHTML(c,src){return Object.entries(c).map(([m,n])=>{const h=src[m]||0;return`<span class="mc" style="color:${h>=n?'#7dff4f':'#ff6a7a'}"><img src="${MAT_ICON[m].toDataURL()}">${n}<i>/${h}</i></span>`}).join('')}
const FIELD_CAP=.6;
function doRepair(w){
  const src=matSrc(),c=repairCost(w),raid=MODE==='raid';
  if(raid&&cond(w)>=FIELD_CAP)return'В рейде — только полевой ремонт до 60%';
  if(!wCanPay(c,src))return'Не хватает компонентов';
  wPay(c,src);const P=H,cap=raid?FIELD_CAP:1;
  const gain=Math.round(w.mdur*(1-cond(w))*Math.min(1.25,(P.st.repairMul||1)));
  w.dur=Math.min(Math.round(w.mdur*cap),w.dur+gain);
  if(!raid){const loss=P.st.repairLoss||0;if(loss>0){w.mloss=Math.max(.5,(w.mloss||1)-loss);applyWpn(w)}}
  return null;
}
function doUpgrade(w){
  if((w.up||0)>=UP_MAX)return'Максимальный уровень';
  if(MODE==='raid')return'Улучшать можно только в убежище';
  if((ST.base.bench||0)<benchNeed(w))return`Нужен верстак ур. ${benchNeed(w)}`;
  const c=upgradeCost(w);if(!wCanPay(c,ST.mats))return'Не хватает компонентов';
  wPay(c,ST.mats);
  if(Math.random()<upgChance(w)){w.up=(w.up||0)+1;const cl=w.clip,d=cond(w);applyWpn(w);w.dur=Math.round(w.mdur*d);if(cl!=null)w.clip=Math.min(cl,w.mag);return'ok'}
  w.dur=Math.max(0,Math.round(w.dur-w.mdur*.15));return'fail';
}
// UI block for the hero panel
function wpnBlock(w){
  if(!w||!w.mdur)return'';const c=cond(w),src=matSrc(),raid=MODE==='raid';
  const rc=repairCost(w),uc=upgradeCost(w);
  const stars='★'.repeat(w.up||0)+'☆'.repeat(UP_MAX-(w.up||0));
  return`<div class="wpb"><div class="wrow2"><span>Прочность</span><div class="mbar"><i style="width:${c*100}%;background:${condCol(c)}"></i><span>${Math.max(0,w.dur)}/${w.mdur}</span></div><b class="stars">${stars}</b></div>
   ${w.cat==='ranged'?`<p class="wst">Обойма ${w.clip}/${w.mag} · перезарядка ${tsec(w.rl*(H.st.reloadMul||1))} (с учётом навыков)</p>`:`<p class="wst">Замах ${tsec(w.wind*(H.st.windMul||1))} на удар (с учётом навыков)</p>`}
   <div class="wact"><div><small>${raid?'Полевой ремонт (до 60%)':'Ремонт'}</small><div class="mcs">${c>=1?'<i>исправно</i>':costHTML(rc,src)}</div><button class="btn sm" id="wRep" ${c>=1||(raid&&c>=FIELD_CAP)?'disabled':''}>Ремонт</button></div>
   <div><small>Улучшение до +${Math.min(UP_MAX,(w.up||0)+1)} · шанс ${Math.round(upgChance(w)*100)}%${(ST.base.bench||0)<benchNeed(w)?` · верстак ${benchNeed(w)}`:''}</small><div class="mcs">${(w.up||0)>=UP_MAX?'<i>максимум</i>':costHTML(uc,ST.mats)}</div><button class="btn sm" id="wUp" ${raid||(w.up||0)>=UP_MAX?'disabled':''}>${raid?'В убежище':'Улучшить'}</button></div></div></div>`;
}
function bindWpn(w,rerender){
  const r=$('wRep'),u=$('wUp');
  if(r)r.onclick=()=>{const e=doRepair(w);if(e)log(e,'#ffb04a');else{log(`Отремонтировано: ${w.name} (${w.dur}/${w.mdur})`,'#7dff4f');if(MODE!=='raid')saveGame()}rerender()};
  if(u)u.onclick=()=>{const e=doUpgrade(w);if(e==='ok')log(`Улучшено: ${w.name}`,'#7dff4f');else if(e==='fail')log(`Улучшение не удалось: компоненты потрачены, износ −15%`,'#ff6a7a');else log(e,'#ffb04a');if(MODE!=='raid'){recalc(H);rebuildSprites(H);saveGame()}rerender()};
}
