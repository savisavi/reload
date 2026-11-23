const TICK=.34;function tsec(n){const v=n*TICK;return (v<9.95?(Math.round(v*10)/10).toString().replace('.',','):Math.round(v))+' с'}function csec(n){return Math.max(1,Math.ceil(n*TICK))}
// ================= RNG =================
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function hashStr(s){let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}h^=h>>>13;h=Math.imul(h,0x5bd1e995);h^=h>>>15;return h>>>0}
function RNG(seed){const f=mulberry32(seed>>>0);return{
  f, int:(a,b)=>a+Math.floor(f()*(b-a+1)), pick:a=>a[Math.floor(f()*a.length)], chance:p=>f()<p,
  w:arr=>{let t=0;for(const[,w]of arr)t+=w;let x=f()*t;for(const[v,w]of arr){if((x-=w)<0)return v}return arr[arr.length-1][0]}}}

// ================= COLORS =================
function hx(h){const n=parseInt(h.slice(1),16);return[n>>16&255,n>>8&255,n&255]}
function toHex(a){return'#'+a.map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('')}
function mix(a,b,t){const A=hx(a),B=hx(b);return toHex(A.map((v,i)=>v+(B[i]-v)*t))}
const DARK='#120a1e', OUT='#0a0612', EYE='#140c1c';
// ================= RESOLUTION =================
// The world keeps its logical unit (TS=16 per tile) for all game math; every bitmap is drawn at RES× detail
// (32×32 per tile) and blitted at 1/RES scale, so sprite pixels are 1/RES of a world unit.
const RES=2, SPX=16*RES; // sprite pixels per tile
// 2× re-detailing of hand-authored pixel art: EPX edge smoothing (diagonals become real 1-px steps, corners round off),
// 1-px rim light / core shadow on the silhouette and a fine material grain on flat fills. Outline is NOT added here.
const _hdc={};
function hdShade(c,k){const key=c+k;return _hdc[key]||(_hdc[key]=k>0?mix(c,'#ffffff',k):mix(c,'#0a0612',-k))}
function hd2x(px,W,Hh,o={}){
  const W2=W*2,H2=Hh*2,out=new Array(W2*H2).fill(null);
  const g=(x,y)=>x<0||y<0||x>=W||y>=Hh?null:px[y*W+x];
  for(let y=0;y<Hh;y++)for(let x=0;x<W;x++){
    const P=px[y*W+x],A=g(x,y-1),B=g(x+1,y),C=g(x-1,y),D=g(x,y+1);
    let e1=P,e2=P,e3=P,e4=P;
    if(C===A&&C!==D&&A!==B)e1=A;if(A===B&&A!==C&&B!==D)e2=B;if(D===C&&D!==B&&C!==A)e3=C;if(B===D&&B!==A&&D!==C)e4=D;
    // never invent pixels outside the original silhouette from an empty source pixel (keeps thin parts thin)
    if(!P){if(o.grow===false){e1=e2=e3=e4=null}}
    const i=(y*2)*W2+x*2;out[i]=e1;out[i+1]=e2;out[i+W2]=e3;out[i+W2+1]=e4;
  }
  if(o.bevel!==false){const b=out.slice(),G=(x,y)=>x<0||y<0||x>=W2||y>=H2?null:b[y*W2+x];
    for(let y=0;y<H2;y++)for(let x=0;x<W2;x++){const c=b[y*W2+x];if(!c||(o.skip&&o.skip.has(c)))continue;
      if(!G(x,y-1)||!G(x-1,y))out[y*W2+x]=hdShade(c,(!G(x,y-1)&&!G(x-1,y))?.22:.14);
      else if(!G(x,y+1)||!G(x+1,y))out[y*W2+x]=hdShade(c,-.16)}}
  if(o.tex){const b=out.slice();for(let y=1;y<H2-1;y++)for(let x=1;x<W2-1;x++){const i=y*W2+x,c=b[i];if(!c||(o.skip&&o.skip.has(c)))continue;
      if(b[i-1]!==c||b[i+1]!==c||b[i-W2]!==c||b[i+W2]!==c)continue;
      const h=((Math.imul(x*73856093^y*19349663^(o.seed||7),2654435761)>>>0)%100)/100;
      if(h<o.tex)out[i]=hdShade(c,-.09);else if(h>1-o.tex*.5)out[i]=hdShade(c,.07)}}
  return out;
}
// 1-px outline around a W×H colour grid
function outline1(px,W,Hh,col){const o=px.slice();for(let y=0;y<Hh;y++)for(let x=0;x<W;x++){if(px[y*W+x])continue;
  if((x>0&&px[y*W+x-1])||(x<W-1&&px[y*W+x+1])||(y>0&&px[(y-1)*W+x])||(y<Hh-1&&px[(y+1)*W+x]))o[y*W+x]=col||OUT}return o}
function gridCanvas(px,W,Hh){const c=document.createElement('canvas');c.width=W;c.height=Hh;const x=c.getContext('2d'),id=x.createImageData(W,Hh);
  for(let i=0;i<px.length;i++){const v=px[i];if(!v)continue;const[r,g,b]=hx(v);id.data[i*4]=r;id.data[i*4+1]=g;id.data[i*4+2]=b;id.data[i*4+3]=255}x.putImageData(id,0,0);return c}
function ramp(c){return{l:mix(c,'#ffffff',.32),b:c,m:mix(c,DARK,.22),d:mix(c,DARK,.45)}}

const SKINS=[
 {n:'светлая',c:'#f2c7a5',w:3},{n:'бледная',c:'#ead8d0',w:2},{n:'оливковая',c:'#c99a6e',w:3},{n:'смуглая',c:'#a8714a',w:3},
 {n:'тёмная',c:'#6e4430',w:3},{n:'очень тёмная',c:'#4a2c20',w:2},{n:'синтетическая',c:'#b8c4d6',w:1},
 {n:'голубой мод',c:'#7fb0d8',w:.7},{n:'зелёный мод',c:'#9ccf9a',w:.5},{n:'лиловый мод',c:'#c49ad8',w:.5}];
const HAIRS=[
 {n:'неон-розовые',c:'#ff2fa8'},{n:'циан',c:'#22e6ff'},{n:'платина',c:'#f1ece0'},{n:'чёрные',c:'#221a2c'},{n:'фиолетовые',c:'#8a4dff'},
 {n:'кислотно-зелёные',c:'#3dff7a'},{n:'жёлтые',c:'#ffd23f'},{n:'алые',c:'#ff4b2b'},{n:'каштановые',c:'#6a4128'},{n:'серебро',c:'#c8cbe0'},{n:'оранжевые',c:'#ff8a1f'}];
