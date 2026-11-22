// ================= AUDIO: procedural SFX, ambience and music =================
// Synthesis building blocks adapted from the user's «Шумодел» tool (gunshot, boom, mech, bell, steps, drums…).
const AUD=(()=>{
const TAU=Math.PI*2,SR=22050;
const mulberry32=a=>function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),lerp=(a,b,t)=>a+(b-a)*t,mtof=m=>440*Math.pow(2,(m-69)/12);
const Gn=(c,v=1)=>{const g=c.createGain();g.gain.value=v;return g};
const Fl=(c,type,f,Q)=>{const x=c.createBiquadFilter();x.type=type;x.frequency.value=Math.min(f,c.sampleRate*.49);if(Q!=null)x.Q.value=Q;return x};
const Os=(c,type,f,det)=>{const o=c.createOscillator();o.type=type;o.frequency.value=f;if(det)o.detune.value=det;return o};
const Pn=(c,v)=>{const p=c.createStereoPanner();p.pan.value=clamp(v,-1,1);return p};
const ch=(...n)=>{for(let i=0;i<n.length-1;i++)n[i].connect(n[i+1]);return n[n.length-1]};
function shaper(c,k){const s=c.createWaveShaper(),n=2048,cv=new Float32Array(n),K=1+k*20,nm=Math.tanh(K);for(let i=0;i<n;i++){const x=i/(n-1)*2-1;cv[i]=Math.tanh(x*K)/nm}s.curve=cv;return s}
function noiseBuf(c,dur,color,rng){const len=Math.max(2,Math.ceil(dur*c.sampleRate)),b=c.createBuffer(1,len,c.sampleRate),d=b.getChannelData(0);let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0,br=0;
  for(let i=0;i<len;i++){const w=rng()*2-1;if(color==='pink'){b0=.99886*b0+w*.0555179;b1=.99332*b1+w*.0750759;b2=.969*b2+w*.153852;b3=.8665*b3+w*.3104856;b4=.55*b4+w*.5329522;b5=-.7616*b5-w*.016898;d[i]=(b0+b1+b2+b3+b4+b5+b6+w*.5362)*.11;b6=w*.115926}else if(color==='brown'){br=(br+.02*w)/1.02;d[i]=br*3.5}else d[i]=w}return b}
const Nz=(c,dur,color,rng)=>{const s=c.createBufferSource();s.buffer=noiseBuf(c,dur,color||'white',rng);return s};
function nz(c,rng,color='white'){c._nz=c._nz||{};if(!c._nz[color])c._nz[color]=noiseBuf(c,3,color,mulberry32(99));const s=c.createBufferSource();s.buffer=c._nz[color];s._off=rng?rng()*1.4:0;return s}
function Sb(c,dur,nch,fill){const len=Math.max(2,Math.ceil(dur*c.sampleRate)),b=c.createBuffer(nch,len,c.sampleRate),arr=[];for(let k=0;k<nch;k++)arr.push(b.getChannelData(k));fill(arr,c.sampleRate,len);const s=c.createBufferSource();s.buffer=b;return s}
function pulseWave(c,d){c._pw=c._pw||{};if(c._pw[d])return c._pw[d];const n=48,re=new Float32Array(n),im=new Float32Array(n);for(let k=1;k<n;k++)re[k]=2*Math.sin(k*Math.PI*d)/(k*Math.PI);return c._pw[d]=c.createPeriodicWave(re,im)}
function perc(p,t,a,d,peak=1,base=0){a=Math.max(a,.0005);p.setValueAtTime(base,t);p.linearRampToValueAtTime(peak,t+a);p.setTargetAtTime(base,t+a,Math.max(d,.002)/4)}
function pts(p,t0,arr){p.setValueAtTime(arr[0][1],t0+arr[0][0]);let last=t0+arr[0][0];for(let i=1;i<arr.length;i++){const tt=Math.max(last,t0+arr[i][0]);p.linearRampToValueAtTime(arr[i][1],tt);last=tt}}
function epts(p,t0,arr){const m=v=>Math.max(v,1e-4);p.setValueAtTime(m(arr[0][1]),t0+arr[0][0]);let last=t0+arr[0][0];for(let i=1;i<arr.length;i++){const tt=Math.max(last,t0+arr[i][0]);p.exponentialRampToValueAtTime(m(arr[i][1]),tt);last=tt}}
function wander(p,t0,dur,base,depth,rate,rng,min=-Infinity){p.setValueAtTime(Math.max(min,base),t0);let t=t0;while(t<t0+dur){t+=(.4+rng()*1.2)/rate;p.linearRampToValueAtTime(Math.max(min,base+depth*(rng()*2-1)),t)}}
function lfo(c,f,depth,target,type='sine',t0=0,stop){const o=Os(c,type,f),g=Gn(c,depth);o.connect(g);g.connect(target);o.start(t0);if(stop)o.stop(stop);return o}
function note(c,out,{t,dur,f,wave='sine',pw,amp=.3,a=.005,r=.05,cut,q,det=0,vib=0,vibRate=5,pan}){const o=c.createOscillator();if(pw)o.setPeriodicWave(pw);else o.type=wave;o.frequency.value=f;if(det)o.detune.value=det;
  let n=o;if(cut){const fl=Fl(c,'lowpass',cut,q??.7);o.connect(fl);n=fl}const g=Gn(c,0);n.connect(g);let last=g;if(pan!=null){const pp=Pn(c,pan);g.connect(pp);last=pp}last.connect(out);
  const e=t+Math.max(a,dur);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(amp,t+a);g.gain.setValueAtTime(amp,e);g.gain.linearRampToValueAtTime(0,e+r);if(vib>0)lfo(c,vibRate,f*vib,o.frequency,'sine',t,e+r+.05);o.start(t);o.stop(e+r+.05);return o}
function bell(c,out,t,f,dec,amp,ratios,rng,pan){ratios=ratios||[1,2.76,5.4,8.93];let dst=out;if(pan!=null){const pp=Pn(c,pan);pp.connect(out);dst=pp}
  ratios.forEach((r,i)=>{const fr=f*r*(1+(rng?(rng()-.5)*.006:0));if(fr>=c.sampleRate*.45)return;const o=Os(c,'sine',fr),g=Gn(c,0);ch(o,g,dst);perc(g.gain,t,.002,dec/(1+i*.6),amp/(1+i*.9));o.start(t);o.stop(t+dec*1.6+.1)})}
function clickHit(c,out,t,f,dec,amp,rng,q=3){const n=nz(c,rng),fl=Fl(c,'bandpass',f,q),g=Gn(c,0);ch(n,fl,g,out);perc(g.gain,t,.0005,dec,amp);n.start(t,n._off,dec*4+.03)}
function thump(c,out,t,f,amp,dec){const o=Os(c,'sine',f),g=Gn(c,0);ch(o,g,out);o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(f*.55,t+dec);perc(g.gain,t,.004,dec,amp);o.start(t);o.stop(t+dec*2+.05)}
function mech(c,out,t,f,rng,amp=1){clickHit(c,out,t,f*(.9+rng()*.2),.025,amp,rng,4);clickHit(c,out,t+.004,f*2.3,.012,amp*.6,rng,6);bell(c,out,t,f*.55*(.9+rng()*.2),.12,.12*amp,[1,2.3,3.7],rng);thump(c,out,t,110,.25*amp,.03)}
function crackleBuf(c,dur,rate,rng,{dec=[.3,1.5],amp=()=>1}={}){return Sb(c,dur,2,(chs,sr,len)=>{const n=Math.floor(rate*dur);for(let k=0;k<n;k++){const st=Math.floor(rng()*len),a=amp(st/sr,rng);if(!a)continue;const dk=(dec[0]+rng()*(dec[1]-dec[0]))*sr/1000,pan=rng(),gl=Math.sqrt(1-pan),gr=Math.sqrt(pan),m=Math.min(len-st,Math.floor(dk*6));for(let j=0;j<m;j++){const v=(rng()*2-1)*Math.exp(-j/dk)*a;chs[0][st+j]+=v*gl;chs[1][st+j]+=v*gr}}})}
function gunshot(c,out,t,o,rng){const bus=Gn(c,1),sh=shaper(c,.25),lp=Fl(c,'lowpass',lerp(10000,1200,o.dist),.7);ch(bus,sh,lp,out);
  const n=nz(c,rng),f=Fl(c,'bandpass',lerp(900,4200,o.bright),.6),g=Gn(c,0);ch(n,f,g,bus);perc(g.gain,t,.0004,.05+o.power*.06,1.3*(1-o.dist*.6));n.start(t,n._off,.5);
  const n0=nz(c,rng),h=Fl(c,'highpass',3000),g0=Gn(c,0);ch(n0,h,g0,bus);perc(g0.gain,t,.0002,.012,.9*o.bright*(1-o.dist));n0.start(t,n0._off,.1);
  const s=Os(c,'sine',150),g2=Gn(c,0);ch(s,g2,bus);s.frequency.setValueAtTime(lerp(170,110,o.power),t);s.frequency.exponentialRampToValueAtTime(38,t+.18);perc(g2.gain,t,.001,.1+o.power*.2,.4+o.power*.9);s.start(t);s.stop(t+.6);
  const nt=Nz(c,o.tail+.3,'brown',rng),ft=Fl(c,'lowpass',lerp(1800,500,o.dist)),gt=Gn(c,0);ch(nt,ft,gt,bus);perc(gt.gain,t+.004,.01,o.tail,.5+o.dist*.4);nt.start(t)}
function boom(c,out,t,{size,debris,dist,sub},rng){const bus=Gn(c,1),lp=Fl(c,'lowpass',lerp(9000,700,dist),.7);ch(bus,lp,out);
  const n=Nz(c,size+.2,'white',rng),f=Fl(c,'lowpass',6000,.8),g=Gn(c,0);ch(n,f,g,bus);epts(f.frequency,t,[[0,7000],[size*.6,250]]);perc(g.gain,t,.002,size*.55,1);n.start(t);
  const b=Nz(c,size*1.4+.2,'brown',rng),fb=Fl(c,'lowpass',380,.9),gb=Gn(c,0);ch(b,fb,gb,bus);perc(gb.gain,t,.015,size*1.1,1.1);b.start(t);
  const s=Os(c,'sine',65),gs=Gn(c,0);ch(s,gs,bus);epts(s.frequency,t,[[0,70],[size*.7,24]]);perc(gs.gain,t,.004,size*.6,sub);s.start(t);s.stop(t+size*1.3+.1);
  if(debris>0){const cr=crackleBuf(c,size*1.3+.1,60+debris*500,rng,{dec:[.2,2.5],amp:(tt,r)=>tt<.03?0:Math.exp(-tt/(size*.45))*Math.pow(r(),2)*debris*1.5}),h=Fl(c,'highpass',1200);ch(cr,h,bus);cr.start(t)}}
function whoosh(c,out,t,d,tone,air,rng,pan=0){const n=Nz(c,d+.1,'pink',rng),f=Fl(c,'bandpass',tone*.5,1.6),g=Gn(c,0),pp=Pn(c,0);ch(n,f,g,pp,out);epts(f.frequency,t,[[0,tone*.45],[d*.55,tone*1.7],[d,tone*.6]]);pts(g.gain,t,[[0,0],[d*.5,1],[d*.62,.9],[d,0]]);pts(pp.pan,t,[[0,pan-.4],[d,pan+.4]]);n.start(t);
  const n2=Nz(c,d+.1,'white',rng),h=Fl(c,'highpass',5000),g2=Gn(c,0);ch(n2,h,g2,out);pts(g2.gain,t,[[0,0],[d*.5,air*.25],[d,0]]);n2.start(t)}
function punch(c,out,t,w,slap,body,rng){const o=Os(c,'sine',130),g=Gn(c,0);ch(o,g,out);epts(o.frequency,t,[[0,130],[.15,45]]);perc(g.gain,t,.002,.15+w*.15,.8+w*.4);o.start(t);o.stop(t+.5);
  const n=nz(c,rng),l=Fl(c,'lowpass',lerp(3000,700,body)),gn=Gn(c,0);ch(n,l,gn,out);perc(gn.gain,t,.001,.08,.8);n.start(t,n._off,.3);
  const n2=nz(c,rng),h=Fl(c,'highpass',2500),g2=Gn(c,0);ch(n2,h,g2,out);perc(g2.gain,t,.0005,.02,slap);n2.start(t,n2._off,.1)}
function clang(c,out,t,pitch,decay,bright,hit,rng){[1,1.59,2.14,2.3,2.65,2.92,3.16,3.5].forEach((x,i)=>{const f=pitch*x*(1+(rng()-.5)*.02);if(f>c.sampleRate*.45)return;const o=Os(c,'sine',f),g=Gn(c,0);ch(o,g,out);perc(g.gain,t,.001,decay*(1-i*.07),.4*Math.pow(lerp(.55,.9,bright),i));o.start(t);o.stop(t+decay*1.3+.1)});clickHit(c,out,t,3200,.02,hit,rng,1);thump(c,out,t,90,hit*.4,.05)}
function blaster(c,out,t,f,drop,d,fm,rng){const o=Os(c,'sine',f),m=Os(c,'sine',f*1.5),mg=Gn(c,f*fm*2+1),g=Gn(c,0);ch(m,mg);mg.connect(o.frequency);ch(o,g,out);
  epts(o.frequency,t,[[0,f],[d,f*drop]]);epts(m.frequency,t,[[0,f*1.5],[d,f*drop*1.5]]);perc(g.gain,t,.002,d,.6);const s=Os(c,'square',f/2),gs=Gn(c,0),ls=Fl(c,'lowpass',2000);ch(s,ls,gs,out);epts(s.frequency,t,[[0,f/2],[d,f*drop/2]]);perc(gs.gain,t,.002,d*.6,.12);
  [o,m,s].forEach(x=>{x.start(t);x.stop(t+d*2+.05)});clickHit(c,out,t,4000,.01,.4,rng,1)}
function sweep(chs,sr,st,durS,f0,f1,amp,pan,harm=0){const n=Math.floor(durS*sr),len=chs[0].length,gl=Math.sqrt((1-pan)/2),gr=Math.sqrt((1+pan)/2);let ph=0;for(let j=0;j<n;j++){const i=st+j;if(i>=len)break;const x=j/n,f=f0*Math.pow(f1/f0,x);ph+=f/sr;let e=Math.sin(Math.PI*x);e*=e;const v=(Math.sin(TAU*ph)+harm*Math.sin(2*TAU*ph))*e*amp;chs[0][i]+=v*gl;chs[1][i]+=v*gr}}
// single footstep (heel + toe) on a surface: 0 stone/concrete, 1 metal grate, 2 puddle
function step(c,out,t,surf,w,rng){const SF=[{th:.8,ta:1,lp:.85,td:7,res:null},{th:.6,ta:.8,lp:1,td:5,res:[430,1130,2380,3720],rd:.12,ra:.25},{th:.2,ta:.8,lp:.45,td:60,bub:7}][surf];
  const src=Sb(c,.5,2,(chs,sr,len)=>{const add=(i,v)=>{if(i>=0&&i<len){chs[0][i]+=v;chs[1][i]+=v}};
    for(const[dt,pa] of[[0,1],[.05+rng()*.03,.5]]){const st=Math.floor(dt*sr),A=(.6+w*.6)*pa*(.85+rng()*.3);const f=70+rng()*40;let dk=.035*sr;for(let i=0;i<dk*5;i++)add(st+i,Math.sin(TAU*f*i/sr)*Math.exp(-i/dk)*SF.th*A*.8);
      dk=SF.td/1000*sr;let y=0;for(let i=0;i<dk*5;i++){y+=SF.lp*((rng()*2-1)-y);add(st+i,y*Math.exp(-i/dk)*SF.ta*A)}
      if(SF.res)SF.res.forEach((rf,ri)=>{const fr=rf*(.97+rng()*.06),rd=SF.rd*sr,ra=SF.ra*A/(ri+1);for(let i=0;i<rd*5;i++)add(st+i,Math.sin(TAU*fr*i/sr)*Math.exp(-i/rd)*ra)});
      if(SF.bub){const nb=Math.round(SF.bub*pa);for(let b=0;b<nb;b++){const off=st+Math.floor(rng()*.2*sr),f0=400+rng()*1200,bd=.015*sr;let ph=0;for(let i=0;i<bd*4;i++){ph+=f0*(1+i/(bd*4))/sr;add(off+i,Math.sin(TAU*ph)*Math.exp(-i/bd)*.3*A)}}}}});
  src.connect(out);src.start(t)}

// ---------------- SFX recipes: [length, build(ctx,out,t,rng,v)] ----------------
const RECIPES={
  pistol:[.6,(c,o,t,r)=>gunshot(c,o,t,{power:.45+r()*.1,tail:.35,bright:.55,dist:0},r)],
  revolver:[.8,(c,o,t,r)=>gunshot(c,o,t,{power:.7,tail:.5,bright:.45,dist:0},r)],
  smg:[.4,(c,o,t,r)=>gunshot(c,o,t,{power:.3,tail:.2,bright:.65,dist:0},r)],
  rifle:[.9,(c,o,t,r)=>gunshot(c,o,t,{power:.8,tail:.6,bright:.7,dist:0},r)],
  shotgun:[1,(c,o,t,r)=>{gunshot(c,o,t,{power:.9,tail:.6,bright:.3,dist:0},r);const b=Nz(c,.6,'brown',r),lp=Fl(c,'lowpass',260),g=Gn(c,0);ch(b,lp,g,o);perc(g.gain,t,.003,.35,.9);b.start(t)}],
  laser:[.4,(c,o,t,r)=>blaster(c,o,t,1500+r()*600,.15,.2,.5,r)],
  reload:[.8,(c,o,t,r)=>{mech(c,o,t,1500,r,.8);const s=nz(c,r),bp=Fl(c,'bandpass',2500,1.2),g=Gn(c,0);ch(s,bp,g,o);pts(g.gain,t+.05,[[0,0],[.1,.12],[.2,0]]);s.start(t+.05,s._off,.3);mech(c,o,t+.32,1900,r,1)}],
  dryfire:[.2,(c,o,t,r)=>mech(c,o,t,2200,r,.5)],
  swing:[.35,(c,o,t,r)=>whoosh(c,o,t,.18+r()*.05,1300+r()*300,.6,r)],
  swingH:[.5,(c,o,t,r)=>whoosh(c,o,t,.3+r()*.06,520+r()*120,.3,r)],
  hit:[.45,(c,o,t,r)=>punch(c,o,t,.55,.5,.5,r)],
  hitMetal:[.6,(c,o,t,r)=>{clang(c,o,t,600+r()*300,.35,.6,.5,r);punch(c,o,t,.3,.3,.7,r)}],
  hitEnergy:[.4,(c,o,t,r)=>{blaster(c,o,t,900,.3,.12,.9,r);const cr=crackleBuf(c,.25,300,r,{dec:[.1,.5]}),h=Fl(c,'highpass',3000);ch(cr,h,o);cr.start(t)}],
  heroHurt:[.4,(c,o,t,r)=>{punch(c,o,t,.8,.2,.8,r);const n=Nz(c,.25,'pink',r),bp=Fl(c,'bandpass',500,2),g=Gn(c,0);ch(n,bp,g,o);perc(g.gain,t+.01,.01,.12,.25);n.start(t)}],
  step0:[.3,(c,o,t,r)=>step(c,o,t,0,.4,r)],step1:[.4,(c,o,t,r)=>step(c,o,t,1,.4,r)],step2:[.4,(c,o,t,r)=>step(c,o,t,2,.5,r)],
  splash:[.7,(c,o,t,r)=>{const s=Sb(c,.6,2,(chs,sr)=>{for(let k=0;k<22;k++)sweep(chs,sr,Math.floor(Math.pow(r(),1.5)*.35*sr),.03+r()*.04,300+r()*900,900+r()*1500,.18*r(),r()*1.6-.8)});s.connect(o);s.start(t);const n=Nz(c,.4,'white',r),bp=Fl(c,'bandpass',1800,.8),g=Gn(c,0);ch(n,bp,g,o);perc(g.gain,t,.005,.2,.5);n.start(t)}],
  rat:[.4,(c,o,t,r)=>{const s=Sb(c,.35,2,(chs,sr)=>{const f=2600+r()*1400;for(let k=0;k<2+Math.floor(r()*2);k++)sweep(chs,sr,Math.floor(k*.09*sr),.06,f*(.9+r()*.3),f*(1.3+r()*.4),.35,r()*.6-.3,.2)});s.connect(o);s.start(t)}],
  dog:[.6,(c,o,t,r)=>{const f0=320*(.9+r()*.2),d=.16,bus=Gn(c,0),sh=shaper(c,.5);ch(bus,sh,o);pts(bus.gain,t,[[0,0],[.008,1],[d*.6,.7],[d,0]]);const os=Os(c,'sawtooth',f0),src=Gn(c,1);pts(os.frequency,t,[[0,f0*.85],[d*.25,f0*1.15],[d,f0*.7]]);ch(os,src);os.start(t);os.stop(t+d+.05);
    const n=nz(c,r),nb=Fl(c,'bandpass',1500,1),gn=Gn(c,.6);ch(n,nb,gn,src);n.start(t,n._off,d+.05);[[900,3,1],[1800,4,.5]].forEach(([f,q,a])=>{const b=Fl(c,'bandpass',f,q),g=Gn(c,a*2);ch(src,b,g,bus)})}],
  drone:[.5,(c,o,t,r)=>{note(c,o,{t,dur:.06,f:1500+r()*300,wave:'square',amp:.12,cut:3000});note(c,o,{t:t+.09,dur:.08,f:1000+r()*200,wave:'square',amp:.12,cut:3000});const w=Os(c,'sawtooth',180),l=Fl(c,'bandpass',900,3),g=Gn(c,0);ch(w,l,g,o);pts(g.gain,t,[[0,0],[.05,.15],[.4,0]]);epts(w.frequency,t,[[0,160],[.4,260]]);w.start(t);w.stop(t+.45)}],
  slime:[.5,(c,o,t,r)=>{const s=Sb(c,.45,2,(chs,sr)=>{for(let k=0;k<6;k++)sweep(chs,sr,Math.floor(k*.05*sr+r()*.02*sr),.07,120+r()*120,260+r()*200,.4,r()*.4-.2,.3)});s.connect(o);s.start(t)}],
  deathFlesh:[.7,(c,o,t,r)=>{thump(c,o,t,80,.9,.15);const n=Nz(c,.5,'brown',r),l=Fl(c,'lowpass',900),g=Gn(c,0);ch(n,l,g,o);perc(g.gain,t,.003,.25,.9);n.start(t);const cr=crackleBuf(c,.5,180,r,{dec:[.3,2],amp:(tt,rr)=>Math.exp(-tt*6)*rr()}),bp=Fl(c,'bandpass',700,1);ch(cr,bp,o);cr.start(t)}],
  deathMech:[1.4,(c,o,t,r)=>{boom(c,o,t,{size:.55,debris:.7,dist:.2,sub:.4},r);clang(c,o,t+.02,420+r()*200,.6,.6,.6,r)}],
  explosion:[2.6,(c,o,t,r)=>boom(c,o,t,{size:1.4,debris:.6,dist:.1,sub:.8},r)],
  smoke:[1.2,(c,o,t,r)=>{const n=Nz(c,1.1,'pink',r),h=Fl(c,'highpass',1500),g=Gn(c,0);ch(n,h,g,o);pts(g.gain,t,[[0,0],[.08,.6],[1,0]]);n.start(t);thump(c,o,t,140,.3,.05)}],
  zap:[.8,(c,o,t,r)=>{const f=180,fe=f*7,env=Gn(c,0),lp=Fl(c,'lowpass',f*3,2);ch(lp,env,o);pts(env.gain,t,[[0,0],[.25,.5],[.3,0]]);epts(lp.frequency,t,[[0,f*3],[.3,fe*4]]);[['sawtooth',1],['square',1.5]].forEach(([w,m])=>{const x=Os(c,w,f*m);epts(x.frequency,t,[[0,f*m],[.3,fe*m]]);ch(x,Gn(c,.35),lp);x.start(t);x.stop(t+.35)});
    const n=nz(c,r),l=Fl(c,'lowpass',3000),g=Gn(c,0);ch(n,l,g,o);perc(g.gain,t+.3,.002,.25,.6);n.start(t+.3,n._off,.6);thump(c,o,t+.3,80,.6,.15)}],
  heal:[1.4,(c,o,t,r)=>{[0,4,7,12].forEach((s,i)=>note(c,o,{t:t+i*.05,dur:.5,f:392*Math.pow(2,s/12),wave:i%2?'triangle':'sine',amp:.08,a:.15,r:.5}));for(let i=0;i<10;i++)bell(c,o,t+i*.07,392*lerp(2,8,i/10)*(.95+r()*.1),.35,.05,[1,2.01],r,r()*1.4-.7)}],
  charge:[.6,(c,o,t,r)=>{const x=Os(c,'square',300),l=Fl(c,'lowpass',1500),g=Gn(c,0);ch(x,l,g,o);epts(x.frequency,t,[[0,300],[.35,1400]]);pts(g.gain,t,[[0,0],[.05,.15],[.35,.15],[.45,0]]);x.start(t);x.stop(t+.5)}],
  pickup:[.45,(c,o,t,r)=>{const f=988*(r()<.5?1:1.122);note(c,o,{t,dur:.05,f,wave:'square',amp:.08,cut:4000});note(c,o,{t:t+.06,dur:.12,f:f*1.335,wave:'square',amp:.08,cut:4000,r:.15})}],
  rummage:[.5,(c,o,t,r)=>{const n=Nz(c,.45,'white',r),f=Fl(c,'bandpass',3200,.7),g=Gn(c,0);ch(n,f,g,o);g.gain.setValueAtTime(0,t);let tt=0;while(tt<.4){tt+=.03+r()*.07;g.gain.linearRampToValueAtTime(Math.pow(r(),1.5)*.5,t+tt)}g.gain.linearRampToValueAtTime(0,t+.44);n.start(t);for(let i=0;i<3;i++)clickHit(c,o,t+r()*.35,1500+r()*2500,.015,.4,r,4)}],
  scrap:[.9,(c,o,t,r)=>{mech(c,o,t,1200+r()*600,r,.9);clickHit(c,o,t+.12,2600,.02,.6,r,3);clang(c,o,t+.18,700+r()*500,.3,.5,.4,r);const cr=crackleBuf(c,.6,120,r,{dec:[.2,1.2],amp:(tt,rr)=>tt<.15?0:Math.exp(-tt*4)*rr()}),h=Fl(c,'highpass',1500);ch(cr,h,o);cr.start(t)}],
  click:[.12,(c,o,t,r)=>{const n=nz(c,r),f=Fl(c,'bandpass',2200,4),g=Gn(c,0);ch(n,f,g,o);perc(g.gain,t,.0006,.012,.6);n.start(t,n._off,.08);const x=Os(c,'triangle',900),g2=Gn(c,0);ch(x,g2,o);epts(x.frequency,t,[[0,990],[.03,400]]);perc(g2.gain,t,.001,.02,.25);x.start(t);x.stop(t+.08)}],
  levelup:[1,(c,o,t,r)=>{[0,4,7,12].forEach((s,i)=>{const f=523*Math.pow(2,s/12);note(c,o,{t:t+i*.08,dur:i===3?.2:.05,f,wave:'square',amp:.1,cut:3500,r:i===3?.4:.08})})}],
  door:[1,(c,o,t,r)=>{whoosh(c,o,t,.6,700,.4,r);mech(c,o,t+.05,700,r,.7);thump(c,o,t+.5,70,.6,.15)}],
  death:[2.4,(c,o,t,r)=>{const seq=[[0,7,.4],[.4,6,.4],[.8,5,.4],[1.2,4,1.1]];seq.forEach(([a,s,d])=>note(c,o,{t:t+a,dur:d*.9,f:mtof(64+s),wave:'sawtooth',amp:.08,cut:1800,r:.2,vib:a>1?.008:0}));thump(c,o,t,60,.7,.4)}],
};
const VARS=3;

// ---------------- music: street-electronic grooves, one per area ----------------
const SCALES=[[0,2,4,5,7,9,11],[0,2,3,5,7,8,10],[0,2,3,5,7,9,10],[0,1,3,5,7,8,10]];
const dm=(key,sc,deg,oct)=>{const s=SCALES[sc],o=Math.floor(deg/7),i=((deg%7)+7)%7;return 12*(oct+1+o)+key+s[i]};
function chipNoise(c,out,t,dec,amp,hp,rng){const n=nz(c,rng),h=Fl(c,'highpass',hp),g=Gn(c,0);ch(n,h,g,out);perc(g.gain,t,.001,dec,amp);n.start(t,n._off,dec*4+.02)}
function kick(c,out,t,amp,f0=150){const o=Os(c,'sine',f0),g=Gn(c,0);ch(o,g,out);epts(o.frequency,t,[[0,f0],[.12,42]]);perc(g.gain,t,.002,.35,amp);o.start(t);o.stop(t+.5)}
function clap(c,out,t,amp,rng){for(let k=0;k<3;k++)chipNoise(c,out,t+k*.011,.02,amp*.5,1000,rng);chipNoise(c,out,t+.033,.14,amp,900,rng)}
const TRACKS={
  base:{bpm:84,key:2,sc:2,energy:.25,swing:.12,dark:.3,lead:'rhodes'},
  sewer:{bpm:96,key:4,sc:3,energy:.45,swing:.08,dark:.85,lead:'pulse'},
  alley:{bpm:108,key:9,sc:2,energy:.6,swing:.1,dark:.5,lead:'pulse'},
  streets:{bpm:118,key:7,sc:1,energy:.75,swing:.05,dark:.4,lead:'saw'},
  server:{bpm:126,key:0,sc:1,energy:.8,swing:0,dark:.55,lead:'saw'},
  core:{bpm:132,key:5,sc:3,energy:.95,swing:0,dark:.9,lead:'saw'},
  frost:{bpm:100,key:2,sc:1,energy:.55,swing:0,dark:.7,lead:'rhodes'},biolab:{bpm:112,key:9,sc:2,energy:.65,swing:.1,dark:.5,lead:'pulse'},
  desert:{bpm:104,key:4,sc:3,energy:.6,swing:.06,dark:.6,lead:'saw'},fog:{bpm:88,key:1,sc:3,energy:.35,swing:0,dark:1,lead:'rhodes'},factory:{bpm:136,key:7,sc:1,energy:1,swing:0,dark:.7,lead:'saw'}};
function buildTrack(c,out,t0,T,rng){
  const beat=60/T.bpm,s16=beat/4,bars=16,sw=T.swing*s16,k=T.key,sc=T.sc;
  const prog=[[0,5,6,4],[0,3,6,5],[0,6,5,4],[0,2,3,4]][Math.floor(rng()*4)];
  // bass rhythm: syncopated 16ths, octave jumps
  const bassPat=Array.from({length:16},(_,i)=>i===0?1:i%4===0?(rng()<.5?1:0):rng()<.32+T.energy*.18?1:0),bassOct=bassPat.map(()=>rng()<.22?1:0),bassDeg=bassPat.map((_,i)=>i===0?0:rng()<.7?0:[4,6,7,2][Math.floor(rng()*4)]);
  const motif=[];let cur=2;for(let s=0;s<16;s++)if(rng()<(s%2?.28:.55)){cur=Math.max(-2,Math.min(9,cur+[-2,-1,0,1,2,3][Math.floor(rng()*6)]));motif.push({s,d:cur,len:1+Math.floor(rng()*3)})}
  const master=Gn(c,.8),comp=c.createDynamicsCompressor();comp.threshold.value=-14;comp.ratio.value=4;ch(master,comp,out);
  const dly=c.createDelay(1);dly.delayTime.value=beat*.75;const fb=Gn(c,.32),dl=Fl(c,'lowpass',2500);ch(dly,dl,fb,dly);dl.connect(master);const send=Gn(c,.3);send.connect(dly);
  const pw=pulseWave(c,.25),pw12=pulseWave(c,.125);
  for(let b=0;b<bars;b++){const bt=t0+b*4*beat,root=prog[Math.floor(b/2)%4],sec=b<4?0:b<12?1:2,fill=b%8===7;
    const T16=i=>bt+i*s16+(i%2?sw:0);
    // drums
    for(let i=0;i<16;i++){const t=T16(i);
      if(i%4===0&&!(fill&&i===12))kick(c,master,t,.8+(i===0?.1:0));else if(T.energy>.7&&(i===14||i===7)&&rng()<.5)kick(c,master,t,.45);
      if(sec>0&&(i===4||i===12))clap(c,master,t,.5,rng);
      if(i%2===0)chipNoise(c,master,t,.025,.07+T.energy*.05,8000,rng);if(i%4===2)chipNoise(c,master,t,.09,.09+T.energy*.04,6500,rng);
      if(T.energy>.6&&i%2===1)chipNoise(c,master,t,.015,.035,9000,rng)}
    if(fill)for(let i=12;i<16;i++){const t=T16(i),o=Os(c,'sine',200-(i-12)*25),g=Gn(c,0);ch(o,g,master);epts(o.frequency,t,[[0,200-(i-12)*25],[.15,90]]);perc(g.gain,t,.002,.2,.5);o.start(t);o.stop(t+.3)}
    // bass: saw through a plucky low-pass ("wah")
    for(let i=0;i<16;i++)if(bassPat[i]){const t=T16(i),f=mtof(dm(k,sc,root+bassDeg[i],1+bassOct[i])),o=Os(c,'sawtooth',f),o2=Os(c,'square',f*.5),l=Fl(c,'lowpass',200,6),g=Gn(c,0);ch(o,l,g,master);ch(o2,Gn(c,.4),l);
      epts(l.frequency,t,[[0,lerp(1800,700,T.dark)],[s16*1.6,180]]);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.34,t+.004);g.gain.setValueAtTime(.34,t+s16*1.4);g.gain.linearRampToValueAtTime(0,t+s16*1.8);[o,o2].forEach(x=>{x.start(t);x.stop(t+s16*2)})}
    // chord stabs on the off-beats
    if(sec>0)[2,6,10,14].forEach(i=>{if(i===14&&rng()<.5)return;const t=T16(i);[0,2,4,6].forEach(d=>{const f=mtof(dm(k,sc,root+d,3));if(T.lead==='rhodes'){note(c,master,{t,dur:s16*1.5,f,wave:'sine',amp:.045,a:.004,r:.25});note(c,send,{t,dur:s16,f:f*2,wave:'triangle',amp:.015,r:.2})}
      else [-7,7].forEach(det=>note(c,master,{t,dur:s16*.9,f,wave:'sawtooth',amp:.022,a:.003,r:.08,cut:lerp(3200,1400,T.dark),det,pan:det/14}))})});
    // pad underneath
    [0,2,4].forEach(d=>note(c,master,{t:bt,dur:4*beat*.95,f:mtof(dm(k,sc,root+d,3)),wave:'triangle',amp:.025,a:beat,r:beat}));
    // arp (energetic areas)
    if(T.energy>.7&&sec>0)for(let i=0;i<16;i++)note(c,send,{t:T16(i),dur:s16*.5,f:mtof(dm(k,sc,root+[0,2,4,7][i%4],4)),pw:pw12,amp:.05,a:.002,r:.02});
    // lead motif in the last section
    if(sec===2||(sec===1&&b%4>=2&&T.energy>.5))for(const n of motif){const t=T16(n.s),f=mtof(dm(k,sc,root+n.d,4)),d=n.len*s16*.9;
      if(T.lead==='saw')[-6,6].forEach(det=>{note(c,master,{t,dur:d,f,wave:'sawtooth',amp:.04,a:.005,r:.06,cut:2600,det,vib:.004});note(c,send,{t,dur:d,f,wave:'sawtooth',amp:.02,cut:2200,det})});
      else if(T.lead==='pulse'){note(c,master,{t,dur:d,f,pw,amp:.06,a:.003,r:.04});note(c,send,{t,dur:d,f,pw,amp:.03,r:.04})}
      else{note(c,master,{t,dur:d,f,wave:'sine',amp:.07,a:.005,r:.3});note(c,send,{t,dur:d,f:f*2,wave:'sine',amp:.02,r:.2})}}
  }
  return bars*4*beat;
}
// ambience per area
function buildAmb(c,out,t0,dur,kind,rng){
  if(kind==='sewer'){const n=Nz(c,dur,'pink',rng),bp=Fl(c,'bandpass',1100,.6),g=Gn(c,0);ch(n,bp,g,out);wander(g.gain,t0,dur,.12,.05,1.5,rng,0);n.start(t0);
    const s=Sb(c,dur,2,(chs,sr,len)=>{for(let k=0;k<dur*70;k++){const st=Math.floor(rng()*len),f0=650*(.5+rng()*1.6),dk=(6+rng()*25)*sr/1000,a=rng()*rng()*.45,pan=rng(),gl=Math.sqrt(1-pan),gr=Math.sqrt(pan),m=Math.min(len-st,Math.floor(dk*5));let ph=0;for(let j=0;j<m;j++){ph+=f0*(1+1.5*j/m)/sr;const v=Math.sin(TAU*ph)*Math.exp(-j/dk)*a*Math.min(1,j/30);chs[0][st+j]+=v*gl;chs[1][st+j]+=v*gr}}
      let t=rng();while(t<dur-.1){sweep(chs,sr,Math.floor(t*sr),.035,1300*(.7+rng()*.6),2400,.25,rng()*1.6-.8);t+=.6+rng()*2}});s.connect(out);s.start(t0);
    const b=Nz(c,dur,'brown',rng),l=Fl(c,'lowpass',140),gb=Gn(c,.25);ch(b,l,gb,out);b.start(t0)}
  else if(kind==='alley'||kind==='streets'){[-1,1].forEach(side=>{const n=Nz(c,dur,'pink',rng),bp=Fl(c,'bandpass',420,.55),g=Gn(c,0),pp=Pn(c,side*.6);ch(n,bp,g,pp,out);wander(bp.frequency,t0,dur,420,200,.6,rng,60);wander(g.gain,t0,dur,.22,.12,.5,rng,.01);n.start(t0)});
    const b=Nz(c,dur,'brown',rng),l=Fl(c,'lowpass',kind==='streets'?260:160),gb=Gn(c,kind==='streets'?.45:.3);ch(b,l,gb,out);wander(gb.gain,t0,dur,gb.gain.value,.1,.3,rng,0);b.start(t0)}
  else if(kind==='server'||kind==='core'){const bus=Gn(c,.6);bus.connect(out);[[50,.4],[100,.3],[150,.12]].forEach(([f,a])=>{const o=Os(c,'sine',f);ch(o,Gn(c,a),bus);o.start(t0);o.stop(t0+dur)});
    const fan=Nz(c,dur,'pink',rng),fh=Fl(c,'bandpass',900,.4),fg=Gn(c,.45);ch(fan,fh,fg,out);wander(fg.gain,t0,dur,.45,.08,.4,rng,.1);fan.start(t0);
    const whine=Os(c,'sine',kind==='core'?7200:5400),wg=Gn(c,.008);ch(whine,wg,out);whine.start(t0);whine.stop(t0+dur);
    let t=t0+rng()*.4;while(t<t0+dur){if(rng()<.25){const n=3+Math.floor(rng()*4);for(let i=0;i<n;i++)note(c,out,{t:t+i*.04,dur:.025,f:1200*Math.pow(2,[0,2,4,7,9][Math.floor(rng()*5)]/12),wave:'sine',amp:.05,a:.002,r:.005});t+=n*.04}t+=(.3+rng()*1.4)/3}}
  else if(kind==='candle'){const cr=crackleBuf(c,dur,25,rng,{dec:[.15,1],amp:(tt,r)=>Math.pow(r(),3)*.5}),hp=Fl(c,'highpass',1200);ch(cr,hp,out);cr.start(t0);const b=Nz(c,dur,'brown',rng),l=Fl(c,'lowpass',200),g=Gn(c,.08);ch(b,l,g,out);b.start(t0)}
  else if(kind==='hum'){const bus=Gn(c,.35);bus.connect(out);[[50,.5],[100,.35],[150,.15]].forEach(([f,a])=>{const o=Os(c,'sine',f);ch(o,Gn(c,a),bus);o.start(t0);o.stop(t0+dur)});const sq=Os(c,'square',100),bp=Fl(c,'bandpass',1200,1);ch(sq,bp,Gn(c,.06),bus);sq.start(t0);sq.stop(t0+dur)}
  else if(kind==='buzz'){ // flickering lamp: mains buzz with crackle bursts
    const bus=Gn(c,0);bus.connect(out);let t=0;while(t<dur){const on=.15+rng()*1.2,off=rng()<.6?.03+rng()*.15:.4;bus.gain.setValueAtTime(.5,t0+t);bus.gain.setValueAtTime(rng()<.5?.05:0,t0+t+on);t+=on+off}
    const sq=Os(c,'sawtooth',100),bp=Fl(c,'bandpass',1800,1.5);ch(sq,bp,Gn(c,.12),bus);sq.start(t0);sq.stop(t0+dur);const o=Os(c,'sine',50);ch(o,Gn(c,.25),bus);o.start(t0);o.stop(t0+dur);
    const cr=crackleBuf(c,dur,40,rng,{dec:[.1,.6]}),h=Fl(c,'highpass',2500);ch(cr,h,Gn(c,.6),bus);cr.start(t0)}
}

