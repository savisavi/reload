// ================= HERO PANEL v3: paper doll + 4-row inventory grid =================
let HSEL=null,HPAGE=0,WSEL=null,HPT='inv';
const DOLL_L=[['armor','Броня'],['clothes','Одежда'],['pas0','Пассив 1'],['pas1','Пассив 2']];
const DOLL_R=[['melee','Ближний'],['ranged','Дальний'],['act0','Боевой 1'],['act1','Боевой 2']];
const INV_COLS=6,INV_ROWS=4,INV_PAGE=INV_COLS*INV_ROWS;
const GEAR_CATS=['melee','ranged','armor','clothes','implant'];
function invRaid(){return MODE==='raid'&&G&&G.pack}
function gearBox(){return invRaid()?G.pack.items:ST.stash}
function matBox(){return invRaid()?G.pack.mats:ST.mats}
function invCells(){
  const P=H,c=[];
  if(P.inv.meds.length)c.push({cat:'med',k:'c:med',icon:iconURL(P.inv.meds[0]),n:P.inv.meds.length,rc:RAR[0].c});
  if(P.inv.bats.length)c.push({cat:'battery',k:'c:bat',icon:iconURL(P.inv.bats[0]),n:P.inv.bats.length,rc:RAR[0].c});
  if((P.inv.grens||[]).length)c.push({cat:'grenade',k:'c:gren',icon:iconURL(P.inv.grens[0]),n:P.inv.grens.length,rc:RAR[(P.inv.grens[0].rar)||0].c});
  for(const a of['пули','дробь','энергия'])if(P.inv.ammo[a]>0)c.push({ammo:a,k:'a:'+a,icon:null,txt:a==='пули'?'•••':a==='дробь'?'∴':'⚡',n:P.inv.ammo[a],rc:'#ffd23f'});
  c.forEach(x=>x.bag=1);
  if(!invRaid()&&ST.ammo)for(const a of['пули','дробь','энергия'])if(ST.ammo[a]>0)c.push({k:'sa:'+a,icon:null,txt:a==='пули'?'•••':a==='дробь'?'∴':'⚡',n:ST.ammo[a],rc:'#5a4a20'});
  gearBox().forEach((it,i)=>c.push({cat:it.cat,k:'g:'+i,icon:iconURL(it),rc:RAR[it.rar].c,it}));
  const M=matBox();for(const m of MAT_KEYS)if(M[m]>0)c.push({mat:m,k:'m:'+m,icon:MAT_ICON[m]?MAT_ICON[m].toDataURL():null,txt:MATS[m].n[0],n:M[m],rc:'#5a5378'});
  return c;
}
function dollItem(k){return slotItem(k)}
function dollCell(k,n){const it=dollItem(k),P=H;let badge='';
  if(it&&k.startsWith('act')){const cd=P.cds[+k[3]];badge=cd>0?`<em class="cd">${csec(cd)}с</em>`:`<em class="en">${it.cost}</em>`}
  return`<button class="dc ${HSEL==='s:'+k?'on':''}" data-hs="s:${k}" style="--rc:${it?RAR[it.rar].c:'#2e2748'}">${it?`<img src="${iconURL(it)}">`:`<span class="ph">${n}</span>`}${badge}</button>`}
