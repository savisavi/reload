// ================= SHELTER v3: library & gym, AFK training, upgrade-driven looks =================
BPOS.lib=[9,2];BPOS.gym=[4,9];
UP.lib={n:'Библиотека',max:2,start:0,power:0,lv:['не построена','Книжная полка','Полка с голопроигрывателем'],
  eff:l=>l>=2?'Журналы, книги и дата-диски; голозаписи учат в 1,5 раза быстрее (нужно питание)':l?'Наёмник читает журналы и книги, пока вы не в игре: Интеллект и Внимательность':'Обучение навыкам по книгам, пока вы отдыхаете',
  L:[null,{it:{boards:6,bolts:4,bulb:2},cr:60,req:{bench:1},raids:0},{it:{chip:2,cap:3,sheet:3},cr:240,req:{lib:1,gen:1},raids:1}]};
UP.gym={n:'Тренажёр',max:2,start:0,power:0,lv:['не построен','Самодельный тренажёр','Силовая станция'],
  eff:l=>l>=2?'Тренировка вдвое быстрее (нужно питание)':l?'Наёмник тренируется сам, пока вы не в игре: Сила, Ловкость, Скорость, Здоровье':'Пассивные тренировки',
  L:[null,{it:{bricks:4,bolts:6,spring:4},cr:60,req:{bench:1},raids:0},{it:{rebar:4,sheet:3,cap:2},cr:240,req:{gym:1,gen:1},raids:1}]};
if(typeof ST!=='undefined'&&ST&&ST.base){for(const k of['lib','gym'])if(ST.base[k]==null)ST.base[k]=0}
MAT_DESC.mag='Журнал о технике и выживании. Полка: 20 мин обучения.';MAT_DESC.book='Учебник или справочник. Полка: 60 мин обучения.';MAT_DESC.disk='Голозапись курса. Нужен голопроигрыватель: 180 мин обучения.';
// ---- training ----
const TR_LIB=['int','per'],TR_GYM=['str','agi','spd','vit'],ATTR_CAP=10;
const trNeed=v=>30*v; // minutes of study for the next point
const attrName=k=>(ATTR.find(a=>a[0]===k)||[,,k])[2];
{const _to=heroToObj;heroToObj=function(h){const o=_to(h);o.trn=h.trn||{};return o}}
{const _fo=heroFromObj;heroFromObj=function(o){const h=_fo(o);h.trn=o.trn||{};return h}}
function trainAdd(k,min,report){if(!H.trn)H.trn={};if(H.attr[k]>=ATTR_CAP)return 0;H.trn[k]=(H.trn[k]||0)+min;let up=0;
  while(H.attr[k]<ATTR_CAP&&H.trn[k]>=trNeed(H.attr[k])){H.trn[k]-=trNeed(H.attr[k]);H.attr[k]++;up++}
  if(H.attr[k]>=ATTR_CAP)H.trn[k]=0;if(up){recalc(H);report.push(`${attrName(k)} +${up}`)}return up}
function trainTick(silent){if(!ST)return;const now=Date.now();if(!ST.trnT){ST.trnT=now;return}
  let dt=Math.min(24*60,(now-ST.trnT)/60000);ST.trnT=now;if(dt<=0||!alive()||MODE==='raid')return;
  const rep=[],pw=powered();let libMin=0,gymMin=0;
  if(ST.base.lib>0&&ST.libM>0){const use=Math.min(ST.libM,dt);ST.libM-=use;libMin=use*(ST.base.lib>=2&&pw?1.5:1);trainAdd(ST.libA||'int',libMin,rep)}
  if(ST.base.gym>0){gymMin=dt*(ST.base.gym>=2&&pw?1:.5);trainAdd(ST.gymA||'str',gymMin,rep)}
  if(!silent&&dt>=2&&(libMin||gymMin))log(`Пока вас не было (${Math.round(dt)} мин): ${[libMin?`учёба ${Math.round(libMin)} мин`:'',gymMin?`тренировки ${Math.round(gymMin)} мин`:''].filter(Boolean).join(', ')}`,'#22e6ff');
  if(rep.length){log('Наёмник прокачался: '+rep.join(', '),'#7dff4f');if(typeof banner==='function')try{banner('▲ '+rep.join(', '))}catch(e){}}
  if(rep.length||dt>=1)saveGame()}
