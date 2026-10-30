import{useEffect,useRef,useState}from'react';
import{LEVELS,Level,Plan,Kind,pickPlan,durationForDistance}from'./core/plan';
import{Clock,elapsedS,locate,pause,resume}from'./core/session';
import{Tracker,watch,Fix}from'./services/gps';
import{simulate}from'./services/simulator';
import{load,save,Store,Result,Cfg,saveActive,loadActive,clearActive}from'./services/storage';
import{computeXp,earnedBadges,BADGES}from'./game/rewards';
import{stepsStatus}from'./services/steps';
import{beep,vibrate,unlockAudio,soundOn,setSound}from'./services/feedback';

const LBL:Record<Kind,string>={warmup:'Échauffement',accel:'Accélère',recover:'Récupère',cooldown:'Retour au calme'};
const TIP:Record<Kind,string>={warmup:'Marche ou petit trot',accel:'Effort contrôlé, à ton rythme',recover:'Ralentis ou marche',cooldown:'Allure douce'};
const mmss=(s:number)=>{s=Math.max(0,Math.ceil(s));return`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`};
interface Out{completed:boolean;elapsed:number;distM:number;defis:number;P:number;source:string}

function Snitch({P}:{P:number}){const x=40+(1-P)*120;return(
<svg viewBox="0 0 200 70" width="100%"><circle cx="20" cy="45" r="8" fill="#7fd1ff"/><g transform={`translate(${x} ${30+6*Math.sin(P*40)})`}>
<ellipse className="wing" cx="-14" cy="-4" rx="12" ry="5" fill="#fff8"/><ellipse className="wing" cx="14" cy="-4" rx="12" ry="5" fill="#fff8"/>
<circle r="9" fill="#f5c542"/></g></svg>)}

