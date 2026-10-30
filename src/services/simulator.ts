import type{Fix}from'./gps';
/** Simulated run at ~2.8 m/s; a fake 500 m jump every 37 s to test the filter. */
export function simulate(onFix:(f:Fix)=>void):()=>void{
  let lat=48.85,k=0;
  const id=setInterval(()=>{k++;lat+=2.8/111320;
    const jump=k%37===0?500/111320:0;
    onFix({lat:lat+jump,lon:2.35,acc:6,t:Date.now()})},1000);
  return()=>clearInterval(id);
}