setInterval(()=>{if(MODE==='base'){trainTick(true);if($('ov').classList.contains('on')&&TRV.k&&$('trBox'))modulePanel(TRV.k)}},15000);
{const _eb=enterBase;enterBase=function(){trainTick(false);return _eb()}}
{const _sg=saveGame;saveGame=function(){if(ST&&!ST.trnT)ST.trnT=Date.now();return _sg()}}
const TRV={k:null};
function trainHTML(k){const lib=k==='lib',l=ST.base[k],pw=powered(),list=lib?TR_LIB:TR_GYM,cur=lib?(ST.libA||'int'):(ST.gymA||'str');
  const rate=lib?(l>=2&&pw?1.5:1):(l>=2&&pw?1:.5);
  const cards=list.map(a=>{const v=H.attr[a],need=trNeed(v),p=(H.trn&&H.trn[a])||0,U=ATTR_UI[a];
    return`<button class="trc ${a===cur?'on':''}" data-tra="${a}"><span class="g" style="color:${U.c}">${U.g}</span><span class="tn">${attrName(a)} <b>${v}</b></span>
      <span class="nbar"><i style="width:${v>=ATTR_CAP?100:Math.min(100,p/need*100)}%;background:${U.c}"></i></span><small>${v>=ATTR_CAP?'максимум':`${Math.floor(p)}/${need} мин`}</small></button>`}).join('');
  const dead=!alive()?'<p class="warn">Нет активного наёмника — обучение стоит.</p>':'';
  let fuel='';if(lib){const it=['mag','book','disk'].map(m=>{const M=MATS[m],have=ST.mats[m]||0,lock=M.holo&&l<2;
      return`<button class="btn sm trl" data-trl="${m}" ${have&&!lock?'':'disabled'}><img src="${MAT_ICON[m].toDataURL()}">${M.n} ×${have}<br><small>${lock?'нужен голопроигрыватель':`+${M.min} мин`}</small></button>`}).join('');
    fuel=`<p>Материалов для чтения: <b style="color:#f9f871">${Math.round(ST.libM||0)} мин</b>${(ST.libM||0)<=0?' — положите журнал или книгу':''}</p><div class="trls">${it}</div>`}
  return`<div id="trBox"><div class="sect">${lib?'ОБУЧЕНИЕ':'ТРЕНИРОВКИ'} · ${H?H.name:''}</div>${dead}
    <p class="help">Идёт в реальном времени, пока наёмник в убежище — даже когда игра закрыта (до 24 ч). Скорость: ×${rate}${(l>=2&&!pw)?' (нет питания — как у 1-го уровня)':''}. Выберите навык:</p>
    <div class="trcs">${cards}</div>${fuel}</div>`}
{const _mp=modulePanel;modulePanel=function(k){const r=_mp(k);TRV.k=null;
  if((k==='lib'||k==='gym')&&ST.base[k]>0&&H){TRV.k=k;trainTick(true);const head=document.querySelector('#panel .hp-head');if(head){head.insertAdjacentHTML('afterend',trainHTML(k));
    document.querySelectorAll('[data-tra]').forEach(b=>b.onclick=()=>{if(k==='lib')ST.libA=b.dataset.tra;else ST.gymA=b.dataset.tra;saveGame();modulePanel(k)});
    document.querySelectorAll('[data-trl]').forEach(b=>b.onclick=()=>{const m=b.dataset.trl;if(!(ST.mats[m]>0))return;ST.mats[m]--;ST.libM=(ST.libM||0)+MATS[m].min;log(`На полку: ${MATS[m].n} (+${MATS[m].min} мин учёбы)`,'#22e6ff');saveGame();modulePanel(k)})}}
  return r}}
