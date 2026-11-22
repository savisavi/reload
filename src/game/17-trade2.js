// ================= TERMINAL v2: same tabs & grids as the chest =================
let TRS2={sell:null,buy:null};
const AM_SELL=.3;
function sellCells(){return stCells().map(c=>({...c,k:'sell'+c.k.slice(2),p:c.it?Math.round(sellPrice(c.it)*sellMul()):c.mat?Math.round(MATS[c.mat].price*sellMul()):Math.max(1,Math.round(c.n*AM_SELL))}))}
function buyCells(){const c=[];
  SHOP_FIX.forEach((f,i)=>{if(f.ammo)c.push({k:'buy:f:'+i,ammo:f.ammo,txt:AM_TXT[f.ammo],n:f.cnt,p:f.p,rc:'#ffd23f'});
    else c.push({k:'buy:f:'+i,cat:f.cat,icon:(f.cat==='med'?MEDPH:f.cat==='battery'?BATPH:GRPH()).toDataURL(),p:f.p,rc:RAR[0].c})});
  MAT_KEYS.filter(k=>MATS[k].buy).forEach(k=>c.push({k:'buy:m:'+k,mat:k,icon:MAT_ICON[k].toDataURL(),p:compBuy(k),rc:'#5a5378'}));
  shopStock().forEach((it,i)=>c.push({k:'buy:s:'+i,it,cat:it.cat,icon:iconURL(it),p:buyPrice(it),rc:RAR[it.rar].c,sold:ST.shopBought.includes(i)}));
  return c}
