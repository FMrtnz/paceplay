import{describe,it,expect}from'vitest';
import{buildPlan,pickPlan,durationForDistance,LEVELS,Level}from'./plan';
import{Tracker}from'../services/gps';import{computeXp}from'../game/rewards';
import{elapsedS,pause,resume}from'./session';
const lv=Object.keys(LEVELS)as Level[];
describe('plan',()=>{
  it('somme exacte des durées (tous niveaux, durées, graines)',()=>{for(const l of lv)for(let T=600;T<=3600;T+=60)for(let s=0;s<30;s++)
    expect(buildPlan(T,l,s).phases.reduce((a,x)=>a+x.dur,0)).toBe(T)});
  it('Σδ=0 : accélération totale constante',()=>{for(const l of lv)for(let s=0;s<100;s++){const p=buildPlan(1800,l,s);
    expect(p.phases.filter(x=>x.kind==='accel').reduce((a,x)=>a+x.dur,0)).toBe(p.n*LEVELS[l].A)}});
  it('exemple 20 min débutant',()=>{const p=buildPlan(1200,'debutant',0);expect(p.phases[0].dur).toBe(180);expect(p.n).toBe(7);
    expect(p.phases.at(-1)!.dur).toBe(180)});
  it('exemple 3 km intermédiaire → 1140 s',()=>{expect(durationForDistance(3,'intermediaire')).toBe(1140);
    expect(buildPlan(1140,'intermediaire').distKm).toBeCloseTo(3.03,2)});
  it('déterministe et refus <10 min',()=>{expect(buildPlan(1200,'avance',5)).toEqual(buildPlan(1200,'avance',5));expect(()=>buildPlan(540,'debutant')).toThrow()});
  it('anti-répétition',()=>{const a=buildPlan(1800,'avance',1);const r=pickPlan(1800,'avance',1,[a.sig]);expect(r.plan.sig).not.toBe(a.sig)});
});
describe('gps',()=>{
  const f=(lat:number,t:number,acc=5)=>({lat,lon:2,acc,t});
  it('rejette précision faible, sauts et positions répétées',()=>{const t=new Tracker();t.add(f(48,0));
    expect(t.add(f(48.0001,1000,50))).toBe(0);expect(t.add(f(48.01,2000))).toBe(0);expect(t.add(f(48,3000))).toBe(0);expect(t.dist).toBe(0)});
  it('cumule une vraie progression',()=>{const t=new Tracker();t.add(f(48,0));t.add(f(48.00003,10000));expect(t.dist).toBeGreaterThan(3)});
});
describe('chrono & récompenses',()=>{
  it('pause/reprise',()=>{let c={startedAt:0,pausedMs:0,pausedAt:null as number|null};c=pause(c,10000);expect(elapsedS(c,50000)).toBe(10);
    c=resume(c,50000);expect(elapsedS(c,60000)).toBe(20)});
  it('XP jamais négatif, interruption récompensée',()=>{expect(computeXp({completed:false,P:0,defis:0,allRecover:false,week3:false})).toBe(0);
    expect(computeXp({completed:false,P:.5,defis:2,allRecover:false,week3:false})).toBe(45)});
});
