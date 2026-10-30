import{describe,it,expect}from'vitest';
import{buildPlan,pickPlan,durationForDistance,LEVELS,Level}from'./plan';
import{Tracker}from'../services/gps';import{computeXp}from'../game/rewards';
import{elapsedS,pause,resume}from'./session';
const lv=Object.keys(LEVELS)as Level[];
describe('plan',()=>{
  it('phase durations sum exactly (all levels, durations, seeds)',()=>{for(const l of lv)for(let T=600;T<=3600;T+=60)for(let s=0;s<30;s++)
    expect(buildPlan(T,l,s).phases.reduce((a,x)=>a+x.dur,0)).toBe(T)});
  it('Σδ=0: total acceleration time is constant',()=>{for(const l of lv)for(let s=0;s<100;s++){const p=buildPlan(1800,l,s);
    expect(p.phases.filter(x=>x.kind==='accel').reduce((a,x)=>a+x.dur,0)).toBe(p.n*LEVELS[l].A)}});
  it('example: 20 min beginner',()=>{const p=buildPlan(1200,'beginner',0);expect(p.phases[0].dur).toBe(180);expect(p.n).toBe(7);
    expect(p.phases[p.phases.length - 1].dur).toBe(180)});
  it('example: 3 km intermediate → 1140 s',()=>{expect(durationForDistance(3,'intermediate')).toBe(1140);
    expect(buildPlan(1140,'intermediate').distKm).toBeCloseTo(3.03,2)});
  it('deterministic, rejects <10 min',()=>{expect(buildPlan(1200,'advanced',5)).toEqual(buildPlan(1200,'advanced',5));expect(()=>buildPlan(540,'beginner')).toThrow()});
  it('anti-repetition',()=>{const a=buildPlan(1800,'advanced',1);const r=pickPlan(1800,'advanced',1,[a.sig]);expect(r.plan.sig).not.toBe(a.sig)});
});
describe('gps',()=>{
  const f=(lat:number,t:number,acc=5)=>({lat,lon:2,acc,t});
  it('rejects poor accuracy, jumps and repeated positions',()=>{const t=new Tracker();t.add(f(48,0));
    expect(t.add(f(48.0001,1000,50))).toBe(0);expect(t.add(f(48.01,2000))).toBe(0);expect(t.add(f(48,3000))).toBe(0);expect(t.dist).toBe(0)});
  it('accumulates real progress',()=>{const t=new Tracker();t.add(f(48,0));t.add(f(48.00003,10000));expect(t.dist).toBeGreaterThan(3)});
});
describe('clock & rewards',()=>{
  it('pause/resume',()=>{let c={startedAt:0,pausedMs:0,pausedAt:null as number|null};c=pause(c,10000);expect(elapsedS(c,50000)).toBe(10);
    c=resume(c,50000);expect(elapsedS(c,60000)).toBe(20)});
  it('XP never negative, interrupted runs still rewarded',()=>{expect(computeXp({completed:false,P:0,challenges:0,allRecover:false,week3:false})).toBe(0);
    expect(computeXp({completed:false,P:.5,challenges:2,allRecover:false,week3:false})).toBe(45)});
});
