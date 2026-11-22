// ================= ROSTER: several mercenaries, one active =================
const ROSTER_CAP=4;
function heroToObj(h){return{dens:h.dens||'mid',stats:h.stats,dead:!!h.dead,attr:h.attr,pts:h.pts||0,seeds:h.ch.seeds,name:h.name,lvl:h.lvl,xp:h.xp,hp:h.hp,mp:h.mp,
  eq:{melee:ser(h.eq.melee),ranged:ser(h.eq.ranged),armor:ser(h.eq.armor),clothes:ser(h.eq.clothes),pas:h.eq.pas.map(ser),act:h.eq.act.map(ser)},
  bag:(h.bag||[]).map(ser),bagMats:h.bagMats||{},inv:{meds:h.inv.meds.map(ser),bats:h.inv.bats.map(ser),grens:(h.inv.grens||[]).map(ser),ammo:h.inv.ammo}}}
function heroFromObj(hs){
  const g=generate(hs.seeds,hs.dens||'mid');const h=heroShell({g,seeds:hs.seeds,name:hs.name});h.dens=hs.dens||'mid';
  h.lvl=hs.lvl;h.xp=hs.xp;h.dead=!!hs.dead;if(hs.stats)h.stats=hs.stats;if(hs.attr)h.attr=hs.attr;h.pts=hs.pts||0;
  h.eq={melee:de(hs.eq.melee),ranged:de(hs.eq.ranged),armor:de(hs.eq.armor),clothes:de(hs.eq.clothes),pas:hs.eq.pas.map(de),act:hs.eq.act.map(de)};
  h.bag=(hs.bag||[]).map(de);h.bagMats=hs.bagMats||{};h.inv={meds:hs.inv.meds.map(de),bats:hs.inv.bats.map(de),grens:(hs.inv.grens||[]).map(de),ammo:hs.inv.ammo};
  recalc(h);h.hp=Math.min(hs.hp,h.st.mhp);h.mp=Math.min(hs.mp,h.st.mmp);rebuildSprites(h);return h}
function saveGame(){try{localStorage.setItem(SAVE_KEY,JSON.stringify({v:2,hero:heroToObj(H),st:{...ST,stash:ST.stash.map(ser)}}))}catch(e){}}
function loadGame(){try{const raw=localStorage.getItem(SAVE_KEY);if(!raw)return false;const o=JSON.parse(raw);if(o.v!==2)return false;
  ST={...freshState(),...o.st,stash:o.st.stash.map(de)};if(!ST.roster)ST.roster=[];if(!o.st.crateV){ST.base.crate=({1:1,2:3,3:5})[ST.base.crate]||ST.base.crate;ST.crateV=1}for(const k in UP)if(ST.base[k]==null)ST.base[k]=UP[k].start;
  H=heroFromObj(o.hero);return true}catch(e){console.error(e);return false}}
const alive=()=>H&&!H.dead;
const mercCount=()=>(alive()?1:0)+(ST.roster||[]).length;
function activateMerc(i){
  const o=ST.roster.splice(i,1)[0];if(!o)return;
  if(alive())ST.roster.push(heroToObj(H));
  H=heroFromObj(o);recalc(H);H.hp=H.st.mhp;H.mp=H.st.mmp;saveGame();enterBase();
}
function gearToStash(h){let sold=0;const all=[h.eq.melee,h.eq.ranged,h.eq.armor,h.eq.clothes,...h.eq.pas,...h.eq.act,...(h.bag||[]),...h.inv.meds,...h.inv.bats,...(h.inv.grens||[])].filter(Boolean);
  for(const it of all){if(ST.stash.length<stashCap())ST.stash.push(it);else{const p=sellPrice(it);ST.credits+=p;sold+=p}}
  for(const m in h.bagMats||{})ST.mats[m]=(ST.mats[m]||0)+h.bagMats[m];for(const a in h.inv.ammo)ST.ammo[a]=(ST.ammo[a]||0)+h.inv.ammo[a];return sold}
