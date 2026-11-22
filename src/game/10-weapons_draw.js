// ================= WEAPON ON THE BODY: real item icon, pivoted at the hand, aimed / swung =================
const _piv=new WeakMap(),_wht=new WeakMap();
function iconPivot(it){
  const c=it.icon;if(_piv.has(c))return _piv.get(c);
  const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data,W=c.width,Hh=c.height;let pv;
  const op=(x,y)=>d[(y*W+x)*4+3]>100;
  if(it.cat==='ranged'){ // grip: lowest opaque row, its leftmost run
    let gy=-1;for(let y=Hh-1;y>=0&&gy<0;y--)for(let x=0;x<W;x++)if(op(x,y)){gy=y;break}
    let gx=0,n=0;for(let x=0;x<W;x++)if(op(x,gy)){gx+=x;n++}pv=[n?gx/n:4,Math.max(0,gy-2)];
  } else { // melee: the end of the handle = opaque pixel closest to the bottom-left corner
    let best=1e9;pv=[2,13];for(let y=0;y<Hh;y++)for(let x=0;x<W;x++)if(op(x,y)){const s=x-y*1.0;if(s<best){best=s;pv=[x+1.5,y-1.5]}}
  }
  _piv.set(c,pv);return pv;
}
function whiteIcon(c){if(_wht.has(c))return _wht.get(c);const w=whiteOf(c);_wht.set(c,w);return w}
const WSNAP=Math.PI/16,WSCALE=.72;
function drawWeapon(e,set,time){
  const W=set.weapon;if(!W||!W.icon||(e.dead&&e.fade<=0))return;
  const pv=iconPivot(W),[hx,hy]=set.hand;let a;
  const now=performance.now();
  if(W.cat==='ranged'){
    let tgt=null;
    if(e.isHero&&MODE==='raid'&&G&&G.dead)tgt=null;
    else if(e.aim&&e.aim.until>now)tgt=e.aim;
    else if(typeof G!=='undefined'&&G&&MODE==='raid'){
      if(e.isHero){let bd=99;for(const q of G.en){if(q.dead||!G.vis[idx(q.x,q.y)])continue;const d=dst(q,e);if(d<bd&&d<=(W.range||6)+.5){bd=d;tgt=q}}}
      else if(e.awake&&G.vis[idx(e.x,e.y)])tgt=G.p;
    }
    if(tgt){const tx=tgt.rx!=null?tgt.rx:tgt.x,ty=tgt.ry!=null?tgt.ry:tgt.y,dx=tx-e.rx,dy=ty-e.ry;
      if(Math.abs(dx)>.3&&!e.bump&&Math.sign(dx)!==e.face){e.face=Math.sign(dx);return} // turn to the target first (next frame draws mirrored)
      a=Math.max(-1.25,Math.min(1.25,Math.atan2(dy,Math.max(.15,Math.abs(dx)))))}
    else a=.18+Math.sin(time*2+(e.ph||0))*.04; // relaxed, barrel slightly down
    a=Math.round(a/WSNAP)*WSNAP;
  } else {
    if(e.bump){const p=Math.min(1,e.bump.t*1.4);a=-1.15+2.5*Math.sin(p*Math.PI/2)}else a=-.15+Math.sin(time*2.2+(e.ph||0))*.05;
    a=Math.round(a/WSNAP)*WSNAP;
  }
  // recoil
  let rx=0;if(W.cat==='ranged'&&e.aim&&e.aim.until-now>780)rx=-1;
  ctx.save();ctx.translate(hx+.5+rx,hy+.5);ctx.rotate(a);ctx.scale(WSCALE,WSCALE);
  ctx.drawImage(W.icon,-pv[0],-pv[1]);
  if(e.flash>0){ctx.globalAlpha*=e.flash;ctx.drawImage(whiteIcon(W.icon),-pv[0],-pv[1])}
  ctx.restore();
}
// static posed sprite (body + weapon) for UI previews, drawn at 2x so the weapon keeps its detail
const _posed=new WeakMap();
function posed(set){
  if(_posed.has(set))return _posed.get(set);
  const K=2,c=document.createElement('canvas');c.width=CW_*K;c.height=CH_*K;const x=c.getContext('2d');x.imageSmoothingEnabled=false;
  x.drawImage(set.fr[0],0,0,CW_*K,CH_*K);
  const W=set.weapon;if(W&&W.icon){const pv=iconPivot(W),[hx,hy]=set.hand,a=W.cat==='ranged'?.2:-.2;
    x.save();x.scale(K,K);x.translate(hx+.5,hy+.5);x.rotate(Math.round(a/WSNAP)*WSNAP);x.scale(WSCALE,WSCALE);x.drawImage(W.icon,-pv[0],-pv[1]);x.restore()}
  _posed.set(set,c);return c;
}
