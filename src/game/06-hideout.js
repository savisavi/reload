// ================= HIDEOUT 2.0 (Tarkov / Zero Sievert inspired) =================
// Requirements per level: named components (hard lock: rare ones only from raids), credits (soft lock),
// prerequisite modules (dependency graph), build time in raids, power from a fuel-burning generator.
function freshState(){
  const b={};for(const k in UP)b[k]=UP[k].start;
  const mats={};MAT_KEYS.forEach(k=>mats[k]=0);
  return{ammo:{'пули':0,'дробь':0,'энергия':0},stash:[],mats,credits:80,base:b,maxDepth:1,raids:0,buff:null,shopSeed:rseed(),shopBought:[],deaths:0,fuel:0,gpus:0,building:null,v2:1,recSeed:rseed(),recTaken:[],fallen:[],roster:[],crateV:1};
}
function migrateST(){
  const isOld=ST.mats.parts!=null||ST.mats.elec!=null||ST.mats.build!=null;
  if(isOld){const map={parts:'bolts',elec:'wire',build:'bricks',cpu:'chip'};const om=ST.mats;const nm={};
    for(const k in om){const t=map[k]||k;if(MATS[t])nm[t]=(nm[t]||0)+om[k]}ST.mats=nm;setTimeout(saveGame,0)}
  ST.v2=1;
  MAT_KEYS.forEach(k=>{if(ST.mats[k]==null)ST.mats[k]=0});
  for(const k in UP)if(ST.base[k]==null)ST.base[k]=UP[k].start;
  if(ST.base.neon){ST.base.light=Math.max(ST.base.light||0,1);delete ST.base.neon}
  for(const k in ST.base)if(!UP[k])delete ST.base[k];
  if(!ST.ammo)ST.ammo={'пули':0,'дробь':0,'энергия':0};if(ST.fuel==null)ST.fuel=0;if(ST.gpus==null)ST.gpus=0;if(ST.building===undefined)ST.building=null;
}
const powered=()=>ST.base.gen>0&&ST.fuel>0;
const needsPower=()=>Object.keys(UP).some(k=>UP[k].power&&ST.base[k]>0);
const reqOK=req=>Object.entries(req||{}).every(([k,l])=>ST.base[k]>=l);
const itemsOK=it=>Object.entries(it||{}).every(([m,n])=>(ST.mats[m]||0)>=n);
const modName=k=>UP[k].n;
function compGrid(mats,showAll,need){
  const keys=MAT_KEYS.filter(k=>showAll||mats[k]>0||(need&&need[k]));
  if(!keys.length)return'<p>Компонентов нет</p>';
  return`<div class="comps">${keys.map(k=>{const n=mats[k]||0,nd=need&&need[k];
    return`<div class="comp t${MATS[k].t}" title="${MATS[k].n}"><img src="${MAT_ICON[k].toDataURL()}"><b>${n}${nd?`<i class="${n>=nd?'ok':'no'}">/${nd}</i>`:''}</b><small>${MATS[k].n}</small></div>`}).join('')}</div>`;
}
function matLine(cost){return Object.entries(cost).map(([m,n])=>{const have=ST.mats[m]||0;return`<span style="color:${have>=n?'#7dff4f':'#ff6a7a'}"><img class="mi" src="${MAT_ICON[m].toDataURL()}">${MATS[m].n} ${have}/${n}</span>`}).join(' ')}
function modIcon(k,l){
  if(k==='farm')return makeProp(1000,'rack').spr;
  if(k==='light')return MAT_ICON.bulb;
  return baseSprite(k,Math.max(1,l));
}
// ---------- build overview ----------
function buildPanel(){
  const pw=powered();
  const bInfo=ST.building?`<p class="rec" style="color:#ffb04a">Строится: ${modName(ST.building.k)} → ${UP[ST.building.k].lv[ST.building.lvl]} · осталось рейдов: ${ST.building.left}</p>`:'';
  const built=[],todo=[];Object.entries(UP).forEach(([k,u])=>{const l=ST.base[k],maxed=l>=u.max,next=maxed?null:u.L[l+1];
    let st;
    if(ST.building&&ST.building.k===k)st=`<span class="tag y">строится ${ST.building.left}</span>`;
    else if(maxed)st='<span class="tag g">макс.</span>';
    else if(!reqOK(next.req))st='<span class="tag r">нужно: '+Object.entries(next.req).filter(([m,lv])=>ST.base[m]<lv).map(([m,lv])=>`${modName(m)} ${lv}`).join(', ')+'</span>';
    else if(itemsOK(next.it)&&ST.credits>=next.cr)st='<span class="tag g">можно строить</span>';
    else st='<span class="tag">не хватает ресурсов</span>';
    const pwr=u.power&&l>0&&!pw?'<span class="tag r">нет питания</span>':'';
    const h=`<button class="mrow ${l>0?'':'nb'}" data-mod="${k}"><img src="${modIcon(k,l||1).toDataURL()}"><div><div class="nm">${u.n} <span class="lvl">${l}/${u.max}</span></div><small>${u.lv[l]}</small><div>${st}${pwr}</div></div></button>`;(l>0?built:todo).push(h)});
  const rows=`<div class="bsplit"><div class="bhalf"><div class="sect">ПОСТРОЕНО · ${built.length}</div><div class="mlist">${built.join('')||'<p class="help">Пока ничего не построено.</p>'}</div></div>
    <div class="bhalf"><div class="sect">МОЖНО ПОСТРОИТЬ · ${todo.length}</div><div class="mlist">${todo.join('')||'<p class="help">Всё построено.</p>'}</div></div></div>`;
  showOv(`<h2>УБЕЖИЩЕ</h2>
  <div class="risk"><div><small>Питание</small><b style="color:${pw?'#7dff4f':'#ff6a7a'}">${ST.base.gen?pw?'есть':'нет топлива':'нет генер.'}</b></div><div><small>Топливо</small><b>${hoursTxt(fuelHours())}</b></div><div><small>Кредиты</small><b>${ST.credits}₵</b></div><div><small>Видеокарты</small><b>${ST.gpus}/${2*ST.base.farm}</b></div></div>
  ${bInfo}${rows}<div class="row"><button class="btn" id="oClose">Закрыть</button></div>`,true);
  document.querySelectorAll('[data-mod]').forEach(b=>b.onclick=()=>modulePanel(b.dataset.mod));
  bindOv();
}
// ---------- crafting ----------
const RECIPES=[
  {mod:'med',lv:1,n:'Аптечка',in:{bandage:2,antisep:1},out:()=>{H.inv.meds.push(makeItem(rseed(),'med',Math.max(1,ST.maxDepth),{rar:0,kind:'аптечка'}));return'аптечка → в сумку'}},
  {mod:'med',lv:2,n:'Нано-аптечка',in:{bandage:2,antisep:2,chip:1},out:()=>{H.inv.meds.push(makeItem(rseed(),'med',Math.max(1,ST.maxDepth),{rar:2,kind:'нано-аптечка'}));return'нано-аптечка → в сумку'}},
  {mod:'wrack',lv:1,n:'Пули ×20',in:{junk:3,bolts:1},out:()=>{H.inv.ammo['пули']+=20;return'+20 пуль'}},
  {mod:'wrack',lv:1,n:'Дробь ×8',in:{junk:3,spring:1},out:()=>{H.inv.ammo['дробь']+=8;return'+8 дроби'}},
  {mod:'wrack',lv:2,n:'Энергоячейки ×12',in:{cap:1,wire:1},out:()=>{H.inv.ammo['энергия']+=12;return'+12 энергоячеек'}},
  {mod:'bench',lv:1,n:'Энергобатарея',in:{cap:2,wire:1},out:()=>{H.inv.bats.push(makeItem(rseed(),'battery',Math.max(1,ST.maxDepth),{rar:1}));return'батарея → в сумку'}},
  {mod:'bench',lv:2,n:'Канистра топлива',in:{junk:6,antisep:1,tape:1},out:()=>{ST.mats.fuel++;return'+1 канистра'}},
  {mod:'recycler',lv:1,n:'Переработка хлама',in:{junk:5},power:1,out:()=>{const pool=MAT_KEYS.filter(k=>MATS[k].t<=1&&!MATS[k].lib&&!MATS[k].fuelv&&k!=='junk');const got={};const n=1+(Math.random()<.5?1:0);
    for(let i=0;i<n;i++){const k=pool[(Math.random()*pool.length)|0];got[k]=(got[k]||0)+1;ST.mats[k]++}return Object.entries(got).map(([k,v])=>`${MATS[k].n} ×${v}`).join(', ')}},
];
function craftHTML(k){
  const rs=RECIPES.filter(r=>r.mod===k);if(!rs.length)return'';
  return`<div class="sect">КРАФТ</div>`+rs.map((r,i)=>{const lock=ST.base[k]<r.lv,np=r.power&&!powered(),ok=!lock&&!np&&itemsOK(r.in);
    return`<div class="trow"><span>${r.n}${lock?` <i class="lk">ур. ${r.lv}</i>`:''}${np?' <i class="lk">нет питания</i>':''}<br><small class="bcost">${matLine(r.in)}</small></span><button class="btn sm" data-craft="${RECIPES.indexOf(r)}" ${ok?'':'disabled'}>Создать</button></div>`}).join('');
}
// ---------- module detail ----------
function modulePanel(k){
  const u=UP[k],l=ST.base[k],maxed=l>=u.max,next=maxed?null:u.L[l+1],pw=powered();
  let reqH='';
  if(next){
    const rq=Object.entries(next.req||{}).map(([m,lv])=>`<span class="${ST.base[m]>=lv?'ok':'no'}">${ST.base[m]>=lv?'✓':'✗'} ${modName(m)} ур. ${lv}</span>`).join('');
    const busy=ST.building&&ST.building.k!==k?`<p style="color:#ffb04a">Сейчас строится ${modName(ST.building.k)} — одновременно можно вести одну стройку.</p>`:'';
    const can=!ST.building&&reqOK(next.req)&&itemsOK(next.it)&&ST.credits>=next.cr;
    reqH=`<div class="sect">СЛЕДУЮЩИЙ УРОВЕНЬ: ${u.lv[l+1].toUpperCase()}</div><p>${u.eff(l+1)}</p>
      ${rq?`<div class="reqs">${rq}</div>`:''}
      ${needHTML(next.it,next.cr)}
      <p class="st">Время стройки: ${next.raids?`${next.raids} рейд.`:'сразу'} · нажмите на компонент, чтобы узнать, где его найти</p>${busy}
      <div class="row"><button class="btn" id="mBuild" ${can?'':'disabled'}>${ST.building&&ST.building.k===k?`Строится (${ST.building.left})`:'Построить'}</button></div>`;
  }
  let extra='';
  if(k==='gen'&&l>0)extra=fuelHTML();
  if(k==='farm'&&l>0)extra=`<div class="sect">ВИДЕОКАРТЫ</div><p>Установлено ${ST.gpus}/${2*l}. Доход: ${20*ST.gpus}₵ за рейд${pw?'':' (нет питания!)'}. Видеокарты встречаются в серверных стойках и вычислительных блоках.</p><div class="row"><button class="btn" id="mGpu" ${ST.mats.gpu&&ST.gpus<2*l?'':'disabled'}>Установить видеокарту (${ST.mats.gpu||0})</button></div>`;
  const pwrNote=u.power?`<p style="color:${l&&!pw?'#ff6a7a':'#8a83ab'}">⚡ Требует питания от генератора${l&&!pw?' — сейчас не работает':''}</p>`:'';
  showOv(`<div class="hp-head"><img src="${modIcon(k,l||1).toDataURL()}" style="width:64px;height:80px"><div class="hp-info"><div class="nm">${u.n} <span class="lvl">ур. ${l}/${u.max}</span></div><p>${u.lv[l]}<br>${l?u.eff(l):'Не построено'}</p>${pwrNote}</div></div>
    ${extra}${craftHTML(k)}${reqH}<div class="row"><button class="btn" id="mBack">К списку</button><button class="btn" id="oClose">Закрыть</button></div>${next?'<div id="matInfo"></div>':''}`,true);if(next)bindNeeds(next.it);
  const on=(id,f)=>{const e=$(id);if(e)e.onclick=f};
  on('mBack',()=>buildPanel());
  on('mBuild',()=>{if(ST.building)return;for(const m in next.it)ST.mats[m]-=next.it[m];ST.credits-=next.cr;
    if(next.raids){ST.building={k,lvl:l+1,left:next.raids};log(`Стройка начата: ${u.n} — готово через ${next.raids} рейд.`,'#ffb04a')}
    else{ST.base[k]=l+1;log(`Построено: ${u.n} — ${u.lv[l+1]}`,'#7dff4f');recalc(H);enterBase()}
    saveGame();updateHUD();modulePanel(k)});
  document.querySelectorAll('[data-fuel]').forEach(b=>b.onclick=()=>{if(feedFuel(b.dataset.fuel)){saveGame();enterBase();modulePanel(k)}});
  on('mGpu',()=>{if(!ST.mats.gpu)return;ST.mats.gpu--;ST.gpus++;log('Видеокарта установлена','#ff9a1f');saveGame();modulePanel(k)});
  document.querySelectorAll('[data-craft]').forEach(b=>b.onclick=()=>{const r=RECIPES[+b.dataset.craft];if(!itemsOK(r.in))return;for(const m in r.in)ST.mats[m]-=r.in[m];
    const res=r.out();log(`Создано: ${r.n} — ${res}`,'#7dff4f');saveGame();updateHUD();modulePanel(k)});
  bindOv();
}
function openBasePanel(kind){
  if(kind==='bed')return bedPanel();if(kind==='crate')return stashPanel();if(kind==='terminal')return tradePanel();if(kind==='door'){if(H.dead){TTAB='hire';return tradePanel()}return loadoutPanel()}
  if(UP[kind])return modulePanel(kind);
  return buildPanel();
}
// ---------- stash ----------
let SSEL=-1;
function stashPanel(){
  const grid=ST.stash.map((it,i)=>`<button class="cell ${i===SSEL?'on':''}" data-i="${i}" style="--rc:${RAR[it.rar].c}"><img src="${iconURL(it)}"></button>`).join('');
  const sel=ST.stash[SSEL];let det='';
  if(sel){const gear=['melee','ranged','armor','clothes','implant'].includes(sel.cat);
    det=`<div class="det sm"><img src="${iconURL(sel)}"><div><div class="nm" style="color:${RAR[sel.rar].c}">${sel.name}</div><p>${CAT_N[sel.cat]} · ${RAR[sel.rar].n} · ур. ${sel.lvl}<br>${sel.lines.join(' · ')}</p>
    <div class="row">${gear?'<button class="btn sm" id="sEq">Надеть</button>':'<button class="btn sm" id="sTake">В сумку</button>'}${gear?`<button class="btn sm" id="sDis" ${ST.base.bench?'':'disabled'}>Разобрать${ST.base.bench?'':' (верстак)'}</button>`:''}</div></div></div>`}
  showOv(`<h2>${UP.crate.lv[ST.base.crate].toUpperCase()}</h2><div class="sect">КОМПОНЕНТЫ</div>${compGrid(ST.mats)}
  <p>Патроны в ящике: пули ${ST.ammo['пули']} · дробь ${ST.ammo['дробь']} · энергия ${ST.ammo['энергия']} (брать в рейд — через «Сборы»)</p>
  <div class="sect">ПРЕДМЕТЫ ${ST.stash.length}/${stashCap()}</div>${det}<div class="agrid">${grid||'<p>Пусто. Принесите добычу из рейда.</p>'}</div>
  <div class="row"><button class="btn" id="sBest">Надеть лучшее</button><button class="btn" id="oClose">Закрыть</button></div>`,true);
  document.querySelectorAll('.cell[data-i]').forEach(b=>b.onclick=()=>{SSEL=+b.dataset.i;stashPanel()});
  const b=(id,f)=>{const e=$(id);if(e)e.onclick=f};
  b('sEq',()=>{const it=ST.stash.splice(SSEL,1)[0];const old=forceEquip(it);if(old)ST.stash.push(old);SSEL=-1;after()});
  b('sTake',()=>{const it=ST.stash.splice(SSEL,1)[0];if(it.cat==='med')H.inv.meds.push(it);else if(it.cat==='battery')H.inv.bats.push(it);else if(it.cat==='grenade')H.inv.grens.push(it);else H.inv.ammo[it.kind]+=it.count;SSEL=-1;after()});
  b('sDis',()=>{const it=ST.stash.splice(SSEL,1)[0];const g={bolts:rnd([1,3])+it.rar};
    if(it.cat==='ranged')Object.assign(g,{spring:rnd([1,2]),sheet:it.rar>=2?1:0});
    if(it.cat==='melee')Object.assign(g,{sheet:rnd([0,1]),tape:1});
    if(it.cat==='implant')Object.assign(g,{wire:rnd([1,2]),chip:1+Math.floor(it.rar/2),cpu:Math.random()<.1+.12*it.rar?1:0});
    if(it.cat==='armor')Object.assign(g,{sheet:rnd([1,2])+(it.rar>1?1:0),tape:1});
    if(it.cat==='clothes')Object.assign(g,{junk:rnd([1,3]),bandage:1});
    for(const m in g)if(g[m])ST.mats[m]+=g[m];
    log('Разобрано: '+Object.entries(g).filter(([m,n])=>n).map(([m,n])=>`${MATS[m].n} ×${n}`).join(', '),'#e0c070');SSEL=-1;after()});
  b('sBest',()=>{let ch=0;for(let i=ST.stash.length-1;i>=0;i--){const it=ST.stash[i];if(!['melee','ranged','armor','clothes','implant'].includes(it.cat))continue;const old=equipIfBetter(it);if(old!==it){ST.stash.splice(i,1);if(old)ST.stash.push(old);ch++}}
    log(ch?`Обновлено снаряжения: ${ch}`:'Лучшее уже надето','#7dff4f');after()});
  function after(){recalc(H);rebuildSprites(H);saveGame();updateHUD();stashPanel()}
  bindOv();
}
// ---------- trade ----------
let TTAB='sell',TSEL=-1;
const sellMul=()=>ST.base.light>=2?1.1:1;
const compBuy=k=>Math.round(MATS[k].price*2.5+(k==='fuel'?15:0));
function tradePanelBase(){
  const tabs=`<div class="tabs"><button class="tab ${TTAB==='sell'?'on':''}" data-t="sell">Продать</button><button class="tab ${TTAB==='buy'?'on':''}" data-t="buy">Купить</button><button class="tab ${TTAB==='hire'?'on':''}" data-t="hire">Наём</button></div>`;
  let body='';
  if(TTAB==='sell'){
    const owned=MAT_KEYS.filter(k=>ST.mats[k]>0);
    body=`<div class="sect">КОМПОНЕНТЫ${sellMul()>1?' (+10% за неон)':''}</div>`+(owned.map(m=>`<div class="trow"><img src="${MAT_ICON[m].toDataURL()}"><span>${MATS[m].n} ×${ST.mats[m]}<br><small class="t${MATS[m].t}c">${TIER_N[MATS[m].t]}</small></span><b>${Math.round(MATS[m].price*sellMul())}₵</b><button class="btn sm" data-sm="${m}">1</button><button class="btn sm" data-sa="${m}">Все</button></div>`).join('')||'<p>Компонентов нет</p>')+
      `<div class="sect">ПРЕДМЕТЫ</div>`;
    const sel=ST.stash[TSEL];
    if(sel)body+=`<div class="det sm"><img src="${iconURL(sel)}"><div><div class="nm" style="color:${RAR[sel.rar].c}">${sel.name}</div><p>${sel.lines.join(' · ')}</p><button class="btn sm" id="tSell">Продать за ${Math.round(sellPrice(sel)*sellMul())}₵</button></div></div>`;
    body+=`<div class="agrid">${ST.stash.map((it,i)=>`<button class="cell ${i===TSEL?'on':''}" data-i="${i}" style="--rc:${RAR[it.rar].c}"><img src="${iconURL(it)}"><em>${Math.round(sellPrice(it)*sellMul())}</em></button>`).join('')||'<p>Ящик пуст</p>'}</div>`;
  } else {
    const stock=shopStock();
    body=`<div class="sect">РАСХОДНИКИ</div>`+SHOP_FIX.map((f,i)=>`<div class="trow"><span>${f.n}</span><b>${f.p}₵</b><button class="btn sm" data-bf="${i}" ${ST.credits>=f.p?'':'disabled'}>Купить</button></div>`).join('')+
      `<div class="sect">КОМПОНЕНТЫ (только обычные — редкие добываются в рейдах)</div>`+MAT_KEYS.filter(k=>MATS[k].buy).map(k=>`<div class="trow"><img src="${MAT_ICON[k].toDataURL()}"><span>${MATS[k].n} <small>(есть ${ST.mats[k]||0})</small></span><b>${compBuy(k)}₵</b><button class="btn sm" data-bc="${k}" ${ST.credits>=compBuy(k)?'':'disabled'}>Купить</button></div>`).join('')+
      `<div class="sect">ВИТРИНА (обновляется после рейда)</div>`;
    const sel=stock[TSEL];
    if(sel&&!ST.shopBought.includes(TSEL))body+=`<div class="det sm"><img src="${iconURL(sel)}"><div><div class="nm" style="color:${RAR[sel.rar].c}">${sel.name}</div><p>${CAT_N[sel.cat]} · ${RAR[sel.rar].n} · ур. ${sel.lvl}<br>${sel.lines.join(' · ')}</p><button class="btn sm" id="tBuy" ${ST.credits>=buyPrice(sel)?'':'disabled'}>Купить за ${buyPrice(sel)}₵</button></div></div>`;
    body+=`<div class="agrid">${stock.map((it,i)=>ST.shopBought.includes(i)?`<div class="cell sold">продано</div>`:`<button class="cell ${i===TSEL?'on':''}" data-i="${i}" style="--rc:${RAR[it.rar].c}"><img src="${iconURL(it)}"><em>${buyPrice(it)}</em></button>`).join('')}</div>`;
  }
  showOv(`<h2>ТОРГОВЫЙ ТЕРМИНАЛ</h2><p class="cr">Кредиты: <b>${ST.credits}₵</b></p>${tabs}${body}<div class="row"><button class="btn" id="oClose">Закрыть</button></div>`,true);
  document.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{TTAB=b.dataset.t;TSEL=-1;tradePanel()});
  document.querySelectorAll('.cell[data-i]').forEach(b=>b.onclick=()=>{TSEL=+b.dataset.i;tradePanel()});
  document.querySelectorAll('[data-sm]').forEach(b=>b.onclick=()=>{const m=b.dataset.sm;if(ST.mats[m]>0){ST.mats[m]--;ST.credits+=Math.round(MATS[m].price*sellMul())}fin()});
  document.querySelectorAll('[data-sa]').forEach(b=>b.onclick=()=>{const m=b.dataset.sa;ST.credits+=Math.round(MATS[m].price*sellMul())*(ST.mats[m]||0);ST.mats[m]=0;fin()});
  document.querySelectorAll('[data-bc]').forEach(b=>b.onclick=()=>{const k=b.dataset.bc,p=compBuy(k);if(ST.credits<p)return;ST.credits-=p;ST.mats[k]++;fin()});
  document.querySelectorAll('[data-bf]').forEach(b=>b.onclick=()=>{const f=SHOP_FIX[+b.dataset.bf];if(ST.credits<f.p)return;ST.credits-=f.p;const L=Math.max(1,ST.maxDepth);
    if(f.cat==='grenade')H.inv.grens.push(makeItem(rseed(),'grenade',L,{rar:0}));else if(f.cat==='med')H.inv.meds.push(makeItem(rseed(),'med',L,{rar:0,kind:'аптечка'}));else if(f.cat==='battery')H.inv.bats.push(makeItem(rseed(),'battery',L,{rar:1}));else H.inv.ammo[f.ammo]+=f.cnt;log(`Куплено: ${f.n}`,'#7dff4f');fin()});
  const ts=$('tSell');if(ts)ts.onclick=()=>{const it=ST.stash.splice(TSEL,1)[0];const p=Math.round(sellPrice(it)*sellMul());ST.credits+=p;log(`Продано: ${it.name} (+${p}₵)`,'#f9f871');TSEL=-1;fin()};
  const tb=$('tBuy');if(tb)tb.onclick=()=>{const it=shopStock()[TSEL];const p=buyPrice(it);if(ST.credits<p)return;if(ST.stash.length>=stashCap()){log('Ящик полон','#ffb04a');return}
    ST.credits-=p;ST.stash.push(it);ST.shopBought.push(TSEL);log(`Куплено: ${it.name} → в ящик`,'#7dff4f');TSEL=-1;fin()};
  function fin(){saveGame();updateHUD();tradePanel()}
  bindOv();
}
// ---------- raid start / end with power, fuel, construction ----------
function startRaid(){
  if(!H)return;if(H.dead){TTAB='hire';return tradePanel()}if(!H.inv.grens)H.inv.grens=[];
  const L=Math.max(1,ST.maxDepth),pw=powered();const sup=[];
  if(pw&&ST.base.med){for(let i=0;i<ST.base.med;i++)H.inv.meds.push(makeItem(rseed(),'med',L,{rar:ST.base.med>1?1:0}));sup.push(`+${ST.base.med} аптечки`)}
  if(pw&&ST.base.wrack>=2){H.inv.ammo['пули']+=12;H.inv.ammo['дробь']+=4;H.inv.ammo['энергия']+=6;sup.push('патроны')}
  recalc(H);
  G={p:H,floor:Math.max(0,(typeof RAID_FROM!=='undefined'?RAID_FROM:1)-1),biome:null,kills:0,mode:{goal:'explore',stance:'fight'},speed:G0speed,cool:.3,turn:0,dead:false,deadT:0,paused:false,
    floats:[],fx:[],cam:{x:0,y:0},descend:0,exitTo:null,time:0,buf:null,camo:0,haste:0,shield:0,shieldT:0,uid:1,
    pack:{items:(H.bag||[]).splice(0),mats:Object.assign({},H.bagMats||{})},idle:0,looted:0,lvl0:H.lvl,xpGain:0};H.bagMats={};
  MODE='raid';hideOv();setModeUI();newFloor();updateHUD();updateSlots();
  if(sup.length)log('База выдала: '+sup.join(', '),'#7dff4f');
  else if(needsPower()&&!pw)log('Убежище без питания — модули не работают','#ffb04a');
}
function endRaid(success){
  const P=H,pk=G.pack;MODE='base';const lines=[],base=[];const trophy={cr:success?(pk.cr|0):0,crLost:success?0:(pk.cr|0),items:pk.items.slice(),mats:{...pk.mats},xp:Math.round(G.xpGain||0),lv0:G.lvl0||P.lvl,kills:G.kills,floor:G.floor,looted:G.looted};
  {const S=P.stats||(P.stats={raids:0,earned:0,kills:0,turns:0,deep:0,born:Date.now()});S.turns+=G.turn;S.deep=Math.max(S.deep,G.floor);
   if(success){S.raids++;let v=0;for(const m in pk.mats)v+=MATS[m].price*pk.mats[m];for(const it of pk.items)v+=sellPrice(it);S.earned+=v}}
  if(success){ST.credits+=pk.cr|0;
    for(const m in pk.mats){ST.mats[m]=(ST.mats[m]||0)+pk.mats[m];lines.push(`<span style="color:${MATS[m].c}">${MATS[m].n} ×${pk.mats[m]}</span>`)}
    let sold=0;for(const it of pk.items){if(ST.stash.length<stashCap()){ST.stash.push(it);lines.push(`<span style="color:${RAR[it.rar].c}">${it.name}</span>`)}else{const p=sellPrice(it);ST.credits+=p;sold+=p}}
    if(sold)lines.push(`Ящик полон — лишнее продано за ${sold}₵`);
  } else if(HARDCORE){ST.deaths++;heroDies(P);
  } else {ST.deaths++;P.hp=Math.max(1,Math.round(P.st.mhp*.25));
    const lost=P.inv.meds.length+P.inv.bats.length+(P.inv.grens||[]).length;P.inv.meds=[];P.inv.bats=[];P.inv.grens=[];const la=Object.values(P.inv.ammo).reduce((a,b)=>a+b,0);P.inv.ammo={'пули':0,'дробь':0,'энергия':0};
    if(lost||la)lines.push(`Потеряно из сумки: расходников ${lost}, патронов ${la}`)}
  // hideout tick: production, fuel, construction (runs whether the raid succeeded or not)
  if(typeof ensureFuel==='function')ensureFuel(base);
  const pw=powered();
  if(pw&&ST.base.farm&&ST.gpus){const c=20*ST.gpus;ST.credits+=c;base.push(`Майнинг-ферма: +${c}₵`)}
  if(ST.base.gen&&needsPower()){fuelTick();base.push(`Генератор: в баке ${fuelTxt(ST.fuelU)} ед. — хватит на ${hoursTxt(fuelHours())}`)}
  if(ST.building){ST.building.left--;if(ST.building.left<=0){const b=ST.building;ST.base[b.k]=b.lvl;base.push(`Стройка завершена: ${UP[b.k].n} — ${UP[b.k].lv[b.lvl]}`);ST.building=null}
    else base.push(`Стройка: ${UP[ST.building.k].n}, осталось ${ST.building.left} рейд.`)}
  ST.raids++;ST.buff=null;recalc(P);ST.shopSeed=rseed();ST.shopBought=[];P.cds=[0,0];
  enterBase();
  const head=success?'<h2 class="rhead ok">РЕЙД ЗАВЕРШЁН УСПЕШНО</h2>':'<h2 class="rhead bad">РЕЙД ПРОВАЛЕН</h2>';
  if(!success&&HARDCORE){ST.raids++;ST.recSeed=rseed();ST.recTaken=[];saveGame();return deathScreen()}
  const nItems=trophy.items.length,nMats=Object.values(trophy.mats).reduce((a,b)=>a+b,0),ups=P.lvl-trophy.lv0;
  let val=0;for(const m in trophy.mats)val+=MATS[m].price*trophy.mats[m];for(const it of trophy.items)val+=sellPrice(it);
  const stat=(n,l,c='')=>`<div class="rstat ${c}"><b>${n}</b><small>${l}</small></div>`;
  const stats=`<div class="rstats">${stat(trophy.kills,'убито врагов')}${stat(nItems+nMats,'найдено предметов')}${stat('+'+trophy.xp,'получено опыта','xp')}${stat(trophy.floor,'глубина')}${success?stat('+'+trophy.cr+'₵','кредиты','gold')+stat(val+'₵','ценность добычи','gold'):''}</div>`;
  const xpb=`<div class="rxp"><span>ур. ${P.lvl}${ups>0?` <em>▲ +${ups} ${ups>1?'уровня':'уровень'}</em>`:''}</span><div class="xpbar"><i style="width:${Math.min(100,P.xp/(6+P.lvl*2)*100)}%"></i></div><small>${Math.floor(P.xp)}/${6+P.lvl*2} опыта</small></div>`;
  let k=0;const tile=(img,rc,cnt,title)=>`<div class="rtro" style="--rc:${rc};animation-delay:${(k++)*45}ms" title="${title}"><img src="${img}">${cnt?`<em>${cnt}</em>`:''}</div>`;
  const tro=success?(trophy.cr?tile(CASH_ICON.toDataURL(),'#f9d030',trophy.cr+'₵','Кредиты'):'')+trophy.items.map(it=>tile(iconURL(it),RAR[it.rar].c,'',it.name)).join('')+Object.entries(trophy.mats).map(([m,n])=>tile(MAT_ICON[m].toDataURL(),MATS[m].c,'×'+n,MATS[m].n)).join(''):'';
  const body=success?`${stats}${xpb}<div class="sect">ТРОФЕИ</div>${tro?`<div class="rtros">${tro}</div>`:'<p>Ничего не вынесено</p>'}${lines.filter(l=>/₵/.test(l)).length?`<p>${lines.filter(l=>/₵/.test(l)).join('<br>')}</p>`:''}`
    :`${stats}${xpb}<p>Эвакуационный дрон вытащил героя на базу. Рюкзак и содержимое сумки потеряны, надетое снаряжение уцелело.${trophy.crLost?` Потеряно кредитов: ${trophy.crLost}₵.`:''}</p><p>${lines.join('<br>')}</p><p>Отдохните на кровати перед новым рейдом.</p>`;
  showOv(`${head}${body}${base.length?`<div class="sect">УБЕЖИЩЕ</div><p>${base.join('<br>')}</p>`:''}<div class="row"><button class="btn" id="oClose">На базу</button></div>`);bindOv();
  saveGame();
}
const BPOS={bed:[2,2],crate:[4,2],terminal:[7,2],med:[10,2],wrack:[12,2],gen:[12,7],bench:[12,5],recycler:[2,8],farm:[[2,5],[3,5],[2,6]]};
function enterBase(){
  MODE='base';migrateST();
  const W=15,Hh=12,t=new Uint8Array(W*Hh).fill(2),room=new Uint8Array(W*Hh).fill(1);
  for(let y=2;y<=9;y++)for(let x=1;x<=13;x++)t[y*W+x]=1;t[10*W+7]=1;
  const M={W,H:Hh,t,room,seed:777,biome:'base',exit:{x:7,y:10},evac:null,rooms:[]};
  const baked=renderMap(M);
  const objs=[];const add=(kind,x,y,spr,lv)=>{objs.push({kind,x,y,spr,lv});t[y*W+x]=4};
  const b=ST.base,pw=powered();
  add('bed',...BPOS.bed,baseSprite('bed',b.bed),b.bed);
  add('crate',...BPOS.crate,baseSprite('crate',b.crate),b.crate);
  add('terminal',...BPOS.terminal,baseSprite('terminal',1),1);
  for(const k of['med','wrack','gen','bench','recycler'])if(b[k])add(k,...BPOS[k],baseSprite(k,b[k]),b[k]);
  for(let i=0;i<b.farm;i++)add('farm',...BPOS.farm[i],makeProp(1000+i*17,'rack').spr,b.farm);
  if(ST.building&&!b[ST.building.k]&&BPOS[ST.building.k]){const p=Array.isArray(BPOS[ST.building.k][0])?BPOS[ST.building.k][0]:BPOS[ST.building.k];
    objs.push({kind:ST.building.k,x:p[0],y:p[1],spr:pixGrid(16,20,P=>{for(let y=8;y<20;y++)for(let x=1;x<15;x++)if((x+y)%4===0||y===8||y===19)P(x,y,(x+y)%8<4?'#f9d030':'#14161c')}),lv:0,site:1});t[p[1]*W+p[0]]=4}
  const neons=[],lights=[{x:7.5,y:5,c:[255,190,120],rad:9,int:b.light&&pw?.75:.45,kind:'win'}];
  if(b.light>=1&&pw){lights.push({x:3,y:3,c:[255,210,140],rad:5,int:.5,kind:'win'},{x:12,y:3,c:[255,210,140],rad:5,int:.5,kind:'win'})}
  if(b.light>=2&&pw){const pts=[];[[0,0],[0,1],[0,2],[1,0],[2,0],[2,1],[2,2],[4,0],[4,1],[4,2],[5,2],[6,0],[6,1],[6,2],[8,0],[8,1],[8,2],[9,1],[10,0],[10,1],[10,2]].forEach(([x,y])=>pts.push([3+x,5+y]));pts.splice(0,pts.length,...neonPts(pts));
    neons.push({x:5,y:1,col:'#ff2fa8',pts,ph:1},{x:9,y:1,col:'#22e6ff',pts:makeSign(RNG(5)),ph:4});
    lights.push({x:5.5,y:2.3,c:[255,47,168],rad:5,int:.8,kind:'neon',ref:neons[0]},{x:9.5,y:2.3,c:[34,230,255],rad:5,int:.7,kind:'neon',ref:neons[1]})}
  lights.push({x:7.5,y:3,c:[255,47,168],rad:3,int:.5,kind:'win'});
  BS={M,mapC:baked.c,objs,neons,lights,hero:{x:7,y:8,rx:7,ry:8},path:[],pending:null,cool:0,time:BS?BS.time:0,cam:{x:7*TS+8,y:6*TS+8},dark:!pw&&needsPower()};
  H.x=H.rx=13;H.y=H.ry=9;H.face=-1;
  setModeUI();updateHUD();
}
function baseWalkTo(kind){openBasePanel(kind)}
function updateHUD(){
  if(!H)return;const P=H;document.body.classList.toggle('nohero',!!H.dead&&MODE==='base');{const d=document.querySelector('[data-base="door"]');if(d)d.style.display=H.dead?'none':''}
  $('hpf').style.width=(P.hp/P.st.mhp*100)+'%';$('hpt').textContent=`${P.hp}/${P.st.mhp}`;
  $('mpf').style.width=(P.mp/P.st.mmp*100)+'%';$('mpt').textContent=`${P.mp}/${P.st.mmp}`;
  if(MODE==='base'){
    const total=MAT_KEYS.reduce((s,k)=>s+(ST.mats[k]||0),0),pw=powered();
    $('fl').textContent='УБЕЖИЩЕ';$('biome').textContent='';$('foes').textContent=`${ST.credits}₵`;
    $('winfo').innerHTML=`<span style="color:#f9f871">${H.name}</span> · ур. ${H.lvl} · рейдов ${ST.raids} · рекорд ${ST.maxDepth}<br><span class="st">компонентов ${total} · предметов ${ST.stash.length}/${stashCap()}</span><br>`+
      `<span class="st">⚡ ${ST.base.gen?(pw?`питание есть, топлива на ${hoursTxt(fuelHours())}`:'<span style="color:#ff6a7a">нет топлива</span>'):'генератора нет'}${ST.building?` · <span style="color:#ffb04a">строится ${UP[ST.building.k].n} (${ST.building.left})</span>`:''}</span>`;
    $('lowhp').style.opacity=0;return;
  }
  $('fl').textContent='ЭТАЖ '+G.floor;$('biome').textContent=BIOMES[G.biome].name;
  $('foes').textContent=`враги ${G.en.filter(e=>!e.dead).length}`;
  const w=P.eq.ranged;
  $('winfo').innerHTML=`<span style="color:${P.eq.melee?RAR[P.eq.melee.rar].c:'#b9ad95'}">⚔ ${P.eq.melee?P.eq.melee.name:'кулаки'}</span>${P.eq.melee?` <b style="color:${condCol(cond(P.eq.melee))}">${Math.round(cond(P.eq.melee)*100)}%</b>`:''}<br>`+
    (w?`<span style="color:${RAR[w.rar].c}">➶ ${w.name}</span> <b>${w.clip}/${w.mag}</b> +${P.inv.ammo[w.ammo]} ${w.ammo} <b style="color:${condCol(cond(w))}">${Math.round(cond(w)*100)}%</b>`:'➶ —')+
    `<br><span class="st">${G.manual?'<b style="color:#ff7ad8">✋ РУЧНОЕ</b> · ':''}рюкзак <b>${packW()}/${capacity()}</b>${G.pack.cr?` · <b style="color:#f9d030">${G.pack.cr}₵</b>`:''}${[G.shield>0?`щит ${G.shield}`:'',G.camo>0?`камуфляж ${tsec(G.camo)}`:'',G.haste>0?`ускорение ${tsec(G.haste)}`:'',`защ ${P.st.def}`,`убито ${G.kills}`,MODE==='raid'?`угроза ${G.threat||'-'}`:''].filter(Boolean).map(s=>' · '+s).join('')}</span>`;
  const gl={explore:['РАЗВЕДКА<br>◎','c1'],deeper:['ГЛУБЖЕ<br>↓','c5'],home:['ДОМОЙ<br>⌂','c2']}[G.mode.goal];
  $('bGoal').innerHTML=gl[0];$('bGoal').className='btn mode '+gl[1];
  $('bStance').innerHTML=G.mode.stance==='fight'?'В БОЙ<br>⚔':'БЕЖАТЬ<br>»';$('bStance').className='btn mode '+(G.mode.stance==='fight'?'c3':'c4');
  $('bSpeed').textContent=G.speed+'×';
  $('lowhp').style.opacity=P.hp<P.st.mhp*.3&&!G.dead?1:0;
}

