// ================= ATTRIBUTE CARDS: six blocks with live pros & cons =================
const ATTR_UI={str:{c:'#ff6a3a',g:'✊'},agi:{c:'#7dff4f',g:'➶'},spd:{c:'#22e6ff',g:'»'},int:{c:'#b45cff',g:'◈'},per:{c:'#ffd23f',g:'◉'},vit:{c:'#ff4b6a',g:'✚'}};
function attrLines(h,k){const S=h.st,A=h.attr,v=A[k],pc=x=>(x>0?'+':'')+Math.round(x*100)+'%',L=[];const add=(t,good)=>L.push([t,good]);
  if(k==='str'){add(`Рюкзак ${S.cap} веса`,v>5?1:v<5?0:null);add(`Урон в ближнем бою ${pc(S.meleeMul-1)}`,S.meleeMul>1?1:S.meleeMul<1?0:null);add(`Время замаха ×${S.windMul.toFixed(2)}`,S.windMul<1?1:S.windMul>1?0:null);if(v<5)add('Быстрее наступает перегруз: наёмник замедляется',0)}
  if(k==='agi'){add(`Уклонение ${Math.round(S.dodge*100)}%`,S.dodge>.08?1:S.dodge<.04?0:null);add(`Меткость ${pc(S.acc)}`,S.acc>0?1:S.acc<0?0:null);if(S.selfMiss)add(`Сам промахивается в ближнем бою: ${Math.round(S.selfMiss*100)}%`,0);
    add(`Износ оружия ${pc(S.wearMul-1)}`,S.wearMul<1?1:S.wearMul>1?0:null);add(`Перезарядка ×${S.reloadMul.toFixed(2)}`,S.reloadMul<1?1:S.reloadMul>1?0:null);add(`Отскок с ловушки ${Math.round(Math.max(0,Math.min(.75,.05+(v-3)*.06))*100)}%, лёд и песок ${v>=6?'почти не мешают':v<=3?'часто валят с ног':'иногда мешают'}`,v>5?1:v<5?0:null)}
  if(k==='spd'){add(S.spdSkip>=0?`Скорость действий: +${Math.round(S.spdSkip*100)}%`:`Скорость действий: −${Math.round(-S.spdSkip*100)}%`,S.spdSkip>0?1:S.spdSkip<0?0:null);add(`Вклад в замах и перезарядку: ${v>5?'быстрее':v<5?'медленнее':'норма'}`,v>5?1:v<5?0:null)}
  if(k==='int'){add(`Опыт ${pc(S.xpMul-1)}`,S.xpMul>1?1:S.xpMul<1?0:null);add(`Расход энергии ${pc(S.costMul-1)}`,S.costMul<1?1:S.costMul>1?0:null);add(`+1 EN каждые ${tsec(S.mpEvery)}`,S.mpEvery<=3?1:S.mpEvery>=7?0:null);
    add(`Ремонт ${pc(S.repairMul-1)}, цена крафта ${pc(S.craftMul-1)}`,S.repairMul>1?1:S.repairMul<1?0:null);add(v>=4?`Выжидает циклы ловушек и обезвреживает (${Math.round(Math.max(.1,Math.min(.95,.25+v*.07+(A.agi||5)*.02))*100)}%)`:'Не понимает ловушек: идёт напролом',v>=4?1:0)}
  if(k==='per'){add(`Обзор ${S.sight} клеток`,S.sight>8?1:S.sight<8?0:null);if(S.lootLoss)add(`Теряет ${Math.round(S.lootLoss*100)}% добычи при обыске`,0);else if(S.perBonus)add(`Бонусная добыча ${Math.round(S.perBonus*100)}%`,1);
    add(`Шанс улучшения ${pc(S.upgBonus)}, осечки ${pc(S.jamMul-1)}`,S.upgBonus>0?1:S.upgBonus<0?0:null);add(`Замечает ловушки: ${Math.round((.04+v*.035+(A.int||5)*.015)*100)}% каждые ${tsec(1)}`,v>5?1:v<5?0:null)}
  if(k==='vit'){add(`Здоровье ${(v-5)*4>=0?'+':''}${(v-5)*4} HP`,v>5?1:v<5?0:null);add(`Получаемый урон ${pc(-S.dr)}`,S.dr>0?1:S.dr<0?0:null);add(`Лечение ${pc(S.healMul-1)}`,S.healMul>1?1:S.healMul<1?0:null);
    add(S.vitRegen?`Регенерация 1 HP за ${tsec(S.vitRegen)}`:'Нет регенерации',S.vitRegen&&S.vitRegen<=8?1:!S.vitRegen?0:null);add(`Яд, огонь, заморозка ${v>5?'короче':v<5?'дольше':'обычно'}`,v>5?1:v<5?0:null)}
  return L}
