// ================= CREDITS AS LOOT: enemies and stashes drop cash, banked on a successful evac =================
const CASH_ICON=pixIcon(P=>{const G={l:'#fff1a0',b:'#f9d030',m:'#c8a020',d:'#8a6a10'};
  for(let s=0;s<4;s++){const y=24-s*5,x=4+(s%2)*3;P.r(x,y,16,4,G.b);P.r(x,y,16,1,G.l);P.r(x,y+3,16,1,G.d);P.r(x,y+1,1,2,G.l);P.r(x+15,y+1,1,2,G.m);for(let i=x+3;i<x+14;i+=3)P(i,y+2,G.m)}
  P.ball(23,10,6,6,G);P.r(22,6,2,8,G.d);P.r(20,7,5,1,G.d);P.r(20,12,5,1,G.d);P(21,7,G.l);
  P(27,3,'#ffffff');P.r(26,4,3,1,'#fff1a0');P.r(27,3,1,3,'#fff1a0')});
ITEMGEN.cash=function(it,r,f){it.kind='кредиты';it.amount=Math.max(1,f.n|0);it.rar=it.amount>=60?2:it.amount>=25?1:0;it.name=`${it.amount}₵`;it.lines=['Кредиты'];it.icon=CASH_ICON};
ITEM_W.cash=0;BASEV.cash=0;CAT_N.cash='Кредиты';
const cashRoll=(base,f)=>Math.max(1,Math.round(base*(1+.35*(f-1))*(.6+Math.random()*.8)));
function dropCash(n,x,y){if(n>0)dropItem(makeItem(rseed(),'cash',1,{n}),x,y)}
{const _k=kill;kill=function(e){const r=_k.apply(this,arguments);if(MODE==='raid'&&G&&e){const f=G.eff||G.floor||1;
  if(e.human?Math.random()<.6:Math.random()<.22)dropCash(cashRoll(e.human?6:3,f),e.x,e.y)}return r}}
// stashes, lockers and terminals sometimes hold cash
{const _lp=lootProp;lootProp=function(pr){const hp0=pr.hp;const r=_lp(pr);
  if(hp0===1&&MODE==='raid'&&G&&Math.random()<.14){const n=cashRoll(5,G.floor||1);G.pack.cr=(G.pack.cr||0)+n;float(pr,`+${n}₵`,'#f9d030',-20);log(`Найдено ${n}₵`,'#f9d030')}return r}}
{const _pa=pickupAt;pickupAt=function(x,y){for(let i=G.items.length-1;i>=0;i--){const it=G.items[i];if(it.cat!=='cash'||it.x!==x||it.y!==y)continue;
    G.pack.cr=(G.pack.cr||0)+it.amount;G.items.splice(i,1);float(G.p,`+${it.amount}₵`,'#f9d030',-14);if(typeof AUD!=='undefined'&&AUD.play)try{AUD.play('pickup')}catch(e){}}
  return _pa.apply(this,arguments)}}