function tradeInfo(side){
  const k=TRS2[side];if(!k)return`<div class="det sm empty">${side==='sell'?'Выберите, что продать из ящика':'Выберите товар — покупки кладутся в ящик'}</div>`;
  const[,t,v]=k.split(':');const acts=[];let html='';
  if(side==='sell'){
    if(t==='i'){const it=ST.stash[+v];if(!it)return'';html=itemDet(it);acts.push(['tS',`Продать за ${Math.round(sellPrice(it)*sellMul())}₵`])}
    else if(t==='m'){const n=ST.mats[v]||0,pr=Math.round(MATS[v].price*sellMul());html=`<div class="det sm"><img src="${MAT_ICON[v].toDataURL()}"><div><div class="nm">${MATS[v].n} ×${n}</div><p>${TIER_N[MATS[v].t]} · ${pr}₵/шт</p></div></div>`;acts.push(['tS1',`Продать 1 (${pr}₵)`],['tSA',`Продать все (${pr*n}₵)`])}
    else if(t==='a'){const n=ST.ammo[v]||0;html=`<div class="det sm empty">Патроны «${v}» в ящике: ${n}</div>`;acts.push(['tS10',`Продать 10 (${Math.round(10*AM_SELL)}₵)`],['tSA',`Продать все (${Math.round(n*AM_SELL)}₵)`])}
  } else {
    if(t==='f'){const f=SHOP_FIX[+v];html=`<div class="det sm empty">${f.n} · ${f.p}₵</div>`;acts.push(['tB',`Купить за ${f.p}₵`])}
    else if(t==='m'){const pr=compBuy(v);html=`<div class="det sm"><img src="${MAT_ICON[v].toDataURL()}"><div><div class="nm">${MATS[v].n}</div><p>${pr}₵/шт · на складе ${ST.mats[v]||0}</p></div></div>`;acts.push(['tB',`Купить 1 (${pr}₵)`],['tB5',`Купить 5 (${pr*5}₵)`])}
    else if(t==='s'){const it=shopStock()[+v];html=itemDet(it);if(!ST.shopBought.includes(+v))acts.push(['tB',`Купить за ${buyPrice(it)}₵`]);else html+='<p class="rinfo">Продано</p>'}
  }
  return`<div class="hsel">${html}${acts.length?`<div class="hacts">${acts.map(([id,n])=>`<button class="btn sm" id="${id}">${n}</button>`).join('')}</div>`:''}</div>`;
}
function tradePanel(){
  if(TTAB==='hire')return hirePanel();
  const side=TTAB==='buy'?'buy':'sell';
  const tabs=`<div class="tabs"><button class="tab ${side==='sell'?'on':''}" data-t="sell">Продать</button><button class="tab ${side==='buy'?'on':''}" data-t="buy">Купить</button><button class="tab" data-t="hire">Наём</button></div>`;
  const cells=side==='sell'?sellCells():buyCells();
  const F=fitGrids(250,1,null);
  showOv(`<h2>ТЕРМИНАЛ</h2>${tabs}<div class="lsec"><div class="lh"><b>${side==='sell'?'ЯЩИК':'ВИТРИНА'}</b><span>${side==='sell'?`${ST.stash.length}/${stashCap()} предм.${sellMul()>1?' · +10% за неон':''}`:'обновляется после рейда'}</span></div>${gridHTML(side,cells,TRS2[side],F.rows)}</div>${tradeInfo(side)}`,true);
  $('panel').classList.add('fit');$('panel').style.setProperty('--cs',F.cs+'px');$('panel').style.setProperty('--cols',F.cols);
  document.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{TTAB=b.dataset.t;tradePanel()});
  document.querySelectorAll('[data-lt]').forEach(b=>b.onclick=()=>{const[s,k]=b.dataset.lt.split(':');LDT[s]=k;LDP[s]=0;tradePanel()});
  document.querySelectorAll('[data-lpg]').forEach(b=>b.onclick=()=>{const[s,d]=b.dataset.lpg.split(':');LDP[s]=Math.max(0,LDP[s]+ +d);tradePanel()});
  document.querySelectorAll('[data-lk]').forEach(b=>b.onclick=()=>{TRS2[side]=b.dataset.lk;tradePanel()});
  const on=(id,f)=>{const e=$(id);if(e)e.onclick=f};
  const fin=()=>{saveGame();updateHUD();tradePanel()};
  const k=TRS2[side]||'',[,t,v]=k.split(':');
  on('tS',()=>{const it=ST.stash.splice(+v,1)[0];if(!it)return;const p=Math.round(sellPrice(it)*sellMul());ST.credits+=p;log(`Продано: ${it.name} (+${p}₵)`,'#f9f871');TRS2.sell=null;fin()});
  on('tS1',()=>{if(ST.mats[v]>0){ST.mats[v]--;ST.credits+=Math.round(MATS[v].price*sellMul())}if(!ST.mats[v])TRS2.sell=null;fin()});
  on('tSA',()=>{if(t==='m'){ST.credits+=Math.round(MATS[v].price*sellMul())*(ST.mats[v]||0);ST.mats[v]=0}else{ST.credits+=Math.round((ST.ammo[v]||0)*AM_SELL);ST.ammo[v]=0}TRS2.sell=null;fin()});
  on('tS10',()=>{const n=Math.min(10,ST.ammo[v]||0);ST.ammo[v]-=n;ST.credits+=Math.round(n*AM_SELL);fin()});
  const buyFix=f=>{if(ST.credits<f.p)return false;const L=Math.max(1,ST.maxDepth);
    if(f.ammo){ST.ammo[f.ammo]=(ST.ammo[f.ammo]||0)+f.cnt}else{if(ST.stash.length>=stashCap()){log('Ящик полон','#ffb04a');return false}
      ST.stash.push(f.cat==='grenade'?makeItem(rseed(),'grenade',L,{rar:0}):f.cat==='med'?makeItem(rseed(),'med',L,{rar:0,kind:'аптечка'}):makeItem(rseed(),'battery',L,{rar:1}))}
    ST.credits-=f.p;return true};
  on('tB',()=>{if(t==='f'){if(buyFix(SHOP_FIX[+v]))log(`Куплено: ${SHOP_FIX[+v].n} → в ящик`,'#7dff4f')}
    else if(t==='m'){const p=compBuy(v);if(ST.credits>=p){ST.credits-=p;ST.mats[v]=(ST.mats[v]||0)+1}}
    else if(t==='s'){const it=shopStock()[+v],p=buyPrice(it);if(ST.credits<p)return log('Не хватает кредитов','#ffb04a');if(ST.stash.length>=stashCap())return log('Ящик полон','#ffb04a');ST.credits-=p;ST.stash.push(it);ST.shopBought.push(+v);log(`Куплено: ${it.name} → в ящик`,'#7dff4f')}
    fin()});
  on('tB5',()=>{const p=compBuy(v);const n=Math.min(5,Math.floor(ST.credits/p));if(n>0){ST.credits-=p*n;ST.mats[v]=(ST.mats[v]||0)+n}fin()});
  bindOv();
}
// one bottom bar → one panel, all docked into the same full-size frame
function openBasePanel(kind){
  if(kind==='crate'||kind==='door'){if(kind==='door'&&!alive()){TTAB='hire';return tradePanel()}return baseInvPanel()}
  if(kind==='terminal')return tradePanel();
  if(kind==='mercs')return mercsPanel();
  if(UP[kind])return modulePanel(kind);
  return buildPanel();
}