// ---- sprites that follow the upgrade level ----
{const _bs=baseSprite;baseSprite=function(kind,lv){
  if(kind==='gen')return pixGrid(16,20,P=>{
    if(lv<=1){for(let y=10;y<20;y++)for(let x=2;x<14;x++)P(x,y,y===10?'#8a9a6a':x===13?'#3a4a2a':'#5a6a3a');for(let x=2;x<14;x++)P(x,13,(x%4<2)?'#f9d030':'#14161c');for(let y=15;y<19;y++)for(let x=5;x<10;x++)P(x,y,(x+y)%2?'#2a2d36':'#3a3f4e');P(12,16,'#3aff6a');for(let y=6;y<10;y++)P(4,y,'#5a6070');P(4,5,'#8f9bb0')}
    else if(lv===2){for(let y=7;y<20;y++)for(let x=1;x<15;x++)P(x,y,y===7?'#9aaa7a':x===14?'#3a4a2a':'#5a6a3a');for(let y=9;y<14;y++)for(let x=9;x<14;x++)P(x,y,y===9?'#ff6a7a':x===13?'#8a1a2a':'#d8303f');
      for(let x=1;x<15;x++)P(x,15,(x%4<2)?'#f9d030':'#14161c');for(let y=10;y<14;y++)for(let x=3;x<8;x++)P(x,y,(x+y)%2?'#2a2d36':'#3a3f4e');P(12,17,'#3aff6a');P(10,17,'#ffb02e');for(let y=1;y<7;y++){P(3,y,'#5a6070');P(4,y,'#3a3f4e')}P(3,0,'#8f9bb0');P(4,0,'#8f9bb0')}
    else{for(let y=6;y<20;y++)for(let x=1;x<15;x++)P(x,y,y===6?'#c0c7d4':x===14?'#2a2d36':'#4a4e58');for(let y=0;y<16;y++)for(let x=0;x<16;x++){const d=Math.hypot(x-7.5,y-11.5);if(d<4.2&&d>2.6)P(x,y,(x+y)%2?'#22e6ff':'#8ff8ff');if(d<=2.6)P(x,y,d<1.2?'#ffffff':'#163a4a')}
      for(let x=1;x<15;x++)P(x,17,(x%3===0)?'#22e6ff':'#2a2d36');P(2,8,'#3aff6a');P(13,8,'#ff2fa8')}});
  if(kind==='med'&&lv>=2)return pixGrid(16,20,P=>{for(let y=12;y<20;y++)for(let x=0;x<16;x++)P(x,y,y===12?'#e6e2ea':y>=18?'#5a6070':'#c8c4d4');
    for(let y=4;y<12;y++)for(let x=1;x<15;x++){const d=Math.hypot((x-7.5)/7,(y-11.5)/7.5);if(d<1&&d>.82)P(x,y,'#8ff8ff');else if(d<=.82)P(x,y,(x+y)%5===0?'#c8ffff':'#2a6a7a')}for(let x=3;x<13;x++)P(x,15,'#22e6ff');P(14,14,'#3aff6a');P(1,14,'#d8303f')});
  if(kind==='lib')return pixGrid(16,20,P=>{for(let y=1;y<20;y++)for(let x=1;x<15;x++)P(x,y,(x===1||x===14||y===1||y===19)?'#5a3a1a':'#2a1c12');
    const sp=['#c43a3a','#3a7ac4','#e0b070','#5aa040','#b45cff','#ff7ad0','#d8d0c0'];for(const sy of[3,8,13]){for(let x=2;x<14;x++)P(x,sy+4,'#7a5a34');let x=2,i=sy;while(x<13){const h=3+((x*7+i)%2),c=sp[(x*3+i)%sp.length];for(let y=sy+4-h;y<sy+4;y++)P(x,y,c);if((x+i)%5===0)x++;x++;i++}}
    if(lv>=2){for(let y=13;y<17;y++)for(let x=4;x<12;x++)P(x,y,y===13?'#8f9bb0':'#3a3f4e');P(7,12,'#22e6ff');P(8,12,'#22e6ff');P(5,15,'#3aff6a')}});
  if(kind==='gym')return pixGrid(16,20,P=>{
    if(lv<=1){for(let y=13;y<16;y++)for(let x=2;x<14;x++)P(x,y,y===13?'#a07a4a':'#6a4a2c');for(let y=16;y<20;y++){P(3,y,'#5a3a1a');P(12,y,'#5a3a1a')}
      for(let y=6;y<13;y++){P(2,y,'#5a6070');P(13,y,'#5a6070')}for(let x=0;x<16;x++)P(x,7,'#c0c7d4');for(let y=4;y<11;y++){P(0,y,'#8a8f9a');P(1,y,'#5a5e68');P(14,y,'#8a8f9a');P(15,y,'#5a5e68')}}
    else{for(let y=2;y<20;y++){P(2,y,'#4a4e58');P(13,y,'#4a4e58')}for(let x=2;x<14;x++){P(x,2,'#8f9bb0');P(x,19,'#2a2d36')}
      for(let y=5;y<11;y++)for(let x=4;x<12;x++)P(x,y,(y%2)?'#2a2d36':'#5a6070');for(let y=13;y<16;y++)for(let x=3;x<13;x++)P(x,y,y===13?'#c43a3a':'#8a2a2a');P(7,3,'#22e6ff');P(8,3,'#22e6ff');P(12,17,'#3aff6a')}});
  return _bs(kind,lv)}}
