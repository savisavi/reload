// ================= SCRAPPING: unwanted gear → components =================
const SCRAP={
  melee:[['bolts',3],['spring',2],['tape',2],['sheet',1.5],['rebar',1],['servo',.25]],
  ranged:[['spring',3],['bolts',2],['wire',2],['cap',1.2],['chip',1],['servo',.5],['cpu',.12]],
  armor:[['sheet',3],['tape',2],['rebar',1.2],['bolts',1],['cap',.4]],
  clothes:[['tape',3],['bandage',2],['wire',1]],
  implant:[['chip',3],['wire',2],['cap',2],['servo',.8],['battery',.5],['cpu',.4],['gpu',.06]]};
// ВНИ — больше заходов, ИНТ — лучше детали (выше тир), ЛОВ — меньше ломается при разборке
function scrapYield(it,A){
  A=A||{per:5,int:5,agi:5};const tab=SCRAP[it.cat];if(!tab)return{mats:{},broken:0};
  const q=(A.per+A.int+A.agi)/15;
  let rolls=Math.max(1,Math.round((1+it.rar*.8+(it.lvl||1)/4)*(.55+.5*q)));
  if(Math.random()<Math.max(0,(A.per-5)*.1))rolls++;
  if(A.per<5&&Math.random()<(5-A.per)*.1)rolls=Math.max(1,rolls-1);
  const brk=Math.max(0,(5-A.agi)*.09)+(A.agi>5?-.02*(A.agi-5):0)+.05;
  const qual=Math.max(.3,(1+.35*it.rar)*(1+.15*(A.int-5)));
  const w=tab.map(([m,v])=>[m,MATS[m].t>=1?v*qual:v]),tot=w.reduce((s,x)=>s+x[1],0);
  const mats={};let broken=0;
  for(let k=0;k<rolls;k++){if(Math.random()<brk){broken++;continue}let r=Math.random()*tot,m=w[0][0];for(const[n,v]of w){r-=v;if(r<=0){m=n;break}}mats[m]=(mats[m]||0)+1}
  if(!Object.keys(mats).length&&broken)mats.junk=1;
  return{mats,broken};
}
const keepWorth=it=>it.cat==='bp'||it.cat==='rcp'||it.rar>=2||(it.fx&&it.rar>=1);
// scrap into the raid backpack (what does not fit is left behind)
function scrapToPack(it,x,y){
  const{mats,broken}=scrapYield(it,H.attr);const got=[];let lost=0;
  for(const m in mats){const fit=Math.max(0,Math.floor(packFree()/MATS[m].w)),take=Math.min(mats[m],fit);if(take>0){G.pack.mats[m]=(G.pack.mats[m]||0)+take;got.push(`${MATS[m].n} ×${take}`)}lost+=mats[m]-take}
  G.fx.push({type:'spark',x:x*TS+8,y:y*TS+6,t:0});
  float({x,y},'разбор','#c0c7d4',-6);
  log(`Разобрано: ${it.name} → ${got.join(', ')||'ничего'}${broken?` · сломано ${broken}`:''}${lost?` · не влезло ${lost}`:''}`,'#c0c7d4');
}
function scrapToStash(it){
  const{mats,broken}=scrapYield(it,H.attr);for(const m in mats)ST.mats[m]=(ST.mats[m]||0)+mats[m];
  return Object.entries(mats).map(([m,n])=>`${MATS[m].n} ×${n}`).join(', ')+(broken?` · сломано ${broken}`:'');
}
