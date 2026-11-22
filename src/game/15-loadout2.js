// ================= BASE LOADOUT: chest on top, mercenary below, drag & drop, tabs =================
const LTABS=[['all','Все'],['wpn','Оружие'],['cons','Расходники'],['mats','Ресурсы'],['ammo','Патроны'],['impl','Импланты'],['cloth','Одежда'],['armor','Броня'],['bp','Чертежи']];
const tabOf=c=>c.mat?'mats':c.ammo?'ammo':({melee:'wpn',ranged:'wpn',med:'cons',battery:'cons',grenade:'cons',implant:'impl',clothes:'cloth',armor:'armor',bp:'bp',rcp:'bp'}[c.cat]||'all');
let LDT={st:'all',bg:'all'},LDP={st:0,bg:0},LDSEL=null;
let LCOLS=8,LROWS=3;
// size the grids to the frame so nothing needs scrolling
function frameBox(){const W=Math.min(640,innerWidth-12)-22,H=innerHeight-48-80-(parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sab'))||0)-18;return{W,H}}
function fitGrids(fixed,grids,mercRowF){const{W,H}=frameBox();let cs=mercRowF?Math.min(46,Math.floor((W-210)/4)-3)&~1:46,rows=1;for(;cs>=26;cs-=2){const used=fixed+(mercRowF?mercRowF(cs):0);rows=Math.floor((H-used)/grids/(cs+3));if(rows>=2)break}rows=Math.max(1,Math.min(rows,8));const cols=Math.max(4,Math.floor((W-12)/(cs+3)));LCOLS=cols;return{cs,rows,cols}}
function bagInit(){if(!H.bag)H.bag=[];if(!H.bagMats)H.bagMats={};if(!ST.ammo)ST.ammo={'пули':0,'дробь':0,'энергия':0};if(!H.inv.grens)H.inv.grens=[]}
function bagW(){let w=0;for(const it of H.bag)w+=ITEM_W[it.cat]||1;for(const k in H.bagMats)w+=H.bagMats[k]*MATS[k].w;return w}
const AM_TXT={'пули':'•••','дробь':'∴','энергия':'⚡'};
function stCells(){const c=[];
  ST.stash.forEach((it,i)=>c.push({k:'st:i:'+i,it,cat:it.cat,icon:iconURL(it),rc:RAR[it.rar].c}));
  for(const m of MAT_KEYS)if(ST.mats[m]>0)c.push({k:'st:m:'+m,mat:m,icon:MAT_ICON[m].toDataURL(),n:ST.mats[m],rc:'#5a5378'});
  for(const a in ST.ammo)if(ST.ammo[a]>0)c.push({k:'st:a:'+a,ammo:a,txt:AM_TXT[a],n:ST.ammo[a],rc:'#ffd23f'});
  return c}
function bgCells(){const c=[],P=H;
  if(P.inv.meds.length)c.push({k:'bg:c:med',cat:'med',it:P.inv.meds[0],icon:iconURL(P.inv.meds[0]),n:P.inv.meds.length,rc:RAR[0].c});
  if(P.inv.bats.length)c.push({k:'bg:c:bat',cat:'battery',it:P.inv.bats[0],icon:iconURL(P.inv.bats[0]),n:P.inv.bats.length,rc:RAR[0].c});
  if(P.inv.grens.length)c.push({k:'bg:c:gren',cat:'grenade',it:P.inv.grens[0],icon:iconURL(P.inv.grens[0]),n:P.inv.grens.length,rc:RAR[P.inv.grens[0].rar].c});
  for(const a in P.inv.ammo)if(P.inv.ammo[a]>0)c.push({k:'bg:a:'+a,ammo:a,txt:AM_TXT[a],n:P.inv.ammo[a],rc:'#ffd23f'});
  H.bag.forEach((it,i)=>c.push({k:'bg:i:'+i,it,cat:it.cat,icon:iconURL(it),rc:RAR[it.rar].c}));
  for(const m of MAT_KEYS)if(H.bagMats[m]>0)c.push({k:'bg:m:'+m,mat:m,icon:MAT_ICON[m].toDataURL(),n:H.bagMats[m],rc:'#5a5378'});
  return c}
function gridHTML(side,cells,sel,rows){sel=sel===undefined?LDSEL:sel;if(LDT[side]==null){LDT[side]='all';LDP[side]=0}
  const tab=LDT[side],f=cells.filter(c=>tab==='all'||tabOf(c)===tab),per=LCOLS*(rows||LROWS),pages=Math.max(1,Math.ceil(f.length/per));LDP[side]=Math.min(LDP[side],pages-1);
  const pc=f.slice(LDP[side]*per,(LDP[side]+1)*per);
  const tabs=`<div class="ltabs">${LTABS.map(([k,n])=>{const cnt=k==='all'?cells.length:cells.filter(c=>tabOf(c)===k).length;return`<button class="lt ${tab===k?'on':''}" data-lt="${side}:${k}">${n}${cnt?`<i>${cnt}</i>`:''}</button>`}).join('')}</div>`;
  const grid=Array.from({length:per},(_,i)=>{const c=pc[i];if(!c)return`<div class="ic empty" data-drop="${side}"></div>`;
    return`<button class="ic ${sel===c.k?'on':''} ${c.sold?'sold':''}" data-lk="${c.k}" data-drop="${side}" style="--rc:${c.rc}">${c.icon?`<img src="${c.icon}" draggable="false">`:`<span class="tx">${c.txt}</span>`}${c.n?`<em>${c.n}</em>`:''}${c.p!=null?`<em class="pr">${c.p}₵</em>`:''}</button>`}).join('');
  const pg=pages>1?`<span class="lpg"><button class="lt" data-lpg="${side}:-1">◀</button>${LDP[side]+1}/${pages}<button class="lt" data-lpg="${side}:1">▶</button></span>`:'';
  return`${tabs.replace(/<\/div>$/,pg+'</div>')}<div class="igrid lg" data-drop="${side}">${grid}</div>`;
}
function lDoll(){const P=H,cell=(k,n)=>{const it=slotItem(k);return`<button class="dc ${LDSEL==='eq:'+k?'on':''}" data-lk="eq:${k}" data-drop="eq:${k}" style="--rc:${it?RAR[it.rar].c:'#2e2748'}">${it?`<img src="${iconURL(it)}" draggable="false">`:`<span class="ph">${n}</span>`}</button>`};
  const bar=(v,m,c)=>`<div class="mbar"><i style="width:${Math.max(0,v/m*100)}%;background:${c}"></i><span>${v}/${m}</span></div>`;
  return`<div class="ldoll"><div class="lhero"><img src="${heroCanvasURL()}"><div class="lhi"><b>${P.name}</b><span>ур. ${P.lvl} · защ ${P.st.def}</span>${bar(P.hp,P.st.mhp,'linear-gradient(90deg,#a82a4e,#ff4b6a)')}${bar(P.mp,P.st.mmp,'linear-gradient(90deg,#1f4fb8,#22b6ff)')}${bar(P.xp,6+P.lvl*2,'linear-gradient(90deg,#22e6ff,#7dff4f)')}</div></div>
    <div class="lslots">${[...DOLL_R,...DOLL_L].map(([k,n])=>cell(k,n)).join('')}</div>
    <div class="lbtns"><button class="btn sm" id="lAllEq">⇧ Надетое<br>в ящик</button><button class="btn sm" id="lAllBag">⇧ Сумку<br>в ящик</button></div></div>`}
// resolve a key into {src,get,remove,put-back}
function lItem(k){const[a,b,...r]=k.split(':'),v=r.join(':');
  if(a==='eq')return{kind:'eq',slot:b,it:slotItem(b)};
  if(b==='i')return{kind:'item',side:a,it:(a==='st'?ST.stash:H.bag)[+v],idx:+v};
  if(b==='c'){const arr={med:H.inv.meds,bat:H.inv.bats,gren:H.inv.grens}[v];return{kind:'cons',side:'bg',arr,it:arr[0]}}
  if(b==='m')return{kind:'mat',side:a,m:v,n:(a==='st'?ST.mats:H.bagMats)[v]||0};
  if(b==='a')return{kind:'ammo',side:a,am:v,n:(a==='st'?ST.ammo:H.inv.ammo)[v]||0};
  return null}
const CONS_ARR=it=>({med:H.inv.meds,battery:H.inv.bats,grenade:H.inv.grens}[it.cat]);
function putTo(side,it){ // item object into chest or bag; returns false if no room
  if(side==='st'){if(ST.stash.length>=stashCap())return lMsg('Ящик полон');ST.stash.push(it);return true}
  if(CONS_ARR(it)){CONS_ARR(it).push(it);return true}
  if(bagW()+(ITEM_W[it.cat]||1)>capacity())return lMsg('Сумка: не хватает места');H.bag.push(it);return true}
let LDMSG='';function lMsg(t){LDMSG=t;return false}
function lMove(k,dest,n){ // dest: 'st' | 'bg' | 'eq:<slot>'
  const o=lItem(k);if(!o)return;LDMSG='';
  if(dest.startsWith('eq:')){const slot=dest.slice(3);const it=o.it;if(!it||!GEAR_CATS.includes(it.cat))return lMsg('Это не надевается');
    const want=slot.startsWith('act')?'implant':slot.startsWith('pas')?'implant':slot;if(it.cat!==want)return lMsg('Не подходит в этот слот');
    if(it.cat==='implant'&&it.t!==(slot.startsWith('act')?'act':'pas'))return lMsg(it.t==='act'?'Это боевой имплант':'Это пассивный имплант');
    if(o.kind==='eq')return;
    (o.side==='st'?ST.stash:H.bag).splice(o.idx,1);let old;
    if(slot.startsWith('act')||slot.startsWith('pas')){const arr=slot.startsWith('act')?H.eq.act:H.eq.pas;old=arr[+slot[3]];arr[+slot[3]]=it}else{old=H.eq[slot];H.eq[slot]=it}
    if(old)(o.side==='st'?ST.stash:H.bag).push(old);recalc(H);rebuildSprites(H);return true}
  if(o.kind==='eq'){if(!o.it)return;const it=o.it;if(!putTo(dest,it))return;
    if(o.slot.startsWith('act'))H.eq.act[+o.slot[3]]=null;else if(o.slot.startsWith('pas'))H.eq.pas[+o.slot[3]]=null;else H.eq[o.slot]=null;recalc(H);rebuildSprites(H);return true}
  if(o.side===dest)return;
  if(o.kind==='item'){const it=o.it;(o.side==='st'?ST.stash:H.bag).splice(o.idx,1);if(!putTo(dest,it)){(o.side==='st'?ST.stash:H.bag).splice(o.idx,0,it);return}return true}
  if(o.kind==='cons'){const it=o.arr.pop();if(!putTo('st',it)){o.arr.push(it);return}return true}
  if(o.kind==='mat'){const from=o.side==='st'?ST.mats:H.bagMats,to=dest==='st'?ST.mats:H.bagMats;let t=Math.min(n||o.n,o.n);
    if(dest==='bg')t=Math.min(t,Math.floor((capacity()-bagW())/MATS[o.m].w));if(t<=0)return lMsg('Сумка: не хватает места');
    from[o.m]-=t;if(from[o.m]<=0)delete from[o.m];to[o.m]=(to[o.m]||0)+t;return true}
  if(o.kind==='ammo'){const from=o.side==='st'?ST.ammo:H.inv.ammo,to=dest==='st'?ST.ammo:H.inv.ammo,t=Math.min(n||o.n,o.n);from[o.am]-=t;to[o.am]=(to[o.am]||0)+t;return true}
}
function lInfo(){
  if(!LDSEL)return`${LDMSG?`<p class="warn">${LDMSG}</p>`:''}<div class="det sm empty">Тап — переложить (ящик ⇄ сумка, надетое → ящик) · удержание — подробности и экипировка · перетаскивание — в нужный слот</div>`;
  const o=lItem(LDSEL);if(!o)return'';const acts=[];let html='';
  const other=o.side==='st'?'bg':'st',toN=o.side==='st'?'В сумку':'В ящик';
  if(!alive()&&o.side==='st'){html=o.it?itemDet(o.it):o.mat?`<div class="det sm empty">${MATS[o.m].n} ×${o.n}</div>`:`<div class="det sm empty">Патроны «${o.am}»: ${o.n}</div>`;if(o.it&&SCRAP[o.it.cat])acts.push(['lScr','Разобрать'])}
  else if(o.kind==='eq'){if(o.it){html=itemDet(o.it);acts.push(['lUnB','Снять в сумку'],['lUnS','Снять в ящик'])}else html='<div class="det sm empty">Пустой слот — перетащите сюда предмет</div>'}
  else if(o.kind==='item'){html=itemDet(o.it,GEAR_CATS.includes(o.it.cat)?`<br>${scoreDiff(o.it)}`:'');if(GEAR_CATS.includes(o.it.cat))acts.push(['lEq','Надеть']);acts.push(['lMv',toN]);if(SCRAP[o.it.cat])acts.push(['lScr','Разобрать'])}
  else if(o.kind==='cons'){html=itemDet(o.it,` · ×${o.arr.length}`);acts.push(['lMv','В ящик'])}
  else if(o.kind==='mat'){const M=MATS[o.m];html=`<div class="det sm"><img src="${MAT_ICON[o.m].toDataURL()}"><div><div class="nm">${M.n} ×${o.n}</div><p>вес ${M.w}/шт · ${M.price}₵/шт${o.side==='st'?'':' · пригодится для полевого ремонта'}</p></div></div>`;acts.push(['lMv1',toN+' 1'],['lMv',toN+' все'])}
  else if(o.kind==='ammo'){html=`<div class="det sm empty">Патроны «${o.am}»: ${o.n}${H.eq.ranged&&H.eq.ranged.ammo===o.am?' · подходят к оружию':''}</div>`;acts.push(['lMv10',toN+' 10'],['lMv',toN+' все'])}
  const it=o.it&&o.it.mdur?o.it:null;
  return`<div class="hsel">${html}${acts.length?`<div class="hacts">${acts.map(([id,n])=>`<button class="btn sm" id="${id}">${n}</button>`).join('')}</div>`:''}</div>${LDMSG?`<p class="warn">${LDMSG}</p>`:''}${it?wpnBlock(it):''}`;
}
function baseInvPanel(){
  const A=alive();if(A)bagInit();else if(!ST.ammo)ST.ammo={'пули':0,'дробь':0,'энергия':0};const P=H;
  const sc=0;
  const F=fitGrids(A?232:150,A?2:1,A?(cs=>2*(cs+3)+8):null);
  const head=`<div class="sbar"><span class="lttl">СНАРЯЖЕНИЕ</span>${A?`<button class="btn go" id="hGo" title="${launchRoute()}">▶ В РЕЙД</button>`:''}<button class="btn" id="hpX">✕</button></div>`;
  const chest=`<div class="lsec"><div class="lh"><b>ЯЩИК</b><span style="color:${ST.stash.length>=stashCap()?'#ff6a7a':''}">${ST.stash.length}/${stashCap()} предм.${ST.stash.length>=stashCap()?' · полон':''}${ST.base.crate<UP.crate.max?` <button class="lt up" id="lUpCrate">⬆ расширить до ${CRATE_CAP[ST.base.crate+1]}</button>`:''}</span></div>${gridHTML('st',stCells(),undefined,A?F.rows:F.rows*2)}</div>`;
  const bw=A?bagW():0,cap=A?capacity():1;
  const merc=!A?`<div class="lsec"><p class="help">Нет активного наёмника. Наймите в терминале или выберите в «Наёмниках».</p></div>`:`<div class="lsec merc">${lDoll()}
    <div class="lh"><b>СУМКА</b><span>вес ${bw}/${cap}</span></div><div class="wline"><i style="width:${Math.min(100,bw/cap*100)}%;background:${bw>cap*.75?'#ff6a3a':'#e0c070'}"></i></div>${gridHTML('bg',bgCells(),undefined,F.rows)}</div>`;
  showOv(`${head}${chest}${merc}<div class="linfo">${lInfo()}</div>`,true);
  $('panel').classList.add('sheet','tall','fit');$('panel').style.setProperty('--cs',F.cs+'px');$('panel').style.setProperty('--cols',F.cols);$('ov').classList.add('dock');SHEET=true;$('panel').scrollTop=sc;
  const on=(id,f)=>{const e=$(id);if(e)e.onclick=f};
  const done=()=>{saveGame();updateHUD();baseInvPanel()};
  document.querySelectorAll('[data-lt]').forEach(b=>b.onclick=()=>{const[s,k]=b.dataset.lt.split(':');LDT[s]=k;LDP[s]=0;baseInvPanel()});
  document.querySelectorAll('[data-lpg]').forEach(b=>b.onclick=()=>{const[s,d]=b.dataset.lpg.split(':');LDP[s]=Math.max(0,LDP[s]+ +d);baseInvPanel()});
  const sideOf=k=>k.split(':')[0];
  on('lMv',()=>{lMove(LDSEL,sideOf(LDSEL)==='st'?'bg':'st');LDSEL=null;done()});
  on('lMv1',()=>{lMove(LDSEL,sideOf(LDSEL)==='st'?'bg':'st',1);done()});
  on('lMv10',()=>{lMove(LDSEL,sideOf(LDSEL)==='st'?'bg':'st',10);done()});
  on('lEq',()=>{const o=lItem(LDSEL);const it=o.it;const slot=it.cat==='implant'?(it.t==='act'?(H.eq.act[0]?(H.eq.act[1]?'act0':'act1'):'act0'):(H.eq.pas[0]?(H.eq.pas[1]?'pas0':'pas1'):'pas0')):it.cat;lMove(LDSEL,'eq:'+slot);LDSEL=null;done()});
  on('lUnB',()=>{lMove(LDSEL,'bg');LDSEL=null;done()});on('lUnS',()=>{lMove(LDSEL,'st');LDSEL=null;done()});
  on('lScr',()=>{const o=lItem(LDSEL);const arr=o.side==='st'?ST.stash:H.bag;const it=arr.splice(o.idx,1)[0];const r=scrapToStash(it);log(`Разобрано: ${it.name} → ${r}`,'#c0c7d4');LDSEL=null;done()});
  on('hGo',()=>zonePick());on('hpX',()=>closeSheet());on('lUpCrate',()=>modulePanel('crate'));
  on('lAllEq',()=>{let n=0,left=0;for(const k of['melee','ranged','armor','clothes','act0','act1','pas0','pas1']){if(!slotItem(k))continue;if(lMove('eq:'+k,'st'))n++;else left++}
    LDMSG=left?`Ящик полон: не поместилось ${left}`:'';log(n?`В ящик: ${n} предм.`:'Нечего снимать','#a8a0c6');LDSEL=null;done()});
  on('lAllBag',()=>{let n=0,left=0;
    for(const a of[H.inv.meds,H.inv.bats,H.inv.grens])while(a.length){if(ST.stash.length>=stashCap()){left+=a.length;break}ST.stash.push(a.pop());n++}
    for(let i=H.bag.length-1;i>=0;i--){if(ST.stash.length>=stashCap()){left+=i+1;break}ST.stash.push(H.bag.splice(i,1)[0]);n++}
    for(const m in H.bagMats){ST.mats[m]=(ST.mats[m]||0)+H.bagMats[m];n+=H.bagMats[m]}H.bagMats={};
    for(const a in H.inv.ammo){ST.ammo[a]=(ST.ammo[a]||0)+H.inv.ammo[a];H.inv.ammo[a]=0}
    LDMSG=left?`Ящик полон (${stashCap()} предм.): не поместилось ${left}. Расширить ящик — в «Убежище»`:'';log('Сумка разобрана в ящик','#a8a0c6');LDSEL=null;done()});
  const w=LDSEL&&lItem(LDSEL);if(w&&w.it&&w.it.mdur)bindWpn(w.it,baseInvPanel);
  bindOv();
  // ---- drag & drop (pointer based: works with mouse and touch) ----
  document.querySelectorAll('[data-lk]').forEach(el=>{
    el.addEventListener('pointerdown',ev=>{
      const k=el.dataset.lk,sx=ev.clientX,sy=ev.clientY;let ghost=null,over=null,held=false;el.setPointerCapture(ev.pointerId);
      const ht=setTimeout(()=>{if(ghost)return;held=true;LDSEL=k;LDMSG='';baseInvPanel()},450);
      const mv=e=>{if(!ghost&&!held&&Math.hypot(e.clientX-sx,e.clientY-sy)>7){clearTimeout(ht);const img=el.querySelector('img');ghost=document.createElement('div');ghost.className='lghost';ghost.innerHTML=img?`<img src="${img.src}">`:el.innerHTML;document.body.appendChild(ghost)}
        if(ghost){e.preventDefault();ghost.style.left=e.clientX+'px';ghost.style.top=e.clientY+'px';ghost.style.display='none';const t=document.elementFromPoint(e.clientX,e.clientY);ghost.style.display='';
          const z=t&&t.closest('[data-drop]');if(over&&over!==z)over.classList.remove('dropok');if(z){z.classList.add('dropok');over=z}}};
      const up=e=>{el.removeEventListener('pointermove',mv);el.removeEventListener('pointerup',up);el.removeEventListener('pointercancel',up);
        if(over)over.classList.remove('dropok');
        if(ghost){ghost.remove();const t=document.elementFromPoint(e.clientX,e.clientY),z=t&&t.closest('[data-drop]');
          if(z){const d=z.dataset.drop;const res=lMove(k,d);if(res)LDSEL=null;done()}}
        else if(!held){clearTimeout(ht);const o=lItem(k);const nm=o&&(o.it?o.it.name:o.m?MATS[o.m].n:o.am?'патроны':'');const sd=k.split(':')[0],dest=sd==='st'?'bg':'st';
          if(lMove(k,dest)){LDSEL=null;LDMSG=`${dest==='st'?'→ В ящик':'→ В сумку'}: ${nm}`;log(LDMSG.replace('→ ',''),'#a8a0c6');done()}else baseInvPanel()}};
      el.addEventListener('pointermove',mv);el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);
    });
  });
}
// ================= SETTINGS (gear in the top-right corner) =================
function settingsPanel(){
  showOv(`<h2>НАСТРОЙКИ</h2>
  <div class="sect">ГЕНЕРАТОРЫ И АРСЕНАЛ</div>
  <div class="setg">${[['all','Все предметы'],['fx','Эффекты 244'],['melee','Ближний бой'],['ranged','Дальний бой'],['armor','Броня'],['clothes','Одежда'],['implant','Импланты'],['fighters','Бойцы'],['decor','Декор'],['mats','Ресурсы']].map(([k,n])=>`<button class="btn" data-ars="${k}">${n}</button>`).join('')}</div>
  <div class="sect">ИГРА</div>
  <p class="help">Сохранение автоматическое. Хардкор: погибший наёмник не возвращается.</p>
  <div class="row"><button class="btn" id="sReset" style="color:#ff6a7a">Сбросить весь прогресс</button></div>
  <div class="row"><button class="btn" id="oClose">Закрыть</button></div>`,true);
  document.querySelectorAll('[data-ars]').forEach(b=>b.onclick=()=>{ARS.cat=b.dataset.ars;ARS.sel=0;openArsenal()});
  $('sReset').onclick=()=>{const b=$('sReset');if(!b.dataset.c){b.dataset.c=1;b.textContent='Точно? Нажмите ещё раз';return}
    try{localStorage.removeItem(SAVE_KEY)}catch(e){}ST=freshState();newHero();enterBase();saveGame();hideOv()};
  bindOv();
}
function baseMenu(){settingsPanel()}
$('bSet').onclick=ev=>{ev.stopPropagation();if(MODE==='raid'&&G&&!G.dead)G.paused=true;settingsPanel()};

function launchRoute(){const n=Math.max(5,Math.min(ST.maxDepth+1,8)),r=[];for(let f=1;f<=n;f++)r.push(`${f}.${BIOMES[biomeFor(f)].name}`);return'Маршрут: '+r.join(' › ')}
addEventListener('resize',()=>{if(typeof MODE!=='undefined'&&MODE==='base'&&SHEET&&document.querySelector('#panel.fit'))baseInvPanel()});
