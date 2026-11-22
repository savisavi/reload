// ================= TITLE SCREEN «RELOAD»: TV-channel demo fights, accounts, leaderboard =================
let DEMO=false,ACC=null,TITLE=null;
// ---- per-account saves: the save key is redirected to the logged-in account; the demo never writes ----
{const SP=Storage.prototype,_g=SP.getItem,_s=SP.setItem,_r=SP.removeItem;
  const rk=k=>k===SAVE_KEY&&ACC?'neongen_acc_'+ACC.id:k;
  SP.getItem=function(k){if(k===SAVE_KEY&&DEMO)return null;return _g.call(this,rk(k))};
  SP.setItem=function(k,v){if(k===SAVE_KEY&&(DEMO||!ACC))return;return _s.call(this,rk(k),v)};
  SP.removeItem=function(k){return _r.call(this,rk(k))};
  window.__rawLS={get:k=>_g.call(localStorage,k),set:(k,v)=>_s.call(localStorage,k,v)}}
const LS=window.__rawLS;
// ---- shared store (accounts + leaderboard + cloud saves). Falls back to this device when unavailable ----
let DB=null;const dbReady=(async()=>{try{if(window.claude&&claude.use){DB=await Promise.race([claude.use('db'),new Promise(r=>setTimeout(()=>r(null),6000))])}}catch(e){DB=null}return DB})();
// own server (Railway / any Node host): /api/* — accounts, leaderboard and saves live there
let API=false;const apiReady=(async()=>{if(!/^https?:$/.test(location.protocol))return false;try{const r=await fetch('/api/health',{cache:'no-store'});const j=r.ok?await r.json():null;API=!!(j&&j.reload)}catch(e){}return API})();
const tok=()=>LS.get('reload_token');
async function api(path,opt={}){const r=await fetch('/api/'+path,{...opt,headers:{'Content-Type':'application/json',...(tok()?{Authorization:'Bearer '+tok()}:{})}});
  const j=await r.json().catch(()=>({}));if(!r.ok)throw Object.assign(new Error(j.error||('HTTP '+r.status)),{status:r.status,msg:j.error});return j}
async function sha(s){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}
const accId=async login=>'p'+(await sha('reload:'+login.trim().toLowerCase())).slice(0,24);
const localAccs=()=>{try{return JSON.parse(LS.get('reload_accounts')||'{}')}catch(e){return{}}};
async function accGet(id){if(DB){try{const s=await DB.doc('players/'+id).get();return s.exists?s.data():null}catch(e){}}return localAccs()[id]||null}
async function accPut(id,o){const a=localAccs();a[id]=o;LS.set('reload_accounts',JSON.stringify(a));if(DB){try{await DB.doc('players/'+id).set(o);return true}catch(e){return e.code||'err'}}return true}
async function loginOrCreate(login,pass){login=login.trim();if(!/^[\wА-Яа-яЁё\-]{3,16}$/.test(login))return{err:'Логин: 3–16 букв, цифр, _ или -'};if(pass.length<4)return{err:'Пароль: минимум 4 символа'};
  if(await apiReady){try{const j=await api('auth',{method:'POST',body:JSON.stringify({login,password:pass})});LS.set('reload_token',j.token);return{id:j.id,login:j.login,created:j.created,cloud:j.save||null}}
    catch(e){return{err:e.msg||'Сервер недоступен — попробуйте позже'}}}
  await dbReady;const id=await accId(login);let a=await accGet(id);
  if(a){const h=await sha(a.salt+':'+pass);if(h!==a.hash)return{err:'Неверный пароль для «'+a.login+'»'};return{id,login:a.login,created:false}}
  if(DB){try{const ref=DB.doc('players/'+id),l=await ref.acquire({holder:id+Math.random(),ttlMs:5000});if(!l.acquired)return{err:'Этот логин сейчас занимают — попробуйте ещё раз'};const again=await ref.get();if(again.exists)return loginOrCreate(login,pass)}catch(e){}}
  const salt=[...crypto.getRandomValues(new Uint8Array(8))].map(x=>x.toString(16).padStart(2,'0')).join('');
  a={login,salt,hash:await sha(salt+':'+pass),stats:{mercs:1,loot:0,cash:0,depth:1},t:Date.now()};const ok=await accPut(id,a);
  if(ok!==true&&DB)return{err:'Не удалось сохранить аккаунт в общей таблице ('+ok+'). Нужен доступ «Участник» к игре.'};return{id,login,created:true}}
