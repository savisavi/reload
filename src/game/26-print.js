// ================= BLUEPRINTS → RESEARCH → RECIPES → 3D PRINTER =================
// Каждый предмет (вид ствола, клинка, импланта, расходника) — свой чертёж. Станок превращает чертёж в рецепт,
// рецепт загружается в 3D-принтер навсегда, принтер печатает из компонентов. Оба станка требуют питания.
const BP={};const bpAdd=(cat,kind,t,label,extra={})=>{BP[cat+':'+kind]={cat,kind,t,label,...extra}};
[['пистолет',0],['револьвер',1],['ПП',1],['дробовик',2],['винтовка',2],['лазер',3]].forEach(([k,t])=>bpAdd('ranged',k,t,capF(k)));
[['нож',0],['бита',0],['мачете',0],['топор',1],['электродубинка',1],['катана',2],['энергоклинок',3]].forEach(([k,t])=>bpAdd('melee',k,t,capF(k)));
[['Электро-разряд',0],['Щит-проектор',1],['Подкожная броня',1],['Кардио-модуль',1],['Нейро-прицел',1],['Боевой процессор',2],['Регенератор',2],['Энерго-ядро',2],['Ракетный модуль',2],['Нано-ремонт',2],['Оптический камуфляж',2],['Рефлекс-ускоритель',3]].forEach(([k,t])=>bpAdd('implant',k,t,k));
[['аптечка',0],['стим-шприц',1],['нано-аптечка',2]].forEach(([k,t])=>bpAdd('med',k,t,capF(k)));
[['0',0,'Энергоячейка'],['1',1,'Энергобатарея'],['3',3,'Квантовый аккумулятор']].forEach(([k,t,n])=>bpAdd('battery',k,t,n,{rar:+k}));
[['пули',0,'Патроны',16],['дробь',1,'Дробь',6],['энергия',2,'Энергоячейки (патроны)',10]].forEach(([k,t,n,c])=>bpAdd('ammo',k,t,n,{count:c}));
bpAdd('grenade','any',1,'Граната');
const BP_KEYS=Object.keys(BP),BP_TN=['простой','обычный','сложный','высокотехнологичный'],BP_TC=['#c0c7d4','#7dff4f','#22e6ff','#ff9a1f'];
const bpHash=k=>{let h=2166136261;for(const c of k)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0};
// a sample of the target item — used for icons
const BP_SAMPLE={};function bpSample(k){if(BP_SAMPLE[k])return BP_SAMPLE[k];const b=BP[k];const f=b.cat==='battery'?{rar:b.rar}:b.cat==='grenade'?{rar:0}:{kind:b.kind,rar:0,nofx:1};
  return BP_SAMPLE[k]=makeItem(bpHash(k),b.cat,1,f)}
// blueprint sheets are drawn natively at 32×32: thin 1-px grid, folded corner, the item as a white line-print
function bpIcon(k,recipe){const s=bpSample(k).icon,c=document.createElement('canvas');c.width=c.height=32;const x=c.getContext('2d');
  const bg=recipe?'#1c2a1c':'#16325a',gr=recipe?'#2c4a2c':'#24508a',ed=recipe?'#7dff4f':'#cfe6ff';
  x.fillStyle='#0a0612';x.fillRect(1,1,30,30);x.fillStyle=bg;x.fillRect(2,2,28,28);x.fillStyle=gr;for(let i=2;i<30;i+=4){x.fillRect(i,2,1,28);x.fillRect(2,i,28,1)}
  x.fillStyle=ed;x.fillRect(2,2,28,1);x.fillRect(2,29,28,1);x.fillRect(2,2,1,28);x.fillRect(29,2,1,28);x.fillStyle=recipe?'#3a6a3a':'#5a8aca';x.fillRect(3,3,26,1);
  const t=document.createElement('canvas');t.width=t.height=32;const tx=t.getContext('2d');tx.drawImage(s,0,0);const d=tx.getImageData(0,0,32,32);
  for(let i=0;i<1024;i++){const a=d.data[i*4+3];if(!a)continue;const lum=(d.data[i*4]+d.data[i*4+1]+d.data[i*4+2])/3;
    if(recipe){/* keep colours */}else{const v=lum<40?'#0b1a33':lum<110?'#9cc4f0':'#eaf4ff';d.data[i*4]=parseInt(v.slice(1,3),16);d.data[i*4+1]=parseInt(v.slice(3,5),16);d.data[i*4+2]=parseInt(v.slice(5,7),16)}}
  tx.putImageData(d,0,0);x.drawImage(t,0,0);
  if(recipe){x.fillStyle='#0a0612';x.fillRect(20,20,9,9);x.fillStyle='#f9f871';x.fillRect(21,21,7,7);x.fillStyle='#fffbd0';x.fillRect(21,21,7,1);x.fillStyle='#1c2a1c';x.fillRect(23,23,3,3);x.fillStyle='#7dff4f';x.fillRect(24,24,1,1)}return c}
