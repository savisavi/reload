// ================= LOCALIZATION: EN (default) / RU (source) / UK =================
// The game code is written in Russian; at display time every Russian phrase is swapped for its translation
// from locales/strings.json (injected by the build as I18N_DICT). Works for DOM text and canvas text alike,
// so templates with numbers ("Перезарядка 1,2 с") are translated piece by piece.
const LANGS=[['en','EN','English'],['ru','RU','Русский'],['uk','UK','Українська']];
const LS_LANG='reload_lang',LS_DICT='reload_i18n';
let LANG=(()=>{try{const v=localStorage.getItem(LS_LANG);if(LANGS.some(l=>l[0]===v))return v}catch(e){}return'en'})();
document.documentElement.lang=LANG;
const I18N={dict:{},lower:{},re:null,cache:new Map()};
(function i18nBuild(){const base=typeof I18N_DICT!=='undefined'?I18N_DICT:{};let over={};
  try{over=JSON.parse(localStorage.getItem(LS_DICT)||'{}')}catch(e){}
  const d={};for(const k in base)d[k]=base[k].slice();
  for(const k in over){if(k[0]==='_')continue;const o=over[k]||{};d[k]=[o.en||(d[k]&&d[k][0])||'',o.uk||(d[k]&&d[k][1])||'']}
  I18N.dict=d;for(const k in d){const l=k.toLowerCase();if(!(l in I18N.lower))I18N.lower[l]=k}
  const keys=Object.keys(d).filter(k=>d[k][0]||d[k][1]).sort((a,b)=>b.length-a.length).map(k=>k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
  const C='А-Яа-яЁёІіЇїЄєҐґ';
  I18N.re=keys.length?new RegExp(`(?<![${C}])(?:${keys.join('|')})(?![${C}])`,'giu'):null})();
const HAS_CYR=/[А-Яа-яЁё]/;
const TRL={а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'kh',ц:'ts',ч:'ch',ш:'sh',щ:'shch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya',і:'i',ї:'yi',є:'ye',ґ:'g'};
const translit=s=>s.replace(/[А-Яа-яЁёІіЇїЄєҐґ]/g,c=>{const l=c.toLowerCase(),t=TRL[l]??c;return c===l?t:(t.charAt(0).toUpperCase()+t.slice(1))});
function matchCase(src,out){if(!out)return out;if(src===src.toUpperCase()&&src!==src.toLowerCase())return out.toUpperCase();if(src[0]!==src[0].toLowerCase()&&out[0]===out[0].toLowerCase())return out[0].toUpperCase()+out.slice(1);return out}
function tr(s){if(LANG==='ru'||typeof s!=='string'||!HAS_CYR.test(s)||!I18N.re)return s;const c=I18N.cache.get(s);if(c!==undefined)return c;
  const li=LANG==='uk'?1:0;let out=s.replace(I18N.re,m=>{let v=I18N.dict[m];if(v&&v[li])return v[li];const k=I18N.lower[m.toLowerCase()];v=k&&I18N.dict[k];return v&&v[li]?matchCase(m,v[li]):m});
  if(LANG==='en'&&HAS_CYR.test(out))out=translit(out);
  if(I18N.cache.size>6000)I18N.cache.clear();I18N.cache.set(s,out);return out}
// ---- canvas text ----
{const P=CanvasRenderingContext2D.prototype,_f=P.fillText,_s=P.strokeText,_m=P.measureText;
  P.fillText=function(t,...a){return _f.call(this,tr(String(t)),...a)};P.strokeText=function(t,...a){return _s.call(this,tr(String(t)),...a)};
  P.measureText=function(t){return _m.call(this,tr(String(t)))}}
// ---- DOM text ----
const I18N_DONE=new WeakMap(),I18N_ATTR=new WeakMap();
function trNode(n){if(n.nodeType===3){const v=n.nodeValue;if(!v||I18N_DONE.get(n)===v)return;const t=tr(v);if(t!==v)n.nodeValue=t;I18N_DONE.set(n,t);return}
  if(n.nodeType!==1)return;const tag=n.tagName;if(tag==='SCRIPT'||tag==='STYLE'||tag==='TEXTAREA')return;
  for(const a of['title','placeholder','aria-label']){const v=n.getAttribute&&n.getAttribute(a);if(!v||!HAS_CYR.test(v))continue;const m=I18N_ATTR.get(n)||{};if(m[a]===v)continue;const t=tr(v);m[a]=t;I18N_ATTR.set(n,m);if(t!==v)n.setAttribute(a,t)}
  if(tag==='INPUT')return;for(let c=n.firstChild;c;c=c.nextSibling)trNode(c)}
function trAll(){if(LANG==='ru')return;trNode(document.body);document.title=tr(document.title)}
if(LANG!=='ru'){trAll();new MutationObserver(ms=>{for(const m of ms){if(m.type==='characterData')trNode(m.target);else{for(const n of m.addedNodes)trNode(n);if(m.type==='attributes')trNode(m.target)}}})
  .observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['title','placeholder']})}
