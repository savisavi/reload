// ================= HD WORLD OVERLAYS =================
// Maps are baked natively at SPX pixels per tile (renderMap). Overlays drawn at runtime in world units:
// world overlays authored in whole units (trap pieces, conveyor chevrons, weather motes): every 1-unit-thin stroke
// or dot is drawn one SPRITE pixel thin instead of two, so overlays share the 32-px grid of the art under them
function thinPx(fn){const f=ctx.fillRect;ctx.fillRect=function(x,y,w,h){if(w===1)w=1/RES;if(h===1)h=1/RES;return f.call(this,x,y,w,h)};
  try{return fn()}finally{ctx.fillRect=f}}
{const _d=decalsDraw;decalsDraw=function(){return thinPx(_d)}}
{const _f=fxDraw;fxDraw=function(){return thinPx(_f)}}