// ---------- loadout: what to wear and take into the raid ----------
let LSEL='melee';
const ROUTE=[['sewer','Канализация'],['alley','Подворотни'],['streets','Улицы'],['server','Серверная (верх)'],['core','Серверная (низ) ∞']];
function slotCands(k){
  if(k.startsWith('act'))return ST.stash.filter(i=>i.cat==='implant'&&i.t==='act');
  if(k.startsWith('pas'))return ST.stash.filter(i=>i.cat==='implant'&&i.t==='pas');
  return ST.stash.filter(i=>i.cat===k);
}
function setSlot(k,it){
  let old;
  if(k.startsWith('act')||k.startsWith('pas')){const arr=k.startsWith('act')?H.eq.act:H.eq.pas,i=+k[3];old=arr[i];arr[i]=it}
  else{old=H.eq[k];H.eq[k]=it}
  return old;
}
function loadoutPanel(){
  const P=H;
  const cells=SLOT_DEF.map(([k,n])=>{const it=slotItem(k);const c=slotCands(k).length;
    return`<button class="scell ${LSEL===k?'on':''}" data-ls="${k}" style="--rc:${it?RAR[it.rar].c:'#2e2748'}">${it?`<img src="${iconURL(it)}">`:'<span class="ph">—</span>'}${c?`<em class="en">+${c}</em>`:''}<small>${n}</small></button>`}).join('');
  const cur=slotItem(LSEL),cands=slotCands(LSEL).sort((a,b)=>score(b,H)-score(a,H));
  const candH=cands.map(it=>{const better=!cur||score(it,H)>score(cur,H);return`<div class="trow"><img src="${iconURL(it)}"><span style="color:${RAR[it.rar].c}">${it.name}<br><small>${it.lines.join(' · ')}</small></span>${better?'<i class="up">▲</i>':''}<button class="btn sm" data-eqi="${ST.stash.indexOf(it)}">Надеть</button></div>`}).join('');
  const stMeds=ST.stash.filter(i=>i.cat==='med'),stBats=ST.stash.filter(i=>i.cat==='battery');
  const row=(lbl,icon,bag,box,kind)=>`<div class="lrow"><img src="${icon}"><span>${lbl}</span><button class="btn sm" data-lo="${kind}:-1" ${bag?'':'disabled'}>−</button><b>${bag}</b><small>в сумке</small><button class="btn sm" data-lo="${kind}:1" ${box?'':'disabled'}>+</button><i>в ящике ${box}</i></div>`;
  const amRow=k=>`<div class="lrow"><span class="am">${k}</span><button class="btn sm" data-am="${k}:-10" ${P.inv.ammo[k]?'':'disabled'}>−10</button><b>${P.inv.ammo[k]}</b><small>в сумке</small><button class="btn sm" data-am="${k}:10" ${ST.ammo[k]?'':'disabled'}>+10</button><i>в ящике ${ST.ammo[k]}</i></div>`;
  const hpW=P.hp<P.st.mhp*.6?'<p class="rec" style="color:#ff6a7a">Герой ранен — отдохните на кровати перед выходом.</p>':'';
  showOv(`<h2>СБОРЫ В РЕЙД</h2>
  <div class="hp-head"><img src="${heroCanvasURL()}"><div class="hp-info"><div class="nm">${P.name} <span class="lvl">ур. ${P.lvl}</span></div>${bar(P.hp,P.st.mhp,'linear-gradient(90deg,#a82a4e,#ff4b6a)')}${bar(P.mp,P.st.mmp,'linear-gradient(90deg,#1f4fb8,#22b6ff)')}<p>защ ${P.st.def} · уклон ${Math.round(P.st.dodge*100)}% · рюкзак ${capacity()}</p></div></div>${hpW}
  <div class="sect">СНАРЯЖЕНИЕ <small>(+N — есть замена в ящике)</small></div><div class="slots8">${cells}</div>
  ${itemDet(cur)}${cur?`<div class="row"><button class="btn sm" id="lOff">Снять в ящик</button><button class="btn sm" id="lBest">Надеть лучшее везде</button></div>`:`<div class="row"><button class="btn sm" id="lBest">Надеть лучшее везде</button></div>`}
  <div class="cands">${candH||'<p>В ящике нет подходящих предметов</p>'}</div>
  <div class="sect">СУМКА — БЕРЁМ С СОБОЙ <small>(при гибели теряется)</small></div>
  ${row('Аптечки',iconURL(P.inv.meds[0]||stMeds[0]||{id:'mph',icon:MEDPH}),P.inv.meds.length,stMeds.length,'med')}
  ${row('Батареи',iconURL(P.inv.bats[0]||stBats[0]||{id:'bph',icon:BATPH}),P.inv.bats.length,stBats.length,'bat')}
  ${amRow('пули')}${amRow('дробь')}${amRow('энергия')}
  <div class="sect">МАРШРУТ</div><div class="route">${ROUTE.map(([k,n],i)=>`<span class="${i<ST.maxDepth?'done':''}">${i+1}${i===4?'+':''}. ${n}</span>`).join('<i>→</i>')}</div>
  <div class="row"><button class="btn go" id="lGo">НАЧАТЬ РЕЙД</button><button class="btn" id="oClose">Остаться</button></div>`,true);
  document.querySelectorAll('[data-ls]').forEach(b=>b.onclick=()=>{LSEL=b.dataset.ls;loadoutPanel()});
  document.querySelectorAll('[data-eqi]').forEach(b=>b.onclick=()=>{const it=ST.stash.splice(+b.dataset.eqi,1)[0];const old=setSlot(LSEL,it);if(old)ST.stash.push(old);fin()});
  document.querySelectorAll('[data-lo]').forEach(b=>b.onclick=()=>{const[k,d]=b.dataset.lo.split(':');const cat=k==='med'?'med':'battery',arr=k==='med'?P.inv.meds:P.inv.bats;
    if(+d>0){const i=ST.stash.findIndex(x=>x.cat===cat);if(i>=0)arr.push(ST.stash.splice(i,1)[0])}
    else{if(ST.stash.length>=stashCap()){log('Ящик полон','#ffb04a');return}arr.sort((a,b)=>(a.heal||a.energy)-(b.heal||b.energy));const it=arr.shift();if(it)ST.stash.push(it)}fin()});
  document.querySelectorAll('[data-am]').forEach(b=>b.onclick=()=>{const[k,d]=b.dataset.am.split(':');const n=+d;
    if(n>0){const t=Math.min(n,ST.ammo[k]);ST.ammo[k]-=t;P.inv.ammo[k]+=t}else{const t=Math.min(-n,P.inv.ammo[k]);P.inv.ammo[k]-=t;ST.ammo[k]+=t}fin()});
  const on=(id,f)=>{const e=$(id);if(e)e.onclick=f};
  on('lOff',()=>{if(ST.stash.length>=stashCap()){log('Ящик полон','#ffb04a');return}const old=setSlot(LSEL,null);if(old)ST.stash.push(old);fin()});
  on('lBest',()=>{for(let i=ST.stash.length-1;i>=0;i--){const it=ST.stash[i];if(!['melee','ranged','armor','clothes','implant'].includes(it.cat))continue;const old=equipIfBetter(it);if(old!==it){ST.stash.splice(i,1);if(old)ST.stash.push(old)}}fin()});
  on('lGo',()=>startRaid());
  function fin(){recalc(H);rebuildSprites(H);saveGame();updateHUD();loadoutPanel()}
  bindOv();
}

