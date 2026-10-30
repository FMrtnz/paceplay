import type{Result}from'../services/storage';
export const BADGES:Record<string,string>={first:'Première capture',w3:'3 séances / semaine',d10:'10 défis cumulés',k5:'5 km cumulés'};
/** Jamais de retrait de points. */
export function computeXp(o:{completed:boolean;P:number;defis:number;allRecover:boolean;week3:boolean}):number{
  const base=o.completed?50:Math.floor(50*o.P);
  return base+10*Math.min(o.defis,10)+(o.completed&&o.allRecover?20:0)+(o.week3?30:0);}
export function earnedBadges(h:Result[],week3Ever:boolean):string[]{
  const b:string[]=[];if(h.some(r=>r.completed))b.push('first');
  if(week3Ever)b.push('w3');if(h.reduce((a,r)=>a+r.defis,0)>=10)b.push('d10');
  if(h.reduce((a,r)=>a+r.distM,0)>=5000)b.push('k5');return b;}
