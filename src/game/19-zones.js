// ================= ZONES, SMARTER MERC, LOOT GATING =================
let RAID_FROM=1;
const ZONES=[
  {b:'sewer',f:1,lv:'1+',rar:1,tier:1},
  {b:'alley',f:2,lv:'3+',rar:2,tier:1},
  {b:'streets',f:3,lv:'5+',rar:2,tier:2},
  {b:'server',f:4,lv:'7+',rar:3,tier:2},
  {b:'core',f:5,lv:'9+',rar:4,tier:3}];
const zoneOf=f=>{const b=biomeFor(f||1);return ZONES.find(z=>z.b===b)||ZONES[ZONES.length-1]};
const TIER_TXT=['хлам','компоненты до микрочипов','компоненты до процессоров и сервоприводов','все компоненты, включая видеокарты'];
const mercDeep=h=>Math.max(1,(h&&h.stats&&h.stats.deep)||1);
// ---- loot is gated by zone: rarity and component tier ----
{const _mi=makeItem;makeItem=function(seed,cat,lvl,force={}){const it=_mi(seed,cat,lvl,force);
  if(typeof MODE!=='undefined'&&MODE==='raid'&&G&&G.floor&&force.rar==null&&it&&it.rar!=null){const cap=zoneOf(G.floor).rar;if(it.rar>cap)return _mi(seed,cat,lvl,{...force,rar:cap})}return it}}
function capMats(out,cap,pool){for(const m of Object.keys(out))if(MATS[m].t>cap){const n=out[m];delete out[m];const alt=pool.filter(k=>MATS[k].t===Math.min(cap,MATS[m].t));const k=alt.length?alt[(Math.random()*alt.length)|0]:'junk';out[k]=(out[k]||0)+n}return out}
{const _rl=rollLoot;rollLoot=function(kind,floor){return capMats(_rl(kind,floor),zoneOf(floor).tier,PROP_DEF[kind].loot.map(x=>x[0]))}}
{const _sy=scrapYield;scrapYield=function(it,A){const r=_sy(it,A);if(typeof MODE!=='undefined'&&MODE==='raid'&&G&&G.floor)capMats(r.mats,zoneOf(G.floor).tier,(SCRAP[it.cat]||[]).map(x=>x[0]));return r}}
// ---- the merc remembers how far it got ----
{const _nf=newFloor;newFloor=function(){_nf();const S=H.stats||(H.stats={raids:0,earned:0,kills:0,turns:0,deep:0,born:Date.now()});
  if(G.floor>(S.deep||0)){const z0=zoneOf(S.deep||1),z1=zoneOf(G.floor);S.deep=G.floor;if(z1!==z0&&G.floor===z1.f)log(`Новая зона разведана: ${BIOMES[z1.b].name} — теперь можно стартовать отсюда`,'#7dff4f')}}}
// hired professionals already know the way to the zones of their level
{const _br=buildRecruit;buildRecruit=function(sp){const h=_br(sp);h.stats.deep=sp.lvl>=9?5:sp.lvl>=7?4:sp.lvl>=5?3:sp.lvl>=3?2:1;return h}}
// ---- smarter merc: melee weak enemies to save ammo, go home when the pack is full ----
function meleeDmg(){const P=G.p,w=P.eq.melee;if(!w||broken(w))return 0;return(avg(w.dmg)+P.st.atk)*(P.st.meleeMul||1)*condDmg(w)*(1-(P.st.selfMiss||0))}
function weakFoe(e){const P=G.p,d=meleeDmg();if(!d)return false;const hits=Math.ceil(e.hp/Math.max(1,d-(e.def||0)));
  const ranged=e.weapon&&e.weapon.cat==='ranged',w=P.eq.ranged,lowAmmo=w&&(w.clip+P.inv.ammo[w.ammo])<w.mag*1.5;
  const awake=G.en.filter(o=>!o.dead&&o.awake&&G.vis[idx(o.x,o.y)]).length;
  return awake<=2&&P.hp>P.st.mhp*.5&&(hits<=(lowAmmo?3:2))&&(!ranged||hits<=1||md(e,P)<=2)}
{const _hd=heroDecide;heroDecide=function(){const P=G.p;
  if(!G.manual&&G.mode.goal!=='home'&&packW()>=capacity()*.9){G.mode.goal='home';log('Рюкзак полон — наёмник несёт добычу на базу','#ffb04a');updateHUD()}
  const a=_hd();
  if(a&&a.shoot&&!G.manual&&weakFoe(a.shoot)){const t=a.shoot;if(md(t,P)===1)return{melee:t};
    const p=bfs(P.x,P.y,(x,y)=>x===t.x&&y===t.y,true);if(p&&p.length>=1&&p.length<=8){if(!G._mlog||G.turn-G._mlog>40){G._mlog=G.turn;log('Слабый противник — экономлю патроны','#a8a0c6')}return{dx:p[0][0]-P.x,dy:p[0][1]-P.y}}}
  return a}}
// ---- zone picker before the raid ----
function zonePick(){
  const deep=mercDeep(H),known=ZONES.filter(z=>z.f<=deep);
  if(known.length<=1){RAID_FROM=1;closeSheet();return startRaid()}
  const cards=known.map(z=>{const ok=true,B=BIOMES[z.b];return`<button class="zcard ${ok?'':'lock'}" ${ok?`data-z="${z.f}"`:'disabled'}><b>${B.name}</b><span>этаж ${z.f} · уровень ${z.lv}</span><em>лут: до «${RAR[z.rar].n}» · ${TIER_TXT[z.tier]}</em>${ok?'':'<i>ещё не разведана</i>'}</button>`}).join('');
  showOv(`<h2>КУДА ИДЁМ?</h2><p class="help">${H.name} знает дорогу до ${BIOMES[known[known.length-1].b].name}. Глубже — сильнее враги и ценнее добыча: редкие предметы и детали встречаются только в дальних зонах.</p><div class="zlist">${cards}</div>`,true);
  document.querySelectorAll('[data-z]').forEach(b=>b.onclick=()=>{RAID_FROM=+b.dataset.z;closeSheet();hideOv();startRaid()});bindOv();
}