const CLOTH=[
 {n:'графит',c:'#2a2740',w:3},{n:'тёмно-синий',c:'#24305a',w:3},{n:'баклажан',c:'#43204f',w:3},{n:'бордо',c:'#5a1a2a',w:2},
 {n:'хаки',c:'#3a4a32',w:2},{n:'серый',c:'#4a4a58',w:2},{n:'чёрный',c:'#17141f',w:3},{n:'кожа',c:'#6a4426',w:2},
 {n:'белый',c:'#d9d4e4',w:1},{n:'красный',c:'#b0202f',w:1},{n:'жёлтый',c:'#d9a81f',w:.7},{n:'бирюза',c:'#1f7a80',w:1}];
const NEON=[
 {n:'розовый',c:'#ff2fa8'},{n:'циан',c:'#22e6ff'},{n:'жёлтый',c:'#f9f871'},{n:'лайм',c:'#7dff4f'},{n:'оранжевый',c:'#ff8a1f'},{n:'фиолет',c:'#b45cff'},{n:'красный',c:'#ff3355'}];
const METALS=[{n:'сталь',c:'#8f9bb0'},{n:'хром',c:'#c0c7d4'},{n:'тёмный металл',c:'#62667a'},{n:'золото',c:'#c9a35a'},{n:'карбон',c:'#3c3f4e'}];
const BOOTS=[{n:'чёрные',c:'#1a1620'},{n:'коричневые',c:'#4a2e1c'},{n:'серые',c:'#4b4a58'},{n:'бордовые',c:'#4a1522'}];
const NAMES=['Нео','Векс','Кай','Зеро','Рэкс','Никс','Джуно','Эш','Байт','Глитч','Эхо','Вольт','Рейзор','Статик','Сайфер','Мира','Декс','Люкс','Оникс','Сейбл','Кода','Флюкс','Хекс','Ронин','Вайпер','Шрайк','Танго','Изи','Блиц','Нова','Кира','Дрифт','Спарк','Роук','Зета','Ям','Лира','Крон','Вега','Сид'];

// ================= GENERATOR =================
const rowL=w=>Math.floor(8-w/2);
const centerCols=(l,w)=>w%2?[l+(w-1)/2]:[l+w/2-1,l+w/2];