let BP_ANON=null;function bpAnonIcon(){if(BP_ANON)return BP_ANON;const c=document.createElement('canvas');c.width=c.height=32;const x=c.getContext('2d');
  x.fillStyle='#0a0612';x.fillRect(1,3,30,26);x.fillStyle='#16325a';x.fillRect(2,4,28,24);x.fillStyle='#24508a';for(let i=2;i<30;i+=4)x.fillRect(i,4,1,24);for(let i=4;i<28;i+=4)x.fillRect(2,i,28,1);
  x.fillStyle='#cfe6ff';x.fillRect(2,4,28,1);x.fillRect(2,27,28,1);x.fillRect(2,4,1,24);x.fillRect(29,4,1,24);
  x.fillStyle='#0a0612';x.fillRect(23,4,7,7);x.fillStyle='#9cc4f0';for(let k=0;k<6;k++)x.fillRect(23+k,4+k,6-k,1); // folded corner
  const q=[[12,10],[13,9],[14,8],[15,8],[16,8],[17,8],[18,9],[19,10],[19,11],[19,12],[18,13],[17,14],[16,15],[15,16],[15,17],[15,18],[15,22],[15,23]];
  x.fillStyle='#8a7a20';q.forEach(([a,b])=>x.fillRect(a+1,b+1,2,2));x.fillStyle='#f9f871';q.forEach(([a,b])=>x.fillRect(a,b,2,2));x.fillStyle='#fffbd0';x.fillRect(13,9,1,1);return BP_ANON=c}
ITEMGEN.bp=function(it,r,f){const k=BP[f.kind]?f.kind:BP_KEYS[(r.f()*BP_KEYS.length)|0];it.kind=k;it.rar=0;it.lvl=1;
  it.name='Неизвестный чертёж';it.lines=['Что это за устройство — неизвестно','Расшифруйте на исследовательском станке'];it.icon=bpAnonIcon()};
ITEMGEN.rcp=function(it,r,f){const k=BP[f.kind]?f.kind:BP_KEYS[0],b=BP[k];it.kind=k;it.rar=b.t;it.lvl=1;
  it.name=`Рецепт: ${b.label}`;it.lines=[`${CAT_N[b.cat]||'Расходники'} · ${BP_TN[b.t]}`,'Печать из: '+Object.entries(printCost(k)).map(([m,n])=>`${MATS[m].n} ×${n}`).join(', '),'Загрузите в 3D-принтер'];it.icon=bpIcon(k,true)};
CAT_N.bp='Чертежи';CAT_N.rcp='Рецепты';ITEM_W.bp=0;ITEM_W.rcp=0;BASEV.bp=30;BASEV.rcp=40;
const mkBP=(k,cat='bp')=>makeItem(rseed(),cat,1,{kind:k});
{const _eq=equipIfBetter;equipIfBetter=function(it){if(it&&(it.cat==='bp'||it.cat==='rcp'))return it;return _eq(it)}}
// ---- drops: blueprints from loot spots in every zone, deeper = more complex ----
function bpRoll(f){const Z=zoneTier(f||1);const pool=BP_KEYS.filter(k=>BP[k].t<=Z+1).map(k=>[k,BP[k].t===Z?3:BP[k].t<Z?1.5:.5]);return pickW(pool)}
{const _lp=lootProp;lootProp=function(pr){const hp0=pr.hp;const r=_lp(pr);
  if(hp0===1&&MODE==='raid'&&G&&Math.random()<.075){const it=mkBP(bpRoll(G.floor));G.pack.items.push(it);log('Найден неизвестный чертёж','#22e6ff');float(pr,'чертёж!','#22e6ff',-14)}
  return r}}
