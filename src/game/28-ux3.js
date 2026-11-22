// ================= UX: toggle base menus, tap = act, long-press = details =================
// base bar: second tap on the same button closes its panel
let BASE_OPEN=null;
document.querySelectorAll('[data-base]').forEach(b=>b.onclick=()=>{if(MODE!=='base')return;const k=b.dataset.base;
  if($('ov').classList.contains('on')&&BASE_OPEN===k){hideOv();BASE_OPEN=null;return}
  BASE_OPEN=k;baseWalkTo(k)});
{const _h=hideOv;hideOv=function(){BASE_OPEN=null;return _h()}}
// tap vs long-press helper: tap runs act, holding ~0.45s runs hold (details)
function tapHold(el,onTap,onHold){let t=null,held=false,sx=0,sy=0,moved=false;
  el.addEventListener('pointerdown',e=>{held=false;moved=false;sx=e.clientX;sy=e.clientY;clearTimeout(t);t=setTimeout(()=>{held=true;onHold()},450)});
  el.addEventListener('pointermove',e=>{if(Math.hypot(e.clientX-sx,e.clientY-sy)>7){moved=true;clearTimeout(t)}});
  const end=()=>clearTimeout(t);el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end);el.addEventListener('pointerleave',end);
  el.addEventListener('contextmenu',e=>e.preventDefault());
  el.onclick=e=>{e.preventDefault();if(held||moved)return;onTap()}}
// terminal: tap buys / sells straight away, hold shows the card
{const _tp=tradePanel;tradePanel=function(){const r=_tp.apply(this,arguments);if(TTAB==='hire')return r;const side=TTAB==='buy'?'buy':'sell';
  const hint=document.querySelector('#panel .det.sm.empty');if(hint)hint.textContent=side==='sell'?'Тап — продать сразу · удержание — подробности':'Тап — купить сразу (в ящик) · удержание — подробности';
  document.querySelectorAll('#panel [data-lk]').forEach(b=>{const k=b.dataset.lk;
    tapHold(b,()=>{TRS2[side]=k;_tp();const btn=side==='sell'?($('tS')||$('tS1')||$('tS10')):$('tB');if(btn&&!btn.disabled)btn.click();else tradePanel()},
      ()=>{TRS2[side]=k;tradePanel()})});
  return r}}
// ---- walk cycle preview in the character generator (arsenal → Бойцы) ----
function posedF(set,f){if(!set._pf)set._pf=[];if(set._pf[f])return set._pf[f];const fr0=set.fr[0];set.fr[0]=set.fr[f]||fr0;_posed.delete(set);const c=posed(set);_posed.delete(set);set.fr[0]=fr0;return set._pf[f]=c.toDataURL()}
let ARS_WALK=null;
{const _ra=renderArsenal;renderArsenal=function(){const r=_ra.apply(this,arguments);clearInterval(ARS_WALK);
  if(ARS.cat==='fighters'){const cells=[...document.querySelectorAll('#panel .cell.f')],big=document.querySelector('#panel .bigf');let t=0;const seq=[2,3,4,5];
    ARS_WALK=setInterval(()=>{if(!document.querySelector('#panel .cell.f')){clearInterval(ARS_WALK);return}t++;const f=seq[t&3];
      cells.forEach(c=>{const it=ARS.list[+c.dataset.i];const im=c.querySelector('img');if(it&&it.s&&im)im.src=posedF(it.s,f)});
      const sel=ARS.list[ARS.sel]||ARS.list[0];if(big&&sel&&sel.s)big.src=posedF(sel.s,f)},170)}
  return r}}