function generate(seeds,density){
  const px=new Array(256).fill(null), gl=new Uint8Array(256);
  const P=(x,y,c,g)=>{if(x<0||x>15||y<0||y>15||!c)return;px[y*16+x]=c;gl[y*16+x]=g?1:0};
  const rb=RNG(seeds.body),rf=RNG(seeds.face),rh=RNG(seeds.hair),rc=RNG(seeds.cloth),ri=RNG(seeds.impl),rk=RNG(seeds.color);

  // ---------- palette ----------
  const skin=rk.w(SKINS.map(s=>[s,s.w]));
  const hairC=rk.pick(HAIRS);
  const main=rk.w(CLOTH.map(c=>[c,c.w]));
  let second=rk.w(CLOTH.map(c=>[c,c.w])); if(second===main) second=CLOTH[(CLOTH.indexOf(main)+4)%CLOTH.length];
  const accent=rk.pick(NEON);
  const metal=rk.pick(METALS);
  const pantsC=rk.chance(.35)?main:rk.w(CLOTH.map(c=>[c,c.w]));
  const bootC=rk.pick(BOOTS);
  const stockings=rk.chance(.5);
  const S=ramp(skin.c),HR=ramp(hairC.c),M=ramp(main.c),S2=ramp(second.c),A=ramp(accent.c),MT=ramp(metal.c),BT=ramp(bootC.c);

  // ---------- body ----------
  const H=rb.w([[10,1],[11,2],[12,3],[13,3],[14,2]]);
  const bi=rb.w([[0,3],[1,4],[2,3],[3,2]]);
  const tw=[5,6,7,8][bi];
  const hw=tw===5?5:tw===6?6:tw===7?rb.pick([5,7]):6;
  const hh=H>=13?5:4;
  const headTop=15-H, headBot=headTop+hh-1;
  const rest=H-hh, neck=rest>=9?1:0;
  const legsLen=Math.round((rest-neck)*.45), torsoLen=rest-neck-legsLen;
  const torsoTop=headBot+1+neck, torsoBot=torsoTop+torsoLen-1, legTop=torsoBot+1;
  const shapes=[['прямая',3]];
  if(tw>=6) shapes.push(['V-силуэт',2],['песочные часы',2],['округлая',tw>=7?3:1]); else shapes.push(['V-силуэт',1]);
  const shape=rb.w(shapes);
  const rowW=i=>{
    if(shape==='V-силуэт'&&torsoLen>=3&&i===torsoLen-1) return tw-2;
    if(shape==='песочные часы'&&torsoLen>=3&&i===torsoLen-2) return tw-2;
    if(shape==='округлая'&&i>=1) return Math.min(tw+2,10);
    return tw;
  };
  const PN=ramp(pantsC.c);
  const sl=rowL(tw), sr=sl+tw-1, hl=rowL(hw), hr=hl+hw-1;
  const cc=centerCols(sl,tw), hc=centerCols(hl,hw);
  const ey=headTop+hh-3;
  const eyeX=hw===5?[hl+1,hl+3]:hw===6?[hl+1,hl+4]:[hl+2,hl+4];
  const nw=hw%2?3:2, nl=rowL(nw);

  // ---------- clothes ----------
  const top=rc.w([['куртка',3],['худи',2],['плащ',2],['майка',2],['футболка',2],['бронежилет',2],['бомбер',2],['комбинезон',1]]);
  const hood=top==='худи'&&rc.chance(.5);
  const legs=top==='комбинезон'?'брюки':rc.w([['брюки',4],['карго',2],['шорты',1],['юбка',2],['леггинсы',1]]);
  const boots=rc.w([['ботинки',4],['высокие сапоги',2],['кроссовки',2]]);
  const gloves=rc.chance(.2);
  const belt=rc.chance(.4);
  const LG = top==='комбинезон'?M:PN;

  // ---------- hair ----------
  const hair=rh.w([['лысый',1],['ёжик',2],['ирокез',3],['андеркат',3],['каре',2],['длинные',3],['шипы',2],['пучок',2],['два пучка',1],['хвост',2],['дреды',1]]);
  const spikeK=rh.int(1,3), spikyTall=rh.chance(.5);

  // ---------- face ----------
  const eyes=rf.w([['обычные',5],['светящиеся',2],['визор',2],['очки',2],['моно-линза',1],['подводка',2]]);
  const mouth=rf.w([['обычный',6],['респиратор',2],['бандана',2],['неоновые губы',1]]);
  const beard=mouth==='обычный'&&rf.chance(.18);
  const brows=hh===5&&rf.chance(.6);
  const mark=rf.w([['нет',5],['неон-тату',2],['шрам',2],['пирсинг',2]]);

  // ---------- implants ----------
  const cnt=density==='low'?ri.w([[0,5],[1,4],[2,1]]):density==='high'?ri.w([[1,1],[2,3],[3,3],[4,2]]):ri.w([[0,2],[1,4],[2,3],[3,1]]);
  let cand=['кибер-рука','кибер-ноги','кибер-глаз','антенна','нейро-порт','челюстной имплант','реактор в груди','схемы на лице','аудио-модуль','шейный разъём'];
  cand=cand.filter(c=>{
    if(c==='кибер-глаз') return !['визор','очки'].includes(eyes);
    if(c==='челюстной имплант') return mouth==='обычный'&&!beard;
    if(c==='схемы на лице') return mouth!=='бандана';
    if(c==='шейный разъём') return neck===1;
    return true;
  });
  const impl=[];
  for(let k=0;k<cnt&&cand.length;k++){const i=Math.floor(ri.f()*cand.length);impl.push(cand.splice(i,1)[0])}
  const has=n=>impl.includes(n);
  const armSide=ri.pick(['L','R']);
  const IG=ramp(ri.chance(.5)?accent.c:ri.pick(NEON).c);
  const antSide=ri.pick(['L','R']);

  // ================= DRAW =================
  // 1. back hair
  if(hair==='длинные'||hair==='дреды'){
    const yEnd=Math.min(legTop-1,headBot+(hair==='дреды'?4:3));
    for(let y=headTop;y<=yEnd;y++)for(let x=hl-1;x<=hr+1;x++)P(x,y,hair==='дреды'?((x+y)%2?HR.d:HR.m):HR.d);
  }
  if(hair==='хвост'){for(let y=headTop+1;y<=Math.min(legTop-1,headBot+2);y++)P(hr+1+(y>headBot?1:0),y,HR.m);P(hr+1,headTop,HR.d)}

  // 2. legs
  const lw=Math.floor((tw-1)/2);
  const bootRows=boots==='высокие сапоги'&&legsLen>=4?2:1;
  const kneeY=Math.floor((legTop+1+14-bootRows)/2);
  const skirtRows=legs==='юбка'?(legsLen>=4?2:1):0;
  for(let y=legTop;y<=14;y++){
    const ri_=y-legTop;
    if(ri_<skirtRows){for(let x=sl-1;x<=sr+1;x++)P(x,y,x===sr+1?PN.m:(ri_===skirtRows-1&&x%2?PN.m:PN.b));continue}
    if(y===legTop){
      for(let x=sl;x<=sr;x++)P(x,y,x===sr?LG.m:LG.b);
      if(belt&&top!=='комбинезон'){for(let x=sl;x<=sr;x++)P(x,y,LG.d);P(cc[0],y,MT.l)}
      continue;
    }
    const isBoot=y>14-bootRows;
    for(const [l,r,side] of [[sl,sl+lw-1,'L'],[sr-lw+1,sr,'R']]){
      for(let x=l;x<=r;x++){
        const outer=side==='L'?x===l:x===r;
        let c;
        if(isBoot){
          if(boots==='кроссовки') c=outer?A.b:'#e6e2f0';
          else c=(side==='R'&&x===r)?BT.m:BT.b;
          if(boots==='высокие сапоги'&&y===14-bootRows+1&&bootRows===2) c=BT.m;
        } else if(has('кибер-ноги')){
          c=side==='R'?MT.m:MT.b; if(y===kneeY&&outer){P(x,y,IG.l,true);continue}
        } else {
          switch(legs){
            case 'шорты': c=y===legTop+1?(side==='R'?LG.m:LG.b):(side==='R'?S.m:S.b);break;
            case 'юбка': c=stockings?(side==='R'?'#1b1426':'#261d33'):(side==='R'?S.m:S.b);break;
            case 'леггинсы': c=outer?A.d:(side==='R'?LG.m:LG.b);break;
            case 'карго': c=(y===legTop+1&&outer&&legsLen>=4)?LG.d:(side==='R'?LG.m:LG.b);break;
            default: c=side==='R'?LG.m:LG.b;
          }
        }
        P(x,y,c);
      }
    }
  }

  // 3. torso
  const TR = (top==='майка'||top==='футболка')?S2:M;
  for(let i=0;i<torsoLen;i++){
    const y=torsoTop+i,w=rowW(i),l=rowL(w),r=l+w-1;
    for(let x=l;x<=r;x++)P(x,y,x===r?TR.m:TR.b);
  }
  const allRows=f=>{for(let y=torsoTop;y<=torsoBot;y++)f(y)};
  switch(top){
    case 'куртка':
      allRows(y=>cc.forEach(x=>P(x,y,S2.d)));
      P(cc[0]-1,torsoTop,M.l);P(cc[cc.length-1]+1,torsoTop,M.l);
      break;
    case 'бомбер':
      for(let x=sl;x<=sr;x++)P(x,torsoBot,M.d);
      for(let y=torsoTop;y<torsoBot;y++)P(cc[0],y,MT.l);
      break;
    case 'худи':
      if(!hood)for(let x=sl+1;x<=sr-1;x++)P(x,torsoTop,M.d);
      if(torsoLen>=3)for(let x=cc[0]-1;x<=cc[cc.length-1]+1;x++)P(x,torsoBot,M.m);
      P(cc[0],torsoTop+1,M.l);
      break;
    case 'плащ':{
      allRows(y=>cc.forEach(x=>P(x,y,S2.d)));
      P(cc[0]-1,torsoTop,M.l);P(cc[cc.length-1]+1,torsoTop,M.l);
      if(torsoLen>=4){for(let x=sl;x<=sr;x++)P(x,torsoBot,M.d);P(cc[0],torsoBot,MT.l)}
      const tl=Math.max(1,legsLen-2);
      for(let y=legTop;y<legTop+tl;y++)for(let x=sl;x<=sr;x++)P(x,y,cc.includes(x)?M.d:(x===sr?M.m:M.b));
      if(neck){P(nl-1,headBot+1,M.b);P(nl+nw,headBot+1,M.m)}
      break;}
    case 'майка':
      for(let x=sl;x<=sr;x++)P(x,torsoTop,(x===cc[0]-1||x===cc[cc.length-1]+1)?S2.b:S.b);
      P(cc[0],torsoTop+1,A.b);
      break;
    case 'футболка':
      cc.forEach(x=>P(x,torsoTop,S.m));
      if(torsoLen>=3){P(cc[0],torsoTop+1,A.b);if(cc.length>1)P(cc[1],torsoTop+1,A.d)}
      break;
    case 'бронежилет':
      for(let x=sl+1;x<=sr-1;x++)if(!cc.includes(x)||torsoLen<3)P(x,torsoTop+1,M.l);
      P(sl,torsoTop,S2.b);P(sr,torsoTop,S2.m);
      for(let x=sl;x<=sr;x++)P(x,torsoBot,A.d);
      break;
    case 'комбинезон':
      allRows(y=>P(cc[0],y,A.b));
      break;
  }

  // 4. neck
  if(neck&&top!=='плащ')for(let x=nl;x<nl+nw;x++)P(x,headBot+1,S.m);
  else if(neck)for(let x=nl;x<nl+nw;x++)P(x,headBot+1,S.m);

  // 5. arms
  const hands={};
  for(const side of ['L','R']){
    const cyber=has('кибер-рука')&&armSide===side;
    const jointY=torsoTop+Math.floor(torsoLen/2);
    let lastX;
    for(let y=torsoTop;y<=legTop;y++){
      let x;
      if(y<=torsoBot){const w=rowW(y-torsoTop),l=rowL(w),r=l+w-1;x=side==='L'?Math.min(sl-1,l-1):Math.max(sr+1,r+1);lastX=x}
      else x=lastX;
      const hand=y===legTop;
      if(hand)hands[side]=[x,y];
      let c,g=false;
      if(cyber){c=hand?MT.l:(side==='R'?MT.m:MT.b); if(y===jointY){c=IG.l;g=true}}
      else if(hand) c=gloves?'#1b1622':S.b;
      else{
        switch(top){
          case 'майка': c=S.m;break;
          case 'футболка': c=y===torsoTop?S2.m:S.m;break;
          case 'бронежилет': c=S2.m;break;
          case 'бомбер': c=y===torsoTop+1?A.b:M.m;break;
          default: c=M.m;
        }
      }
      P(x,y,c,g);
    }
  }

  // long hair strands in front of shoulders
  if(hair==='длинные'||hair==='дреды'){
    const yEnd=Math.min(legTop-1,headBot+(hair==='дреды'?3:2));
    for(let y=headTop+1;y<=yEnd;y++){P(hl-1,y,HR.b);P(hr+1,y,HR.m)}
  }

  // 6. head
  for(let y=headTop;y<=headBot;y++)for(let x=hl;x<=hr;x++){
    if((y===headTop||y===headBot)&&(x===hl||x===hr))continue;
    P(x,y,x===hr?S.m:S.b);
  }

  // 7. hair front
  const row=(y,a,b,c)=>{for(let x=a;x<=b;x++)P(x,y,c)};
  switch(hair){
    case 'ёжик': row(headTop,hl,hr,HR.d); if(hh===5){P(hl,headTop+1,HR.d);P(hr,headTop+1,HR.d)} break;
    case 'ирокез':
      row(headTop,hl+1,hr-1,S.m); hc.forEach(x=>P(x,headTop,HR.b));
      for(let k=1;k<=spikeK;k++)hc.forEach(x=>P(x,headTop-k,k===spikeK?HR.l:HR.b));
      break;
    case 'андеркат':
      row(headTop-1,hl+1,hr,HR.b); row(headTop,hl,hr,HR.b);
      if(hh===5){P(hl,headTop+1,HR.m);P(hl+1,headTop+1,HR.m)}
      P(hr,headTop,HR.m);
      break;
    case 'каре':
      row(headTop-1,hl+1,hr-1,HR.b); row(headTop,hl-1,hr+1,HR.b);
      for(let y=headTop+1;y<=headBot;y++){P(hl-1,y,HR.b);P(hr+1,y,HR.m)}
      if(hh===5)row(headTop+1,hl,hr,HR.m);
      break;
    case 'длинные': case 'дреды':
      row(headTop-1,hl+1,hr-1,HR.b); row(headTop,hl,hr,HR.b);
      P(hl-1,headTop,HR.b);P(hr+1,headTop,HR.m);
      if(hh===5){P(hl,headTop+1,HR.m);P(hl+1,headTop+1,HR.m)}
      break;
    case 'шипы':
      row(headTop,hl-1,hr+1,HR.b);
      for(let x=hl-1;x<=hr+1;x+=2)P(x,headTop-1,HR.b);
      if(spikyTall){P(hl+1,headTop-2,HR.l);P(hr-1,headTop-2,HR.l)}
      P(hl-1,headTop+1,HR.m);P(hr+1,headTop+1,HR.m);
      break;
    case 'пучок':
      row(headTop,hl,hr,HR.b); row(headTop-1,hl+1,hr-1,HR.b);
      hc.forEach(x=>{P(x,headTop-2,HR.b);P(x,headTop-3,HR.l)});
      break;
    case 'два пучка':
      row(headTop,hl,hr,HR.b); row(headTop-1,hl+1,hr-1,HR.b);
      P(hl-1,headTop-1,HR.b);P(hl-1,headTop-2,HR.l);P(hl,headTop-2,HR.b);
      P(hr+1,headTop-1,HR.m);P(hr+1,headTop-2,HR.b);P(hr,headTop-2,HR.b);
      break;
    case 'хвост':
      row(headTop-1,hl+1,hr-1,HR.b); row(headTop,hl,hr,HR.b);
      P(hr+1,headTop,A.b);
      break;
    case 'лысый': P(hl+1,headTop,S.l); break;
  }
  if(!['ирокез','лысый','ёжик'].includes(hair))P(hl+1,hair==='каре'||hair==='шипы'?headTop:headTop-1,HR.l);
  if(brows&&!(hair==='каре'))eyeX.forEach(x=>P(x,ey-1,HR.d));

  // hood up
  if(hood){
    for(let y=headTop-1;y<=headBot;y++){
      if(y>headTop-1){P(hl-1,y,M.b);P(hr+1,y,M.m)}
    }
    row(headTop-1,hl,hr,M.b);
    row(headTop,hl,hr,M.d);
    if(hair!=='лысый'&&hair!=='ёжик')P(hc[0],headTop,HR.b);
    if(neck){P(nl-1,headBot+1,M.d);P(nl+nw,headBot+1,M.d)}
  }

  // 8. face
  switch(eyes){
    case 'обычные': eyeX.forEach(x=>P(x,ey,EYE)); break;
    case 'светящиеся': eyeX.forEach(x=>P(x,ey,A.l,true)); break;
    case 'визор':
      for(let x=hl;x<=hr;x++)P(x,ey,A.b,true);
      eyeX.forEach(x=>P(x,ey,A.l,true));
      P(hl-1,ey,MT.m);P(hr+1,ey,MT.d);
      break;
    case 'очки':
      for(let x=hl;x<=hr;x++)P(x,ey,'#0d0b14');
      eyeX.forEach(x=>P(x,ey,'#2e2a44'));
      P(eyeX[0],ey,mix(A.b,'#ffffff',.35));
      break;
    case 'моно-линза':
      P(eyeX[0],ey,EYE); P(eyeX[1],ey,A.l,true);
      if(eyeX[1]+1<=hr)P(eyeX[1]+1,ey,MT.b); else P(eyeX[1]-1,ey,MT.b);
      break;
    case 'подводка':
      eyeX.forEach(x=>P(x,ey,EYE));
      if(eyeX[0]-1>=hl)P(eyeX[0]-1,ey,A.d);
      if(eyeX[1]+1<=hr)P(eyeX[1]+1,ey,A.d);
      break;
  }
  switch(mouth){
    case 'обычный': hc.forEach(x=>P(x,headBot,S.d)); break;
    case 'неоновые губы': hc.forEach(x=>P(x,headBot,A.b)); break;
    case 'респиратор':
      row(headBot,hl+1,hr-1,MT.b); hc.forEach(x=>P(x,headBot,MT.d));
      P(hl,headBot-1,MT.m);P(hr,headBot-1,MT.d);
      break;
    case 'бандана':
      for(let y=ey+1;y<=headBot;y++){const a=y===headBot?hl+1:hl,b=y===headBot?hr-1:hr;for(let x=a;x<=b;x++)P(x,y,x===b?S2.m:S2.b)}
      P(hc[0],headBot,A.d);
      break;
  }
  if(beard){row(headBot,hl+1,hr-1,HR.d);P(hl,headBot-1,HR.d);P(hr,headBot-1,HR.d);hc.forEach(x=>P(x,headBot,mix(HR.d,DARK,.5)))}
  switch(mark){
    case 'неон-тату': P(hl,ey+1,A.b,true); break;
    case 'шрам': P(eyeX[1],ey+1,S.d); if(hh===5)P(eyeX[1],ey-1,S.d); break;
    case 'пирсинг': if(mouth==='обычный'||mouth==='неоновые губы')P(hc[0],headBot-1,MT.l); else P(hr,ey-1,MT.l); break;
  }

  // 9. implants
  if(has('кибер-глаз')){const e=eyeX[1];P(e,ey,'#ff3355',true);P(e+1<=hr?e+1:e-1,ey,MT.b);if(ey-1>=headTop)P(e,ey-1,MT.m)}
  if(has('антенна')){const ax=antSide==='R'?hr:hl;P(ax,headTop-1,MT.m);P(ax,headTop-2,MT.b);P(ax,headTop-3,IG.l,true)}
  if(has('нейро-порт')){P(hl,ey,MT.m);P(hl,ey+1,IG.b,true)}
  if(has('челюстной имплант')){for(let x=hc[hc.length-1];x<=hr-1;x++)P(x,headBot,MT.b);P(hr,headBot-1,MT.m);P(hc[hc.length-1],headBot,IG.b,true)}
  if(has('реактор в груди')){P(cc[0],torsoTop+1,IG.l,true)}
  if(has('схемы на лице')){const x=eyeX[0];P(x,ey+1,IG.b,true);if(ey+2<=headBot&&!(ey+2===headBot&&hc.includes(x)))P(x,ey+2,IG.d,true)}
  if(has('аудио-модуль')){P(hr+1,ey+1,MT.b);P(hr+1,ey,IG.b,true)}
  if(has('шейный разъём')){P(nl+nw-1,headBot+1,IG.b,true)}

  const hName=H<=10?'низкий':H===11?'ниже среднего':H===12?'средний':H===13?'высокий':'очень высокий';
  const traits={
    'Рост':`${hName} (${2*H} px)`,
    'Телосложение':['худощавое','среднее','крепкое','массивное'][bi],
    'Фигура':shape,
    'Кожа':[skin.n,skin.c],
    'Причёска':hood?`${hair} (под капюшоном)`:hair,
    'Цвет волос':hair==='лысый'?['—',null]:[hairC.n,hairC.c],
    'Глаза':eyes,
    'Рот / низ лица':mouth+(beard?', борода':''),
    'Отметины':mark,
    'Верх':top+(hood?' (капюшон)':''),
    'Низ':legs,
    'Обувь':boots,
    'Ткань':[main.n+' / '+second.n,main.c],
    'Неон':[accent.n,accent.c],
    'Импланты':impl.length?impl.map(n=>n==='кибер-рука'?`кибер-рука (${armSide==='L'?'правая':'левая'})`:n):['нет'],
  };
  // ================= 32-PX PASS =================
  // The 16-grid above is the character's "plan" (it keeps every existing hero identical); here it becomes a real
  // 32×32 sprite: EPX-smoothed silhouette, then 1-px details — eyes with catchlights, thin brows, nose, lips,
  // hair strands, seams, zips, pockets, laces, soles, panel lines on implants.
  const N=32,X=v=>v*2,skinSet=new Set([S.l,S.b,S.m,S.d]);
  const q=hd2x(px,16,16,{bevel:true,skip:new Set([EYE,A.l,A.b,IG.l,IG.b])}),g2=new Uint8Array(N*N);
  for(let y=0;y<N;y++)for(let x=0;x<N;x++)g2[y*N+x]=gl[(y>>1)*16+(x>>1)];
  const at=(x,y)=>x<0||y<0||x>=N||y>=N?null:q[y*N+x];
  const Q=(x,y,c,gg)=>{if(x<0||y<0||x>=N||y>=N)return;q[y*N+x]=c;g2[y*N+x]=gg?1:0};
  const Qs=(x,y,c,gg)=>{if(skinSet.has(at(x,y)))Q(x,y,c,gg)}; // only over skin
  const Qn=(x,y,c,gg)=>{if(at(x,y))Q(x,y,c,gg)};             // only over something
  const hT=X(headTop),hB=X(headBot)+1,hL=X(hl),hR=X(hr)+1,eY=X(ey),tT=X(torsoTop),tB=X(torsoBot)+1,lT=X(legTop);
  // --- head: thinner shade column, forehead light, rounder jaw, ear
  for(let y=hT;y<=hB;y++){if(at(hR-1,y)===S.m)Q(hR-1,y,S.b);}
  Qs(hL+1,hT+1,S.l);Qs(hL+2,hT+1,S.l);Qs(hL+1,hT+2,S.l);
  if(!hood){Qs(hL,hB,null);Qs(hR,hB,null);Qs(hL+1,hB,S.m);Qs(hR-1,hB,S.d);}
  if(!hood&&!['каре','длинные','дреды'].includes(hair)){Qs(hR,eY+2,S.m);Qs(hR,eY+3,S.d)}
  // cheeks / nose
  const nX=X(eyeX[0])+Math.round((X(eyeX[1])-X(eyeX[0]))/2)+1;
  if(!['визор','очки'].includes(eyes)||true){Qs(nX,eY+2,S.m);Qs(nX,eY+3,S.d)}
  Qs(X(eyeX[1])+2,eY+3,mix(S.b,'#ff6a7a',.18));
  // --- eyes
  const eyeAt=(ex,kind)=>{const x=X(ex),y=eY;
    if(kind==='normal'){Q(x,y,'#e8e4f4');Q(x+1,y,EYE);Q(x,y+1,EYE);Q(x+1,y+1,EYE);if(skinSet.has(at(x,y+2)))Q(x+1,y+2,S.m)}
    else if(kind==='glow'){Q(x,y,'#ffffff',1);Q(x+1,y,A.l,1);Q(x,y+1,A.l,1);Q(x+1,y+1,A.b,1)}};
  switch(eyes){
    case 'обычные': eyeX.forEach(e=>eyeAt(e,'normal'));break;
    case 'подводка': eyeX.forEach(e=>eyeAt(e,'normal'));Qs(X(eyeX[0])-1,eY,A.b);Qs(X(eyeX[1])+2,eY,A.b);break;
    case 'светящиеся': eyeX.forEach(e=>eyeAt(e,'glow'));break;
    case 'визор':{for(let x=hL-1;x<=hR+1;x++){if(!at(x,eY))continue;Q(x,eY,A.l,1);Q(x,eY+1,A.b,1)}
      eyeX.forEach(e=>{Q(X(e),eY,'#ffffff',1)});Qn(hL-2,eY,MT.l);Qn(hR+2,eY+1,MT.d);Qn(hL-1,eY-1,MT.m);break}
    case 'очки':{for(let x=hL;x<=hR;x++){Q(x,eY,'#0d0b14');Q(x,eY+1,'#0d0b14')}
      eyeX.forEach(e=>{const x=X(e);Q(x,eY,mix(A.b,'#ffffff',.5));Q(x+1,eY,'#2e2a44');Q(x,eY+1,'#2e2a44');Q(x+1,eY+1,'#1a1626')});break}
    case 'моно-линза':{eyeAt(eyeX[0],'normal');const x=X(eyeX[1]);Q(x,eY,'#ffffff',1);Q(x+1,eY,A.l,1);Q(x,eY+1,A.l,1);Q(x+1,eY+1,A.b,1);Qn(x+2,eY,MT.l);Qn(x+2,eY+1,MT.d);Qn(x,eY-1,MT.m);Qn(x+1,eY-1,MT.m);break}
  }
  // brows: one pixel thick
  if(brows&&hair!=='каре')eyeX.forEach(e=>{const x=X(e);if(at(x,eY-2)===HR.d){Q(x,eY-2,S.b);Q(x+1,eY-2,S.b)}Q(x,eY-1,HR.d);Q(x+1,eY-1,HR.d)});
  // --- mouth / lower face
  const mY=X(headBot),mx0=X(hc[0]),mx1=X(hc[hc.length-1])+1;
  if(mouth==='обычный'&&!beard){for(let x=mx0;x<=mx1;x++){Q(x,mY,S.d);Q(x,mY+1,S.b)}Q(mx0-1,mY,S.m);Qs(mx0,mY+1,S.m)}
  else if(mouth==='неоновые губы'){for(let x=mx0;x<=mx1;x++){Q(x,mY,A.b,1);Q(x,mY+1,A.d)}Q(mx0,mY,A.l,1)}
  else if(mouth==='респиратор'){for(let x=X(hl+1);x<=X(hr-1)+1;x++){Q(x,mY,x%2?MT.d:MT.b);Q(x,mY+1,MT.m)}Q(mx0,mY,'#14101c');Q(mx0+1,mY,MT.l);Qn(hL,mY-1,MT.l);Qn(hR,mY-1,MT.d)}
  else if(mouth==='бандана'){for(let x=hL;x<=hR;x++)if(at(x,eY+2)===S2.b||at(x,eY+2)===S2.m){if((x+eY)%3===0)Q(x,eY+3,S2.m)}Qn(mx0,mY+1,A.b)}
  if(beard){for(let y=mY-1;y<=mY+1;y++)for(let x=hL+1;x<=hR-1;x++){const c=at(x,y);if(c===HR.d||c===mix(HR.d,DARK,.5)||skinSet.has(c)&&y===mY+1)Q(x,y,(x+y)%2?HR.d:HR.m)}for(let x=mx0;x<=mx1;x++)Q(x,mY,S.d)}
  // marks
  if(mark==='неон-тату'){Qs(hL+1,eY+2,A.b,1);Qs(hL+1,eY+3,A.l,1);Qs(hL+2,eY+4,A.b,1)}
  if(mark==='шрам'){const x=X(eyeX[1]);for(let k=-2;k<=3;k++)Qs(x+(k>0?1:0)+ (k>1?1:0),eY+k,S.d)}
  if(mark==='пирсинг'){if(mouth==='обычный'||mouth==='неоновые губы')Q(mx1,mY+1,MT.l);else Qn(hR-1,eY-2,MT.l)}
  // --- hair strands & highlights
  const hairSet=new Set([HR.l,HR.b,HR.m,HR.d]);
  if(hair!=='лысый')for(let y=0;y<N;y++)for(let x=0;x<N;x++){const c=at(x,y);if(!hairSet.has(c))continue;
    const up=at(x,y-1);if(!up||!hairSet.has(up)){if(c!==HR.d)Q(x,y,HR.l);continue}
    if((x*5+y*3)%7===0&&c===HR.b)Q(x,y,HR.m);else if((x*3+y)%9===0&&c===HR.m)Q(x,y,HR.d)}
  // --- torso detail
  const TRb=(top==='майка'||top==='футболка')?S2:M;
  for(let y=tT;y<=tB;y++){for(let x=0;x<N;x++){if(at(x,y)===TRb.m&&at(x+1,y)!==TRb.m&&at(x-1,y)===TRb.m)Q(x-1,y,TRb.b)}}
  const cX=X(cc[0])+(cc.length>1?1:0);
  switch(top){
    case 'куртка': for(let y=tT;y<=tB;y++){Q(cX,y,S2.d);Q(cX+1,y,(y%2)?MT.l:S2.d);}Q(cX-2,tT,M.l);Q(cX-3,tT+1,M.l);Q(cX+3,tT,M.l);Q(cX+4,tT+1,M.l);
      if(tB-tT>=5){Qn(X(sl)+1,tT+4,M.d);Qn(X(sl)+2,tT+4,M.d);Qn(X(sr),tT+4,M.d);Qn(X(sr)-1,tT+4,M.d)}break;
    case 'бомбер': for(let x=X(sl);x<=X(sr)+1;x++){Q(x,tB,(x%2)?M.d:M.m);Q(x,tB-1,M.d)}for(let y=tT;y<tB-1;y++)Q(cX,y,y%2?MT.l:MT.m);Qn(X(sl)+1,tT+1,A.b);break;
    case 'худи': if(!hood){for(let x=X(sl)+2;x<=X(sr)-1;x++)Q(x,tT,M.d)}Q(cX-1,tT+1,M.l);Q(cX-1,tT+2,M.l);Q(cX+2,tT+1,M.l);Q(cX+2,tT+3,M.l);
      if(tB-tT>=5){for(let x=cX-3;x<=cX+4;x++)Q(x,tB-3,M.d);Qn(cX-3,tB-2,M.d);Qn(cX+4,tB-2,M.d)}break;
    case 'плащ': for(let y=tT;y<=tB+X(Math.max(1,legsLen-2));y++){if(at(cX,y))Q(cX,y,S2.d);if(at(cX+1,y))Q(cX+1,y,M.d)}Q(cX-2,tT,M.l);Q(cX+3,tT,M.l);
      if(torsoLen>=4){Q(cX,tB-1,MT.l);Q(cX+1,tB-1,MT.h||MT.l)}break;
    case 'майка': Qn(X(cc[0])-2,tT,S2.b);Qn(X(cc[cc.length-1])+3,tT,S2.b);Q(cX,tT+2,A.b,1);Q(cX+1,tT+2,A.l,1);break;
    case 'футболка': if(tB-tT>=3){Q(cX-1,tT+2,A.b);Q(cX,tT+2,A.l);Q(cX+1,tT+2,A.b);Q(cX,tT+3,A.d);Q(cX+2,tT+3,A.d)}for(let x=X(sl);x<=X(sr)+1;x++)if(at(x,tB)===S2.b)Q(x,tB,S2.m);break;
    case 'бронежилет': for(let x=X(sl)+1;x<=X(sr);x++){if(at(x,tT+2))Q(x,tT+2,M.l);if(at(x,tT+3)&&x%4===0)Q(x,tT+3,M.d)}
      for(let y=tT+1;y<tB-1;y++)Qn(cX,y,M.d);Qn(X(sl)+1,tB-2,M.d);Qn(X(sl)+2,tB-2,M.d);Qn(X(sr),tB-2,M.d);for(let x=X(sl);x<=X(sr)+1;x++)if(at(x,tB))Q(x,tB,x%3?A.d:A.b);break;
    case 'комбинезон': for(let y=tT;y<=tB;y++)Q(cX,y,y%2?A.b:A.l);Qn(X(sl)+2,tT+2,M.d);Qn(X(sl)+3,tT+2,M.d);Qn(X(sl)+2,tT+3,M.d);break;
  }
  // belt buckle
  if(belt&&top!=='комбинезон'){for(let x=X(sl);x<=X(sr)+1;x++)if(at(x,lT))Q(x,lT,LG.d);Q(cX,lT,MT.l);Q(cX+1,lT,MT.b);Q(cX,lT+1,MT.m);Q(cX+1,lT+1,LG.d)}
  // arms: thinner sleeves (inner pixel column lighter), cuff, knuckles
  for(const side of ['L','R']){const h=hands[side];if(!h)continue;const hx2=X(h[0]),hy2=X(h[1]);
    if(at(hx2,hy2-1)&&!(has('кибер-рука')&&armSide===side)){Qn(hx2,hy2-1,mix(at(hx2,hy2-1),DARK,.3));Qn(hx2+1,hy2-1,mix(at(hx2+1,hy2-1)||M.m,DARK,.3))}
    if(has('кибер-рука')&&armSide===side){for(let y=tT;y<hy2;y++){if(y%3===0){Qn(hx2,y,MT.d);Qn(hx2+1,y,MT.d)}}Qn(hx2+(side==='L'?0:1),hy2+1,MT.d)}
    else{Qn(hx2+(side==='L'?1:0),hy2+1,gloves?'#2a2433':S.m)}}
  // legs: knee crease, inner shade, soles, laces
  const kY=X(kneeY);
  const legCols=[[X(sl),X(sl+lw-1)+1],[X(sr-lw+1),X(sr)+1]];
  for(const[a,b]of legCols){
    if(!has('кибер-ноги')&&!['шорты','юбка'].includes(legs)){Qn(a+1,kY,LG.m);Qn(a+2,kY,LG.m)}
    if(has('кибер-ноги')){for(let y=lT+2;y<X(15-bootRows);y++)if(y%3===1)for(let x=a;x<=b;x++)Qn(x,y,MT.d);Q(a+1,kY,IG.l,1);Q(a+1,kY+1,IG.b,1)}
    if(legs==='карго'&&legsLen>=4){Qn(a,lT+3,LG.d);Qn(a,lT+4,LG.d);Qn(a+1,lT+4,LG.d)}
    const bTop=X(15-bootRows);
    for(let x=a-1;x<=b+1;x++){if(at(x,29))Q(x,29,boots==='кроссовки'?'#cfcadb':BT.d)}
    if(boots==='кроссовки'){Qn(a+1,bTop,A.b);Qn(a+2,bTop+1,A.l);Qn(b,bTop,'#ffffff')}
    else{Qn(a,bTop,BT.l);if(boots==='высокие сапоги'){Qn(a+1,bTop+1,MT.l)}else Qn(b-1,bTop,BT.l)}
  }
  // --- implants detail
  if(has('кибер-глаз')){const x=X(eyeX[1]);Q(x,eY,'#ffd0d8',1);Q(x+1,eY,'#ff3355',1);Q(x,eY+1,'#ff3355',1);Q(x+1,eY+1,'#a01a30',1);Qn(x-1,eY-1,MT.l);Qn(x+2,eY+2,MT.d)}
  if(has('антенна')){const ax=X(antSide==='R'?hr:hl)+(antSide==='R'?1:0);for(let y=X(headTop-3);y<X(headTop);y++){Q(ax===X(hl)?ax+1:ax-1,y,null);Q(ax,y,y<X(headTop-2)?MT.l:MT.m)}Q(ax,X(headTop-3),IG.l,1);Q(ax,X(headTop-3)-1,'#ffffff',1)}
  if(has('нейро-порт')){Q(hL,eY,MT.l);Q(hL,eY+1,MT.d);Q(hL+1,eY+1,'#14101c');Q(hL,eY+2,IG.l,1);Q(hL,eY+3,IG.b,1)}
  if(has('реактор в груди')){const x=cX,y=tT+2;Q(x,y,'#ffffff',1);Q(x+1,y,IG.l,1);Q(x,y+1,IG.l,1);Q(x+1,y+1,IG.b,1);Qn(x-1,y,MT.m);Qn(x+2,y+1,MT.d);Qn(x,y-1,MT.l);Qn(x+1,y+2,MT.d)}
  if(has('схемы на лице')){const x=X(eyeX[0]);Q(x,eY+2,IG.l,1);Q(x,eY+3,IG.b,1);Q(x-1,eY+4,IG.b,1);Qs(x-1,eY+5,IG.d,1)}
  if(has('аудио-модуль')){Q(hR+1,eY+1,MT.l);Q(hR+2,eY+2,MT.b);Q(hR+1,eY+3,MT.d);Q(hR+2,eY+1,IG.l,1)}
  if(has('шейный разъём')){Q(X(nl+nw-1),X(headBot+1),MT.l);Q(X(nl+nw-1)+1,X(headBot+1),IG.l,1)}
  const H2=30-X(headTop);
  return{px:q,gl:g2,legTop:lT,traits,H,H2,hands:{L:hands.L&&[X(hands.L[0])+1,X(hands.L[1])],R:hands.R&&[X(hands.R[0])+1,X(hands.R[1])]},N};
}