// ---- shop: two blueprints in the rotating stock ----
{const _ss=shopStock;shopStock=function(){const out=_ss();const r=RNG((ST.shopSeed^0xB1)>>>0),Z=zoneTier(Math.max(1,ST.maxDepth));
  for(let i=0;i<2;i++){const pool=BP_KEYS.filter(k=>BP[k].t<=Z+1);out.push(makeItem(ST.shopSeed+i*313+7,'bp',1,{kind:pool[(r.f()*pool.length)|0]}))}return out}}
// ---- costs: every recipe has its own stable set of components ----
const FIXED_COST={'ammo:пули':{junk:3,bolts:1},'ammo:дробь':{junk:3,spring:1},'ammo:энергия':{cap:1,wire:1},'med:аптечка':{bandage:2,tape:1},'med:стим-шприц':{bandage:1,antisep:1,chip:1},
  'med:нано-аптечка':{bandage:2,antisep:2,cpu:1},'battery:0':{wire:2,cap:1},'battery:1':{cap:2,wire:2,chip:1},'battery:3':{battery:1,cpu:1,cap:2},'grenade:any':{junk:2,tape:1,fuelS:1}};
const PC_POOL={ranged:[['bolts','spring','tape','junk','wire'],['sheet','rebar','cap'],['servo','battery'],['gpu','cpu']],
  melee:[['bolts','tape','boards','junk','spring'],['rebar','sheet','cement'],['servo','battery'],['cpu','battery']],
  implant:[['wire','tape','bulb'],['chip','cap'],['cpu','servo','battery'],['gpu','cpu']]};
function printCost(k){if(FIXED_COST[k])return FIXED_COST[k];const b=BP[k],r=RNG(bpHash(k)),cost={},T=b.t,P=PC_POOL[b.cat]||PC_POOL.ranged;
  const pick=(t,n)=>{const a=P[t].slice(),o=[];while(o.length<n&&a.length)o.push(a.splice((r.f()*a.length)|0,1)[0]);return o};
  if(T>0){const m=pick(T,1)[0];cost[m]=[0,4,2,1][T]+(b.cat==='ranged'?1:0);if(T>1){const s=pick(T-1,1)[0];if(!cost[s])cost[s]=3}}
  pick(0,T?2:3).forEach((m,i)=>{if(!cost[m])cost[m]=[4,3,2][i]+T+(b.cat==='ranged'&&!T?1:0)});return cost}
function printItem(k){const b=BP[k],L=Math.max(1,ST.maxDepth),pl=ST.base.printer||1;
  if(b.cat==='ammo'){const n=Math.round(b.count*(pl>=2?1.5:1));ST.ammo[b.kind]=(ST.ammo[b.kind]||0)+n;return`${b.label} ×${n} → в ящик`}
  const rar=b.cat==='battery'?b.rar:b.cat==='med'?(b.kind==='нано-аптечка'?2:b.kind==='стим-шприц'?1:0):pickW([[0,5],[1,pl>=2?4:2],[2,pl>=2?1.5:.3],[3,pl>=2?.3:0]]);
  const f=b.cat==='grenade'?{rar}:b.cat==='battery'?{rar}:{kind:b.kind,rar};const it=makeItem(rseed(),b.cat,L,f);
  if(ST.stash.length>=stashCap())return null;ST.stash.push(it);return`${it.name} → в ящик`}
// ---- the two machines ----
UP.research={n:'Исследовательский станок',max:2,start:0,power:1,lv:['не построен','Станок','Лаборатория'],
  eff:l=>l>=2?'Исследование чертежей вдвое быстрее':l?'Превращает чертёж в рецепт (нужно питание)':'Исследование чертежей',
  L:[null,{it:{boards:4,wire:4,bulb:2,bolts:4},cr:60,req:{gen:1},raids:0},{it:{chip:3,cap:3,sheet:3},cr:260,req:{research:1,bench:1},raids:1}]};
UP.printer={n:'3D-принтер',max:2,start:0,power:1,lv:['не построен','3D-принтер','Промышленный принтер'],
  eff:l=>l>=2?'Печать: выше редкость, патронов ×1,5':l?'Печать оружия, имплантов и расходников по рецептам (нужно питание)':'Печать предметов по рецептам',
  L:[null,{it:{bolts:6,wire:4,spring:3,tape:2},cr:80,req:{gen:1},raids:0},{it:{servo:2,chip:2,sheet:4},cr:400,req:{printer:1,bench:2},raids:1}]};