// ---------------- runtime ----------------
let ac=null,master,sfxBus,musBus,ambBus,buzzBus;
const BANK={},LAST={};let bankReady=false,bankBusy=false;
const SETK='neongen_audio';let VOL={on:1,m:.45,s:.8,a:.6};try{Object.assign(VOL,JSON.parse(localStorage.getItem(SETK))||{})}catch(e){}
function saveVol(){try{localStorage.setItem(SETK,JSON.stringify(VOL))}catch(e){}apply()}
function apply(){if(!ac)return;const k=VOL.on?1:0,t=ac.currentTime;master.gain.setTargetAtTime(k,t,.05);musBus.gain.setTargetAtTime(VOL.m,t,.1);sfxBus.gain.setTargetAtTime(VOL.s,t,.05);ambBus.gain.setTargetAtTime(VOL.a,t,.1);buzzBus.gain.setTargetAtTime(VOL.a,t,.1)}
async function render(dur,fn,seed){const len=Math.ceil(dur*SR),c=new OfflineAudioContext(2,len,SR);const out=Gn(c,1);out.connect(c.destination);try{fn(c,out,0,mulberry32(seed))}catch(e){console.warn(e)}return c.startRendering()}
async function renderLoop(dur,fn,seed){const X=1,b=await render(dur+X,fn,seed),n=Math.round(dur*SR),xn=Math.round(X*SR),out=new AudioBuffer({length:n,numberOfChannels:2,sampleRate:SR});
  for(let c=0;c<2;c++){const d=b.getChannelData(c),o=out.getChannelData(c);o.set(d.subarray(0,n));for(let i=0;i<xn;i++){const a=i/xn;o[i]=d[i]*Math.sin(a*Math.PI/2)+d[n+i]*Math.cos(a*Math.PI/2)}}
  let pk=0;for(let c=0;c<2;c++){const o=out.getChannelData(c);for(let i=0;i<n;i++)pk=Math.max(pk,Math.abs(o[i]))}if(pk>.95)for(let c=0;c<2;c++){const o=out.getChannelData(c);for(let i=0;i<n;i++)o[i]*=.9/pk}
  return out}