// cloud save: one document per account, written at most every 30 s
let cloudT=0,cloudQ=null,cloudBusy=false;
function accStats(){const fallen=(ST.fallen||[]).length;return{mercs:(alive()?1:0)+(ST.roster||[]).length+fallen,loot:Math.round(ST.lootSum||0),cash:ST.credits|0,depth:ST.maxDepth|0}}
async function cloudPush(){if(!ACC||!ST)return;{const a=localAccs();if(a[ACC.id]){a[ACC.id].stats=accStats();a[ACC.id].t=Date.now();LS.set('reload_accounts',JSON.stringify(a))}}if(API){if(cloudBusy)return;cloudBusy=true;try{await api('save',{method:'PUT',body:JSON.stringify({data:LS.get('neongen_acc_'+ACC.id),stats:accStats()})})}catch(e){}cloudBusy=false;return}
  if(!DB||cloudBusy)return;cloudBusy=true;const raw=LS.get('neongen_acc_'+ACC.id);
  try{const st=accStats();await DB.doc('players/'+ACC.id).update({stats:st,t:Date.now()});if(raw&&raw.length<240000)await DB.doc('saves/'+ACC.id).set({data:raw,t:Date.now()})}catch(e){}cloudBusy=false}
{const _sg=saveGame;saveGame=function(){if(DEMO||!ACC)return;const r=_sg.apply(this,arguments);try{const o=JSON.parse(LS.get('neongen_acc_'+ACC.id)||'{}');if(o&&!o.t){o.t=Date.now();LS.set('neongen_acc_'+ACC.id,JSON.stringify(o))}}catch(e){}
  clearTimeout(cloudQ);const wait=Math.max(0,30000-(Date.now()-cloudT));cloudQ=setTimeout(()=>{cloudT=Date.now();cloudPush()},wait);return r}}
// loot counter for the leaderboard
{const _er=endRaid;endRaid=function(success){if(DEMO){demoNext();return}if(success&&G&&G.pack){let v=0;for(const m in G.pack.mats)v+=MATS[m].price*G.pack.mats[m];for(const it of G.pack.items)v+=sellPrice(it);ST.lootSum=(ST.lootSum||0)+v}return _er.apply(this,arguments)}}
{const _hd=heroDies;heroDies=function(){if(DEMO)return;return _hd.apply(this,arguments)}}
{const _ds=deathScreen;deathScreen=function(){if(DEMO)return;return _ds.apply(this,arguments)}}
{const _so=showOv;showOv=function(){if(DEMO&&!TITLE_OV)return;return _so.apply(this,arguments)}}
let TITLE_OV=false;
// ---- demo «channels»: a random merc fighting random foes in a random biome ----
const CH_LIST=[1,2,3,4,5,6,7,8,9,10];let CHN=0,CH_TIMER=null;
function demoNext(){staticBurst(()=>demoChannel())}
function demoChannel(){DEMO=true;ST=freshState();ST.base.gen=0;newHero();const f=CH_LIST[(Math.random()*CH_LIST.length)|0];CHN=(CHN%99)+1;
  ST.maxDepth=f;const L=Math.max(1,f);H.lvl=2+f*2;H.attr={str:5+(f>>1),agi:6+(f>>2),int:5,per:6,vit:6+(f>>1),spd:5+(f>>2)};
  H.eq.ranged=makeItem(rseed(),'ranged',L,{rar:Math.min(3,1+(f>>2))});H.eq.melee=makeItem(rseed(),'melee',L,{rar:Math.min(3,1+(f>>2))});
  if(Math.random()<.5)H.eq.armor=makeItem(rseed(),'armor',L,{rar:1});if(Math.random()<.6)H.eq.clothes=makeItem(rseed(),'clothes',L,{rar:1});
  H.inv.ammo={'пули':999,'дробь':999,'энергия':999};recalc(H);H.hp=H.st.mhp;H.mp=H.st.mmp;rebuildSprites(H);H.showW='r';
  RAID_FROM=f;startRaid();G.speed=1;G.demoT=0;
  const P=G.p;let n=0;for(let k=0;k<40&&n<4;k++){const p=freeTile((x,y)=>{const d=Math.abs(x-P.x)+Math.abs(y-P.y);return d>=3&&d<=7&&!isExit(x,y)});if(p){const e=makeEnemy(p.x,p.y);e.awake=true;G.en.push(e);n++}}
  computeFOV();if(TITLE)titleOSD(f)}
