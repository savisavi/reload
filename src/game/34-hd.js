// ================= HD WORLD: every baked map becomes a real RES× (32 px per tile) bitmap =================
// Floors, walls and decor are laid out on the world-unit grid (16 per tile) by renderMap and the biome hooks;
// this pass turns the result into a 32-px-per-tile texture: EPX smoothing of shapes (puddles, manholes, signs),
// 1-px seams and mortar instead of 2-px ones, and an independent per-pixel grain so no 2×2 blocks survive.
function mapHD(src,seed){
  const W=src.width,Hh=src.height,sd=src.getContext('2d').getImageData(0,0,W,Hh),s32=new Uint32Array(sd.data.buffer);
  const W2=W*2,H2=Hh*2,out=document.createElement('canvas');out.width=W2;out.height=H2;
  const ox=out.getContext('2d'),od=ox.createImageData(W2,H2),o32=new Uint32Array(od.data.buffer);
  const lum=v=>((v&255)*3+((v>>>8)&255)*6+((v>>>16)&255))/10;
  const at=(x,y)=>s32[(y<0?0:y>=Hh?Hh-1:y)*W+(x<0?0:x>=W?W-1:x)];
  const T=14; // luminance step that counts as a drawn line
  for(let y=0;y<Hh;y++)for(let x=0;x<W;x++){
    const P=s32[y*W+x],A=at(x,y-1),B=at(x+1,y),C=at(x-1,y),D=at(x,y+1);
    let e1=P,e2=P,e3=P,e4=P;
    if(C===A&&C!==D&&A!==B)e1=A;if(A===B&&A!==C&&B!==D)e2=B;if(D===C&&D!==B&&C!==A)e3=C;if(B===D&&B!==A&&D!==C)e4=D;
    const lp=lum(P),la=lum(A),lb=lum(B),lc=lum(C),ld=lum(D);
    // one-unit-thick lines (seams, mortar, cracks, highlights) become one sprite pixel thick
    const hLine=Math.abs(lp-la)>T&&Math.abs(lp-ld)>T&&(lp<la)===(lp<ld);
    const vLine=Math.abs(lp-lc)>T&&Math.abs(lp-lb)>T&&(lp<lc)===(lp<lb);
    if(hLine&&!vLine){e3=D;e4=D}else if(vLine&&!hLine){e2=B;e4=B}else if(hLine&&vLine){e4=D}
    const i=(y*2)*W2+x*2;o32[i]=e1;o32[i+1]=e2;o32[i+W2]=e3;o32[i+W2+1]=e4;
  }
  // per-pixel grain (deterministic): breaks up flat 2×2 areas into real 32-px texture
  const s0=(seed|0)^0x2545f491;
  for(let i=0;i<o32.length;i++){const v=o32[i];if(!(v>>>24))continue;
    const h=Math.imul((i^s0)*2654435761,0x85ebca6b)>>>0,k=(h>>>27)-15;if(k>-10&&k<10)continue; // ~40% of pixels move
    const f=1+k*.0045,r=Math.min(255,(v&255)*f),g=Math.min(255,((v>>>8)&255)*f),b=Math.min(255,((v>>>16)&255)*f);
    o32[i]=(v&0xff000000)|(b<<16)|(g<<8)|r}
  ox.putImageData(od,0,0);return out;
}
{const _rm=renderMap;renderMap=function(M){const res=_rm(M);
  res.c=mapHD(res.c,M.seed||1);
  for(const l of res.leds||[])l.pts=l.pts.map(([x,y,...rest])=>[x*RES+1,y*RES,...rest]); // LEDs are single sprite pixels
  return res}}
// world overlays authored in whole units (trap pieces, conveyor chevrons, weather motes): every 1-unit-thin stroke
// or dot is drawn one SPRITE pixel thin instead of two, so overlays share the 32-px grid of the art under them
function thinPx(fn){const f=ctx.fillRect;ctx.fillRect=function(x,y,w,h){if(w===1)w=1/RES;if(h===1)h=1/RES;return f.call(this,x,y,w,h)};
  try{return fn()}finally{ctx.fillRect=f}}
{const _d=decalsDraw;decalsDraw=function(){return thinPx(_d)}}
{const _f=fxDraw;fxDraw=function(){return thinPx(_f)}}
