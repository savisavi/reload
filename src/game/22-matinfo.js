// ================= COMPONENT NEEDS: progress bars + "what is it / where to find" =================
const MAT_DESC={junk:'Всякий мусор: обрезки, банки, сломанные мелочи. Основа для переработки и простого крафта.',
  bolts:'Болты и гайки — крепёж для любой мебели и механизмов.',spring:'Стальные пружины из механизмов и оружия.',
  tape:'Изолента. Чинит всё — от проводки до приклада.',wire:'Медные провода для питания и электроники.',
  bulb:'Лампы и светодиоды — освещение и индикаторы.',boards:'Доски и щепа от ящиков и стройки.',
  bricks:'Кирпичи и обломки кладки — для прочных конструкций.',bandage:'Бинты и марля — основа медицины.',
  cement:'Мешки цемента — для фундамента и тяжёлых модулей.',antisep:'Антисептик для медблока и аптечек.',
  fuel:'Канистра топлива — питает генератор.',rebar:'Арматура — каркас для стеллажей и станков.',
  sheet:'Листовой металл для корпусов, шкафов и брони.',cap:'Конденсаторы — накопители заряда для электроники.',
  chip:'Микрочипы — мозги простых устройств.',battery:'Аккумуляторы высокой ёмкости.',
  servo:'Сервоприводы — точная механика для станков и протезов.',cpu:'Процессоры из серверов — для сложной электроники.',
  gpu:'Видеокарты — самая ценная находка, нужны майнинг-ферме.'};
const SCRAP_N={melee:'холодное оружие',ranged:'огнестрел',armor:'броня',clothes:'одежда',implant:'импланты'};
const PROP_ICO={};const propIco=k=>PROP_ICO[k]||(PROP_ICO[k]=makeProp(4242,k).spr.toDataURL());
function matSources(m){const props=Object.entries(PROP_DEF).filter(([k,D])=>D.loot.some(([x])=>x===m)).map(([k,D])=>({ico:propIco(k),n:D.n}));
  const scr=Object.entries(SCRAP).filter(([c,t])=>t.some(([x])=>x===m)).map(([c])=>SCRAP_N[c]).filter(Boolean);return{props,scr}}
function matInfoHTML(m,need){const M=MATS[m],have=ST.mats[m]||0,s=matSources(m);
  const zs=ZONES.filter(z=>z.tier>=M.t).slice(0,3).map(z=>BIOMES[z.b].name);
  return`<div class="minfo"><div class="mtop"><img src="${MAT_ICON[m].toDataURL()}"><div><div class="nm" style="color:${M.c}">${M.n}</div>
    <div class="mst">${TIER_N[M.t]} · вес ${M.w} · цена ${M.price}₵ · в ящике ${have}${need?` / нужно ${need}`:''}</div><p>${MAT_DESC[m]||''}</p></div></div>
    <div class="msub">ГДЕ ИСКАТЬ: <b>${TIER_WHERE[M.t]}</b>${M.t?' · на меньшей глубине — редко':' · встречается везде'}</div>
    ${s.props.length?`<div class="msrc">${s.props.map(p=>`<div><img src="${p.ico}"><small>${p.n}</small></div>`).join('')}</div>`:''}
    <div class="msub">${s.scr.length?`Разбор: ${s.scr.join(', ')}. `:''}${M.buy?'Продаётся в терминале.':'В терминале не продаётся.'}${zs.length?` Лучшие зоны: ${zs.join(', ')}.`:''}</div></div>`}
function needHTML(it,cr){const rows=Object.entries(it).map(([m,n])=>{const have=ST.mats[m]||0,k=Math.min(1,have/n),ok=have>=n;
    return`<button class="nrow ${ok?'ok':'no'}" data-mi="${m}"><img src="${MAT_ICON[m].toDataURL()}"><span class="nn">${MATS[m].n}</span><span class="nbar"><i style="width:${k*100}%"></i></span><span class="nv">${Math.min(have,n)}/${n}${ok?' ✓':` <em>−${n-have}</em>`}</span></button>`});
  const okc=ST.credits>=cr;rows.push(`<div class="nrow ${okc?'ok':'no'}"><span class="nci">₵</span><span class="nn">Кредиты</span><span class="nbar"><i style="width:${Math.min(1,ST.credits/Math.max(1,cr))*100}%"></i></span><span class="nv">${Math.min(ST.credits,cr)}/${cr}${okc?' ✓':` <em>−${cr-ST.credits}</em>`}</span></div>`);
  const miss=Object.entries(it).filter(([m,n])=>(ST.mats[m]||0)<n);
  const sum=miss.length||!okc?`<p class="nmiss">Не хватает: ${miss.map(([m,n])=>`${MATS[m].n} ×${n-(ST.mats[m]||0)}`).concat(okc?[]:[`${cr-ST.credits}₵`]).join(', ')}</p>`:'<p class="nmiss ok">Всего хватает — можно строить</p>';
  return`<div class="needs">${rows.join('')}</div>${sum}`}
function bindNeeds(it){const box=$('matInfo');if(!box)return;
  const show=m=>{box.innerHTML=matInfoHTML(m,it&&it[m]);document.querySelectorAll('[data-mi]').forEach(b=>b.classList.toggle('sel',b.dataset.mi===m))};
  document.querySelectorAll('[data-mi]').forEach(b=>b.onclick=()=>show(b.dataset.mi));
  const first=Object.entries(it||{}).find(([m,n])=>(ST.mats[m]||0)<n)||Object.entries(it||{})[0];if(first)show(first[0])}
