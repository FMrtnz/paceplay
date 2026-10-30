import type{Plan}from'./plan';
export interface Clock{startedAt:number;pausedMs:number;pausedAt:number|null}
/** Temps écoulé en s, calculé uniquement à partir d'horodatages. */
export const elapsedS=(c:Clock,now:number)=>Math.max(0,((c.pausedAt??now)-c.startedAt-c.pausedMs)/1000);
export function locate(plan:Plan,e:number){let acc=0;
  for(let i=0;i<plan.phases.length;i++){const d=plan.phases[i].dur;if(e<acc+d)return{i,left:acc+d-e};acc+=d}
  return{i:plan.phases.length,left:0}}
export const pause=(c:Clock,now:number):Clock=>c.pausedAt?c:{...c,pausedAt:now};
export const resume=(c:Clock,now:number):Clock=>c.pausedAt?{...c,pausedMs:c.pausedMs+now-c.pausedAt,pausedAt:null}:c;
