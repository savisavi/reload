// ================= ENEMIES, HAND-BUILT AT 32×32 =================
// Every creature is drawn natively on the 32-px grid (no upscaling): shaded volumes lit from the upper left,
// 1-px details (whiskers, claws, joints, vents, LEDs), a 1-px outline. All of them face LEFT like before
// (the renderer flips them), feet on row 30, so positions, hit flashes, gibs and pfx masks stay as they were.
const C32=(()=>{
  const N=32;
  function Cv(){const px=new Array(N*N).fill(null),gl=[];
    const ok=(x,y)=>x>=0&&y>=0&&x<N&&y<N;
    const k={px,
      put(x,y,c){x=Math.round(x);y=Math.round(y);if(ok(x,y)&&c)px[y*N+x]=c;return k},
      get(x,y){x=Math.round(x);y=Math.round(y);return ok(x,y)?px[y*N+x]:null},
      erase(x,y){x=Math.round(x);y=Math.round(y);if(ok(x,y))px[y*N+x]=null;return k},
      rect(x,y,w,h,c){for(let j=0;j<h;j++)for(let i=0;i<w;i++)k.put(x+i,y+j,c);return k},
      // shaded ellipse: R = ramp {h,l,b,m,d}; lit from upper-left, rim shadow lower-right
      ell(cx,cy,rx,ry,R,o={}){const lx=o.lx??-.55,ly=o.ly??-.8;
        for(let y=Math.floor(cy-ry);y<=Math.ceil(cy+ry);y++)for(let x=Math.floor(cx-rx);x<=Math.ceil(cx+rx);x++){
          const nx=(x+.5-cx-.5)/rx,ny=(y+.5-cy-.5)/ry,d=nx*nx+ny*ny;if(d>1)continue;
          const v=-(nx*lx+ny*ly)*(.6+.4*Math.sqrt(Math.max(0,1-d)))-(d>.72?.25:0);
          k.put(x,y,v>.62?R.h:v>.28?R.l:v>-.18?R.b:v>-.5?R.m:R.d)}return k},
      // vertical cylinder / box with left light and right shade
      box(x,y,w,h,R,o={}){for(let j=0;j<h;j++)for(let i=0;i<w;i++){const f=w<=1?.5:i/(w-1);let c=f<.2?R.l:f>.8?R.m:R.b;if(j===0&&o.top!==false)c=R.l;if(j===h-1&&o.bot!==false)c=R.d;k.put(x+i,y+j,c)}
        if(o.hl)k.put(x,y,R.h);return k},
      line(x0,y0,x1,y1,c,t=1){const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0),1);for(let s=0;s<=n;s++){const x=x0+(x1-x0)*s/n,y=y0+(y1-y0)*s/n;
        k.put(x,y,c);if(t>1){k.put(x+1,y,c);if(t>2)k.put(x,y+1,c)}}return k},
      glow(x,y,c){k.put(x,y,c);gl.push([x,y]);return k},
      done(outline){const q=outline1(px,N,N,outline);return gridCanvas(q,N,N)}};
    return k}
  const R=c=>{const r=ramp(c);r.h=mix(c,'#ffffff',.6);return r};
  return{Cv,R};
})();
function buildCreatures32(){const{Cv,R}=C32;const D={};
  // ---------- tier 1 ----------
  D.rat=()=>{const c=Cv(),F=R('#6d6a72'),P=R('#d98a96');
    c.line(24,26,27,24,P.m).line(27,24,30,25,P.b).line(30,25,31,28,P.m);                 // tail
    c.ell(15,24,10,5.5,F);c.ell(6,24,5,4,F);                                               // body, head
    c.ell(7,19,2.2,2.2,P).put(7,19,P.d);c.ell(11,19,2.2,2.2,P).put(11,19,P.d);             // ears
    c.put(1,24,P.b).put(1,25,P.m);c.put(4,22,'#ff3344').put(4,23,'#7a1020').put(3,22,'#ffd0d8'); // nose, eye
    c.line(2,26,0,27,'#c8c4d0').line(2,25,0,24,'#c8c4d0');                                // whiskers
    for(const x of[8,12,19,23])c.rect(x,29,2,1,P.m).put(x,28,F.d);                         // paws
    for(let x=12;x<22;x+=3)c.put(x,21,F.l);
    return c.done('#1a1216')};
  D.slime=()=>{const c=Cv(),G=R('#4fbf5a');
    c.ell(16,22,13,8.5,G);for(let x=4;x<29;x++)if(c.get(x,30))c.put(x,30,G.d);
    c.ell(10,18,3,2,{h:'#ffffff',l:'#e8ffe0',b:'#c8f8b8',m:'#9af07f',d:'#9af07f'});c.put(9,17,'#ffffff');  // shine
    c.rect(9,22,2,3,'#0f1a12').put(9,22,'#e8ffe0');c.rect(17,22,2,3,'#0f1a12').put(17,22,'#e8ffe0');     // eyes
    c.line(12,27,15,27,'#2d7a3a');for(const[x,y]of[[21,20],[24,25],[7,26]])c.put(x,y,G.l).put(x+1,y,G.h); // mouth, bubbles
    return c.done('#0f1a12')};
  D.drone=()=>{const c=Cv(),M=R('#5a6070'),L=R('#9aa3b5');
    c.line(8,10,12,15,M.d).line(24,10,20,15,M.d);                                          // rotor arms
    c.rect(2,8,11,1,L.h).rect(19,8,11,1,L.h).rect(4,9,7,1,M.m).rect(21,9,7,1,M.m);           // blurred rotors
    c.rect(7,9,2,2,M.d).rect(23,9,2,2,M.d);
    c.ell(16,18,10,5,M);c.rect(7,17,18,1,L.b);                                             // hull
    c.rect(9,19,6,3,'#14101c');c.rect(10,20,4,1,'#ff2f4f');c.glow(10,20,'#ffd0d8');        // red eye strip
    c.rect(18,19,4,1,M.d);c.put(22,18,'#22e6ff');
    c.box(13,23,6,3,M);c.rect(14,26,4,1,'#ffd23f');c.put(15,27,'#fff3b0').put(16,27,'#ffb02e');c.put(15,28,'#ffb02e'); // thruster
    return c.done('#0c0a12')};
  D.dog=()=>{const c=Cv(),B=R('#6a4a2c'),L=R('#8a6a4a');
    c.line(27,20,30,16,B.m,2);                                                             // tail
    c.ell(17,21,10,5,B);c.rect(9,19,16,1,L.b);                                            // body + back
    c.ell(6,17,5,4.5,B);c.ell(2,19,3,2.3,L);c.put(0,19,'#14100c').put(0,18,'#14100c');      // head, snout, nose
    c.line(7,13,9,10,B.d,2).put(9,10,B.m);c.line(4,13,5,11,B.d);                           // ears
    c.put(4,16,'#ff3344').put(3,16,'#ffd0d8');c.line(1,21,4,22,'#3a0a0a');c.put(2,22,'#e8e4f4');   // eye, jaw, fang
    for(const[x,d]of[[8,-1],[12,1],[21,-1],[25,1]]){c.line(x,25,x+d,29,B.m,2);c.rect(x+d-1,30,3,1,'#14100c')} // legs
    c.put(16,23,L.l).put(14,24,L.l);c.line(11,20,14,20,'#c0c7d4');c.put(12,20,'#ff3344');    // spiked collar
    return c.done('#140e0a')};
  D.sentry=()=>{const c=Cv(),M=R('#4a3a44'),L=R('#8a6a7a');
    c.line(10,22,5,30,M.d,2).line(22,22,27,30,M.d,2).line(16,24,16,30,M.d,2);              // tripod
    c.rect(4,30,4,1,'#2a1a22').rect(25,30,4,1,'#2a1a22').rect(15,30,3,1,'#2a1a22');
    c.box(8,20,16,4,M);c.ell(16,13,10,8,M);c.rect(7,13,19,1,L.l);                          // base, dome
    c.rect(0,15,9,3,M.d).rect(0,15,9,1,L.b).rect(0,16,1,1,'#14101c');                       // barrel
    c.ell(13,12,4,3.5,{h:'#ffffff',l:'#ffd0d8',b:'#ff2f4f',m:'#c01a3a',d:'#6a0a1a'});c.glow(12,11,'#ffffff');  // eye
    c.put(20,9,'#ffd23f').put(22,11,'#3aff6a');for(let x=10;x<23;x+=4)c.put(x,21,'#2a1a22');
    return c.done('#0c0a12')};
  // ---------- frost ----------
  D.icewolf=()=>{const c=Cv(),W=R('#cfe4f2'),M=R('#8a9aaa');
    c.line(26,19,31,14,W.l,2).put(31,13,'#ffffff');                                        // tail
    c.ell(17,21,10,5,W);for(let x=10;x<25;x+=2)c.put(x,16+(x%4?0:1),W.h);                   // body, fur ridge
    c.ell(6,16,5,4.5,W);c.ell(2,18,3,2.2,W);c.put(0,18,'#0e1420');                          // head, snout
    c.line(6,12,8,8,M.b,2).line(3,12,4,9,M.b);                                             // ears
    c.glow(4,15,'#22e6ff').put(3,15,'#e8fbff');c.line(1,20,4,21,'#0e1420');c.put(2,21,'#ffffff');
    for(const[x,d]of[[8,-1],[12,1],[21,-1],[25,1]]){c.line(x,25,x+d,29,M.b,2);c.rect(x+d-1,30,3,1,'#0e1420')}
    for(const[x,y]of[[14,22],[19,23],[22,20]])c.put(x,y,'#22e6ff');                        // ice crystals
    c.put(11,8,'#e8fbff').put(15,7,'#e8fbff').put(19,8,'#e8fbff');                         // frost breath
    return c.done('#0e1420')};
  D.cryojelly=()=>{const c=Cv(),G=R('#8fd8ff');
    c.ell(16,16,11,9,G);for(let x=6;x<27;x+=4){c.line(x,24,x+((x/4)%2?1:-1),29,'#4a90c0');c.put(x,30,'#e8fbff')}  // tentacles
    c.ell(16,15,6,4,{h:'#ffffff',l:'#e8fbff',b:'#c8f0ff',m:'#8fd8ff',d:'#8fd8ff'});         // inner core
    c.glow(15,14,'#ffffff');c.ell(10,11,2.5,1.5,{h:'#ffffff',l:'#ffffff',b:'#e8fbff',m:'#e8fbff',d:'#e8fbff'});
    c.rect(11,17,2,2,'#0e1a24');c.rect(19,17,2,2,'#0e1a24');c.put(11,17,'#ffffff').put(19,17,'#ffffff');
    return c.done('#0e1a24')};
  D.frostcrab=()=>{const c=Cv(),W=R('#d8eef8'),S=R('#6a8aa8'),B='#22e6ff';
    c.line(6,22,2,14,S.b,2).line(26,22,30,14,S.b,2);                                       // arms
    c.ell(3,11,3,3.5,W);c.ell(29,11,3,3.5,W);c.erase(3,8).erase(3,9).erase(29,8).erase(29,9); // claws (open)
    c.ell(16,22,10,6,W);c.rect(8,20,17,1,W.h);for(let x=10;x<23;x+=4)c.put(x,24,'#9fe8ff');  // shell
    c.line(13,16,12,13,S.d).line(19,16,20,13,S.d);c.glow(12,12,B).glow(20,12,B);            // eye stalks
    for(const x of[8,11,21,24])c.line(x,26,x+(x<16?-3:3),30,S.m);
    c.glow(16,23,B);return c.done('#0e1420')};
  // ---------- biolab ----------
  D.vinecrawler=()=>{const c=Cv(),G=R('#3f9a3a');
    const body=[[28,29],[24,29],[20,28],[17,27],[14,26],[12,24],[11,21],[11,18],[12,15],[13,12]];
    for(let i=0;i<body.length;i++){const[x,y]=body[i],r=1.2+i*.22;c.ell(x,y,r+1,r,G)}
    c.ell(11,9,4.5,4,G);c.put(7,9,'#0a140c').put(8,11,'#7dff4f');c.glow(10,8,'#ff3344').put(9,8,'#ffd0d8'); // head, eye
    c.line(7,11,5,13,'#ff3344').put(4,14,'#ff3344').put(6,14,'#ff3344');                   // tongue
    for(const[x,y]of[[22,27],[16,25],[12,20],[13,14]])c.put(x,y,'#7dff4f').put(x+1,y-1,'#c8ffa8'); // glowing nodes
    c.line(18,26,20,23,G.m).put(21,22,'#7dff4f');c.line(25,28,27,25,G.m).put(28,24,'#22e6ff');  // leaves
    return c.done('#0a140c')};
  D.sporepod=()=>{const c=Cv(),Pk=R('#c84a9a'),Gn=R('#3f8a3a');
    c.box(14,19,5,11,Gn);c.line(15,22,11,25,Gn.m).line(18,24,22,26,Gn.m);c.rect(10,25,2,1,Gn.l).rect(22,26,2,1,Gn.l); // stem, leaves
    c.ell(16,12,12,8,Pk);for(let x=5;x<28;x++)if(c.get(x,19))c.put(x,19,Pk.d);              // cap
    for(const[x,y,r]of[[10,9,1.6],[17,7,1.8],[22,12,1.4],[13,14,1.3]])c.ell(x,y,r,r,{h:'#ffffff',l:'#ffe8f8',b:'#ffd0f0',m:'#ffd0f0',d:'#f0b0d8'});
    for(let x=7;x<26;x+=3)c.put(x,20,'#ffd0f0');c.put(4,6,'#ffd0f0').put(27,5,'#ffd0f0').put(25,3,'#ffd0f0'); // gills, spores
    return c.done('#140a14')};
  D.mantis=()=>{const c=Cv(),G=R('#5ad04a');
    c.line(7,6,3,1,G.m).line(10,6,12,1,G.m);                                               // antennae
    c.ell(8,9,4,3.5,G);c.glow(6,8,'#ff3344').glow(10,8,'#ff3344');c.put(8,12,G.d);            // head, eyes
    c.line(9,12,12,17,G.b,2);c.ell(17,21,9,4,G);for(let x=12;x<25;x+=3)c.put(x,23,G.d);       // thorax, abdomen
    c.line(11,15,4,14,G.l,2).line(4,14,2,19,G.l,2).put(1,20,'#e8ffe0');                      // raptorial arm
    c.line(12,17,6,18,G.m,2).line(6,18,5,22,G.m).put(5,23,'#e8ffe0');
    c.line(14,24,11,30,G.m).line(18,24,19,30,G.m).line(22,24,26,30,G.m);                    // legs
    c.line(19,18,25,13,'#c8ffa8').line(20,19,27,15,'#9af07f');                              // wings
    return c.done('#0a140a')};
  // ---------- desert ----------
  D.scorpion=()=>{const c=Cv(),T=R('#d8902a');
    c.ell(17,25,9,3.8,T);for(let x=10;x<25;x+=3)c.put(x,23,T.d);                            // body
    const tail=[[25,23],[27,20],[28,16],[27,12],[24,10]];tail.forEach(([x,y],i)=>c.ell(x,y,2.3-i*.15,2.3-i*.15,T));
    c.line(22,9,20,11,'#ff3344').put(19,12,'#ff3344').glow(21,10,'#ffd0d8');                // stinger
    c.line(9,24,4,21,T.m,2);c.ell(2,19,2.5,2,T);c.erase(0,19);c.line(9,26,4,27,T.m,2);c.ell(2,28,2.5,1.8,T); // pincers
    c.glow(9,22,'#ff3344');c.put(11,22,'#ff3344');
    for(const x of[12,15,18,21])c.line(x,28,x-1,30,T.d);
    return c.done('#1a0e06')};
  D.sandworm=()=>{const c=Cv(),T=R('#b07a40'),Y=R('#e0c070');
    c.ell(16,28,14,3.5,Y);for(let x=3;x<30;x+=3)c.put(x,26,Y.h);                             // sand mound
    for(let y=26;y>6;y-=4)c.ell(15+(y<16?-1:0),y,8-(26-y)*.08,3,T);                         // segments
    c.ell(14,8,8,6,T);c.ell(13,9,5,4,{h:'#a02020',l:'#801818',b:'#5a1010',m:'#3a0808',d:'#2a0404'}); // maw
    for(let a=0;a<8;a++){const x=13+Math.cos(a*.8)*4,y=9+Math.sin(a*.8)*3.2;c.put(x,y,'#ffffff')} // teeth ring
    c.put(13,9,'#14040a');for(let y=12;y<24;y+=4)c.line(9,y,21,y,T.d);
    return c.done('#1a1008')};
  D.sandmite=()=>{const c=Cv(),Y=R('#c8a040');
    c.line(12,14,9,9,Y.d).line(17,14,20,9,Y.d);c.put(9,8,'#ff6a1f').put(20,8,'#ff6a1f');       // antennae
    c.ell(15,22,11,7,Y);c.line(15,15,15,28,Y.d);for(let x=7;x<24;x+=4)c.put(x,19,Y.h);        // shell + split
    c.ell(7,22,4,3.5,R('#8a6a20'));c.glow(5,21,'#ff6a1f').glow(8,21,'#ff6a1f');               // head
    for(const x of[9,14,19,24])c.line(x,28,x+(x<16?-2:2),30,'#5a4010');
    c.put(21,20,'#ff6a1f').put(23,22,'#ff6a1f');return c.done('#1a1008')};
  // ---------- core ----------
  D.wraith=()=>{const c=Cv(),W=R('#e8ecf4');
    c.ell(14,13,10,10,W);c.rect(4,14,21,10,W.b);for(let x=4;x<25;x++)c.put(x,14+((x*7)%3),W.b);
    for(let x=4;x<25;x+=1){const t=24+((x>>1)%3);for(let y=19;y<=t;y++)c.put(x,y,y>t-2?W.m:W.b)}  // ragged hem
    for(let x=4;x<25;x+=4)c.erase(x+2,26);c.rect(4,14,2,10,W.l);c.rect(23,15,2,10,W.m);
    c.rect(8,11,3,4,'#14101c');c.rect(16,11,3,4,'#14101c');c.glow(9,12,'#22e6ff').glow(17,12,'#22e6ff');
    c.line(11,18,15,19,'#8a90a0');c.put(26,9,'#e8ecf4').put(28,6,'#e8ecf4').put(2,20,'#e8ecf4');   // mouth, wisps
    return c.done('#8a90a0')};
  D.stalker=()=>{const c=Cv(),W=R('#d8d4e0');
    c.ell(13,5,3.5,4,W);c.glow(12,5,'#ff3344').glow(14,5,'#ff3344');                         // head
    c.box(12,9,4,10,W);c.line(12,10,8,17,W.b).line(8,17,6,22,W.m).put(5,23,'#ff3344');       // torso, long arm
    c.line(16,10,19,16,W.b).line(19,16,21,21,W.m);
    c.line(13,19,10,30,W.b,2).line(15,19,18,30,W.b,2);c.rect(9,30,3,1,'#2a2a34').rect(18,30,3,1,'#2a2a34'); // legs
    for(let y=11;y<18;y+=2)c.put(13,y,'#8a8696');c.put(14,13,'#ff3344');                     // spine, core
    return c.done('#2a2a34')};
  D.toybot=()=>{const c=Cv(),Rd=R('#e04040'),Yl=R('#ffd23f');
    c.line(16,4,16,7,'#c0c7d4').ell(16,3,1.5,1.5,{h:'#ffffff',l:'#e8ecf4',b:'#c0c7d4',m:'#9aa3b4',d:'#6f7684'});  // antenna
    c.box(7,8,18,9,Rd,{hl:1});c.rect(9,10,5,4,'#ffffff').rect(18,10,5,4,'#ffffff');c.rect(11,11,2,2,'#14101c').rect(20,11,2,2,'#14101c');
    c.rect(11,15,10,1,'#5a1010');for(let x=12;x<20;x+=2)c.put(x,15,'#ffffff');               // grin
    c.box(9,17,14,7,Yl);c.rect(13,19,6,3,'#14101c');c.glow(14,20,'#3aff6a').put(16,20,'#ffd23f').put(17,20,'#ff3344');
    c.line(8,18,4,22,'#c0c7d4',2).ell(3,23,2,2,Rd);c.line(23,18,27,22,'#c0c7d4',2).ell(28,23,2,2,Rd); // arms
    c.box(10,24,4,6,Rd).box(18,24,4,6,Rd);c.rect(9,30,6,1,'#14101c').rect(17,30,6,1,'#14101c');
    return c.done('#1a0e0e')};
  D.vacbot=()=>{const c=Cv(),M=R('#9aa3b5');
    c.ell(16,25,14,5,M);c.rect(3,27,27,2,M.d);c.rect(2,26,29,1,M.m);                         // disc + skirt
    c.ell(16,23,8,3,R('#4a5060'));c.rect(10,22,12,1,'#2a2d36');                              // top panel
    c.rect(5,25,4,2,'#14101c');c.glow(6,25,'#ff2f4f').put(7,25,'#ff2f4f').put(8,26,'#7a1020');// eye
    c.put(22,22,'#3aff6a').put(24,22,'#ffd23f');for(let x=8;x<26;x+=3)c.put(x,29,'#4a5060');
    c.line(1,29,4,28,'#c0c7d4').line(28,28,31,29,'#c0c7d4');                                 // brushes
    return c.done('#0c0a12')};
  D.mannequin=()=>{const c=Cv(),B=R('#d8b890');
    c.ell(14,5,3.5,4.2,B);c.line(12,4,15,4,B.m);c.put(13,6,B.d);                               // blank head, seam
    c.box(13,9,3,2,B);c.box(9,11,11,9,B,{hl:1});c.line(14,11,14,19,B.m);                       // neck, torso + seam
    c.box(7,11,2,8,B);c.box(20,12,2,7,B);c.rect(6,19,3,2,B.m).rect(20,19,3,2,B.m);              // arms
    c.glow(12,14,'#7dff4f');c.put(13,14,'#22e6ff');c.rect(17,17,2,1,'#22e6ff');               // tags/LEDs
    c.box(10,20,4,10,B);c.box(16,20,4,10,B);c.rect(10,24,4,1,B.d).rect(16,24,4,1,B.d);        // legs + joints
    c.rect(9,30,5,1,'#2a1e14').rect(16,30,5,1,'#2a1e14');
    return c.done('#2a1e14')};
  return D}
{const D=buildCreatures32();for(const k in D){if(!SP[k])continue;try{SP[k]=D[k]();SP[k+'W']=whiteOf(SP[k])}catch(err){console.warn('cre32',k,err)}}}
