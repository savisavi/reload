// ================= GENERATOR FUEL: real-time burn in units/hour, canisters of 3 sizes, cells & batteries as backup =================
// ST.fuelU = units in the tank (float), ST.fuelT = last time the burn was applied. Burn: 2 / 1.5 / 1 u/h on generator lv 1/2/3.
const CELLS_PER_U=5,BAT_U=4,FUEL_ORDER=['fuelS','fuel','fuelL'];
const genRate=()=>[0,2,1.5,1][Math.min(3,ST.base.gen||0)]||2;
const fuelTxt=u=>(Math.round(u*10)/10).toString().replace('.',',');
const hoursTxt=h=>{if(h<=0)return'0 мин';const m=Math.max(1,Math.round(h*60));if(m<60)return`${m} мин`;if(h>=10)return`${Math.round(h)} ч`;return m%60?`${Math.floor(m/60)} ч ${m%60} мин`:`${m/60} ч`};
const stashBats=()=>ST.stash.filter(it=>it.cat==='battery');
const fuelStock=()=>FUEL_ORDER.reduce((s,m)=>s+(ST.mats[m]||0)*MATS[m].fuelv,0)+Math.floor((ST.ammo['энергия']||0)/CELLS_PER_U)+stashBats().length*BAT_U;
const fuelHours=()=>ST.base.gen>0?(ST.fuelU||0)/genRate():0;
function fuelSync(){if(ST.fuelU==null)ST.fuelU=(ST.fuel||0)*4;ST.fuel=ST.base.gen>0&&ST.fuelU>0.0001?1:0}
MAT_DESC.fuelS='Малая канистра: 4 ед. топлива. Генератор тратит 2 / 1,5 / 1 ед. в час (ур. 1 / 2 / 3).';
MAT_DESC.fuel='Средняя канистра: 10 ед. топлива. Генератор тратит 2 / 1,5 / 1 ед. в час (ур. 1 / 2 / 3).';
MAT_DESC.fuelL='Большая канистра: 24 ед. топлива. Генератор тратит 2 / 1,5 / 1 ед. в час (ур. 1 / 2 / 3).';
// one portion from the stock; returns units added
function feedFuel(src,quiet){let add=0,txt='';
  if(MATS[src]&&MATS[src].fuelv){if(!(ST.mats[src]>0))return 0;ST.mats[src]--;add=MATS[src].fuelv;txt=MATS[src].n}
  else if(src==='cells'){const c=ST.ammo['энергия']||0;if(c<CELLS_PER_U)return 0;const n=Math.min(Math.floor(c/CELLS_PER_U),4);ST.ammo['энергия']-=n*CELLS_PER_U;add=n;txt=`энергоячейки ×${n*CELLS_PER_U}`}
  else if(src==='bat'){const b=stashBats()[0];if(!b)return 0;ST.stash.splice(ST.stash.indexOf(b),1);add=BAT_U;txt='энергобатарея'}
  if(!add)return 0;ST.fuelU=(ST.fuelU||0)+add;fuelSync();if(!quiet)log(`Генератор: ${txt} → +${add} ед. (в баке ${fuelTxt(ST.fuelU)} ед.)`,'#7dff4f');return add}
function feedNext(){for(const s of[...FUEL_ORDER,'cells','bat']){const n=MATS[s]?MATS[s].n:s==='cells'?'энергоячейки':'энергобатарея',a=feedFuel(s,true);if(a)return`${n} +${a}`}return null}
// burn fuel for the real time that has passed (also while the game was closed), topping up from the stash as the tank runs dry
function fuelTick(silent){if(!ST)return;const now=Date.now();if(ST.fuelU==null)fuelSync();if(!ST.fuelT){ST.fuelT=now;return}
  let h=(now-ST.fuelT)/3.6e6;ST.fuelT=now;if(!(ST.base.gen>0)||!needsPower()||h<=0){fuelSync();return}
  let need=h*genRate();const took=[];let out=0;
  while(need>0){if(ST.fuelU>=need){ST.fuelU-=need;need=0;break}need-=ST.fuelU;ST.fuelU=0;const t=feedNext();if(!t){out=need/genRate();break}took.push(t)}
  fuelSync();
  if(!silent&&took.length)log(`Генератор сам дозаправился из ящика: ${took.join(', ')}`,'#7dff4f');
  if(!silent&&out>.02)log(`Топливо кончилось ~${hoursTxt(out)} назад — убежище было без питания`,'#ff6a7a');
  if(took.length||out)saveGame()}
// keep at least a little in the tank when there's stock (so a raid launch never finds it empty)
function ensureFuel(report){fuelTick(true);if(!(ST.base.gen>0)||!needsPower()||ST.fuelU>0.0001)return false;const t=feedNext();
  if(t){const m=`Генератор заправился из ящика: ${t} → ${fuelTxt(ST.fuelU)} ед.`;if(report)report.push(m);else log(m,'#7dff4f');return true}return false}
function fuelHTML(){fuelTick(true);const r=genRate(),cells=ST.ammo['энергия']||0,bats=stashBats().length,stock=fuelStock(),tank=ST.fuelU||0;
  const opt=FUEL_ORDER.map(m=>[m,MATS[m].n,ST.mats[m]||0,`+${MATS[m].fuelv} ед. = ${hoursTxt(MATS[m].fuelv/r)}`,MAT_ICON[m].toDataURL()]).concat([['cells','Энергоячейки',cells,`${CELLS_PER_U} шт. = 1 ед.`,null],['bat','Энергобатареи',bats,`1 шт. = ${BAT_U} ед.`,null]]);
  const total=(tank+stock)/r,warn=total<4?'#ff6a7a':total<12?'#ffb04a':'#7dff4f',until=new Date(Date.now()+total*3.6e6);
  return`<div class="sect">ТОПЛИВО</div>
  <p>В баке: <b>${fuelTxt(tank)} ед.</b> — на <b>${hoursTxt(tank/r)}</b> · в ящике ещё <b>${stock} ед.</b> · расход <b>${fuelTxt(r)} ед./ч</b></p>
  <p>Всего питания хватит на <b style="color:${warn}">${hoursTxt(total)}</b>${total>0?` — примерно до <b style="color:${warn}">${until.toLocaleString('ru-RU',{weekday:'short',hour:'2-digit',minute:'2-digit'})}</b>`:''}</p>
  <p class="help">Генератор работает в реальном времени, даже когда игра закрыта. Чем выше уровень, тем экономнее: 2 → 1,5 → 1 ед. в час. Когда бак пустеет, он сам берёт из ящика канистры (от малых), потом энергоячейки, потом батареи.</p>
  <div class="trls">${opt.map(([k,n,c,v,ic])=>`<button class="btn sm trl" data-fuel="${k}" ${c&&(k!=='cells'||c>=CELLS_PER_U)?'':'disabled'}>${ic?`<img src="${ic}">`:'<span style="font-size:16px;color:#22e6ff">⚡</span>'}${n} ×${c}<br><small>${v}</small></button>`).join('')}</div>`}
{const _eb=enterBase;enterBase=function(){fuelTick(false);ensureFuel();return _eb()}}
{const _sr=startRaid;startRaid=function(){ensureFuel();return _sr.apply(this,arguments)}}
{const _lg=loadGame;loadGame=function(){const r=_lg.apply(this,arguments);if(ST){fuelSync();if(!ST.fuelT)ST.fuelT=Date.now()}return r}}
setInterval(()=>{if(ST&&MODE){const was=ST.fuel;fuelTick(true);if(was!==ST.fuel&&MODE==='base')enterBase()}},60000);
