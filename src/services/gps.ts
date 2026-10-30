export interface Fix{lat:number;lon:number;acc:number;t:number}
export function haversine(a:Fix,b:Fix){const R=6371000,r=Math.PI/180,dl=(b.lat-a.lat)*r,dn=(b.lon-a.lon)*r;
  const h=Math.sin(dl/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dn/2)**2;return 2*R*Math.asin(Math.sqrt(h))}
export class Tracker{
  last:Fix|null=null;speed=0;rejected=0;accSum=0;n=0;
  constructor(public dist=0){}
  /** Retourne les mètres ajoutés. Rejette précision >30 m, sauts >25 km/h, gigue/positions répétées. */
  add(f:Fix):number{
    if(f.acc>30){this.rejected++;return 0}
    if(!this.last){this.last=f;this.note(f);return 0}
    const dt=(f.t-this.last.t)/1000;if(dt<=0)return 0;
    const d=haversine(this.last,f);
    if(d<Math.max(3,f.acc*0.5))return 0;
    if(d/dt>7){this.rejected++;return 0}
    this.last=f;this.dist+=d;this.speed=d/dt;this.note(f);return d}
  private note(f:Fix){this.accSum+=f.acc;this.n++}
  quality():'bonne'|'moyenne'|'faible'|'—'{if(!this.n)return'—';const a=this.accSum/this.n;return a<=10?'bonne':a<=20?'moyenne':'faible'}
  paceMinKm(){return this.speed>0.3?1000/this.speed/60:null}
}
export function watch(onFix:(f:Fix)=>void,onMsg:(m:string)=>void):()=>void{
  if(!('geolocation' in navigator)){onMsg('GPS indisponible : mode durée uniquement.');return()=>{}}
  const id=navigator.geolocation.watchPosition(
    p=>{onMsg('');onFix({lat:p.coords.latitude,lon:p.coords.longitude,acc:p.coords.accuracy,t:p.timestamp})},
    e=>onMsg(e.code===1?'Localisation refusée : mode durée uniquement (aucune pénalité).':e.code===2?'Signal GPS perdu…':'GPS trop lent à répondre…'),
    {enableHighAccuracy:true,maximumAge:0,timeout:20000});
  return()=>navigator.geolocation.clearWatch(id);
}