// ---- language switch + export/import of all texts ----
function setLang(l){try{localStorage.setItem(LS_LANG,l)}catch(e){}try{if(typeof ACC!=='undefined'&&ACC&&!DEMO)saveGame()}catch(e){}location.reload()}
function i18nExport(){const out={_meta:{source:'ru',languages:['en','ru','uk'],exported:new Date().toISOString(),phrases:Object.keys(I18N.dict).length,
    note:'Ключ — русская фраза из кода игры. Правьте en и uk, затем Настройки → Язык → Импорт. Пустое значение = показывать оригинал.'}};
  for(const k of Object.keys(I18N.dict).sort((a,b)=>a.localeCompare(b,'ru')))out[k]={en:I18N.dict[k][0],uk:I18N.dict[k][1]};
  const text=JSON.stringify(out,null,1);
  (async()=>{try{const dl=window.claude&&claude.use?await Promise.race([claude.use('downloads'),new Promise(r=>setTimeout(()=>r(null),1500))]):null;
    if(dl){await dl.save({filename:'reload-strings.json',data:text});return}}catch(e){if(e&&e.code)return}
  const b=new Blob([text],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='reload-strings.json';document.body.append(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)})()}
function i18nImport(){const inp=document.createElement('input');inp.type='file';inp.accept='.json,application/json';
  inp.onchange=async()=>{const f=inp.files[0];if(!f)return;try{const j=JSON.parse(await f.text());let n=0;const o={};for(const k in j){if(k[0]==='_'||!j[k]||typeof j[k]!=='object')continue;o[k]={en:String(j[k].en||''),uk:String(j[k].uk||'')};n++}
      if(!n)throw new Error('empty');localStorage.setItem(LS_DICT,JSON.stringify(o));log(`Импортировано фраз: ${n}`,'#7dff4f');setTimeout(()=>setLang(LANG),300)}catch(e){log('Не удалось прочитать файл перевода','#ff6a7a')}};inp.click()}
function langButtons(cls){return LANGS.map(([k,s,n])=>`<button class="${cls} ${k===LANG?'on':''}" data-lang="${k}" title="${n}">${s}</button>`).join('')}
function bindLang(root){root.querySelectorAll('[data-lang]').forEach(b=>b.onclick=e=>{e.stopPropagation();if(b.dataset.lang!==LANG)setLang(b.dataset.lang)})}
{const _sp=settingsPanel;settingsPanel=function(){_sp();const p=$('panel');if(!p)return;const d=document.createElement('div');let custom=false;try{custom=!!localStorage.getItem(LS_DICT)}catch(e){}
  d.innerHTML=`<div class="sect">ЯЗЫК · LANGUAGE</div><div class="tabs">${langButtons('tab')}</div>
  <p class="help">Все тексты игры (${Object.keys(I18N.dict).length} фраз) можно выгрузить в JSON, отдать переводчику и загрузить обратно.${custom?' Сейчас используется загруженный перевод.':''}</p>
  <div class="row"><button class="btn" id="i18nEx">Экспорт JSON</button><button class="btn" id="i18nIm">Импорт JSON</button>${custom?'<button class="btn" id="i18nRs">Сбросить перевод</button>':''}</div>`;
  p.insertBefore(d,p.querySelector('.sect'));bindLang(d);$('i18nEx').onclick=i18nExport;$('i18nIm').onclick=i18nImport;
  const rs=$('i18nRs');if(rs)rs.onclick=()=>{localStorage.removeItem(LS_DICT);setLang(LANG)};if(LANG!=='ru')trNode(d)}}
{const _st=startTitle;startTitle=function(){_st();const t=$('title');if(!t)return;const d=document.createElement('div');d.className='tl-lang';d.innerHTML=langButtons('tlang');t.append(d);bindLang(d)}}