function scoreDiff(it){
  const cur=it.cat==='implant'?(it.t==='act'?H.eq.act:H.eq.pas).reduce((m,x)=>!x?null:m===undefined?x:(m&&score(x)<score(m)?x:m),undefined):H.eq[it.cat];
  if(!cur)return'<b style="color:#7dff4f">слот пуст</b>';
  const d=Math.round(score(it)-score(cur));return d>0?`<b style="color:#7dff4f">лучше на ${d}</b>`:d<0?`<b style="color:#ff6a7a">хуже на ${-d}</b>`:'как текущее';
}
function selInfo(){
  const raid=invRaid(),k=HSEL||'';const [t,v]=[k.slice(0,1),k.slice(2)];let it=null,html='',html2='',acts=[];WSEL=null;
  if(t==='s'){it=dollItem(v);if(it)acts.push(['hUn','Снять'])}
  else if(t==='g'){it=gearBox()[+v];if(it&&!raid&&['med','battery','grenade'].includes(it.cat))acts.push(['hToBag','В сумку']);if(it&&GEAR_CATS.includes(it.cat))acts.push(['hEq','Надеть']);if(it&&SCRAP[it.cat])acts.push(['hScrap','Разобрать']);if(raid)acts.push(['hDrop','Выбросить'])}
  else if(t==='c'){const arr={med:H.inv.meds,bat:H.inv.bats,gren:H.inv.grens||[]}[v];it=arr[0];
    const sum=v==='med'?`всего +${arr.reduce((s,m)=>s+m.heal,0)} HP`:v==='bat'?`всего +${arr.reduce((s,m)=>s+m.energy,0)} EN`:`${arr.length} шт.`;
    if(it)html=`<div class="det sm"><img src="${iconURL(it)}"><div><div class="nm" style="color:${RAR[it.rar].c}">${it.name} ×${arr.length}</div><p>${it.lines.join(' · ')}<br>${sum}</p></div></div>`;
    if(raid)acts.push(['hUse',v==='gren'?'Бросить':'Использовать']);else acts.push(['hToStash','В ящик']);it=null}
  else if(t==='a'){const cur=H.eq.ranged&&H.eq.ranged.ammo===v;html=`<div class="det sm empty">В сумке патроны «${v}»: ${H.inv.ammo[v]}${cur?' · подходят к оружию':''}</div>`;if(!raid)acts.push(['hAmS10','В ящик 10'],['hAmSA','В ящик все'])}
  else if(k.startsWith('sa:')){const a=k.slice(3);html=`<div class="det sm empty">В ящике патроны «${a}»: ${ST.ammo[a]} · в сумке ${H.inv.ammo[a]}</div>`;acts.push(['hAmT10','Взять 10'],['hAmTA','Взять все'])}
  else if(t==='m'){const M=MATS[v],n=matBox()[v]||0;html=`<div class="det sm"><img src="${MAT_ICON[v]?MAT_ICON[v].toDataURL():''}"><div><div class="nm">${M.n} ×${n}</div><p>Компонент · вес ${M.w} · цена ${M.price}₵/шт · всего ${M.w*n} веса, ${M.price*n}₵</p></div></div>`;if(raid)acts.push(['hDropM','Выбросить'])}
  if(it&&it.mdur)html2=wpnBlock(it);
  if(it)html=itemDet(it,(t==='g'&&GEAR_CATS.includes(it.cat)?`<br>${scoreDiff(it)}`:'')+(raid&&t==='g'?` · ${sellPrice(it)}₵`:''));
  if(!html)html='<div class="det sm empty">Выберите слот или предмет</div>';
  if(it&&it.mdur)WSEL=it;
  return`<div class="hsel">${html}${acts.length?`<div class="hacts">${acts.map(([id,n])=>`<button class="btn sm" id="${id}">${n}</button>`).join('')}</div>`:''}</div>${html2}`;
}
function boxFree(it){return invRaid()?packFree()>=(ITEM_W[it.cat]||1):ST.stash.length<stashCap()}
function doUnequip(k){
  const it=dollItem(k);if(!it)return;
  if(!boxFree(it)){log(invRaid()?'Рюкзак полон':'Ящик полон','#ffb04a');flashMsg(invRaid()?'Рюкзак полон':'Ящик полон');return}
  if(k.startsWith('act'))H.eq.act[+k[3]]=null;else if(k.startsWith('pas'))H.eq.pas[+k[3]]=null;else H.eq[k]=null;
  gearBox().push(it);recalc(H);rebuildSprites(H);HSEL=null;afterInvChange();
}
function doEquip(i){
  const box=gearBox(),it=box[i];if(!it)return;box.splice(i,1);
  let old=null;
  // implant goes to the slot picked on the doll, if any
  if(it.cat==='implant'&&HSEL_SLOT&&HSEL_SLOT.slice(0,3)===(it.t==='act'?'act':'pas')){const arr=it.t==='act'?H.eq.act:H.eq.pas,s=+HSEL_SLOT[3];old=arr[s];arr[s]=it;recalc(H);rebuildSprites(H)}
  else old=forceEquip(it);
  if(old)box.push(old);
  log(`Надето: ${it.name}`,RAR[it.rar].c);HSEL=null;afterInvChange();
}
let HSEL_SLOT=null;
function flashMsg(t){const e=document.querySelector('.hsel');if(e){const p=document.createElement('p');p.className='warn';p.textContent=t;e.appendChild(p)}}
function afterInvChange(){if(typeof saveGame==='function'&&MODE!=='raid')saveGame();updateHUD();if(MODE==='raid')updateSlots();heroPanel()}
function heroPanel(){
  if(!invRaid())return baseInvPanel();
  const P=H,raid=invRaid();
  const all=invCells(),tab=LDT.rp||'all',cells=all.filter(c=>tab==='all'||tabOf(c)===tab),pages=Math.max(1,Math.ceil(cells.length/INV_PAGE));HPAGE=Math.min(HPAGE,pages-1);
  const ctabs=`<div class="ltabs rtabs">${LTABS.map(([k,n])=>{const cnt=k==='all'?all.length:all.filter(c=>tabOf(c)===k).length;return`<button class="lt ${tab===k?'on':''}" data-rt="${k}">${n}${cnt?`<i>${cnt}</i>`:''}</button>`}).join('')}</div>`;
  const pc=cells.slice(HPAGE*INV_PAGE,(HPAGE+1)*INV_PAGE);
  const grid=Array.from({length:INV_PAGE},(_,i)=>{const c=pc[i];if(!c)return'<div class="ic empty"></div>';
    return`<button class="ic ${HSEL===c.k?'on':''} ${c.bag&&!raid?'bag':''}" data-hs="${c.k}" style="--rc:${c.rc}">${c.icon?`<img src="${c.icon}">`:`<span class="tx">${c.txt}</span>`}${c.n?`<em>${c.n}</em>`:''}</button>`}).join('');
  const capL=raid?`Рюкзак <b>${packW()}/${capacity()}</b>`:`Ящик <b>${ST.stash.length}/${stashCap()}</b>`;
  const wr=raid?packW()/capacity():0;
  const doll=`<div class="doll">
    <div class="dcol">${DOLL_L.map(([k,n])=>dollCell(k,n)).join('')}</div>
    <div class="dmid"><img src="${heroCanvasURL()}"><div class="nm">${P.name.split(' ')[0]}</div><div class="lv">ур. ${P.lvl} · опыт ${Math.floor(P.xp)}/${6+P.lvl*2}</div><div class="xpbar hxp"><i style="width:${Math.min(100,P.xp/(6+P.lvl*2)*100)}%"></i></div>
      ${bar(P.hp,P.st.mhp,'linear-gradient(90deg,#a82a4e,#ff4b6a)')}${bar(P.mp,P.st.mmp,'linear-gradient(90deg,#1f4fb8,#22b6ff)')}
      <p>защ ${P.st.def} · укл ${Math.round(P.st.dodge*100)}%</p></div>
    <div class="dcol">${DOLL_R.map(([k,n])=>dollCell(k,n)).join('')}</div></div>`;
  const inv=`<div class="hinv"><div class="ih"><span>${capL}</span>${pages>1?`<span class="pg"><button class="btn sm" id="hPrev">◀</button>${HPAGE+1}/${pages}<button class="btn sm" id="hNext">▶</button></span>`:''}</div>
    ${raid?`<div class="wline"><i style="width:${Math.min(100,wr*100)}%;background:${wr>.75?'#ff6a3a':wr>.6?'#ffb04a':'#e0c070'}"></i></div>`:''}
    ${ctabs}<div class="igrid">${grid}</div></div>`;
  let risk='';
  if(raid){const M=G.M,pe=bfs(P.x,P.y,(x,y)=>x===M.evac.x&&y===M.evac.y,false,true),hpR=P.hp/P.st.mhp,val=packValue();
    const rec=hpR<.35&&!P.inv.meds.length?['Мало HP и нет аптечек — эвакуируйтесь','#ff6a7a']:wr>=.85?['Рюкзак почти полон — пора выносить','#ffb04a']:wr>.75?['Перегруз — враги ходят чаще','#ffb04a']:val>=120&&hpR<.5?['Хорошая добыча, герой потрёпан — стоит уйти','#ffb04a']:['Можно продолжать','#7dff4f'];
    risk=`<p class="hrisk">≈${val}₵ · до эвакуации ${pe?pe.length:'?'} шаг. · этаж ${G.floor} · угроза ${G.threat||'-'} — <span style="color:${rec[1]}">${rec[0]}</span></p>`}
  const sbarH='';
  const sc=$('panel').classList.contains('sheet')?$('panel').scrollTop:0;
  const ptabs=`<div class="tabs ptabs"><button class="tab ${HPT!=='attr'?'on':''}" data-pt="inv">Снаряжение</button><button class="tab ${HPT==='attr'?'on':''}" data-pt="attr">Прокачка${P.pts?` <b class="ptn">+${P.pts}</b>`:''}</button><button class="btn ptx" id="hpX">✕</button></div>`;
  const body=HPT==='attr'?`<div class="pattr"><div class="lh"><b>${P.name}</b><span>ур. ${P.lvl} · опыт ${Math.floor(P.xp)}/${6+P.lvl*2}</span></div><div class="xpbar" style="margin:0 0 8px"><i style="width:${Math.min(100,P.xp/(6+P.lvl*2)*100)}%"></i></div>${attrCards(P,true)}</div>`:`<div class="hp3">${doll}${inv}</div>${selInfo()}${risk}`;
  showOv(`${sbarH}${ptabs}${body}`,true);
  $('panel').classList.add('sheet');$('panel').classList.remove('tall');$('ov').classList.add('dock');SHEET=true;$('panel').scrollTop=sc;
  document.querySelectorAll('[data-hs]').forEach(b=>b.onclick=()=>{const k=b.dataset.hs;
    if(k.startsWith('s:'))HSEL_SLOT=k.slice(2);
    // tap an implant slot, then an implant in the grid → goes to that slot; double tap = action
    if(HSEL===k){if(k.startsWith('g:'))return doEquip(+k.slice(2));if(k.startsWith('s:'))return doUnequip(k.slice(2))}
    HSEL=k;heroPanel()});
  const on=(id,f)=>{const e=$(id);if(e)e.onclick=f};
  on('hPrev',()=>{HPAGE=Math.max(0,HPAGE-1);heroPanel()});on('hNext',()=>{HPAGE++;heroPanel()});
  on('hUn',()=>doUnequip(HSEL.slice(2)));on('hEq',()=>doEquip(+HSEL.slice(2)));
  on('hDrop',()=>{const i=+HSEL.slice(2),it=G.pack.items.splice(i,1)[0];if(it){it.ign=true;dropItem(it,G.p.x,G.p.y);log(`Выброшено: ${it.name}`,'#a8a0c6')}HSEL=null;afterInvChange()});
  on('hGo',()=>{closeSheet();startRaid()});
  const bagArr=v=>({med:H.inv.meds,bat:H.inv.bats,gren:H.inv.grens}[v]);
  on('hToStash',()=>{const v=HSEL.slice(2),arr=bagArr(v);if(!arr||!arr.length)return;if(ST.stash.length>=stashCap()){flashMsg('Ящик полон');return}ST.stash.push(arr.pop());if(!arr.length)HSEL=null;afterInvChange()});
  on('hToBag',()=>{const i=+HSEL.slice(2),it=ST.stash[i];if(!it)return;ST.stash.splice(i,1);({med:H.inv.meds,battery:H.inv.bats,grenade:H.inv.grens})[it.cat].push(it);HSEL=null;afterInvChange()});
  const amMove=(a,n,toBag)=>{if(!ST.ammo)ST.ammo={'пули':0,'дробь':0,'энергия':0};const from=toBag?ST.ammo:H.inv.ammo,to=toBag?H.inv.ammo:ST.ammo,t=Math.min(n,from[a]);from[a]-=t;to[a]+=t;afterInvChange()};
  on('hAmS10',()=>amMove(HSEL.slice(2),10,false));on('hAmSA',()=>amMove(HSEL.slice(2),1e9,false));
  on('hAmT10',()=>amMove(HSEL.slice(3),10,true));on('hAmTA',()=>amMove(HSEL.slice(3),1e9,true));
  on('hScrap',()=>{const i=+HSEL.slice(2),box=gearBox(),it=box.splice(i,1)[0];if(it){if(raid){scrapToPack(it,G.p.x,G.p.y)}else{const r=scrapToStash(it);log(`Разобрано: ${it.name} → ${r}`,'#c0c7d4')}}HSEL=null;afterInvChange()});
  on('hDropM',()=>{const m=HSEL.slice(2);log(`Выброшено: ${MATS[m].n} ×${G.pack.mats[m]}`,'#a8a0c6');delete G.pack.mats[m];HSEL=null;afterInvChange()});
  on('hUse',()=>{const v=HSEL.slice(2);G.buf={use:v};if(G.paused)G.paused=false;setTimeout(heroPanel,60)});
  const goal=g=>()=>{G.manual=false;G.mode.goal=g;G.idle=0;updateHUD();heroPanel()};
  on('gHome',goal('home'));on('gDeep',goal('deeper'));on('gExp',goal('explore'));
  on('hpPause',()=>{G.paused=!G.paused;heroPanel()});
  on('hpX',()=>closeSheet());
  document.querySelectorAll('[data-pt]').forEach(b=>b.onclick=()=>{HPT=b.dataset.pt;heroPanel()});
  document.querySelectorAll('[data-rt]').forEach(b=>b.onclick=()=>{LDT.rp=b.dataset.rt;HPAGE=0;heroPanel()});
  if(WSEL)bindWpn(WSEL,heroPanel);
  bindAttr(heroPanel);bindOv();
}
