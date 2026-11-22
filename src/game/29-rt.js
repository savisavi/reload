// ---- real-time controls: pause button, Space, pause tag ----
(function(){
  const side=$('side'),sp=$('bSpeed');
  const b=document.createElement('button');b.className='btn';b.id='bPlay';b.textContent='❚❚';side.insertBefore(b,sp);
  const tag=document.createElement('div');tag.id='pauseTag';tag.textContent='ПАУЗА';document.body.append(tag);
  const flip=()=>{if(MODE!=='raid'||!G||G.dead)return;G.paused=!G.paused;sync()};
  b.onclick=ev=>{ev.stopPropagation();flip()};
  addEventListener('keydown',ev=>{if(ev.code==='Space'&&MODE==='raid'&&G&&!G.dead&&!(ev.target&&/INPUT|TEXTAREA/.test(ev.target.tagName))){ev.preventDefault();flip()}});
  function sync(){const on=MODE==='raid'&&G&&G.paused&&!G.dead;b.textContent=on?'▶':'❚❚';b.classList.toggle('on',!!on);tag.style.display=on&&!SHEET?'block':'none';b.style.display=MODE==='raid'?'':'none'}
  (function poll(){sync();requestAnimationFrame(poll)})();
})();
// ---- anti-oscillation: if the merc keeps stepping back and forth between two tiles, commit to a route ----
{const _act=act;act=function(a){const P=G&&G.p;const ox=P?P.x:0,oy=P?P.y:0;const r=_act(a);
  if(MODE==='raid'&&P&&!G.dead&&!G.manual&&(P.x!==ox||P.y!==oy)){const h=G._ph||(G._ph=[]);h.push(P.y*G.M.W+P.x);if(h.length>14)h.shift();
    if(h.length>=12&&new Set(h).size<=2&&!(G.forcePath&&G.forcePath.length)){G._ph=[];G._osc=(G._osc||0)+1;const M=G.M;
      const tgt=G.mode.goal==='home'||G._osc>2?M.evac:G.mode.goal==='deeper'?M.exit:null;let p=null;
      if(tgt)p=bfs(P.x,P.y,(x,y)=>x===tgt.x&&y===tgt.y,false,true);
      if(!p){const seen=G.seen;p=bfs(P.x,P.y,(x,y)=>Math.abs(x-P.x)+Math.abs(y-P.y)>=8&&(!seen||!seen[y*M.W+x]),false,true)||bfs(P.x,P.y,(x,y)=>x===M.exit.x&&y===M.exit.y,false,true)}
      if(p){G.forcePath=p.slice(0,16);log('Наёмник топтался на месте — иду другим путём','#8a83ab')}}}
  return r}}
{const _nf=newFloor;newFloor=function(){const r=_nf.apply(this,arguments);if(G){G._ph=[];G._osc=0}return r}}
// ---- XP bar in the HUD ----
{const _uh=updateHUD;let lastLv=0;updateHUD=function(){const r=_uh.apply(this,arguments);try{if(!H)return r;const need=6+H.lvl*2,f=$('xpf');if(!f)return r;
  f.style.width=Math.min(100,H.xp/need*100)+'%';$('xpt').textContent=`ур. ${H.lvl} · опыт ${Math.floor(H.xp)}/${need}`;
  if(lastLv&&H.lvl>lastLv){const b=$('hudxp');b.classList.remove('up');void b.offsetWidth;b.classList.add('up')}lastLv=H.lvl}catch(e){}return r}}