const RES_MIN=[15,30,60,120];
function resTick(){if(!ST)return;const now=Date.now(),R=ST.res;if(!R){ST.resT=now;return}const dt=Math.min(24*60,(now-(ST.resT||now))/60000);ST.resT=now;
  if(!(ST.base.research>0)||!powered()||R.done)return;R.left-=dt*(ST.base.research>=2?2:1);
  if(R.left<=0){R.left=0;R.done=1;const b=BP[R.key];ST.lastReveal={key:R.key,t:Date.now(),dup:!!(ST.known&&ST.known[R.key])};
    log(`Чертёж расшифрован: ${b.label} — ${CAT_N[b.cat]||'расходник'}, ${BP_TN[b.t]}`,BP_TC[b.t]);
    if(ST.stash.length<stashCap()){ST.stash.push(mkBP(R.key,'rcp'));ST.res=null}else log('Ящик полон — заберите рецепт со станка','#ffb04a');saveGame()}}
setInterval(()=>{if(ST&&MODE==='base'){const had=ST.res&&!ST.res.done;resTick();if(had&&(!ST.res||ST.res.done)&&$('ov').classList.contains('on')&&MACH.k)modulePanel(MACH.k);else if(MACH.k==='research'&&$('resBar')&&ST.res)$('resBar').style.width=Math.round((1-ST.res.left/ST.res.total)*100)+'%'}},5000);
{const _eb=enterBase;enterBase=function(){resTick();return _eb()}}
const MACH={k:null};
function costRow(c){return Object.entries(c).map(([m,n])=>{const h=ST.mats[m]||0;return`<span class="pc ${h>=n?'ok':''}"><img src="${MAT_ICON[m].toDataURL()}">${n}<small>/${h}</small></span>`}).join('')}
function revealHTML(){const L=ST.lastReveal;if(!L||!BP[L.key]||Date.now()-L.t>36e5*6)return'';const b=BP[L.key],c=printCost(L.key),rare=['обычная находка','неплохая находка','редкая находка','очень редкая находка'][b.t];
  return`<div class="mcur reveal"><img src="${bpIcon(L.key,true).toDataURL()}"><div><small>ПОСЛЕДНЯЯ РАСШИФРОВКА</small><br><b style="color:${BP_TC[b.t]}">${b.label}</b> — ${CAT_N[b.cat]||'расходник'}<br>
    <small style="color:${BP_TC[b.t]}">${capF(BP_TN[b.t])} · ${rare} · рецепт стоит ~${sellPrice(mkBP(L.key,'rcp'))}₵</small>${L.dup?'<br><small style="color:#ffb04a">Этот рецепт принтер уже знает — дубликат можно продать</small>':''}
    <div class="pcs">${costRow(c)}</div></div></div>`}
function researchHTML(){const pw=powered(),R=ST.res,sp=ST.base.research>=2?2:1,bps=ST.stash.map((it,i)=>[it,i]).filter(([it])=>it.cat==='bp');
  let cur='<p class="help">Станок пуст. Положите неизвестный чертёж — станок выяснит, что это за устройство, насколько оно редкое и из чего печатается.</p>';
  if(R){const p=Math.round((1-R.left/R.total)*100);cur=R.done?`<div class="mcur"><img src="${bpIcon(R.key,true).toDataURL()}"><div><b>${BP[R.key].label}</b><br><small>расшифровано — ящик был полон</small></div><button class="btn sm" id="resTake">Забрать рецепт</button></div>`
    :`<div class="mcur"><img src="${bpAnonIcon().toDataURL()}"><div><b>Расшифровка чертежа…</b>
    <span class="nbar"><i id="resBar" style="width:${p}%;background:#22e6ff"></i></span><small>${pw?`${p}% · что это — станет ясно в конце`:'нет питания — стоит'}</small></div></div>`}
  const list=bps.length?bps.map(([it,i])=>`<button class="btn sm trl" data-res="${i}" ${R||!pw?'disabled':''}><img src="${iconURL(it)}">Неизвестный чертёж<br><small>расшифровка: 15 мин – ${hoursTxt(2/sp)}</small></button>`).join(''):'<p class="help">В ящике нет чертежей. Их находят в рейдах во всех зонах и продают в терминале.</p>';
  return`<div class="sect">ИССЛЕДОВАНИЕ${pw?'':' <span class="tag r">нет питания</span>'}</div>${revealHTML()}${cur}<div class="sect">ЧЕРТЕЖИ В ЯЩИКЕ</div><div class="trls">${list}</div>`}