async function buildBank(){if(bankBusy)return;bankBusy=true;
  const order=['click','step0','pistol','swing','hit','pickup','rummage','scrap','smg','revolver','rifle','shotgun','laser','reload','dryfire','swingH','hitMetal','hitEnergy','heroHurt','step1','step2','splash','rat','dog','drone','slime','deathFlesh','deathMech','explosion','smoke','zap','heal','charge','levelup','door','death'];
  for(const k of order){const[len,fn]=RECIPES[k];BANK[k]=[];for(let v=0;v<VARS;v++){const b=await render(len,(c,o,t,r)=>fn(c,o,t+.005,r,v),1000+v*77+k.length*13);normalize(b,k);BANK[k].push(b)}await new Promise(r=>setTimeout(r,0))}
  bankReady=true}
const LOUD={click:.25,step0:.35,step1:.35,step2:.4,pickup:.4,rummage:.5,swing:.55,swingH:.6,levelup:.5,door:.6,death:.7,heal:.6,charge:.5};
function normalize(b,k){let pk=0;for(let c=0;c<2;c++){const d=b.getChannelData(c);for(let i=0;i<d.length;i++)pk=Math.max(pk,Math.abs(d[i]))}const g=pk>1e-5?(.9/pk)*(LOUD[k]||.85):1;for(let c=0;c<2;c++){const d=b.getChannelData(c);for(let i=0;i<d.length;i++)d[i]*=g}}
function init(){if(ac){if(ac.state==='suspended')ac.resume();return}
  const C=window.AudioContext||window.webkitAudioContext;if(!C)return;ac=new C();
  master=Gn(ac,VOL.on?1:0);const comp=ac.createDynamicsCompressor();comp.threshold.value=-10;comp.ratio.value=3;ch(master,comp,ac.destination);
  sfxBus=Gn(ac,VOL.s);musBus=Gn(ac,VOL.m);ambBus=Gn(ac,VOL.a);buzzBus=Gn(ac,VOL.a);[sfxBus,musBus,ambBus,buzzBus].forEach(b=>b.connect(master));
  buildBank().then(()=>{if(pendingArea)area(pendingArea)});}
