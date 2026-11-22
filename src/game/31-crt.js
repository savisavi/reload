// ================= CRT MASK: scanlines, RGB aperture grille, curved vignette, flicker, rolling band =================
const CRT={mode:(()=>{try{return localStorage.getItem('neongen_crt')||'full'}catch(e){return'full'}})()};
(function(){const d=document.createElement('div');d.id='crt';d.innerHTML='<i class="sl"></i><i class="ag"></i><i class="roll"></i><i class="vig"></i><i class="glass"></i>';document.body.append(d);})();
function crtApply(){document.body.classList.remove('crt-off','crt-light','crt-full');document.body.classList.add('crt-'+CRT.mode);try{localStorage.setItem('neongen_crt',CRT.mode)}catch(e){}}
crtApply();
{const _sp=settingsPanel;settingsPanel=function(){_sp();const p=$('panel');const box=document.createElement('div');
  const opt=[['off','Выкл'],['light','Лёгкая'],['full','Полная']];
  box.innerHTML=`<div class="sect">ЭКРАН</div><p class="help">CRT-маска: строки развёртки, RGB-решётка, скруглённый кинескоп, мерцание.</p><div class="tabs">${opt.map(([k,n])=>`<button class="tab ${CRT.mode===k?'on':''}" data-crt="${k}">${n}</button>`).join('')}</div>`;
  p.insertBefore(box,p.querySelector('.sect'));
  box.querySelectorAll('[data-crt]').forEach(b=>b.onclick=()=>{CRT.mode=b.dataset.crt;crtApply();box.querySelectorAll('[data-crt]').forEach(x=>x.classList.toggle('on',x===b))})}}