function fireMerc(which){ // 'active' or roster index
  if(which==='active'){if(!alive())return;const sold=gearToStash(H);log(`${H.name} уволен${sold?`, лишнее продано за ${sold}₵`:''}`,'#ffb04a');
    H.dead=true;H.fired=true;H.eq={melee:null,ranged:null,armor:null,clothes:null,pas:[null,null],act:[null,null]};H.bag=[];H.bagMats={};H.inv={meds:[],bats:[],grens:[],ammo:{'пули':0,'дробь':0,'энергия':0}};
    if(ST.roster.length){const o=ST.roster.shift();H=heroFromObj(o);H.hp=H.st.mhp;H.mp=H.st.mmp}}
  else{const o=ST.roster.splice(which,1)[0];if(!o)return;const h=heroFromObj(o);const sold=gearToStash(h);log(`${h.name} уволен${sold?`, лишнее продано за ${sold}₵`:''}`,'#ffb04a')}
  saveGame();enterBase();
}
let MSEL='active',MFIRE=null;
function mercCard(h,key,active){
  const bar=(v,m,c)=>`<div class="mbar"><i style="width:${Math.max(0,v/m*100)}%;background:${c}"></i><span>${v}/${m}</span></div>`;
  return`<button class="mcard ${MSEL===key?'on':''} ${active?'act':''}" data-m="${key}"><img src="${posed(h.spr.r).toDataURL()}"><div class="mi"><b>${h.name}</b><span>ур. ${h.lvl}${active?' · <em>АКТИВЕН</em>':''}</span>${bar(h.hp,h.st.mhp,'linear-gradient(90deg,#a82a4e,#ff4b6a)')}${bar(h.mp,h.st.mmp,'linear-gradient(90deg,#1f4fb8,#22b6ff)')}${bar(h.xp,6+h.lvl*2,'linear-gradient(90deg,#22e6ff,#7dff4f)')}</div></button>`}
function mercsPanel(){
  const list=[];if(alive())list.push({key:'active',h:H,active:true});(ST.roster||[]).forEach((o,i)=>list.push({key:String(i),h:heroFromObj(o),active:false}));
  if(!list.find(x=>x.key===MSEL))MSEL=list[0]?list[0].key:null;
  const sel=list.find(x=>x.key===MSEL);
  let det='<p class="help">Наёмников нет. Нанять — в терминале, вкладка «Наём».</p>';
  if(sel){const h=sel.h,S=h.stats||{},gear=[h.eq.ranged,h.eq.melee,h.eq.armor,h.eq.clothes,...h.eq.act,...h.eq.pas].filter(Boolean);
    det=`<div class="rdet"><img class="big" src="${posed(h.spr.r).toDataURL()}"><div>
      <div class="nm">${h.name} <span class="lvl">ур. ${h.lvl} · опыт ${Math.floor(h.xp)}/${6+h.lvl*2}</span></div><div class="xpbar" style="margin:4px 0 6px"><i style="width:${Math.min(100,h.xp/(6+h.lvl*2)*100)}%"></i></div>
      <p>HP ${h.hp}/${h.st.mhp} · EN ${h.mp}/${h.st.mmp} · защ ${h.st.def} · уклон ${Math.round(h.st.dodge*100)}% · сумка ${h.st.cap+15*ST.base.bench}</p>
      <div class="rg">${gear.map(it=>`<img title="${it.name}" src="${iconURL(it)}" style="border-bottom:2px solid ${RAR[it.rar].c}">`).join('')}</div>
      <p class="rs">рейдов ${S.raids||0} · заработал ${S.earned||0}₵ · убил ${S.kills||0} · рекорд глубины ${S.deep||0}</p></div></div>
      <div class="row">${sel.active?`<button class="btn go" id="mEq">Снаряжение</button>`:`<button class="btn go" id="mAct">Сделать активным</button>`}
      <button class="btn" id="mFire" style="color:#ff6a7a">${MFIRE===MSEL?'Точно уволить? Нажмите ещё раз':'Уволить'}</button></div>
      <p class="help">Активен только один наёмник — он идёт в рейд. При увольнении снаряжение и сумка уходят в ящик.</p>`}
  const attrs=sel?attrCards(sel.h,sel.active):'';
  showOv(`<h2>НАЁМНИКИ <small>${list.length}/${ROSTER_CAP}</small></h2><div class="mgrid"><div class="mlist mcards">${list.map(x=>mercCard(x.h,x.key,x.active)).join('')}</div><div class="mattr"><div class="lh mh"><b>ПРОКАЧКА</b>${sel&&!sel.active?'<span>доступна у активного</span>':''}</div>${attrs}</div></div>${det}`,true);
  document.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{MSEL=b.dataset.m;MFIRE=null;mercsPanel()});
  const on=(id,f)=>{const e=$(id);if(e)e.onclick=f};
  on('mEq',()=>baseInvPanel());on('mAct',()=>{activateMerc(+MSEL);MSEL='active';mercsPanel()});
  on('mFire',()=>{if(MFIRE!==MSEL){MFIRE=MSEL;return mercsPanel()}MFIRE=null;fireMerc(MSEL==='active'?'active':+MSEL);MSEL='active';mercsPanel()});
  bindAttr(mercsPanel);bindOv();
}