function titleOSD(f){const o=$('tOSD');if(!o)return;const b=BIOMES[biomeFor(f)];o.innerHTML=`<b>CH ${String(CHN).padStart(2,'0')}</b> ${b?b.name:''} · ЭТ. ${f}`;o.classList.remove('on');void o.offsetWidth;o.classList.add('on')}
function staticBurst(mid){const c=$('tStatic');if(!c){mid&&mid();return}c.width=160;c.height=100;const x=c.getContext('2d');c.style.display='block';let t=0,done=false;
  const step=()=>{t++;const im=x.createImageData(160,100);for(let i=0;i<im.data.length;i+=4){const v=Math.random()*255|0;im.data[i]=im.data[i+1]=im.data[i+2]=v;im.data[i+3]=255}x.putImageData(im,0,0);
    x.fillStyle='rgba(255,255,255,.25)';x.fillRect(0,(t*13)%100,160,6);if(t===8&&!done){done=true;mid&&mid()}if(t<16)requestAnimationFrame(step);else c.style.display='none'};step()}
// keep the demo watchable: merc can't die, fights keep coming
setInterval(()=>{if(!DEMO||!G||!G.p)return;const P=G.p;if(P.hp<P.st.mhp*.45)P.hp=P.st.mhp;G.dead=false;
  const live=G.en.filter(e=>!e.dead&&Math.abs(e.x-P.x)+Math.abs(e.y-P.y)<9).length;
  if(live<2){const p=freeTile((x,y)=>{const d=Math.abs(x-P.x)+Math.abs(y-P.y);return d>=4&&d<=8&&!isExit(x,y)});if(p){const e=makeEnemy(p.x,p.y);e.awake=true;G.en.push(e)}}
  if(G.descend>0){G.descend=0;G.exitTo=null}},700);
// ---- the screen ----
function startTitle(){document.body.classList.add('titleOn');
  const el=document.createElement('div');el.id='title';el.innerHTML=`<canvas id="tStatic"></canvas><div id="tOSD"></div>
  <div class="tl-logo"><div class="tl-sub">NEON//GEN</div><h1 data-t="RELOAD">RELOAD</h1><div class="tl-tag">кибер-данж · наёмники · серверные глубины</div></div>
  <div class="tl-menu" id="tMenu"><button class="tbtn" id="tIn">Войти</button><button class="tbtn" id="tTop">Рейтинг</button></div>
  <div class="tl-box" id="tBox"></div><div class="tl-foot">канал сменится сам · тап по экрану — следующий канал</div>`;
  document.body.append(el);TITLE=el;
  $('tIn').onclick=e=>{e.stopPropagation();loginBox()};$('tTop').onclick=e=>{e.stopPropagation();topBox()};
  el.addEventListener('click',e=>{if(e.target===el||e.target.id==='tOSD')demoNext()});
  demoChannel();CH_TIMER=setInterval(()=>{if(TITLE&&!$('tBox').classList.contains('on'))demoNext()},9000)}
function loginBox(){const b=$('tBox'),last=LS.get('reload_last')||'';b.classList.add('on');$('tMenu').style.display='none';
  b.innerHTML=`<h3>ВХОД</h3><p class="th">Нет такого логина — создадим новый. Есть — войдём.</p>
  <input id="tL" maxlength="16" placeholder="логин" value="${last.replace(/"/g,'')}" autocomplete="username"><input id="tP" type="password" maxlength="40" placeholder="пароль" autocomplete="current-password">
  <div class="terr" id="tErr"></div><div class="trow"><button class="tbtn sm" id="tBack">Назад</button><button class="tbtn sm pri" id="tGo">Войти / создать</button></div>
  <p class="th small">Это простая игровая защита — не используйте здесь настоящий пароль от почты или банка.</p>`;
  $('tBack').onclick=()=>{b.classList.remove('on');$('tMenu').style.display=''};
  const go=async()=>{const L=$('tL').value,P=$('tP').value;$('tErr').textContent='Проверяю…';$('tGo').disabled=true;const r=await loginOrCreate(L,P);$('tGo').disabled=false;
    if(r.err){$('tErr').textContent=r.err;return}LS.set('reload_last',r.login);enterAs(r)};
  $('tGo').onclick=go;$('tP').onkeydown=e=>{if(e.key==='Enter')go()};setTimeout(()=>(last?$('tP'):$('tL')).focus(),50)}
