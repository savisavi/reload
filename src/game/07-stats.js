// ================= HERO ATTRIBUTES =================
const ATTR=[
  ['str','СИЛ','Сила','рюкзак 10+5/ед., урон в ближнем бою ±8%/ед. от 5, замах −5%/ед.; при перегрузе (>75% веса) наёмник замедляется'],
  ['agi','ЛОВ','Ловкость','уклонение 2,5%/ед. выше 2; меткость ±5%/ед.; износ оружия ±9%/ед.; перезарядка ±6%/ед.; ниже 5 — сам промахивается в ближнем бою'],
  ['spd','СКР','Скорость','темп действий, замах −4%/ед. и перезарядка −5%/ед.: выше 5 — враги чаще не успевают ответить'],
  ['int','ИНТ','Интеллект','опыт ±8%/ед., импланты ±6%, расход и восстановление энергии; ремонт ±10%/ед., стоимость ремонта и улучшений ±6%/ед., меньше теряется макс. прочность'],
  ['per','ВНИ','Внимательность','обзор 3+ВНИ клеток; бонус/потеря добычи; шанс улучшения +5%/ед.; осечки изношенного оружия ±12%/ед.'],
  ['vit','ЗДР','Здоровье','HP ±4/ед. от 5, урон ±3%/ед., лечение ±8%; при ЗДР 3 и ниже регенерации нет']];
function genAttr(h){
  const T=h.traits,bi=Math.max(0,['худощавое','среднее','крепкое','массивное'].indexOf(T['Телосложение']));
  const nImpl=T['Импланты'][0]==='нет'?0:T['Импланты'].length;const r=RNG(((h.ch.seeds.face||1)^0x5a5a5a)>>>0);
  return{str:3+bi+r.int(0,1),agi:Math.max(2,6-bi+r.int(-1,1)),spd:Math.max(2,4+(bi===0?1:0)+(h.H>=13?1:0)+r.int(0,1)-(bi===3?1:0)),
    int:3+Math.min(3,nImpl)+r.int(0,1),per:3+r.int(0,2)+(['визор','моно-линза','светящиеся'].includes(T['Глаза'])?1:0),vit:3+Math.min(bi,2)+r.int(0,1)};
}
function recalc(h){
  if(!h.attr)h.attr=genAttr(h);const A=h.attr,d=k=>A[k]-5;
  const e=h.eq,pas=e.pas.filter(Boolean),bf=(typeof ST!=='undefined'&&ST)?ST.buff:null;
  const st={def:(e.armor?.def||0)+(e.clothes?.def||0)+pas.reduce((s,i)=>s+(i.def||0),0),
    dodge:Math.max(0,Math.min(.6,(e.clothes?.dodge||0)+(A.agi-2)*.025)),
    mhp:Math.max(20,h.base.hp+(e.armor?.hp||0)+pas.reduce((s,i)=>s+(i.hp||0),0)+(h.lvl-1)*5+(bf?bf.hp:0)+d('vit')*4+10),
    mmp:h.base.mp+pas.reduce((s,i)=>s+(i.mp||0),0)+((typeof ST!=='undefined'&&ST)?ST.base.gen*10:0)+(bf?bf.en:0),
    acc:pas.reduce((s,i)=>s+(i.acc||0),0)+d('agi')*.05,crit:pas.reduce((s,i)=>s+(i.crit||0),0),regen:pas.reduce((s,i)=>s+(i.regen||0),0),atk:h.lvl-1,
    selfMiss:Math.max(0,-d('agi')*.08),meleeMul:Math.max(.6,1+d('str')*.08),
    cap:10+A.str*5,dr:Math.max(-.2,Math.min(.4,d('vit')*.03)),healMul:Math.max(.5,1+d('vit')*.08),vitRegen:A.vit<=3?0:Math.max(3,18-A.vit*2),
    spdMul:1+(A.spd-5)*.06,spdSkip:Math.max(-.3,Math.min(.35,(A.spd-5)*.06)),
    xpMul:Math.max(.6,1+d('int')*.08),impMul:Math.max(.7,1+d('int')*.06),costMul:A.int<5?1+(5-A.int)*.15:Math.max(.5,1-(A.int-5)*.06),
    mpEvery:A.int<=1?40:A.int===2?24:A.int===3?14:A.int===4?7:A.int===5?4:A.int===6?3:2,
    perBonus:Math.max(0,Math.min(.7,d('per')*.1)),lootLoss:Math.max(0,-d('per')*.12),sight:Math.max(5,Math.min(12,3+A.per)),
    wearMul:Math.max(.35,1-d('agi')*.09),
    windMul:Math.max(.55,Math.min(1.7,1-d('str')*.05-d('spd')*.04)),
    reloadMul:Math.max(.45,Math.min(1.8,1-d('agi')*.06-d('spd')*.05)),
    repairMul:Math.max(.5,1+d('int')*.1),repairLoss:Math.max(0,.08-d('int')*.015),craftMul:Math.max(.6,Math.min(1.5,1-d('int')*.06)),
    upgBonus:d('per')*.05+d('int')*.03,jamMul:Math.max(.3,1-d('per')*.12)};
  h.st=st;h.hp=Math.min(h.hp,st.mhp);h.mp=Math.min(h.mp,st.mmp);
}
// negative/positive effect summary for UI
function attrFx(h){const A=h.attr,S=h.st,o=[];if(!A||!S)return'';
  const pc=x=>(x>0?'+':'')+Math.round(x*100)+'%';
  o.push(['str',`рюкзак ${S.cap}, ближний ${pc(S.meleeMul-1)}, замах ×${S.windMul.toFixed(2)}`,A.str<5]);
  o.push(['agi',`уклон ${Math.round(S.dodge*100)}%, меткость ${pc(S.acc)}${S.selfMiss?`, промах ${Math.round(S.selfMiss*100)}%`:''}, износ ${pc(S.wearMul-1)}, перезар. ×${S.reloadMul.toFixed(2)}`,A.agi<5]);
  o.push(['spd',S.spdSkip<0?`действует медленнее на ${Math.round(-S.spdSkip*100)}%`:`действует быстрее на ${Math.round(S.spdSkip*100)}%`,A.spd<5]);
  o.push(['int',`опыт ${pc(S.xpMul-1)}, расход EN ${pc(S.costMul-1)}, +1 EN за ${tsec(S.mpEvery)}, ремонт ${pc(S.repairMul-1)}, цена крафта ${pc(S.craftMul-1)}`,A.int<5]);
  o.push(['per',`шанс улучш. ${pc(S.upgBonus)}, осечки ${pc(S.jamMul-1)}, обзор ${S.sight}${S.lootLoss?`, теряет ${Math.round(S.lootLoss*100)}% добычи`:S.perBonus?`, бонус ${Math.round(S.perBonus*100)}%`:''}`,A.per<5]);
  o.push(['vit',`урон ${pc(-S.dr)}, лечение ${pc(S.healMul-1)}, ${S.vitRegen?`реген 1 HP/${tsec(S.vitRegen)}`:'нет регенерации'}`,A.vit<5]);
  return`<div class="atfx">${o.map(([k,t,bad])=>`<p class="${bad?'bad':''}"><b>${ATTR.find(a=>a[0]===k)[1]}</b> ${t}</p>`).join('')}</div>`}