function printerHTML(){const pw=powered(),known=Object.keys(ST.known||{}).filter(k=>BP[k]),rcps=ST.stash.map((it,i)=>[it,i]).filter(([it])=>it.cat==='rcp');
  const load=rcps.length?`<div class="sect">НОВЫЕ РЕЦЕПТЫ В ЯЩИКЕ</div><div class="trls">${rcps.map(([it,i])=>`<button class="btn sm trl" data-rl="${i}"><img src="${iconURL(it)}">${BP[it.kind].label}<br><small>${ST.known&&ST.known[it.kind]?'уже известен — продать?':'загрузить в принтер'}</small></button>`).join('')}</div>`:'';
  const cats=['ranged','melee','implant','med','battery','ammo','grenade'];
  const rows=known.length?known.sort((a,b)=>cats.indexOf(BP[a].cat)-cats.indexOf(BP[b].cat)||BP[a].t-BP[b].t).map(k=>{const b=BP[k],c=printCost(k),ok=pw&&itemsOK(c);
    return`<div class="prow"><img src="${iconURL(bpSample(k))}"><div class="pn"><b>${b.label}</b><small style="color:${BP_TC[b.t]}">${CAT_N[b.cat]||''}${b.count?` · ×${Math.round(b.count*((ST.base.printer||1)>=2?1.5:1))}`:''}</small><div class="pcs">${costRow(c)}</div></div><button class="btn sm" data-pr="${k}" ${ok?'':'disabled'}>Печать</button></div>`}).join('')
    :'<p class="help">Принтер пока ничего не умеет. Цикл: найти чертёж → исследовать на станке → загрузить рецепт сюда.</p>';
  return`${load}<div class="sect">ПЕЧАТЬ${pw?'':' <span class="tag r">нет питания</span>'} · рецептов: ${known.length}/${BP_KEYS.length}</div><div class="plist">${rows}</div>`}
{const _mp=modulePanel;modulePanel=function(k){const r=_mp(k);MACH.k=null;
  if((k==='research'||k==='printer')&&ST.base[k]>0){MACH.k=k;if(k==='research')resTick();const head=document.querySelector('#panel .hp-head');
    if(head){head.insertAdjacentHTML('afterend',k==='research'?researchHTML():printerHTML());
      document.querySelectorAll('[data-res]').forEach(b=>b.onclick=()=>{const i=+b.dataset.res,it=ST.stash[i];if(!it||ST.res||!powered())return;ST.stash.splice(i,1);const t=RES_MIN[BP[it.kind].t];ST.res={key:it.kind,left:t,total:t};ST.resT=Date.now();log('Станок расшифровывает чертёж…','#22e6ff');saveGame();modulePanel(k)});
      const tk=$('resTake');if(tk)tk.onclick=()=>{if(ST.stash.length>=stashCap())return log('Ящик полон','#ffb04a');ST.stash.push(mkBP(ST.res.key,'rcp'));ST.res=null;saveGame();modulePanel(k)};
      document.querySelectorAll('[data-rl]').forEach(b=>b.onclick=()=>{const i=+b.dataset.rl,it=ST.stash[i];if(!it)return;ST.known=ST.known||{};
        if(ST.known[it.kind]){ST.stash.splice(i,1);const p=sellPrice(it);ST.credits+=p;log(`Дубликат рецепта продан: +${p}₵`,'#f9f871')}else{ST.stash.splice(i,1);ST.known[it.kind]=1;log(`Принтер выучил: ${BP[it.kind].label}`,'#7dff4f')}saveGame();modulePanel(k)});
      document.querySelectorAll('[data-pr]').forEach(b=>b.onclick=()=>{const key=b.dataset.pr,c=printCost(key);if(!powered()||!itemsOK(c))return;if(BP[key].cat!=='ammo'&&ST.stash.length>=stashCap())return log('Ящик полон','#ffb04a');
        for(const m in c)ST.mats[m]-=c[m];const t=printItem(key);log(`Напечатано: ${t}`,'#7dff4f');saveGame();modulePanel(k)})}}
  return r}}