function Run({plan,cfg,onEnd}:{plan:Plan;cfg:Cfg;onEnd:(o:Out)=>void}){
  const a=useRef(loadActive()).current;
  const ck=useRef<Clock>(a?.clock??{startedAt:Date.now(),pausedMs:0,pausedAt:null});
  const tr=useRef(new Tracker(a?.dist??0));
  const lastFix=useRef(Date.now());const done=useRef(false);
  const[,re]=useState(0);const[msg,setMsg]=useState('');
  const target=cfg.mode==='dist'?cfg.val*1000:0;
  const now=Date.now(),e=elapsedS(ck.current,now),loc=locate(plan,e),ph=plan.phases[loc.i];
  const dist=tr.current.dist,P=Math.min(1,Math.max(e/plan.total,target?dist/target:0));
  const end=(completed:boolean)=>{if(done.current)return;done.current=true;clearActive();if(completed){beep('capture');vibrate([200,100,200,100,400])}
    let acc=0,d=0;for(const p of plan.phases){acc+=p.dur;if(p.kind==='accel'&&acc<=e)d++}
    onEnd({completed,elapsed:Math.round(e),distM:Math.round(dist),defis:d,P,source:cfg.sim?'simulation':'GPS'})};
  useEffect(()=>{const id=setInterval(()=>{re(x=>x+1);saveActive({plan,cfg,clock:ck.current,dist:tr.current.dist});
    const t=elapsedS(ck.current,Date.now());
    if(target?tr.current.dist>=target:t>=plan.total)end(true)},250);return()=>clearInterval(id)});
  useEffect(()=>{const f=(x:Fix)=>{if(ck.current.pausedAt)return;lastFix.current=Date.now();tr.current.add(x)};
    return cfg.sim?simulate(f):watch(f,setMsg)},[]);
  useEffect(()=>{let l:any;try{(navigator as any).wakeLock?.request('screen').then((x:any)=>l=x).catch(()=>{})}catch{}return()=>{try{l?.release()}catch{}}},[]);
  useEffect(()=>{if(ph)beep(ph.kind==='accel'?'up':ph.kind==='recover'?'down':'down');try{if(ph)speechSynthesis.speak(Object.assign(new SpeechSynthesisUtterance(`${LBL[ph.kind]}. ${TIP[ph.kind]}`),{lang:'fr-FR'}))}catch{}},[loc.i]);
  const paused=!!ck.current.pausedAt,lost=!paused&&now-lastFix.current>15000&&!msg;
  return(<div className="w">
    <div className="card"><Snitch P={P}/><div className="bar"><i style={{width:`${P*100}%`}}/></div></div>
    <div className={ph?.kind} style={{textAlign:'center',fontSize:'1.6em',fontWeight:700}}>{ph?LBL[ph.kind]:'Rythme libre'}</div>
    <div className="muted" style={{textAlign:'center'}}>{ph?TIP[ph.kind]:target?`Plus que ${Math.max(0,Math.round(target-dist))} m`:''}</div>
    <div className="big-n">{ph?mmss(loc.left):'∞'}</div>
    <div className="card">Temps {mmss(e)} / {mmss(plan.total)}<br/>Distance : {(dist/1000).toFixed(2)} km {target?`/ ${cfg.val} km`:''} <span className="muted">({cfg.sim?'simulation':'GPS'} · fiabilité {tr.current.quality()})</span>
      {(msg||lost)&&<div style={{color:'#ffb86b'}}>{msg||'Signal GPS perdu : la distance est suspendue, le chrono continue.'}</div>}</div>
    <button className="big" onClick={()=>{unlockAudio();ck.current=paused?resume(ck.current,Date.now()):pause(ck.current,Date.now());re(x=>x+1)}}>{paused?'Reprendre':'Pause'}</button>
    <button onClick={()=>end(false)} style={{width:'100%'}}>Terminer ici (sans pénalité)</button>
    <p className="muted">Gardez l'écran allumé : Safari peut suspendre le GPS en arrière-plan.</p></div>)}

export default function App(){
  const[store,setStore]=useState<Store>(load);
  const[cfg,setCfg]=useState<Cfg>({mode:'time',val:20,level:store.level,sim:false});
  const[scr,setScr]=useState<'home'|'conf'|'prev'|'run'|'res'|'prog'>('home');
  const[snd,setSnd]=useState(soundOn());const[plan,setPlan]=useState<Plan|null>(null);const[rep,setRep]=useState(false);
  const[last,setLast]=useState<{r:Result;nb:string[]}|null>(null);
  useEffect(()=>{const a=loadActive();if(a){setCfg(a.cfg);setPlan(a.plan);setScr('run')}},[]);
  const recent=store.history.slice(-20).map(h=>h.sig);
  const gen=(seed:number)=>{const T=cfg.mode==='time'?cfg.val*60:durationForDistance(cfg.val,cfg.level);
    try{const r=pickPlan(T,cfg.level,seed,recent);setPlan(r.plan);setRep(r.repeated);setScr('prev')}catch(e:any){alert(e.message)}};
  const finish=(o:Out)=>{const t=Date.now(),week=store.history.filter(h=>h.completed&&t-h.date<6048e5).length+(o.completed?1:0);
    const w3=o.completed&&week===3,xp=computeXp({...o,allRecover:o.completed,week3:w3});
    const r:Result={date:t,mode:cfg.mode,level:cfg.level,completed:o.completed,elapsed:o.elapsed,distM:o.distM,source:o.source,defis:o.defis,xp,sig:plan!.sig,P:o.P};
    const history=[...store.history,r],all=earnedBadges(history,w3||store.badges.includes('w3'));
    const s:Store={...store,xp:store.xp+xp,history,badges:all,seed:plan!.seed+1,level:cfg.level};
    save(s);setStore(s);setLast({r,nb:all.filter(b=>!store.badges.includes(b))});setScr('res')};
  const Seg=<T extends string|number>({v,set,opts,f}:{v:T;set:(x:T)=>void;opts:T[];f:(x:T)=>string})=><div>{opts.map(o=><button key={String(o)} className={o===v?'on':''} onClick={()=>set(o)}>{f(o)}</button>)}</div>;
  if(scr==='run'&&plan)return<Run plan={plan} cfg={cfg} onEnd={finish}/>;
  return(<div className="w"><h1>PACEPLAY</h1>
  {scr==='home'&&<><p>Capture le Snitch doré en alternant accélérations et récupérations. Marcher, ralentir ou s'arrêter ne coûte jamais de points.</p>
    <div className="card">XP : <b>{store.xp}</b> · Séances : {store.history.length} · Badges : {store.badges.length}</div>
    <button className="big" onClick={()=>setScr('conf')}>Démarrer une mission</button><button onClick={()=>setScr('prog')}>Progression</button></>}
  {scr==='conf'&&<><h3>Objectif</h3>
    <Seg v={cfg.mode} set={m=>setCfg({...cfg,mode:m,val:m==='time'?20:3})} opts={['time','dist']} f={x=>x==='time'?'Durée':'Distance'}/>
    <Seg v={cfg.val} set={v=>setCfg({...cfg,val:v})} opts={cfg.mode==='time'?[15,20,30,45]:[2,3,5,10]} f={x=>cfg.mode==='time'?`${x} min`:`${x} km`}/>
    <h3>Niveau</h3><Seg v={cfg.level} set={l=>setCfg({...cfg,level:l})} opts={Object.keys(LEVELS) as Level[]} f={l=>LEVELS[l].label}/>
    <div className="card muted">GPS : demandé uniquement pendant la séance (distance mesurée, fiabilité affichée).<br/>Pas : indisponible — {stepsStatus.reason}<br/>Repli : mode durée.</div>
    <label><input type="checkbox" checked={cfg.sim} onChange={e=>setCfg({...cfg,sim:e.target.checked})}/> Simulation GPS (test sans sortie)</label><br/><label><input type="checkbox" checked={snd} onChange={e=>{setSnd(e.target.checked);setSound(e.target.checked)}}/> Sons et vibreur (vibreur indisponible sur iPhone)</label><br/><br/>
    <button className="big" onClick={()=>gen(store.seed)}>Calculer la séance</button><button onClick={()=>setScr('home')}>Retour</button></>}
  {scr==='prev'&&plan&&<><div className="card">Durée {mmss(plan.total)} · {plan.n} accélérations · ≈ {plan.distKm.toFixed(2)} km (estimation)
    {cfg.mode==='dist'&&<><br/>Objectif : {cfg.val} km mesurés par GPS</>}{rep&&<div className="muted">Toutes les variantes récentes ont été jouées : séance déjà vue.</div>}</div>
    <div className="card" style={{maxHeight:'40vh',overflow:'auto'}}>{plan.phases.map((p,i)=><div key={i} className={p.kind}>{LBL[p.kind]} — {mmss(p.dur)}</div>)}</div>
    <button className="big" onClick={()=>{unlockAudio();clearActive();setScr('run')}}>Partir</button><button onClick={()=>gen(plan.seed+1)}>Autre séance</button><button onClick={()=>setScr('conf')}>Retour</button></>}
  {scr==='res'&&last&&<><h2>{last.r.completed?'Snitch capturé !':'Mission interrompue'}</h2>
    <div className="card">Durée {mmss(last.r.elapsed)}<br/>Distance {(last.r.distM/1000).toFixed(2)} km ({last.r.source})<br/>Défis réussis : {last.r.defis}<br/><b>+{last.r.xp} XP</b></div>
    {last.nb.map(b=><div key={b} className="card">🏅 Badge : {BADGES[b]}</div>)}<button className="big" onClick={()=>setScr('home')}>Accueil</button></>}
  {scr==='prog'&&<><div className="card">XP total : <b>{store.xp}</b></div><h3>Badges</h3>
    {Object.entries(BADGES).map(([k,v])=><div key={k} className="card" style={{opacity:store.badges.includes(k)?1:.4}}>🏅 {v}</div>)}
    <h3>Historique</h3>{[...store.history].reverse().slice(0,15).map((h,i)=><div key={i} className="card muted">{new Date(h.date).toLocaleDateString()} · {mmss(h.elapsed)} · {(h.distM/1000).toFixed(1)} km · +{h.xp} XP {h.completed?'✓':'(interrompue)'}</div>)}
    <button onClick={()=>setScr('home')}>Retour</button></>}
  </div>)}