const ATTR_DESC={str:'Сила — сколько наёмник уносит в рюкзаке, насколько сильно бьёт в ближнем бою и как быстро замахивается тяжёлым оружием.',
  agi:'Ловкость — уклонение и меткость, бережное обращение с оружием, скорость перезарядки, а ещё ловушки: отскок, лёд и песок.',
  spd:'Скорость — как часто наёмник действует: ходит, бьёт и стреляет. Дополнительно ускоряет замах и перезарядку.',
  int:'Интеллект — получаемый опыт, расход и восстановление энергии, ремонт и крафт, умение выжидать и обезвреживать ловушки.',
  per:'Внимательность — дальность обзора, сколько добычи находится при обыске, удача при улучшениях и замечание скрытых ловушек.',
  vit:'Здоровье — запас HP, получаемый урон, сила лечения, регенерация и длительность яда, огня и заморозки.'};
let ATTR_SEL='str',ATTR_H=null,ATTR_EDIT=false;
function attrNext(h,k){if(h.attr[k]>=10)return null;h.attr[k]++;recalc(h);const L=attrLines(h,k);h.attr[k]--;recalc(h);return L}
function attrDetail(h,k){const U=ATTR_UI[k],v=h.attr[k],n=(ATTR.find(a=>a[0]===k)||[])[2]||k,now=attrLines(h,k),nx=attrNext(h,k);
  const li=([t,g])=>`<li class="${g===1?'g':g===0?'b':''}">${g===1?'▲':g===0?'▼':'•'} ${t}</li>`;
  return`<div class="adh" style="--ac:${U.c}"><div class="abig"><i>${U.g}</i><b>${v}</b></div><div><b class="adn">${n}</b><span class="ads ${v<5?'low':v>5?'hi':''}">${v<5?'слабо':v>5?'сильно':'норма'} · 5 = норма, максимум 10</span></div></div>
    <p class="adx">${ATTR_DESC[k]}</p><div class="adt">СЕЙЧАС</div><ul class="adl">${now.map(li).join('')}</ul>
    ${nx?`<div class="adt">ПОСЛЕ +1 (${v+1})</div><ul class="adl nx">${nx.map(li).join('')}</ul>`:'<div class="adt">МАКСИМУМ</div>'}`}
function attrCards(h,edit){if(!h||!h.attr||!h.st)return'';const pts=edit?(h.pts||0):0;ATTR_H=h;ATTR_EDIT=edit;if(!ATTR_UI[ATTR_SEL])ATTR_SEL='str';
  const rows=ATTR.map(([k,s,n])=>{const U=ATTR_UI[k],v=h.attr[k],lv=v<5?'low':v>5?'hi':'mid';
    return`<div class="arow ${lv} ${k===ATTR_SEL?'on':''}" data-ai="${k}" style="--ac:${U.c}"><div class="abig"><i>${U.g}</i><b>${v}</b></div><div class="aname"><b>${n}</b><span>${v<5?'слабо':v>5?'сильно':'норма'}</span></div>
      ${pts&&v<10?`<button class="aplus" data-ap="${k}">+</button>`:''}<button class="ainfo" data-ai="${k}" title="Подробнее">i</button></div>`}).join('');
  return`${pts?`<p class="apts">Свободных очков: <b>${pts}</b> — нажмите <span>+</span> у навыка</p>`:''}<div class="alay"><div class="alist">${rows}</div><div class="adwrap"><div class="adet">${attrDetail(h,ATTR_SEL)}</div></div></div>`}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-ai]');if(!b||e.target.closest('[data-ap]'))return;const lay=b.closest('.alay');if(!lay||!ATTR_H)return;
  ATTR_SEL=b.dataset.ai;lay.querySelectorAll('.arow').forEach(r=>r.classList.toggle('on',r.dataset.ai===ATTR_SEL));lay.querySelector('.adet').innerHTML=attrDetail(ATTR_H,ATTR_SEL)});
