export type Level='debutant'|'intermediaire'|'avance';
export type Kind='warmup'|'accel'|'recover'|'cooldown';
export interface Phase{kind:Kind;dur:number}
export interface Plan{phases:Phase[];total:number;distKm:number;sig:string;seed:number;n:number}
// A/R en secondes, vitesses en km/h
export const LEVELS:Record<Level,{label:string;A:number;R:number;vE:number;vA:number}>={
  debutant:{label:'Débutant',A:30,R:90,vE:7,vA:8.5},
  intermediaire:{label:'Intermédiaire',A:45,R:75,vE:9,vA:11},
  avance:{label:'Avancé',A:60,R:60,vE:10.5,vA:13.5}};
const STEP=15; // pas de variation δ (s)
const round30=(x:number)=>Math.round(x/30)*30;
const clamp=(x:number,a:number,b:number)=>Math.min(b,Math.max(a,x));
export function rng(seed:number){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}}

export function buildPlan(T:number,level:Level,seed=0):Plan{
  if(!Number.isInteger(T)||T<600) throw new Error('Durée minimale : 10 minutes');
  const p=LEVELS[level],K=p.A+p.R;
  const W=clamp(round30(0.15*T),180,300), C=clamp(round30(0.10*T),120,300);
  const M=T-W-C, n=Math.floor(M/K), L=M-n*K;
  if(n<1) throw new Error('Séance trop courte pour ce niveau');
  const r=rng(seed), tpl=Math.floor(r()*4), s=r()<0.5?1:-1;
  const v=Array.from({length:n},(_,i)=>s*(tpl===0?0:tpl===1?(i<n/3||i>=2*n/3?-1:1):tpl===2?(i<n/3?-1:i<2*n/3?0:1):(i%2?1:-1)));
  let sum=v.reduce((a,b)=>a+b,0);   // force Σδ = 0
  while(sum>0){v[v.lastIndexOf(1)]=0;sum--}
  while(sum<0){v[v.lastIndexOf(-1)]=0;sum++}
  const phases:Phase[]=[{kind:'warmup',dur:W}];
  for(const d of v){const a=p.A+STEP*d;phases.push({kind:'accel',dur:a},{kind:'recover',dur:K-a})}
  phases.push({kind:'cooldown',dur:C+L});
  const total=phases.reduce((a,x)=>a+x.dur,0);
  if(total!==T) throw new Error('Invariant violé : somme des phases ≠ durée');
  const distKm=phases.reduce((a,x)=>a+x.dur*(x.kind==='accel'?p.vA:p.vE),0)/3600;
  return{phases,total,distKm,n,seed,sig:phases.map(x=>x.kind[0]+x.dur).join('-')};
}
export function durationForDistance(km:number,level:Level):number{
  if(km<1) throw new Error('Distance minimale : 1 km');
  const p=LEVELS[level],f=p.A/(p.A+p.R),v=(1-f)*p.vE+f*p.vA;
  return Math.max(600,Math.ceil(km*3600/v/60)*60);
}
/** Teste seed, seed+1… jusqu'à une signature absente de `recent` (max 50 essais). */
export function pickPlan(T:number,level:Level,seed:number,recent:string[]):{plan:Plan;repeated:boolean}{
  let first:Plan|null=null;
  for(let k=0;k<50;k++){const p=buildPlan(T,level,seed+k);first??=p;if(!recent.includes(p.sig))return{plan:p,repeated:false}}
  return{plan:first!,repeated:true};
}
