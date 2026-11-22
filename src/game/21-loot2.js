// ================= TIERED LOOT & UPGRADE ECONOMY =================
// Ярусы компонентов = уровни улучшений: 1-й уровень строится из того, что падает в канализации и переулках,
// 2-й — улицы и серверная, 3-й — ядро и верхние глубокие биомы, видеокарты — самые глубокие сектора.
const zoneTier=f=>f<=2?0:f<=4?1:f<=7?2:3;
ZONES.forEach(z=>z.tier=zoneTier(z.f));
TIER_TXT.length=0;TIER_TXT.push('компоненты 1-го уровня: болты, доски, провода, изолента…','компоненты до 2-го уровня: листы металла, арматура, микрочипы…','компоненты до 3-го уровня: сервоприводы, процессоры, аккумуляторы','все компоненты, включая видеокарты');
const LT_DIST=[[.86,.14,0,0],[.35,.55,.10,0],[.18,.34,.43,.05],[.10,.25,.45,.20]];
const LT_POOL=[0,1,2,3].map(t=>MAT_KEYS.filter(k=>MATS[k].t===t&&!MATS[k].lib&&!MATS[k].fuelv));
function pickW(arr){let s=0;for(const a of arr)s+=a[1];let r=Math.random()*s;for(const a of arr)if((r-=a[1])<0)return a[0];return arr[arr.length-1][0]}
rollLoot=function(kind,floor=1){const D=PROP_DEF[kind],out={},Z=zoneTier(floor||1),dist=LT_DIST[Z];
  let n=D.rolls[0]+Math.floor(Math.random()*(D.rolls[1]-D.rolls[0]+1))+(Z>=2?1:0);
  for(let i=0;i<n;i++){const t=pickW(dist.map((p,k)=>[k,p]));
    const own=D.loot.filter(([m])=>MATS[m].t===t&&!MATS[m].fuelv);
    const m=own.length&&Math.random()<.65?pickW(own):LT_POOL[t][(Math.random()*LT_POOL[t].length)|0];
    out[m]=(out[m]||0)+(t===0&&Math.random()<.45?2:1)}
  const kc=[.07,.09,.11,.13][Z]*(D.loot.some(([m])=>m==='chip'||m==='boards'||m==='cpu')?1.6:1);
  if(Math.random()<kc){const k=pickW([[['mag'],[1,.6,.15,.05][Z]],[['book'],[0,.4,.5,.35][Z]],[['disk'],[0,0,.35,.6][Z]]].map(([a,w])=>[a[0],w]));out[k]=(out[k]||0)+1}
  const fc=[.08,.09,.10,.11][Z]*(D.loot.some(([m])=>m==='fuel')?4:1);
  if(Math.random()<fc){const k=pickW([['fuelS',[.8,.4,.2,0][Z]],['fuel',[.2,.5,.5,.4][Z]],['fuelL',[0,.1,.3,.6][Z]]]);out[k]=(out[k]||0)+1}
  return out};
// deeper = rarer items (still capped by the zone)
{const _mi=makeItem;makeItem=function(seed,cat,lvl,force={}){const it=_mi(seed,cat,lvl,force);
  if(typeof MODE!=='undefined'&&MODE==='raid'&&G&&G.floor&&force.rar==null&&it&&it.rar!=null){const cap=zoneOf(G.floor).rar,ch=Math.min(.55,.07*(G.floor-1));
    if(it.rar<cap&&Math.random()<ch)return _mi(seed,cat,lvl,{...force,rar:it.rar+1})}return it}}