// ---- live details: lamps, generator smoke, holo cone ----
const B3={puffs:[]};
{const _rb=renderBase;renderBase=function(time){_rb(time);const B=BS;if(!B||!B.L)return;const[ox,oy]=camOrigin(),s=curS();ctx.setTransform(s,0,0,s,ox,oy);ctx.imageSmoothingEnabled=false;
  const L=B.L,b=ST.base,pw=powered(),lit=!B.candle;
  if(b.light>=1){const y0=L.in[1]*TS-12;for(let x=L.in[0]+1;x<L.in[2];x+=3){const px=x*TS+8;ctx.fillStyle='#3a3f4e';ctx.fillRect(px,y0-6,1,5);ctx.fillStyle=lit?'#fff6c0':'#4a4636';ctx.fillRect(px-1,y0-1,3,2);
      if(lit){ctx.globalCompositeOperation='lighter';const g=ctx.createRadialGradient(px,y0,0,px,y0,22);g.addColorStop(0,'rgba(255,230,160,.35)');g.addColorStop(1,'rgba(255,200,120,0)');ctx.fillStyle=g;ctx.fillRect(px-22,y0-22,44,44);ctx.globalCompositeOperation='source-over'}}}
  if(b.light>=2&&lit){ctx.globalCompositeOperation='lighter';const y=L.in[1]*TS-3;for(let x=L.in[0]*TS;x<(L.in[2]+1)*TS;x+=2){const on=Math.sin(time*2+x*.05)>-.6;ctx.fillStyle=on?((x>>4)%2?'rgba(255,47,168,.9)':'rgba(34,230,255,.9)'):'rgba(60,20,60,.5)';ctx.fillRect(x,y,2,1)}ctx.globalCompositeOperation='source-over'}
  for(const o of B.objs){if(o.site)continue;const cx=o.x*TS+8,cy=o.y*TS;
    if(o.kind==='gen'&&pw){if(Math.random()<.06*(o.lv>=3?0:1))B3.puffs.push({x:cx-4+(o.lv>=2?0:0)+(o.lv>=2?-1:0),y:cy-(o.lv>=2?4:-2),t:0});
      if(o.lv>=3){ctx.globalCompositeOperation='lighter';const a=.25+.15*Math.sin(time*5),g=ctx.createRadialGradient(cx,cy+7,0,cx,cy+7,14);g.addColorStop(0,`rgba(34,230,255,${a})`);g.addColorStop(1,'rgba(34,230,255,0)');ctx.fillStyle=g;ctx.fillRect(cx-14,cy-7,28,28);ctx.globalCompositeOperation='source-over'}
      else{const j=(Math.floor(time*20)&1);ctx.fillStyle='rgba(0,0,0,0)';if(j){ctx.fillStyle='#3aff6a';ctx.fillRect(cx+4,cy+(o.lv>=2?13:12),1,1)}}}
    if(o.kind==='lib'&&o.lv>=2&&pw){ctx.globalCompositeOperation='lighter';const f=.5+.5*Math.sin(time*7)*Math.sin(time*2.3);ctx.fillStyle=`rgba(34,230,255,${.12+.12*f})`;ctx.beginPath();ctx.moveTo(cx-.5,cy+8);ctx.lineTo(cx-6,cy-6);ctx.lineTo(cx+6,cy-6);ctx.closePath();ctx.fill();
      ctx.fillStyle=`rgba(180,255,255,${.5+.4*f})`;for(let k=0;k<5;k++)ctx.fillRect(cx-4+k*2,cy-6+((k+Math.floor(time*6))%3),1,1);ctx.globalCompositeOperation='source-over'}
    if(o.kind==='gym'&&alive()&&ST.base.gym>0&&(Math.floor(time*1.5)%2)){ctx.fillStyle='#ffd23f';ctx.fillRect(cx+5,cy-6,1,2)}}
  const dt=1/60;B3.puffs=B3.puffs.filter(p=>(p.t+=dt)<1.6);for(const p of B3.puffs){const a=.45*(1-p.t/1.6);ctx.fillStyle=`rgba(140,140,150,${a})`;const r=1+p.t*2;ctx.fillRect(Math.round(p.x+Math.sin(p.t*3)*2-r/2),Math.round(p.y-p.t*10-r/2),Math.ceil(r),Math.ceil(r))}
}}