['pointerdown','keydown','touchstart'].forEach(ev=>addEventListener(ev,init,{passive:true}));
let live=0;
function play(name,o={}){if(!ac||!bankReady||!VOL.on)return;const vs=BANK[name];if(!vs)return;const now=ac.currentTime;
  if(LAST[name]&&now-LAST[name]<(o.gap||.035))return;LAST[name]=now;if(live>28)return;
  const s=ac.createBufferSource();s.buffer=vs[(Math.random()*vs.length)|0];s.playbackRate.value=(o.rate||1)*(.94+Math.random()*.12);
  const g=Gn(ac,o.vol==null?1:o.vol),p=Pn(ac,o.pan||0);ch(s,g,p,sfxBus);live++;s.onended=()=>live--;s.start(now+(o.delay||0))}
// world-space helper: volume by distance from the hero, pan by side
function at(x,y,name,o={}){if(typeof G==='undefined'||!G||!G.p)return play(name,o);const dx=x-G.p.x,dy=y-G.p.y,d=Math.hypot(dx,dy);const v=Math.max(0,1-d/12);if(v<=.03)return;play(name,{...o,vol:(o.vol==null?1:o.vol)*v,pan:Math.max(-1,Math.min(1,dx/7))})}
// music & ambience
const MUS={},AMB={};let curMus=null,curAmb=null,curBuzz=null,pendingArea=null,areaName=null;
function swap(bus,old,buf,fade=1.5){const now=ac.currentTime;if(old){old.g.gain.setTargetAtTime(0,now,fade/3);const s=old.s;setTimeout(()=>{try{s.stop()}catch(e){}},fade*1500)}
  if(!buf)return null;const s=ac.createBufferSource();s.buffer=buf;s.loop=true;const g=Gn(ac,0);ch(s,g,bus);s.start(now);g.gain.setTargetAtTime(1,now,fade/3);return{s,g}}
