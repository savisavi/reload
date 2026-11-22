// ================= HARDCORE: permadeath + recruitment terminal =================
const HARDCORE=true;
function charFromSeed(seed){
  const r=RNG(mix32(seed>>>0)),seeds={};['body','face','hair','cloth','impl','color'].forEach(g=>seeds[g]=(r.f()*4294967296)>>>0);
  const dens=r.chance(.5)?'mid':'high',g=generate(seeds,dens);const nm=r.pick(NAMES);
  return{dens,g,seeds,name:r.chance(.55)?`${nm}-${String(r.int(1,99)).padStart(2,'0')}`:`${nm} «${r.pick(NAMES)}»`};
}
// recruit specs: deterministic per pool seed (pool refreshes after every raid)
function recruitSpecs(){
  const r=RNG(mix32((ST.recSeed||1)>>>0)),top=Math.max(4,Math.min(30,ST.maxDepth*2+3)),out=[];
  for(let i=0;i<6;i++){const free=i<2;
    const lvl=free?1:Math.max(2,Math.round(2+(top-2)*((i-2)/3)*(.75+r.f()*.5)));
    out.push({i,seed:(r.f()*4294967296)>>>0,lvl,free})}
  return out;
}
function buildRecruit(sp){
  const r=RNG(mix32((sp.seed^0xC0FFEE)>>>0)),sd=()=>(r.f()*4294967296)>>>0;
  const ch=charFromSeed(sp.seed),h=heroShell(ch);h.dens=ch.dens;h.lvl=sp.lvl;h.xp=0;
  h.attr=genAttr(h);
  // free volunteers are rough around the edges; hired pros get their level's worth of points
  if(sp.free){const ks=Object.keys(h.attr);for(let k=0;k<2;k++){const a=ks[(r.f()*ks.length)|0];h.attr[a]=Math.max(1,h.attr[a]-1)}}
  else{const ks=Object.keys(h.attr);for(let k=0;k<sp.lvl-1;k++){const a=ks[(r.f()*ks.length)|0];h.attr[a]++}}
  h.pts=0;
  const L=sp.lvl,rar=sp.free?0:Math.min(4,Math.floor((L-1)/3)+(r.f()<.35?1:0));
  const fl=Math.max(1,Math.ceil(L/2));
  h.eq.ranged=makeItem(sd(),'ranged',fl,{rar,kind:sp.free?(r.f()<.6?'пистолет':'револьвер'):undefined});
  h.eq.melee=makeItem(sd(),'melee',fl,{rar:sp.free?0:Math.max(0,rar-(r.f()<.5?1:0))});
  if(L>=4)h.eq.armor=makeItem(sd(),'armor',fl,{rar:Math.max(0,rar-1)});
  if(L>=3)h.eq.clothes=makeItem(sd(),'clothes',fl,{rar:Math.max(0,rar-1)});
  h.eq.act[0]=makeItem(sd(),'implant',fl,{rar:Math.max(0,rar-1),kind:'Электро-разряд'});
  if(L>=6)h.eq.pas[0]=makeItem(sd(),'implant',fl,{rar:Math.max(0,rar-1)});
  if(sp.free){for(const w of[h.eq.ranged,h.eq.melee])if(w&&w.mdur)w.dur=Math.round(w.mdur*(.45+r.f()*.25))}
  const am=h.eq.ranged.ammo;h.inv.ammo[am]=Math.round((sp.free?18:24)+L*6);
  for(let k=0;k<1+Math.floor(L/3);k++)h.inv.meds.push(makeItem(sd(),'med',fl,{rar:0,kind:'аптечка'}));
  if(!sp.free)h.inv.bats.push(makeItem(sd(),'battery',fl,{rar:0}));
  if(L>=5)h.inv.grens.push(makeItem(sd(),'grenade',fl,{rar:0}));
  recalc(h);h.hp=h.st.mhp;h.mp=h.st.mmp;rebuildSprites(h);
  return h;
}
function gearValue(h){let v=0;for(const it of[h.eq.melee,h.eq.ranged,h.eq.armor,h.eq.clothes,...h.eq.pas,...h.eq.act])if(it)v+=itemValue(it);return v}
function recruitPrice(sp,h){return sp.free?0:Math.round(55*Math.pow(sp.lvl,1.55)+gearValue(h)*.5)}
const _recCache={};
function recruit(sp){const k=ST.recSeed+':'+sp.i;if(!_recCache[k])_recCache[k]=buildRecruit(sp);return _recCache[k]}
let HSELR=0;
function hirePanel(){
  const specs=recruitSpecs(),isAlive=H&&!H.dead;HSELR=Math.min(HSELR,specs.length-1);
  const tabs=`<div class="tabs"><button class="tab" data-t="sell">Продать</button><button class="tab" data-t="buy">Купить</button><button class="tab on" data-t="hire">Наём</button></div>`;
  const cards=specs.map(sp=>{const h=recruit(sp),taken=ST.recTaken.includes(sp.i),pr=recruitPrice(sp,h);
    return`<button class="rc ${HSELR===sp.i?'on':''} ${taken?'taken':''}" data-r="${sp.i}"><img src="${posed(h.spr.r).toDataURL()}"><b>${h.name.split(' ')[0]}</b><span>ур. ${h.lvl}</span><em class="${sp.free?'fr':''}">${taken?'нанят':sp.free?'бесплатно':pr+'₵'}</em></button>`}).join('');
  const sp=specs[HSELR],h=recruit(sp),pr=recruitPrice(sp,h),taken=ST.recTaken.includes(sp.i);
  const gear=[h.eq.ranged,h.eq.melee,h.eq.armor,h.eq.clothes,...h.eq.act,...h.eq.pas].filter(Boolean);
  const A=h.attr;
  const det=`<div class="rdet"><img class="big" src="${posed(h.spr.r).toDataURL()}"><div>
    <div class="nm">${h.name} <span class="lvl">ур. ${h.lvl}</span></div>
    <p>HP ${h.st.mhp} · EN ${h.st.mmp} · защ ${h.st.def} · ${h.traits['Телосложение']}</p>
    <div class="attrs">${ATTR.map(([k,s])=>`<span class="at ${A[k]<5?'low':A[k]>5?'hi':''}"><i>${s}</i><b>${A[k]}</b></span>`).join('')}</div>
    <div class="rg">${gear.map(it=>`<img title="${it.name}" src="${iconURL(it)}" style="border-bottom:2px solid ${RAR[it.rar].c}">`).join('')}</div>
    <p class="rs">${h.eq.ranged.name} · ${h.eq.ranged.lines[0]}<br>${h.eq.melee.name}<br>патроны ${h.inv.ammo[h.eq.ranged.ammo]} · аптечки ${h.inv.meds.length}${h.inv.grens.length?` · гранаты ${h.inv.grens.length}`:''}${sp.free?'<br><span style="color:#ffb04a">Доброволец: снаряжение изношено, навыки слабее</span>':''}</p>
  </div></div>`;
  const full=mercCount()>=ROSTER_CAP,can=!full&&!taken&&ST.credits>=pr;
  const btn=full?`<p class="rinfo">В отряде нет мест (максимум ${ROSTER_CAP}). Уволить можно в меню «Наёмники».</p>`
    :taken?'':`<button class="btn ${can?'go':''}" id="rHire" ${can?'':'disabled'}>${sp.free?'Взять добровольца':`Нанять за ${pr}₵`}</button>${!can&&ST.credits<pr?`<p class="rinfo">Не хватает ${pr-ST.credits}₵</p>`:''}`;
  const fallen=(ST.fallen||[]).slice(-6).reverse();
  showOv(`<h2>ТЕРМИНАЛ</h2>${tabs}${!isAlive?'<p class="rinfo">Нет активного наёмника — наймите нового</p>':''}<p class="rinfo" style="color:#8a83ab">В отряде ${mercCount()}/${ROSTER_CAP}</p>
    <div class="rcards">${cards}</div>${det}<div class="row">${btn}</div>
    ${fallen.length?`<div class="sect">МЕМОРИАЛ</div><p class="mem">${fallen.map(f=>`✝ ${f.name} · ур. ${f.lvl} · рейдов ${f.raids||0} · заработал ${f.earned||0}₵ · пал на этаже ${f.floor}`).join('<br>')}</p>`:''}
    <p class="help">Хардкор: погибший боец не возвращается, всё надетое и в сумке теряется. Ящик, кредиты и убежище остаются. Список наёмников обновляется после каждого рейда.</p>
    <div class="row"><button class="btn" id="oClose">Закрыть</button></div>`,true);
  document.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{TTAB=b.dataset.t;TSEL=-1;tradePanel()});
  document.querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>{HSELR=+b.dataset.r;hirePanel()});
  const hb=$('rHire');if(hb)hb.onclick=()=>{if(!can)return;ST.credits-=pr;ST.recTaken.push(sp.i);
    const nh=buildRecruit(sp);delete _recCache[ST.recSeed+':'+sp.i];
    if(alive()){ST.roster.push(heroToObj(nh));saveGame();log(`${nh.name} в отряде — выбрать активным можно в «Наёмниках»`,'#7dff4f');return hirePanel()}
    H=nh;
    saveGame();enterBase();updateHUD();log(`${nh.name} присоединяется к убежищу`,'#7dff4f');
    showOv(`<h2>НОВЫЙ БОЕЦ</h2><div class="hero-top"><img class="big" src="${heroCanvasURL()}"><div><div class="nm">${nh.name}</div><p>ур. ${nh.lvl} · HP ${nh.st.mhp}<br>${nh.eq.ranged.name}<br>${nh.eq.melee.name}</p></div></div><div class="row"><button class="btn go" id="oLo">Снаряжение</button><button class="btn" id="oClose">В убежище</button></div>`);
    const lo=$('oLo');if(lo)lo.onclick=()=>loadoutPanel();bindOv()};
  bindOv();
}
function tradePanel(){if(TTAB==='hire')return hirePanel();return tradePanelBase()}
function heroDies(P){
  const S=P.stats||{};(ST.fallen=ST.fallen||[]).push({name:P.name,lvl:P.lvl,floor:G.floor,kills:S.kills||G.kills,raids:S.raids||0,earned:S.earned||0,turns:S.turns||0,deep:S.deep||G.floor,born:S.born||0,died:Date.now(),killer:G.killer||'',seeds:P.ch.seeds});
  P.dead=true;P.hp=0;
  P.eq={melee:null,ranged:null,armor:null,clothes:null,pas:[null,null],act:[null,null]};
  P.inv={meds:[],bats:[],grens:[],ammo:{'пули':0,'дробь':0,'энергия':0}};
}
function lifeSpan(ms){const m=Math.max(1,Math.round(ms/60000));if(m<60)return`${m} мин`;const h=Math.floor(m/60);if(h<48)return`${h} ч ${m%60} мин`;return`${Math.floor(h/24)} дн ${h%24} ч`}
function deathScreen(){
  const f=ST.fallen[ST.fallen.length-1];
  let portrait='';try{const h=heroShell({g:generate(f.seeds,'mid'),seeds:f.seeds,name:f.name});rebuildSprites(h);portrait=`<img class="tomb-p" src="${posed(h.spr.r).toDataURL()}">`}catch(_){}
  showOv(`<div class="tomb"><div class="tomb-h">✝ НАЁМНИК ПОГИБ ✝</div>${portrait}
  <div class="tomb-n">${f.name}</div><div class="tomb-l">уровень ${f.lvl}${f.killer?` · убит: ${f.killer}`:''}</div>
  <div class="tomb-g">
    <div><small>Прожил</small><b>${f.born?lifeSpan(f.died-f.born):'—'}</b><i>${f.turns} ход. в рейдах</i></div>
    <div><small>Рейдов пройдено</small><b>${f.raids}</b><i>с эвакуацией</i></div>
    <div><small>Заработал</small><b>${f.earned}₵</b><i>вынесенной добычи</i></div>
    <div><small>Уничтожил</small><b>${f.kills}</b><i>врагов</i></div>
    <div><small>Рекорд глубины</small><b>${f.deep}</b><i>этаж</i></div>
    <div><small>Пал на</small><b>${f.floor}</b><i>этаже</i></div>
  </div>
  <p class="tomb-t">Снаряжение и сумка потеряны навсегда. Ящик, кредиты (${ST.credits}₵) и убежище сохранились.</p></div>
  <div class="row">${ST.roster&&ST.roster.length?`<button class="btn go" id="oNext">Продолжить: ${ST.roster[0].name}</button>`:''}<button class="btn ${ST.roster&&ST.roster.length?'':'go'}" id="oHire">Терминал найма</button></div>`);
  $('oHire').onclick=()=>{TTAB='hire';HSELR=0;tradePanel()};{const n=$('oNext');if(n)n.onclick=()=>{activateMerc(0);MSEL='active';mercsPanel()}}
}