// ---- base upgrades: level N uses components of tier N ----
{const L=(it,cr,req={},raids=0)=>({it,cr,req,raids});
  UP.gen.L=[null,L({bolts:4,wire:3,junk:6},60),L({sheet:4,cap:3,fuel:1},220,{bench:1},1),L({battery:2,servo:2,cpu:1},550,{bench:2,light:1},1)];
  UP.light.L=[null,L({bulb:4,wire:3,tape:2},40,{gen:1}),L({chip:2,cap:2,sheet:2},160,{light:1},1)];
  UP.bed.L=[null,null,L({boards:4,bolts:4,bandage:2},50),L({sheet:3,antisep:2,chip:1},260,{gen:1},1)];
  UP.crate.L=[null,null,L({boards:3,bolts:3},30),L({boards:5,bricks:4,tape:3},80),L({sheet:4,rebar:3,cement:2},180,{bench:1}),L({sheet:6,rebar:4,chip:2},350,{bench:1}),L({servo:2,battery:1,cpu:1},600,{bench:2})];
  UP.bench.L=[null,L({boards:4,bolts:6,tape:2},40),L({sheet:4,rebar:3,cap:2},200,{gen:1},1)];
  UP.med.L=[null,L({bandage:3,tape:2,bulb:1},50),L({antisep:4,chip:2,sheet:2},220,{gen:1,bench:1},1)];
  UP.wrack.L=[null,L({bolts:6,spring:4,junk:8},60,{bench:1}),L({sheet:3,cap:3,rebar:2},220,{gen:1},1)];
  UP.recycler.L=[null,L({sheet:4,rebar:2,bolts:8},150,{bench:1,gen:1},1)];
  UP.farm.L=[null,L({chip:3,cap:4,sheet:4},320,{gen:2,light:1},1),L({cpu:2,servo:1,battery:1},650,{farm:1,bench:2},2),L({gpu:2,cpu:2,battery:2},1200,{farm:2,gen:3},2)];}
// ---- weapons: upgrade +N uses tier N components, repairs stay cheap ----
const WUP_T=[0,1,2,2,3];
function tierMats(r,cat,t,n){const pref=(REC_POOL[cat]||[]).filter(k=>MATS[k].t===t),pool=pref.concat(LT_POOL[t].filter(k=>k!=='fuel'));const out=[];let g=0;
  while(out.length<n&&g++<50){const k=pool[(r.f()*pool.length)|0];if(k&&!out.includes(k))out.push(k)}return out}
upgradeCost=function(w){const u=w.up||0,T=WUP_T[Math.min(4,u)],r=RNG(mix32((w.seed+(u+1)*7919)>>>0)),k=(H.st.craftMul||1),cost={};
  const add=(m,n)=>{cost[m]=Math.max(1,Math.round(n*k))};
  const main=tierMats(r,w.cat,T,1)[0];add(main,[5,3,2,1][T]+(T===0?u:0)+(w.rar>=3?1:0));
  if(T>0){const s=tierMats(r,w.cat,T-1,1)[0];if(s&&s!==main)add(s,[4,3,2][T-1]+1)}
  const b=tierMats(r,w.cat,0,2).find(m=>!cost[m]);if(b)add(b,3+u);
  return cost};
repairCost=function(w){const T=Math.min(2,Math.floor((w.up||0)/2)),r=RNG(mix32((w.seed^0xBEEF1)>>>0)),miss=1-cond(w),k=(H.st.craftMul||1),cost={};
  const ks=tierMats(r,w.cat,0,2);if(T>0){const m=tierMats(r,w.cat,T,1)[0];if(m)ks[1]=m}
  ks.forEach((m,i)=>{const base=(i===0?4:2)*(1+w.rar*.3)/Math.max(1,MATS[m].t*1.5);cost[m]=Math.max(1,Math.round(base*miss*k*1.6))});return cost};
const TIER_WHERE=['канализация и переулки (эт. 1–2)','улицы и серверная (эт. 3–4)','ядро, Киберснег, Биолаборатория (эт. 5–7)','Технопустыня, Туманные сектора, Цеха (эт. 8+)'];
function whereMats(it){const t=Math.max(0,...Object.keys(it||{}).map(m=>MATS[m].t));return`<p class="st" style="color:#a8a0c6">Компоненты ${t+1}-го уровня · где искать: <b style="color:#f9f871">${TIER_WHERE[t]}</b></p>`}
TIER_N.splice(0,TIER_N.length,'компонент 1-го уровня','компонент 2-го уровня','компонент 3-го уровня','компонент 4-го уровня');