async function area(name){pendingArea=name;if(!ac||!bankReady)return;if(areaName===name)return;areaName=name;
  const T=TRACKS[name]||TRACKS.base;const seed=7+Object.keys(TRACKS).indexOf(name)*101;
  track(name);
  const ambKind=({frost:'alley',biolab:'sewer',desert:'streets',fog:'core',factory:'server'})[name]||(name==='base'?(typeof candleOn==='function'&&candleOn()?'candle':'hum'):name);
  const ak=ambKind;if(!AMB[ak])AMB[ak]=renderLoop(10,(c,o,t,r)=>buildAmb(c,o,t,10,ak,r),seed+3);
  if(!AMB.buzz)AMB.buzz=renderLoop(9,(c,o,t,r)=>buildAmb(c,o,t,9,'buzz',r),55);
  const[mb,ab,bb]=await Promise.all([MUS[name],AMB[ak],AMB.buzz]);if(areaName!==name)return;
  curMus=swap(musBus,curMus,mb,2);curAmb=swap(ambBus,curAmb,ab,1.5);if(!curBuzz){curBuzz=swap(buzzBus,null,bb,.5);curBuzz.g.gain.value=0}}
// flickering lamps: buzz loudness follows the nearest lamp
function tick(){if(!ac||!curBuzz)return;let v=0;
  if(typeof MODE!=='undefined'&&MODE==='raid'&&G&&G.lamps){const P=G.p;let best=99;for(const l of G.lamps){const d=Math.hypot(l.x-P.x,l.y-P.y);if(d<best)best=d}v=Math.max(0,1-best/5)*.8}
  curBuzz.g.gain.setTargetAtTime(v,ac.currentTime,.25)}