async function enterAs(r){$('tErr').textContent=r.created?'Аккаунт создан. Загружаю…':'Загружаю…';
  // choose the newest save: this device or the cloud; the very first account inherits an old single-player save
  let raw=LS.get('neongen_acc_'+r.id),cloud=null;
  if(r.cloud)cloud=r.cloud;else if(DB){try{const s=await DB.doc('saves/'+r.id).get();if(s.exists)cloud=s.data()}catch(e){}}
  const tOf=x=>{try{return JSON.parse(x).t||0}catch(e){return 0}};
  if(cloud&&cloud.data&&(!raw||tOf(cloud.data)>tOf(raw)))raw=cloud.data;
  if(!raw&&!LS.get('reload_legacy_claimed')){const old=LS.get(SAVE_KEY);if(old){raw=old;LS.set('reload_legacy_claimed','1')}}
  if(raw)LS.set('neongen_acc_'+r.id,raw);
  clearInterval(CH_TIMER);DEMO=false;ACC={id:r.id,login:r.login};G=null;
  TITLE.remove();TITLE=null;document.body.classList.remove('titleOn');
  if(typeof AUD!=='undefined'&&AUD.unlock)try{AUD.unlock()}catch(e){}
  bootGame();try{saveGame()}catch(e){}cloudT=0;cloudPush();
  log(r.created?`Добро пожаловать, ${r.login}! Аккаунт создан.`:`С возвращением, ${r.login}.`,'#22e6ff')}
const TOP_COLS=[['depth','Глубина','эт.'],['loot','Лут','₵'],['cash','Касса','₵'],['mercs','Наёмники','']];let TOPK='depth';
async function topBox(){const b=$('tBox');b.classList.add('on');$('tMenu').style.display='none';b.innerHTML=`<h3>РЕЙТИНГ</h3><p class="th">Загружаю…</p>`;
  await apiReady;await dbReady;let rows=[],shared=!!(API||DB);
  if(API){try{rows=await api('top')}catch(e){shared=false}}
  else if(DB){try{const q=await DB.collection('players').get();rows=q.docs.map(d=>d.data()).filter(Boolean)}catch(e){}}
  if(!rows.length)rows=Object.values(localAccs());
  const draw=()=>{const k=TOPK,list=rows.map(a=>({n:a.login,s:a.stats||{}})).sort((a,b)=>(b.s[k]||0)-(a.s[k]||0)).slice(0,50);
    b.innerHTML=`<h3>РЕЙТИНГ</h3><div class="ttabs">${TOP_COLS.map(([c,n])=>`<button class="${c===k?'on':''}" data-tk="${c}">${n}</button>`).join('')}</div>
    <div class="ttable"><div class="tr th2"><span>#</span><span>Игрок</span><span>Наёмн.</span><span>Лут</span><span>Касса</span><span>Глуб.</span></div>
    ${list.length?list.map((a,i)=>`<div class="tr ${i<3?'top'+i:''}"><span>${i+1}</span><span class="tn">${String(a.n).replace(/[<>&]/g,'')}</span><span>${a.s.mercs||0}</span><span>${a.s.loot||0}₵</span><span>${a.s.cash||0}₵</span><span>${a.s.depth||0}</span></div>`).join(''):'<p class="th">Пока пусто — станьте первым.</p>'}</div>
    ${shared?'':'<p class="th small">Общая таблица сейчас недоступна — показаны игроки этого устройства.</p>'}
    <div class="trow"><button class="tbtn sm" id="tBack">Назад</button></div>`;
    b.querySelectorAll('[data-tk]').forEach(x=>x.onclick=()=>{TOPK=x.dataset.tk;draw()});$('tBack').onclick=()=>{b.classList.remove('on');$('tMenu').style.display=''}};
  draw()}
// switch player from the settings
{const _sp=settingsPanel;settingsPanel=function(){_sp();const p=$('panel');if(!p||!ACC)return;const d=document.createElement('div');
  d.innerHTML=`<div class="sect">ИГРОК</div><p>Вы вошли как <b style="color:#22e6ff">${ACC.login}</b>. Прогресс сохраняется на этом устройстве${API?' и на сервере':DB?' и в общей таблице':''}.</p><div class="row"><button class="btn" id="tOut">Сменить игрока</button></div>`;
  p.insertBefore(d,p.querySelector('.sect'));$('tOut').onclick=()=>{saveGame();cloudPush().finally(()=>{try{localStorage.removeItem('reload_token')}catch(e){}location.reload()})}}}

// flush the save to the server when the tab is hidden or closed
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&API&&ACC&&ST&&!DEMO){try{fetch('/api/save',{method:'PUT',keepalive:true,headers:{'Content-Type':'application/json',Authorization:'Bearer '+tok()},body:JSON.stringify({data:LS.get('neongen_acc_'+ACC.id),stats:accStats()})})}catch(e){}}});