// ---- old item crafting is gone: the printer does it now ----
for(let i=RECIPES.length-1;i>=0;i--)if(RECIPES[i].mod!=='recycler')RECIPES.splice(i,1);
delete UP.wrack;
UP.med.eff=l=>l>=2?'Полное лечение после рейда; аптечки лечат на 40% сильнее':l?'Полное лечение после рейда; аптечки лечат на 20% сильнее':'Лечение и усиление аптечек';
UP.bench.eff=l=>l>=2?'Рюкзак +30, разбор декораций быстрее':l?'Рюкзак +15, разбор предметов на компоненты':'Рюкзак и разбор предметов';
{const _rc=recalc;recalc=function(h){const r=_rc.apply(this,arguments);if(h&&h.st&&ST&&ST.base&&ST.base.med)h.st.healMul=(h.st.healMul||1)*(1+.2*ST.base.med);return r}}
// migrate old saves: a built ammo station becomes a printer; unknown keys default
{const _lg=loadGame;loadGame=function(){const r=_lg.apply(this,arguments);if(ST&&ST.base){if(ST.base.wrack>0&&!ST.base.printer)ST.base.printer=Math.min(2,ST.base.wrack);ST.base.wrack=0;
  for(const k of['research','printer'])if(ST.base[k]==null)ST.base[k]=0;if(!ST.known)ST.known={}}return r}}
// ---- sprites ----
{const _bs=baseSprite;baseSprite=function(kind,lv){
  if(kind==='research')return pixGrid(16,20,P=>{for(let y=10;y<20;y++)for(let x=1;x<15;x++)P(x,y,y===10?'#8f9bb0':y>=18?'#2a2d36':'#4a4e58');
    for(let y=2;y<10;y++)for(let x=3;x<13;x++)P(x,y,(x===3||x===12||y===2)?'#3a3f4e':'#0b1a33');for(let y=4;y<9;y++)for(let x=5;x<11;x++)if((x+y)%3===0)P(x,y,'#22e6ff');P(7,6,'#cfe6ff');P(8,6,'#cfe6ff');
    for(let x=3;x<13;x+=2)P(x,13,lv>=2?'#ff2fa8':'#3aff6a');if(lv>=2){P(1,8,'#8f9bb0');P(1,7,'#8f9bb0');P(14,8,'#8f9bb0');P(14,7,'#22e6ff')}});
  if(kind==='printer')return pixGrid(16,20,P=>{for(let y=4;y<20;y++)for(let x=1;x<15;x++){const edge=x===1||x===14||y===4||y===19;P(x,y,edge?(lv>=2?'#c0c7d4':'#5a6070'):y>15?'#2a2d36':null)}
    for(let y=5;y<16;y++)for(let x=2;x<14;x++)P(x,y,'#141824');for(let x=2;x<14;x++)P(x,7,'#8f9bb0');P(7,8,'#ff9a1f');P(7,9,'#ffd23f');for(let x=5;x<11;x++)P(x,15,'#ff9a1f');for(let x=6;x<10;x++)P(x,14,'#ffb04a');
    P(3,17,'#3aff6a');P(5,17,'#22e6ff');if(lv>=2){for(let y=5;y<16;y++){P(2,y,'#22e6ff')}}});
  return _bs(kind,lv)}}
{const _rb=renderBase;renderBase=function(time){_rb(time);const B=BS;if(!B||!B.objs||!powered())return;const[ox,oy]=camOrigin(),s=curS();ctx.setTransform(s,0,0,s,ox,oy);
  for(const o of B.objs){if(o.site)continue;const cx=o.x*TS+8,cy=o.y*TS;
    if(o.kind==='research'&&ST.res&&!ST.res.done){ctx.globalCompositeOperation='lighter';ctx.fillStyle=`rgba(34,230,255,${.25+.2*Math.sin(time*6)})`;ctx.fillRect(cx-5,cy-2+((time*16|0)%14)/2,10,.5);ctx.globalCompositeOperation='source-over'}
    if(o.kind==='printer'){const p=(time*3)%1;ctx.fillStyle='#ffd23f';ctx.fillRect(cx-4+Math.round(p*16)/2,cy+3,.5,.5);ctx.fillStyle='rgba(255,138,31,.6)';ctx.fillRect(cx-4+Math.round(p*16)/2,cy+3.5,.5,.5)}}}}