setInterval(tick,250);
function track(name){const T=TRACKS[name]||TRACKS.base,seed=7+Object.keys(TRACKS).indexOf(name)*101;if(!MUS[name])MUS[name]=renderLoop(16*4*60/T.bpm,(c,o,t,r)=>buildTrack(c,o,t,T,r),seed);return MUS[name]}
return{play,at,area,init,VOL,saveVol,track,ready:()=>bankReady};
})();

// ---------------- game hooks ----------------
{
const KIND_SFX={'пистолет':'pistol','револьвер':'revolver','ПП':'smg','винтовка':'rifle','дробовик':'shotgun','лазер':'laser'};
const HEAVY=new Set(['бита','топор','электродубинка']);
const meleeHitSfx=(e,w)=>e&&!e.human&&(e.type==='drone'||e.type==='sentry')?'hitMetal':w&&(w.kind==='энергоклинок'||w.kind==='электродубинка')?'hitEnergy':'hit';
const _heroShoot=heroShoot;heroShoot=function(e){const P=G.p,w=P.eq.ranged,c0=w?w.clip:0,a0=w?P.inv.ammo[w.ammo]:0;_heroShoot(e);if(!w)return;
  const shots=c0-w.clip;if(shots>0){const s=KIND_SFX[w.kind]||'pistol';for(let i=0;i<shots;i++)AUD.play(s,{delay:i*.07,gap:0})}
  else if(w.clip>c0||P.inv.ammo[w.ammo]<a0)AUD.play('reload');else AUD.play('dryfire')};
const _reload=reloadWpn;reloadWpn=function(){const r=_reload();if(r)AUD.play('reload');return r};
const _heroMelee=heroMelee;heroMelee=function(e){const w=G.p.eq.melee,hp0=e.hp;_heroMelee(e);AUD.play(w&&HEAVY.has(w.kind)?'swingH':'swing');if(e.hp<hp0||e.dead)AUD.play(meleeHitSfx(e,w),{delay:.06})};
const _enemyShoot=enemyShoot;enemyShoot=function(e){const c0=e.clip;_enemyShoot(e);const w=e.weapon;const s=w&&w.kind?KIND_SFX[w.kind]:(e.type==='drone'||e.type==='sentry')?'laser':'pistol';
  if(c0!=null&&e.clip>c0)AUD.at(e.x,e.y,'reload',{vol:.6});else AUD.at(e.x,e.y,s||'pistol',{vol:.75})};
const _enemyMelee=enemyMelee;enemyMelee=function(e){const hp0=G.p.hp;_enemyMelee(e);const w=e.weapon;
  if(e.human)AUD.at(e.x,e.y,w&&HEAVY.has(w.kind)?'swingH':'swing',{vol:.7});else AUD.at(e.x,e.y,({rat:'rat',dog:'dog',slime:'slime',icewolf:'dog',cryojelly:'slime',frostcrab:'rat',vinecrawler:'slime',sporepod:'slime',mantis:'rat',scorpion:'rat',sandworm:'slime',sandmite:'rat',wraith:'drone',stalker:'dog',mannequin:'hitMetal'})[e.type]||'drone',{vol:.8});
  if(G.p.hp<hp0)AUD.play('heroHurt',{delay:.05,vol:.9})};
const _kill=kill;kill=function(e){_kill(e);AUD.at(e.x,e.y,(!e.human&&['drone','sentry','toybot','vacbot','mannequin','frostcrab'].includes(e.type))?'deathMech':'deathFlesh')};
const _loot=lootProp;lootProp=function(pr){const hp0=pr.hp;_loot(pr);AUD.at(pr.x,pr.y,pr.hp<=0&&hp0>0?'scrap':'rummage')};
const _scrap=scrapToPack;scrapToPack=function(it,x,y){_scrap(it,x,y);AUD.play('scrap')};
const _pick=pickupAt;pickupAt=function(x,y){const n0=G.items.length;_pick(x,y);if(G.items.length<n0)AUD.play('pickup')};
const _gren=useGrenade;useGrenade=function(){const r=_gren();if(r)AUD.play(G.camo>0?'smoke':'explosion',{delay:.22});return r};
const _imp=useImplant;useImplant=function(s){const r=_imp(s);if(r)AUD.play('zap');return r};
const _med=useMed;useMed=function(){const r=_med();if(r)AUD.play('heal');return r};
const _bat=useBat;useBat=function(){const r=_bat();if(r)AUD.play('charge');return r};
let lastPos=null,stepN=0;
const _end=endTurn;endTurn=function(){const P=G&&G.p;const before=P?P.x+','+P.y:null;const lvl=P?P.lvl:0;const r=_end.apply(this,arguments);
  if(P&&before!==lastPos&&lastPos!==null&&P.x+','+P.y!==lastPos){const t=G.M.t[P.y*G.M.W+P.x];const surf=t===3?2:(G.biome==='server'||G.biome==='core')?1:0;AUD.play(t===3&&stepN%3===0?'splash':'step'+surf,{vol:.8,gap:.12});stepN++}
  if(P){lastPos=P.x+','+P.y;if(P.lvl>lvl)AUD.play('levelup')}return r};
const _nf=newFloor;newFloor=function(){_nf();lastPos=null;AUD.area(G.biome);AUD.play('door')};
const _eb=enterBase;enterBase=function(){_eb();AUD.area('base')};
const _death=deathScreen;deathScreen=function(){AUD.play('death');return _death()};
document.addEventListener('click',e=>{if(e.target.closest&&e.target.closest('.btn,.tab,.lt,.ic,.dc,.mcard,.rc'))AUD.play('click',{vol:.8})},true);
}
// settings: sound section
{const _sp=settingsPanel;settingsPanel=function(){_sp();const p=$('panel');const box=document.createElement('div');const V=AUD.VOL;
  const sl=(k,n)=>`<label class="vrow"><span>${n}</span><input type="range" min="0" max="100" value="${Math.round(V[k]*100)}" data-vol="${k}"><b>${Math.round(V[k]*100)}</b></label>`;
  box.innerHTML=`<div class="sect">ЗВУК</div><div class="row"><button class="btn" id="sndOn">${V.on?'🔊 Звук включён':'🔇 Звук выключен'}</button></div>${sl('m','Музыка')}${sl('s','Эффекты')}${sl('a','Окружение')}<p class="help">Музыка и все звуки синтезируются процедурно прямо в игре.</p>`;
  const first=p.querySelector('.sect');p.insertBefore(box,first);
  box.querySelectorAll('[data-vol]').forEach(i=>i.oninput=()=>{V[i.dataset.vol]=i.value/100;i.nextElementSibling.textContent=i.value;AUD.saveVol()});
  $('sndOn').onclick=()=>{AUD.init();V.on=V.on?0:1;AUD.saveVol();settingsPanel()}}}
