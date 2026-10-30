import type{Level,Plan}from'../core/plan';import type{Clock}from'../core/session';
export interface Result{date:number;mode:'time'|'dist';level:Level;completed:boolean;elapsed:number;distM:number;source:string;challenges:number;xp:number;sig:string;P:number}
export interface Store{xp:number;history:Result[];badges:string[];seed:number;level:Level}
export interface Cfg{mode:'time'|'dist';val:number;level:Level;sim:boolean}
export interface Active{plan:Plan;cfg:Cfg;clock:Clock;dist:number}
const K='pp_store',A='pp_active';
export const emptyStore=():Store=>({xp:0,history:[],badges:[],seed:1,level:'beginner'});
const LEGACY:Record<string,Level>={debutant:'beginner',intermediaire:'intermediate',avance:'advanced'};
/** Loads the store and migrates data saved by earlier versions (French identifiers). */
export function load():Store{try{
  const s:Store={...emptyStore(),...JSON.parse(localStorage.getItem(K)||'{}')};
  s.level=LEGACY[s.level as string]??s.level;
  s.history=s.history.map((r:any)=>({...r,level:LEGACY[r.level]??r.level,challenges:r.challenges??r.defis??0}));
  return s}catch{return emptyStore()}}
export function save(s:Store){try{localStorage.setItem(K,JSON.stringify(s))}catch{}}
export const saveActive=(a:Active)=>{try{localStorage.setItem(A,JSON.stringify(a))}catch{}};
export function loadActive():Active|null{try{return JSON.parse(localStorage.getItem(A)||'null')}catch{return null}}
export const clearActive=()=>{try{localStorage.removeItem(A)}catch{}};