// ================= FRAMES & RENDER =================
const rgbCache={};
const rgb=c=>rgbCache[c]||(rgbCache[c]=hx(c));
function frame(ch,f,outline){
  const N=ch.g.N||16,NN=N*N,u=N/16; // u = sprite pixels per old pixel
  let px=ch.g.px.slice(), gl=Array.from(ch.g.gl);
  const lt=ch.g.legTop;
  if(f===1){ // idle breath: upper body sinks by one sprite pixel
    for(let y=lt-1;y>=1;y--)for(let x=0;x<N;x++){px[y*N+x]=px[(y-1)*N+x];gl[y*N+x]=gl[(y-1)*N+x]}
    for(let x=0;x<N;x++){px[x]=null;gl[x]=0}
    for(let i=0;i<NN;i++)if(gl[i]&&px[i])px[i]=mix(px[i],'#ffffff',.35);
  }
  if(f>=2){ // walk cycle: 2 = left foot up, 3 = feet apart, 4 = right foot up, 5 = feet apart + body down
    const P0=px.slice(),G0=gl.slice();let sx=0,n=0;for(let y=lt;y<N;y++)for(let x=0;x<N;x++)if(P0[y*N+x]){sx+=x;n++}const cx=n?sx/n:N/2-.5;
    const lift=side=>{for(let y=lt+1;y<N;y++)for(let x=0;x<N;x++){if((x<cx)!==(side<0))continue;const i=y*N+x,yy=y+u;px[i]=yy<N?P0[yy*N+x]:null;gl[i]=yy<N?G0[yy*N+x]:0}};
    const spread=()=>{for(let y=Math.max(lt+1,N-3*u);y<N;y++){const row=P0.slice(y*N,y*N+N),grow=G0.slice(y*N,y*N+N);for(let x=0;x<N;x++){px[y*N+x]=null;gl[y*N+x]=0}
      for(let x=0;x<N;x++){if(!row[x])continue;const nx=x<cx?x-u:x+u;if(nx>=0&&nx<N){px[y*N+nx]=row[x];gl[y*N+nx]=grow[x]}}
      for(let x=0;x<N;x++)if(!px[y*N+x]&&row[x]&&(x<cx?px[y*N+x-1]:px[y*N+x+1]))px[y*N+x]=row[x]}}; // keep legs joined while they part
    if(f===2)lift(-1);else if(f===4)lift(1);else spread();
    if(f===2||f===4){const b=u>1?1:1;for(let y=0;y<lt;y++)for(let x=0;x<N;x++){const i=y*N+x;px[i]=y<lt-b?P0[(y+b)*N+x]:px[i];gl[i]=y<lt-b?G0[(y+b)*N+x]:gl[i]}
      for(let k=1;k<=b;k++)for(let x=0;x<N;x++){const i=(lt-k)*N+x;if(!px[i]&&P0[(lt-k)*N+x])px[i]=P0[(lt-k)*N+x]}}
  }
  if(outline)px=outline1(px,N,N,OUT);
  return{px,gl,N};
}
function toImageData(fr){
  const N=fr.N||Math.round(Math.sqrt(fr.px.length)),id=new ImageData(N,N);
  for(let i=0;i<N*N;i++){const c=fr.px[i];if(!c)continue;const [r,g,b]=rgb(c);id.data[i*4]=r;id.data[i*4+1]=g;id.data[i*4+2]=b;id.data[i*4+3]=255}
  return id;
}
