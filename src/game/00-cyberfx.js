// ================= CYBERPUNK PASS OVER THE PIXELFX LIBRARY =================
// The bundled library (window.PFX, 244 effects) is generic: part of it is fantasy — fish, bats, skulls, feathers,
// runes, chests, potions, fountains, campfires. This module runs before the game and:
//  • REDRAWS effects whose very shape is fantasy with procedural cyberpunk ones (drones, cables, nanites,
//    holo-icons, HUD reticles, burst pipes, burning barrels, neon tubes, supply crates, sentry cams, hop-bots);
//  • RESKINS effects that only look fantasy by colour/name (holy gold, arcane violet…) with neon palettes and cyber names.
// Ids stay the same, so items, statuses and the arsenal keep working.
(function(){
if(typeof PFX==='undefined'||!PFX.all||!PFX.core)return;
const E=PFX.all.effects,C=PFX.core,TAU=Math.PI*2;
const PAL={
  cyan:['#04121a','#0a2a3a','#0f4a5e','#127a8a','#18b0c0','#22e6ff','#a8f8ff','#ffffff'],
  magenta:['#1a0414','#3a0a2a','#6a1048','#a01a6a','#d8238c','#ff2fa8','#ff9ad6','#ffffff'],
  acid:['#061204','#0e2a08','#1a4a10','#2a7a18','#4ab020','#7dff4f','#c8ffa8','#ffffff'],
  amber:['#1a0e02','#3a1e04','#6a3408','#a0520c','#d87a14','#ffb02e','#ffe08a','#ffffff'],
  violet:['#0e061a','#1e0c3a','#34146a','#5420a0','#7a30d8','#b45cff','#dcb0ff','#ffffff'],
  red:['#1a0406','#3a080e','#6a0e18','#a01424','#d81c34','#ff4b6a','#ffb0bc','#ffffff'],
  steel:['#08090c','#16181e','#2a2d36','#4a4e58','#6f7684','#9aa3b4','#d2d8e4','#ffffff'],
  toxic:['#0a0e02','#1a2404','#344808','#5a7a10','#8ab018','#c8f02a','#eeffa0','#ffffff'],
};
const R=p=>C.ramp(PAL[p]||p);
const hash=(i,s=0)=>{let h=(i*374761393+s*668265263)|0;h=(h^(h>>>13))*1274126177|0;return((h^(h>>>16))>>>0)/4294967296};
const lp=(a,b,k)=>a+(b-a)*k;
// ---- tiny pixel glyphs for holo-icons ----
const GLY={
  warn:['...#...','..#.#..','..#.#..','.#.#.#.','.#...#.','#..#..#','#######'],
  q:['.#####.','##...##','....##.','...##..','...##..','.......','...##..'],
  batt:['########.','#......##','#.#....##','#.#....##','########.'],
  wifi:['.#####.','#.....#','..###..','.#...#.','...#...','...#...'],
  plus:['..###..','..###..','#######','#######','#######','..###..','..###..'],
  card:['#######','#.....#','#######','#.....#','#.##..#','#######'],
  stim:['......#','.....#.','..###..','.###...','###....','.#.....','#......'],
  chip:['.#.#.#.','#######','.#...#.','##.#.##','.#...#.','#######','.#.#.#.'],
  bolt:['...##','..##.','.####','..##.','.##..','##...'],
  virus:['#..#..#','.#####.','.#...#.','##.#.##','.#...#.','.#####.','#..#..#'],
  x:['#.....#','.#...#.','..#.#..','...#...','..#.#..','.#...#.','#.....#'],
};
function glyph(e,g,x0,y0,col,a=1,jit=0,sc=1){const G=GLY[g]||GLY.warn;for(let j=0;j<G.length;j++){const dx=jit&&hash(j,jit)<.25?(hash(j,jit+1)<.5?-1:1):0;
  for(let i=0;i<G[j].length;i++)if(G[j][i]==='#'){if(sc===1)e.dot(x0+i+dx,y0+j,col,a);else e.rect(x0+(i+dx)*sc,y0+j*sc,sc,sc,col,a)}}}
const gw=g=>(GLY[g]||GLY.warn)[0].length,gh=g=>(GLY[g]||GLY.warn).length;

// ================= GENERATORS =================
// Every generator draws around the origin (0,0) = the effect's anchor; y grows downwards, up is negative.
const GEN={
  // small quad-drones on orbits / figure-eights, blinking LEDs and thruster glow
  drones(e,t,a,P){const n=a.count||1,s=a.seed||1,r=a.r||18,sz=a.size||1;
    for(let k=0;k<n;k++){const ph=hash(k,s)*TAU,sp=(a.speed||1)*(.8+hash(k,s+9)*.5);let x,y;
      if(a.path==='swarm'){x=Math.sin(t*sp*1.3+ph)*r+Math.sin(t*2.1+k)*4+(hash(k,s+3)-.5)*r;y=Math.cos(t*sp*.9+ph*1.7)*r*.45+(hash(k,s+4)-.5)*r*.6}
      else if(a.path==='orbit'){x=Math.cos(t*sp*1.6+k*TAU/n)*r;y=Math.sin(t*sp*1.6+k*TAU/n)*r*.35+(a.oy||0)}
      else if(a.path==='drift'){x=((hash(k,s+5)*2-1)*r+t*6*sp)%r;y=(hash(k,s+6)-.5)*r*.8+Math.sin(t*2+ph)*3+(a.oy||0)}
      else{x=Math.sin(t*sp*1.4+ph)*r;y=Math.sin(t*sp*2.8+ph)*r*.35+(a.oy||0)}
      x=Math.round(x);y=Math.round(y+Math.sin(t*9+k)*.6);
      const S=R('steel');e.glow(x,y+4,7*sz,P[4],.3);e.glowLine(x,y+2,x,y+6+sz*3,1.5+sz*.5,P[5],.45);
      if(sz>=2){const rot=(t*30+k|0)%2;e.rect(x-4,y-1,9,4,S[3]);e.rect(x-4,y-1,9,1,S[5]);e.rect(x-3,y+3,7,1,S[2]);e.line(x-4,y-1,x-7,y-3,S[4]);e.line(x+4,y-1,x+7,y-3,S[4]);
        e.rect(x-10,y-4+rot,6,1,P[6],.9);e.rect(x+5,y-4+(1-rot),6,1,P[6],.9);e.rect(x-1,y+1,3,1,P[5])}
      else{const rot=(t*30+k|0)%2;e.rect(x-2,y,5,2,S[4]);e.dot(x,y-1,S[5]);e.rect(x-4,y-1+rot,2,1,P[6]);e.rect(x+3,y-rot,2,1,P[6])}
      const on=((t*4+k*.7)%1)<.5;e.dot(x,y+(sz>=2?0:1),on?P[7]:P[5]);e.glow(x,y,3+sz,P[5],on?.5:.2)}},
  // cables / power lines lashing up from the floor, sparking at the tips
  cables(e,t,a,P,dur){const n=a.count||4,s=a.seed||2,ox=a.ox||0,L=a.len||30,w=a.spread||30,grow=Math.min(1,t/(dur*.35)),fade=a.loopy?1:Math.min(1,(dur-t)/(dur*.25)+.2);
    for(let k=0;k<n;k++){const bx=ox+Math.round((n===1?0:(k/(n-1)-.5))*w+(hash(k,s)-.5)*6),len=L*(.7+hash(k,s+1)*.5)*grow,segs=12;let px=bx,py=0;
      const ph=hash(k,s+2)*TAU,sw=a.whip?Math.sin(t*6+ph)*1.6:Math.sin(t*2.2+ph)*.6;
      for(let i=1;i<=segs;i++){const f=i/segs,x=bx+Math.sin(f*3+ph)*(4+f*8)*sw+(a.lean||0)*f*len*.6,y=-f*len;
        e.line(Math.round(px),Math.round(py),Math.round(x),Math.round(y),i%3===0?P[5]:P[3],fade);e.line(Math.round(px)+1,Math.round(py),Math.round(x)+1,Math.round(y),P[2],fade);e.glowLine(px,py,x,y,2,P[4],.12*fade);px=x;py=y}
      if(len>3){const sp=((t*8+k)%1)<.6;e.glow(px,py,4,P[5],(sp?.6:.25)*fade);e.dot(Math.round(px),Math.round(py),P[7],fade);
        for(let j=0;j<3;j++){const q=(t*3+j*.33+k*.1)%1;e.dot(Math.round(px+(hash(j+k*7,s+(t*6|0))-.5)*10*q),Math.round(py+q*8),P[6],(1-q)*fade)}}
      e.rect(bx-2,-1,5,2,P[3],fade)}
    e.glow(0,0,w*.6,P[4],.08*grow)},
  // square nanites / data bits spiralling up and around
  nanites(e,t,a,P,dur){const n=a.count||40,s=a.seed||3,r=a.r||14,H=a.h||44,mode=a.mode||'helix';
    for(let k=0;k<n;k++){const ph=hash(k,s)*TAU,q=(t/dur*(a.loops||1.5)+hash(k,s+1))%1;let x,y;
      if(mode==='burst'){const ang=ph,d=Math.min(1,t/(dur*.25))*r*(1+hash(k,s+2))-q*2;x=Math.cos(ang)*d;y=-H*.5+Math.sin(ang)*d*.7+q*q*16}
      else if(mode==='fall'){x=(hash(k,s+2)-.5)*(a.w||100)+Math.sin(t*1.5+ph)*6;y=-((a.h||80)*(1-((t*.25*(1+hash(k,s+3)))+hash(k,s+4))%1))}
      else{x=Math.cos(ph+t*3)*r*(1-q*.4);y=-q*H}
      const big=hash(k,s+5)<.25,col=hash(k,s+6)<.15?P[7]:big?P[5]:P[4],al=mode==='fall'?.9:Math.sin(Math.PI*q);
      const X=Math.round(x),Y=Math.round(y);if(big)e.rect(X,Y,2,2,P[6],Math.min(1,al*1.3));else e.dot(X,Y,col,Math.min(1,al*1.3));e.glow(x,y,big?4:3,P[5],.35*al)}
    if(a.ring){const q=(t/dur*2)%1;e.glowRing(0,-q*H,10+4*(1-q),1.2,P[5],.5*(1-q))}
    if(a.core)e.glow(0,-H*.5,10,P[5],.15+.1*Math.sin(t*6))},
  // hologram icon(s) above the head with flicker and scan lines
  holo(e,t,a,P){const g=a.glyph||'warn',hy=a.hy||-54,n=a.count||1,sc=a.sc||1,fl=((t*12)|0)%9===0?.35:1,W=gw(g)*sc,H=gh(g)*sc;
    for(let k=0;k<n;k++){let x,y;if(n>1){const ang=t*3+k*TAU/n;x=Math.round(Math.cos(ang)*(a.or||14)-W/2);y=Math.round(hy+Math.sin(ang)*4-H/2)}else{x=-Math.floor(W/2);y=hy-Math.floor(H/2)+Math.round(Math.sin(t*3)*1.5)}
      e.glow(x+W/2,y+H/2,W*.9+4,P[4],.4*fl);glyph(e,g,x,y,P[5],fl,((t*10)|0)+k,sc);glyph(e,g,x,y-1,P[7],.25*fl,0,sc);
      for(let j=0;j<H;j+=2)e.rect(x-1,y+j,W+2,1,P[6],.1*fl)}
    if(n===1){if(a.stem!==0)e.glowLine(0,hy+H/2+2,0,hy+H/2+10,1,P[5],.35);const cx=-Math.floor(W/2)-3,cy=hy-Math.floor(H/2)-3,BW=W+5,BH=H+5;
      for(const[dx,dy]of[[0,0],[BW,0],[0,BH],[BW,BH]]){e.dot(cx+dx,cy+dy,P[6]);e.dot(cx+dx+(dx?-1:1),cy+dy,P[5]);e.dot(cx+dx,cy+dy+(dy?-1:1),P[5])}}
    if(a.label)e.text(a.label,0,hy-H/2-(n>1?12:10),P[6],{align:'center',a:fl,outline:P[1]})},
  // HUD reticle / targeting array on the floor, with variants (clock, sigil, assembler)
  reticle(e,t,a,P,dur){const R0=a.r||26,cy=a.cy||0,sq=.38,on=Math.min(1,t/(dur*.2));
    const ell=(r,col,al,dash)=>{const n=Math.max(16,r*3|0);for(let i=0;i<n;i++){if(dash&&((i+(t*12|0))%dash)<dash/2)continue;const an=i/n*TAU;e.dot(Math.round(Math.cos(an)*r),Math.round(cy+Math.sin(an)*r*sq),col,al)}};
    if(a.kind!=='clock'&&a.kind!=='sigil'){ell(R0*on,P[5],.9,0);ell(R0*.7*on,P[4],.7,6);
      for(let i=0;i<8;i++){const an=i/8*TAU+t*1.2;e.line(Math.round(Math.cos(an)*R0*.78),Math.round(cy+Math.sin(an)*R0*.78*sq),Math.round(Math.cos(an)*R0),Math.round(cy+Math.sin(an)*R0*sq),P[6],.8)}
      for(let i=0;i<14;i++){const an=i/14*TAU-t*.8;const b=hash(i,(t*4)|0)<.5;e.dot(Math.round(Math.cos(an)*R0*.55),Math.round(cy+Math.sin(an)*R0*.55*sq),b?P[7]:P[3],.9)}
      e.glow(0,cy,R0*.8,P[4],.12*on)}
    if(a.kind==='cast'){const q=Math.max(0,(t-dur*.35)/(dur*.4));if(q>0&&q<1.3){e.beam(0,cy,0,cy-120,6*(1-Math.abs(q-.6)),P[5],.6*(1.3-q));e.glowLine(0,cy,0,cy-120,2,P[7],.7*(1.3-q))}}
    if(a.kind==='assemble'){const q=Math.min(1,Math.max(0,(t-dur*.2)/(dur*.6))),H=34,top=cy-H*q;
      for(let y=cy;y>top;y-=2){const w=y>cy-10?5:y>cy-26?7:4;e.rect(-w/2|0,y,w,1,P[4],.8)}e.rect(-6,Math.round(top),13,1,P[7]);e.glow(0,top,6,P[5],.5);
      if(q>=1){e.dot(-2,cy-30,P[7]);e.dot(1,cy-30,P[7])}}
    if(a.kind==='clock'){const hy=a.hy||-54,r=a.cr||9,sp=a.lag?(.4+.6*Math.abs(Math.sin(t*1.3))):1;
      for(let i=0;i<20;i++){const an=i/20*TAU,on2=((i/20+t*sp)%1)<.35;e.dot(Math.round(Math.cos(an)*r),Math.round(hy+Math.sin(an)*r),on2?P[6]:P[2],on2?1:.6)}
      e.glow(0,hy,r+4,P[4],.35);e.text(a.label||'LAG',0,hy-3,P[6],{align:'center',scale:a.ts||1,outline:P[1]})}
    if(a.kind==='sigil'){const hy=a.hy||-30,q=Math.min(1,t/(dur*.5)),N=9,Z=a.sc||2;
      for(let j=0;j<N;j++)for(let i=0;i<N;i++){if(hash(i+j*N,a.seed||4)<.5||(i+j*N)/(N*N)>q)continue;const cor=(i<3&&j<3)||(i>5&&j<3)||(i<3&&j>5);e.rect((i-N/2)*Z|0,(hy+(j-N/2)*Z)|0,Z-1||1,Z-1||1,cor?P[7]:P[5])}
      e.glow(0,hy,N*Z,P[5],.35*q);ell(R0*.6,P[4],.5,4)}},
  // a broken pipe spurting coolant (up = fountain, cascade = from above)
  pipe(e,t,a,P,dur){const S=R('steel');if(a.cascade){const top=a.top||-80;e.rect(-14,top-6,28,6,S[3]);e.rect(-14,top-6,28,1,S[5]);e.rect(-4,top,8,3,S[2]);
      for(let i=0;i<60;i++){const q=(t*1.6+hash(i,7))%1,x=Math.round((hash(i,8)-.5)*8+Math.sin(q*6+i)*1.5),y=Math.round(top+3+q*(-top-2));e.dot(x,y,hash(i,9)<.3?P[7]:P[5],.9)}
      e.glowLine(0,top+3,0,-2,4,P[5],.25);for(let i=0;i<14;i++){const q=(t*1.2+hash(i,5))%1;e.glow(Math.round((hash(i,6)-.5)*30*q),-2-q*8,4,S[5],.25*(1-q))}e.glowRing(0,0,10,2,P[5],.35);return}
    e.rect(-12,-4,24,4,S[3]);e.rect(-12,-4,24,1,S[5]);e.rect(-3,-9,6,5,S[2]);e.rect(-4,-9,8,1,S[4]);
    for(let i=0;i<70;i++){const q=(t*1.4+hash(i,3))%1,vx=(hash(i,4)-.5)*36,vy=-(40+hash(i,5)*30),x=Math.round(vx*q),y=Math.round(-9+vy*q+60*q*q);if(y>0)continue;e.dot(x,y,hash(i,6)<.3?P[7]:P[5],1-q*.5)}
    e.glowLine(0,-9,0,-50,3,P[5],.3);for(let i=0;i<10;i++){const q=(t*.8+hash(i,2))%1;e.glow(Math.round((hash(i,1)-.5)*20),-12-q*30,5,S[5],.18*(1-q))}},
  // burning oil drum
  barrel(e,t,a,P){const S=R('steel'),w=a.w||14,h=a.h||18;e.rect(-w/2,-h,w,h,S[2]);e.rect(-w/2,-h,w,1,S[4]);e.rect(-w/2,-h*.66|0,w,1,S[4]);e.rect(-w/2,-h*.33|0,w,1,S[4]);e.rect(-w/2,-h,2,h,S[3]);
    e.rect(-w/2+3,-h+4,3,4,R('amber')[4],.7);
    for(let i=0;i<26;i++){const q=(t*1.8+hash(i,11))%1,x=Math.round((hash(i,12)-.5)*(w-2)*(1-q*.6)+Math.sin(t*7+i)*1.2),y=Math.round(-h-q*(18+hash(i,13)*10));
      const col=q<.25?P[7]:q<.5?P[6]:q<.75?P[5]:P[3],sz=q<.5?2:1;if(hash(i,(t*20)|0)<.85)e.rect(x,y,sz,sz,col);e.glow(x,y,3+(1-q)*3,P[5],.35*(1-q))}
    for(let i=0;i<8;i++){const q=(t*1.1+hash(i,14))%1;e.dot(Math.round((hash(i,15)-.5)*20*q),Math.round(-h-10-q*36),P[6],1-q)}
    e.glow(0,-h-6,26,P[4],.18+.06*Math.sin(t*13))},
  // flickering neon tube sign on a wall
  neon(e,t,a,P){const word=a.word||'OPEN',hy=a.hy||-40,flick=hash((t*14)|0,a.seed||5)<.08?.15:1,w=word.length*4+6;
    const S=R('steel');e.rect(-w/2-2,hy-6,w+4,13,S[1],.9);e.rect(-w/2-2,hy-6,w+4,1,S[3]);
    e.glow(0,hy,w*.7,P[4],.3*flick);e.text(word,0,hy-3,P[6],{align:'center',a:flick});e.text(word,0,hy-3,P[7],{align:'center',a:.4*flick});
    e.glowLine(-w/2,hy+7,w/2,hy+7,1,P[5],.5*flick)},
  // metal supply crate / pod that pops open with light
  crate(e,t,a,P,dur){const S=R('steel'),q=Math.max(0,Math.min(1,(t-dur*.3)/(dur*.2))),shake=t<dur*.3?Math.round(Math.sin(t*50)*(t/(dur*.3))):0;
    if(a.pod){e.rect(-8+shake,-24,16,24,S[2]);e.rect(-8+shake,-24,16,2,S[4]);e.rect(-5+shake,-20,10,12,P[2]);e.glowLine(-5,-14,5,-14,1,P[5],.6);
      if(q>0){e.rect(-9-q*6,-26,6,26,S[3]);e.rect(4+q*6,-26,6,26,S[3]);e.glow(0,-12,16*q,P[5],.4*q);for(let i=0;i<12;i++){const r=(t*2+hash(i,3))%1;e.glow(Math.round((hash(i,4)-.5)*30*r),-16-r*20,4,S[5],.2*(1-r))}}
      return}
    e.rect(-12+shake,-12,24,12,S[2]);e.rect(-12+shake,-12,24,1,S[4]);e.rect(-12+shake,-6,24,1,P[5],.9);e.rect(-2+shake,-9,4,3,P[6]);
    const lid=-12-q*10;e.rect(-13,Math.round(lid)-3,26,3,S[3]);e.rect(-13,Math.round(lid)-3,26,1,S[5]);
    if(q>0){e.glowLine(0,-14,0,-50,8*q,P[5],.35*q);e.glowLine(0,-14,0,-40,3,P[7],.4*q);for(let i=0;i<10;i++){const r=(t*1.5+hash(i,2))%1;e.dot(Math.round((hash(i,3)-.5)*20),Math.round(-14-r*40),P[7],(1-r)*q)}}},
  // security camera on a bracket, sweeping a red scan cone
  cam(e,t,a,P){const S=R('steel'),sw=Math.sin(t*1.2)*.6,hx=0,hy=-30;e.rect(-1,hy,2,30,S[2]);e.rect(-5,-2,10,2,S[3]);
    e.rect(hx-6,hy-4,12,7,S[3]);e.rect(hx-6,hy-4,12,1,S[5]);const lx=hx+Math.round(sw*5)+4;e.rect(lx-1,hy-2,3,3,P[2]);e.dot(lx,hy-1,P[7]);e.glow(lx,hy-1,4,P[5],.7);
    const ex=lx+Math.cos(sw)*40,ey=hy+18+Math.sin(sw)*10;e.beam(lx,hy-1,ex,ey,6,P[4],.18);e.glowLine(lx,hy-1,ex,ey,1,P[5],.3);e.glowRing(ex,ey,5,1,P[5],.4*(.5+.5*Math.sin(t*8)))},
  // little hopping robot (crab legs)
  hopper(e,t,a,P,dur){const S=R('steel'),q=(t/dur*2)%1,jump=q>.5?Math.sin((q-.5)*2*Math.PI)*14:0,crouch=q<.5?Math.sin(q*2*Math.PI)*2:0,y=Math.round(-jump+crouch),x=Math.round(Math.sin(t*1.5)*10);
    e.glow(x,-1,6,S[3],.2);e.rect(x-5,y-7,10,5,S[3]);e.rect(x-5,y-7,10,1,S[5]);e.dot(x-2,y-5,P[7]);e.dot(x+2,y-5,P[7]);e.glow(x,y-5,4,P[5],.5);
    for(const s of[-1,1])for(let l=0;l<2;l++){const lx=x+s*(3+l*2);e.line(lx,y-3,lx+s*3,y+(jump>1?1:2)-crouch,S[4])}
    if(q>.48&&q<.56)for(let i=0;i<6;i++)e.dot(x+(i-3)*2,-1,P[5],.6)},
  // flechette dart (replaces arrows)
  dart(e,t,a,P,dur){const W=a.W||100,q=(t/dur)%1,x=Math.round(-W*.4+q*W*.9),y=0;e.glowLine(x-24,y,x,y,1.5,P[4],.5);e.line(x-10,y,x,y,P[6]);e.rect(x,y-1,3,3,P[7]);e.glow(x+1,y,4,P[5],.6);
    if(a.muzzle&&t<dur*.15){e.glow(-W*.42,0,8,R('amber')[6],.8);e.glow(-W*.42,0,14,R('amber')[5],.4)}}
};
// ================= WHAT GETS REDRAWN =================
// [id, generator, palette, options, new name, description]
const REDRAW=[
  ['critters/bat','drones','violet',{count:1,size:2,r:26,oy:-4},'Recon Drone','A recon quad-drone loops on a figure-eight, rotors flickering, a violet LED blinking under it.'],
  ['critters/bird','drones','cyan',{count:1,size:2,r:20},'Courier Drone','A courier drone hovers in place, bobbing on its thrusters.'],
  ['critters/butterfly','drones','magenta',{count:3,size:2,r:18,path:'swarm'},'Micro-drones','Three micro-drones flit around like neon midges.'],
  ['critters/fish-school','drones','cyan',{count:9,size:1,r:34,path:'swarm',speed:.7},'Drone Swarm','A swarm of micro-drones holds formation in two rows, LEDs flickering in sequence.'],
  ['critters/flying-skull','drones','red',{count:1,size:2,r:12,speed:1.6},'Hunter-Killer Drone','A red-eyed hunter-killer drone darts about, thrusters roaring.'],
  ['critters/wisp','drones','acid',{count:1,size:2,r:18,speed:1.3},'Spark Bot','A tiny spark bot zips along a figure-eight trailing green light.'],
  ['critters/ghost','holo','cyan',{glyph:'x',hy:-24,sc:2,label:'NO SIGNAL'},'Signal Ghost','A dead-channel hologram flickers in the air: NO SIGNAL.'],
  ['critters/frog','hopper','acid',{},'Hop-Bot','A crab-legged hop-bot crouches and springs, eyes glowing.'],
  ['critters/snake','cables','acid',{count:1,len:14,spread:0,whip:1,lean:2,loopy:1},'Cable Snake','A live cable writhes across the floor, sparking at the tip.'],
  ['critters/eyeball','cam','red',{},'Sentry Cam','A security camera sweeps the room with a red scan cone.'],
  ['shadow/necro-skulls','drones','acid',{count:4,size:2,r:20,path:'orbit',oy:-24},'Orbit Drones','Four drones circle a green beacon on a tilted orbit.'],
  ['shadow/curse','holo','violet',{glyph:'virus',hy:-50,sc:2},'Malware','A virus icon stamps itself over the head and pulses.'],
  ['shadow/grasping-hands','cables','violet',{count:5,len:26,spread:34,whip:1},'Grapple Cables','Cables burst from the floor and whip around the target, sparking.'],
  ['shadow/shadow-tendrils','cables','violet',{count:6,len:34,spread:50,loopy:1},'Data Tendrils','Violet data cables rise from a floor port and sway, crackling at the tips.'],
  ['shadow/hex-sigil','reticle','magenta',{kind:'sigil',hy:-40,r:40,sc:4},'Hack Glyph','A QR-like hack glyph assembles in the air, block by block.'],
  ['status/cursed','holo','acid',{glyph:'virus',hy:-52,label:'INFECTED'},'Infected','A virus icon glitches over the head: the target is infected.'],
  ['status/charmed','holo','magenta',{glyph:'wifi',hy:-52,label:'HIJACK'},'Hijacked','A hijack signal pulses over the head: someone else is at the controls.'],
  ['status/confused','holo','amber',{glyph:'q',hy:-52,label:'ERR'},'Corrupted','A glitching question mark: the target’s software is scrambled.'],
  ['status/sleep','holo','cyan',{glyph:'batt',hy:-52,label:'STANDBY'},'Standby','A low-battery icon blinks: the target is in standby.'],
  ['status/stunned','holo','amber',{glyph:'warn',hy:-42,count:3,or:16},'System Error','Three warning signs orbit the head: system error.'],
  ['status/slowed','reticle','cyan',{kind:'clock',hy:-50,cr:12,lag:1,label:'LAG'},'Lag','A buffering ring spins over the head: the target lags.'],
  ['arcane/time-stop','reticle','cyan',{kind:'clock',hy:-50,cr:30,ts:2,label:'PAUSE'},'System Pause','A HUD ring freezes everything: SYSTEM PAUSE.'],
  ['arcane/rune-circle','reticle','magenta',{r:34},'Holo-Reticle','A holographic targeting ring turns on the floor, ticks and bits racing round.'],
  ['arcane/magic-circle-cast','reticle','violet',{kind:'cast',r:30},'Orbital Uplink','A targeting array locks on, then an orbital beam slams down.'],
  ['spawn/summon-rise','reticle','amber',{kind:'assemble',r:28},'Assembler Pad','A fabrication pad prints a combat frame layer by layer.'],
  ['spawn/egg-hatch','crate','acid',{pod:1},'Pod Hatch','A stasis pod shudders, vents steam and splits open.'],
  ['pickups/chest-open','crate','amber',{},'Supply Crate','A supply crate rattles, the lid pops and light spills out.'],
  ['pickups/key-glint','holo','cyan',{glyph:'card',hy:-16,sc:2,stem:0},'Keycard','A holo-keycard hovers and glints.'],
  ['pickups/potion','holo','acid',{glyph:'stim',hy:-16,sc:2,stem:0},'Stim','A stim injector hovers, its tag glowing.'],
  ['pickups/gem-spin','holo','magenta',{glyph:'chip',hy:-16,sc:2,stem:0},'Data Chip','A data chip turns in the air, pins glinting.'],
  ['pickups/heart-pickup','holo','red',{glyph:'plus',hy:-16,sc:2,stem:0},'Medi-gel','A medi-gel pack hovers, its cross pulsing.'],
  ['pickups/power-star','holo','amber',{glyph:'bolt',hy:-16,sc:2,stem:0},'Overclock','An overclock charge crackles in the air.'],
  ['holy/feather-burst','nanites','cyan',{mode:'burst',count:50,r:20,h:40},'Nanite Burst','A pop of white light throws out a cloud of glittering nanites.'],
  ['holy/resurrection','nanites','cyan',{count:70,r:12,h:56,ring:1,core:1},'Reboot','Nanites stream up the body and a scan ring climbs it: system reboot.'],
  ['nature/healing-bloom','nanites','acid',{count:45,r:9,h:40,ring:1},'Repair Swarm','A repair swarm spirals up the body, knitting it back together.'],
  ['nature/leaf-storm','nanites','acid',{count:60,r:16,h:52},'Nanite Storm','A spiral of nanites whirls around the character.'],
  ['nature/root-snare','cables','acid',{count:5,len:18,spread:22},'Cable Snare','Cables burst up and coil around the legs.'],
  ['nature/thorns','cables','steel',{count:9,len:18,spread:150,ox:80},'Rebar Spikes','Bent rebar rams up out of the floor in a line.'],
  ['nature/vine-whip','cables','amber',{count:1,len:44,spread:0,whip:1,lean:1.5},'Power Cable Lash','A live power cable rears up and lashes out, spitting sparks.'],
  ['weather/cherry-blossoms','nanites','magenta',{mode:'fall',count:70,w:220,h:140},'Neon Ash','Pink neon ash drifts down through the air.'],
  ['weather/falling-leaves','nanites','amber',{mode:'fall',count:60,w:220,h:140},'Falling Embers','Embers and hot scraps drift down.'],
  ['weather/fireflies','drones','acid',{count:10,size:1,r:60,path:'swarm',speed:.4},'Micro-drone Cloud','Dozens of micro-drones blink in the dark.'],
  ['weather/aurora','nanites','cyan',{mode:'fall',count:140,w:240,h:150},'Data Rain','Columns of data bits rain down the screen.'],
  ['fire/campfire','barrel','amber',{},'Barrel Fire','A dented oil drum burns, sparks spiralling up.'],
  ['fire/brazier','barrel','amber',{w:16,h:22},'Drum Fire','A tall drum fire roars, throwing light around.'],
  ['fire/torch','neon','magenta',{word:'BAR',hy:-50},'Neon Sign','A neon BAR sign buzzes and flickers on the wall.'],
  ['fire/candle','neon','red',{word:'EXIT',hy:-30},'Exit Light','An emergency EXIT light glows red.'],
  ['water/fountain','pipe','cyan',{},'Burst Pipe','A burst pipe sprays coolant into the air.'],
  ['water/waterfall','pipe','cyan',{cascade:1,top:-90},'Coolant Spill','Coolant pours from a broken overhead pipe, steaming where it lands.'],
  ['projectiles/arrow','dart','cyan',{W:112},'Flechette','A steel flechette streaks along on a cyan tracer.'],
  ['moves/arrow-shot','dart','cyan',{W:150,muzzle:1},'Flechette Shot','A muzzle flash, then a flechette whips across on a cyan tracer.'],
];
// ================= WHAT GETS RESKINNED (palette + name) =================
const RESKIN={
  'holy/blessing':['cyan','Uplink Beam'],'holy/divine-shield':['cyan','Energy Barrier'],'holy/halo':['cyan','Holo-ring'],'holy/heal':['acid','Nano-repair'],
  'holy/heal-aoe':['acid','Repair Field'],'holy/holy-pillar':['cyan','Orbital Beam'],'holy/smite':['cyan','Orbital Strike'],'holy/sunburst':['amber','Reactor Flare'],
  'arcane/arcane-beam':['magenta','Particle Beam'],'arcane/arcane-missiles':['magenta','Micro-missiles'],'arcane/arcane-orb':['magenta','Plasma Orb'],'arcane/blink-in':['cyan','Phase In'],
  'arcane/blink-out':['cyan','Phase Out'],'arcane/mana-burst':['magenta','Power Surge'],'arcane/portal':['violet','Warp Breach'],'arcane/spell-charge':['cyan','Capacitor Charge'],'arcane/star-fall':['cyan','Satellite Rain'],
  'shadow/black-hole':['violet','Singularity'],'shadow/dark-explosion':['violet','Antimatter Blast'],'shadow/eclipse':['violet','Dark Reactor'],'shadow/life-steal':['red','Bio-drain'],
  'shadow/shadow-flames':['violet','Plasma Fire'],'shadow/soul-drain':['violet','Data Siphon'],'shadow/void-orb':['violet','Void Core'],
  'fire/spirit-flame':['cyan','Plasma Flame'],'fire/fire-breath':['amber','Flamer Cone'],'fire/meteor':['amber','Orbital Debris'],
  'moves/holy-smite':['cyan','Orbital Smite'],'moves/meteor-call':['amber','Orbital Barrage'],'moves/fireball-throw':['amber','Thermite Throw'],
  'spawn/soul-rise':['cyan','Upload'],'spawn/spawn-portal':['violet','Warp Breach'],'spawn/dissolve-burn':['amber','Thermal Burn'],
  'status/petrified':['steel','Locked Down'],'melee/scythe-reap':['magenta','Mono-scythe'],
  'water/wave-crash':['acid','Coolant Surge'],'water/whirlpool':['acid','Drain Vortex'],'water/water-orb':['steel','Liquid Metal'],'water/bubbles':['acid','Coolant Vent'],
  'water/drip':['acid','Coolant Drip'],'water/water-jet':['cyan','Coolant Jet'],'water/geyser':['cyan','Steam Vent'],
  'critters/jellyfish':['magenta','Holo-jelly'],'weather/shooting-stars':['cyan','Satellite Debris'],'weather/god-rays':['cyan','Floodlights'],'weather/clouds':['toxic','Smog'],
  'weather/fog':['toxic','Smog Bank'],'weather/rain':['acid','Acid Rain'],'transitions/star-iris':['magenta','Neon Iris'],'explosions/cartoon-pow':['magenta','POW Sign'],
  'explosions/firework-burst':['magenta','Neon Firework'],'explosions/firework-rocket':['cyan','Signal Rocket'],'projectiles/magic-missile':['magenta','Smart Missile'],
  'pickups/crystal-shard':['cyan','Data Shard'],'pickups/coin-spin':['amber','Credit Chip'],'spawn/coin-drop':['amber','Credit Drop'],'ui/quest-complete':['cyan','Mission Complete'],
};
// ---- apply ----
const loopOf=m=>!!m.loop;
for(const[id,gen,pal,opt,name,desc]of REDRAW){const old=E[id];if(!old)continue;const m=old.meta||{};const dur=m.duration||1.5;
  E[id]={meta:{...m,name,desc,tags:['cyberpunk',gen].concat(m.tags||[]),options:{palette:PAL[pal],seed:(m.options&&m.options.seed)||1},cyber:'redrawn'},
    draw(e,t,a){try{GEN[gen](e,t,{...opt,seed:a.seed||opt.seed},R(a.palette||PAL[pal]),dur)}catch(err){}}}}
for(const id in RESKIN){const ef=E[id];if(!ef||!ef.meta)continue;const[pal,name]=RESKIN[id];ef.meta.name=name;ef.meta.cyber='reskinned';
  if(ef.meta.options&&ef.meta.options.palette)ef.meta.options.palette=PAL[pal].slice()}
window.CYBERFX={REDRAW:REDRAW.map(r=>r[0]),RESKIN:Object.keys(RESKIN),PAL};
})();
