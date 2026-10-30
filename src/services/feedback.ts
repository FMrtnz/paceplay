/** Sons (Web Audio) et vibreur. Le vibreur n'existe pas sur Safari iOS : ignoré sans erreur.
 *  L'audio doit être déverrouillé par un geste de l'utilisateur (bouton Partir / Reprendre). */
let ctx:AudioContext|null=null;
export const soundOn=()=>{try{return localStorage.getItem('pp_sound')!=='off'}catch{return true}};
export const setSound=(on:boolean)=>{try{localStorage.setItem('pp_sound',on?'on':'off')}catch{}};
export function unlockAudio(){try{const A=(window as any).AudioContext||(window as any).webkitAudioContext;ctx??=new A();ctx!.resume()}catch{}}
function tone(f:number,at:number,d:number,vol=0.25){if(!ctx)return;const o=ctx.createOscillator(),g=ctx.createGain(),t=ctx.currentTime+at;
  o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+0.02);g.gain.exponentialRampToValueAtTime(0.0001,t+d);
  o.connect(g).connect(ctx.destination);o.start(t);o.stop(t+d+0.05)}
export function beep(k:'up'|'down'|'capture'){if(!soundOn())return;
  if(k==='up'){tone(660,0,0.12);tone(880,0.14,0.16)}
  else if(k==='down'){tone(660,0,0.12);tone(440,0.14,0.16)}
  else[523,659,784,1047].forEach((f,i)=>tone(f,i*0.14,0.3,0.3))}
export const vibrate=(p:number|number[])=>{try{if(soundOn())navigator.vibrate?.(p)}catch{}};