function attrHTML(edit){
  const A=H.attr||{},pts=H.pts||0;
  return`<div class="attrs">${ATTR.map(([k,s,n,d])=>`<span class="at ${A[k]<5?'low':A[k]>5?'hi':''}" title="${n}: ${d}"><i>${s}</i><b>${A[k]}</b>${edit&&pts?`<button class="ap" data-ap="${k}">+</button>`:''}</span>`).join('')}${pts?`<em class="pts">очков: ${pts}</em>`:''}</div>${edit?attrFx(H):''}`;
}
function bindAttr(rerender){document.querySelectorAll('[data-ap]').forEach(b=>b.onclick=ev=>{ev.stopPropagation();if(!(H.pts>0))return;H.attr[b.dataset.ap]++;H.pts--;recalc(H);saveGame();updateHUD();rerender()})}
function attrHelp(){return`<div class="atlegend">${ATTR.map(([k,s,n,d])=>`<p><b>${s}</b> ${n} — ${d}</p>`).join('')}</div>`}

// ===== dynamic difficulty =====
// expected hero level for a floor; anything above it is 'overlevel' and the dungeon answers in kind
const expLvl=f=>1+2*(f-1);
function overLvl(){const P=G.p;return Math.max(0,P.lvl-expLvl(G.floor))}
// the floor the enemies are equipped and toughened for (sewers stay sewers, but the residents scale)
function effFloor(){return G.floor+Math.round(overLvl()*.7)}
function threatLevel(){const P=G.p,ov=overLvl();return +(G.floor+ov*1.1+(P.lvl-1)*.3+Math.max(0,P.st.mhp-60)/25).toFixed(1)}