// ---------- compact loadout (no scrolling) ----------
function loadoutPanel(){
  const P=H;
  const cells=SLOT_DEF.map(([k,n])=>{const it=slotItem(k);const c=slotCands(k).length;
    return`<button class="scell ${LSEL===k?'on':''}" data-ls="${k}" style="--rc:${it?RAR[it.rar].c:'#2e2748'}" title="${n}">${it?`<img src="${iconURL(it)}">`:'<span class="ph">—</span>'}${c?`<em class="en">+${c}</em>`:''}<small>${n}</small></button>`}).join('');
  const cur=slotItem(LSEL),cands=slotCands(LSEL).sort((a,b)=>score(b,H)-score(a,H));
  const candH=cands.map(it=>{const better=!cur||score(it,H)>score(cur,H);return`<button class="ccell" data-eqi="${ST.stash.indexOf(it)}" style="--rc:${RAR[it.rar].c}" title="${it.name}: ${it.lines.join(', ')}"><img src="${iconURL(it)}">${better?'<i>▲</i>':''}</button>`}).join('');
  const stMeds=ST.stash.filter(i=>i.cat==='med'),stBats=ST.stash.filter(i=>i.cat==='battery'),stGr=ST.stash.filter(i=>i.cat==='grenade');if(!P.inv.grens)P.inv.grens=[];
  const cc=(lbl,icon,bag,box,minus,plus,step)=>`<div class="lc">${icon?`<img src="${icon}">`:`<span class="am">${lbl}</span>`}<b>${bag}</b><small>ящик ${box}</small><div><button class="btn sm" data-x="${minus}" ${bag?'':'disabled'}>−${step||''}</button><button class="btn sm" data-x="${plus}" ${box?'':'disabled'}>+${step||''}</button></div></div>`;
  const slotName=(SLOT_DEF.find(s=>s[0]===LSEL)||[0,''])[1];
  showOv(`<div class="lo">
  <div class="lo-top"><img class="lo-hero" src="${heroCanvasURL()}"><div class="lo-info"><div class="nm">${P.name} <span class="lvl">ур. ${P.lvl}</span></div>
    ${bar(P.hp,P.st.mhp,'linear-gradient(90deg,#a82a4e,#ff4b6a)')}${bar(P.mp,P.st.mmp,'linear-gradient(90deg,#1f4fb8,#22b6ff)')}
    ${attrHTML(true)}<p>защ ${P.st.def} · уклон ${Math.round(P.st.dodge*100)}% · рюкзак ${capacity()}</p>${P.hp<P.st.mhp*.6?'<p style="color:#ff6a7a">ранен — отдохните</p>':''}</div>
    <div class="lo-slots">${cells}</div></div>
  <div class="lo-sel"><span class="lb">${slotName}:</span> ${cur?`<b style="color:${RAR[cur.rar].c}">${cur.name}</b> <small>${cur.lines.join(' · ')}</small>`:'<small>пусто</small>'}</div>
  <div class="lo-cands">${candH||'<small>в ящике нет замены</small>'}<span class="sp"></span>${cur?'<button class="btn sm" id="lOff">Снять</button>':''}<button class="btn sm" id="lBest">Лучшее</button></div>
  <div class="sect">СУМКА <small>(при гибели теряется)</small></div>
  <div class="lo-cons">
    ${cc('Аптечки',iconURL(P.inv.meds[0]||stMeds[0]||{id:'mph',icon:MEDPH}),P.inv.meds.length,stMeds.length,'med:-1','med:1')}
    ${cc('Батареи',iconURL(P.inv.bats[0]||stBats[0]||{id:'bph',icon:BATPH}),P.inv.bats.length,stBats.length,'bat:-1','bat:1')}
    ${cc('Гранаты',iconURL((P.inv.grens||[])[0]||stGr[0]||{id:'gph',icon:GRPH()}),(P.inv.grens||[]).length,stGr.length,'gr:-1','gr:1')}
    ${['пули','дробь','энергия'].map(k=>cc(k,null,P.inv.ammo[k],ST.ammo[k],`am:${k}:-10`,`am:${k}:10`,10)).join('')}
  </div>
  <div class="lo-go"><div class="route">${ROUTE.map(([k,n],i)=>`<span class="${i<ST.maxDepth?'done':''}">${i+1}${i===4?'+':''}.${n.split(' ')[0]}</span>`).join('<i>›</i>')}</div><button class="btn go" id="lGo">НАЧАТЬ РЕЙД</button></div>
  </div>`,true);
  document.querySelectorAll('[data-ls]').forEach(b=>b.onclick=()=>{LSEL=b.dataset.ls;loadoutPanel()});
  document.querySelectorAll('[data-eqi]').forEach(b=>b.onclick=()=>{const it=ST.stash.splice(+b.dataset.eqi,1)[0];const old=setSlot(LSEL,it);if(old)ST.stash.push(old);fin()});
  document.querySelectorAll('[data-x]').forEach(b=>b.onclick=()=>{const a=b.dataset.x.split(':');
    if(a[0]==='am'){const k=a[1],n=+a[2];if(n>0){const t=Math.min(n,ST.ammo[k]);ST.ammo[k]-=t;P.inv.ammo[k]+=t}else{const t=Math.min(-n,P.inv.ammo[k]);P.inv.ammo[k]-=t;ST.ammo[k]+=t}return fin()}
    const cat={med:'med',bat:'battery',gr:'grenade'}[a[0]],arr={med:P.inv.meds,bat:P.inv.bats,gr:P.inv.grens}[a[0]];
    if(+a[1]>0){const i=ST.stash.findIndex(x=>x.cat===cat);if(i>=0)arr.push(ST.stash.splice(i,1)[0])}
    else{if(ST.stash.length>=stashCap()){log('Ящик полон','#ffb04a');return}arr.sort((x,y)=>(x.heal||x.energy||0)-(y.heal||y.energy||0));const it=arr.shift();if(it)ST.stash.push(it)}fin()});
  const on=(id,f)=>{const e=$(id);if(e)e.onclick=f};
  on('lOff',()=>{if(ST.stash.length>=stashCap()){log('Ящик полон','#ffb04a');return}const old=setSlot(LSEL,null);if(old)ST.stash.push(old);fin()});
  on('lBest',()=>{for(let i=ST.stash.length-1;i>=0;i--){const it=ST.stash[i];if(!['melee','ranged','armor','clothes','implant'].includes(it.cat))continue;const old=equipIfBetter(it);if(old!==it){ST.stash.splice(i,1);if(old)ST.stash.push(old)}}fin()});
  bindAttr(loadoutPanel);
  on('lGo',()=>startRaid());
  function fin(){recalc(H);rebuildSprites(H);saveGame();updateHUD();loadoutPanel()}
  bindOv();
}
