// Cultural thread choice is a bounded, no-network *alternative* to the
// maximin plan. Only identical provider tag IDs across different categories
// count as evidence. Never imply actual audience satisfaction or event availability.
import {evaluatePlan} from "./engine.mjs";
const slots=["music","food","experience"];
const rounded=x=>Math.round((x+Number.EPSILON)*1000)/1000;
const text=x=>typeof x==="string"&&x.trim().length>0&&x.length<=100&&
 !/[<>@\r\n]/.test(x);
const grounded=(x)=>x&&text(x.id)&&text(x.label)&&text(x.evidence_id)&&
 text(x.qloo_entity_id)&&x.source==="qloo-rest:insights+rank"&&
 Number.isFinite(x.scoreA)&&Number.isFinite(x.scoreB)&&
 x.scoreA>=0&&x.scoreA<=1&&x.scoreB>=0&&x.scoreB<=1&&
 Number.isFinite(x.cost)&&x.cost>=0;
// Reconstruct selected tag evidence for a veto re-plan from this request's
// cached Qloo discovery metadata. No new provider request is necessary.
export function cachedSelectedTagEvidence(items,tagIndex){
 if(!Array.isArray(items)||!(tagIndex instanceof Map))return [];
 return items.filter(x=>text(x?.id)&&text(x?.qloo_entity_id)).map(x=>{
  const tags=tagIndex.get(x.qloo_entity_id.toLowerCase());
  return {optionId:x.id,slot:x.slot,
   tags:(Array.isArray(tags)?tags:[]).filter(t=>
    typeof t?.id==="string"&&t.id.startsWith("urn:tag:")&&
    t.id.length<=180&&text(t.name)
   ).slice(0,150).map(t=>({id:t.id,name:t.name}))};
 });
}
function sharedTags(items,tagIndex){
 const byId=new Map();
 for(const item of items){
  const id=item.qloo_entity_id.toLowerCase();
  const tags=tagIndex.get(id);
  for(const x of Array.isArray(tags)?tags:[]){
   if(typeof x?.id!=="string"||!x.id.startsWith("urn:tag:")||
    x.id.length>180||!text(x.name))continue;
   const key=x.id.toLowerCase();
   if(!byId.has(key))byId.set(key,{id:x.id,name:x.name,slots:new Set(),items:new Set()});
   const rec=byId.get(key);
   rec.slots.add(item.slot);rec.items.add(item.id);
  }
 }
 return [...byId.values()].filter(x=>x.slots.size>=2)
  .sort((a,b)=>b.slots.size-a.slots.size||
   a.id.localeCompare(b.id))
  .map(x=>({id:x.id,name:x.name,slots:[...x.slots].sort(),
   option_ids:[...x.items].sort()}));
}
export function findVerifiedThreadChoice({
 candidates,tagIndex,bridge,exclude=[],maxBudget=210,maxLoss=.05
}={}){
 if(!Array.isArray(candidates)||!(tagIndex instanceof Map)||
  !bridge||!Number.isFinite(bridge.worst)||
  !Array.isArray(exclude)||!Number.isFinite(maxLoss)||maxLoss<0||maxLoss>.2)
  throw TypeError("Invalid grounded cultural thread inputs");
 const excluded=new Set(exclude);
 const bySlot=slots.map(slot=>candidates.filter(x=>
  x.slot===slot&&grounded(x)&&!excluded.has(x.id)));
 let examined=0,withinBound=0,withThread=0,best=null;
 const choose=(p,q)=>{
  if(!q)return true;
  // Prefer three-category intersections when available, then evidence
  // breadth, then the *least* group proxy loss and a deterministic ID tie.
  const a=p.motifs,b=q.motifs;
  const triples=a.filter(x=>x.slots.length===3).length;
  const old=b.filter(x=>x.slots.length===3).length;
  if(triples!==old)return triples>old;
  if(a.length!==b.length)return a.length>b.length;
  if(p.plan.worst!==q.plan.worst)return p.plan.worst>q.plan.worst;
  if(p.plan.mean!==q.plan.mean)return p.plan.mean>q.plan.mean;
  return p.ids<q.ids;
 };
 for(const a of bySlot[0])for(const b of bySlot[1])for(const c of bySlot[2]){
  if(new Set([a.id,b.id,c.id]).size!==3)continue;
  const plan=evaluatePlan([a,b,c]);
  if(plan.cost>maxBudget)continue;
  examined++;
  const loss=rounded(Math.max(0,bridge.worst-plan.worst));
  if(plan.worst>bridge.worst+1e-6||loss>maxLoss+1e-6)continue;
  withinBound++;
  const motifs=sharedTags([a,b,c],tagIndex);
  if(!motifs.length)continue;
  withThread++;
  const choice={plan,motifs,ids:[a.id,b.id,c.id].join("|")};
  if(choose(choice,best))best=choice;
 }
 const common={
  method:"bounded-exact-qloo-tag-intersection",
  provider_calls:0,
  max_rank_proxy_loss:maxLoss,
  evaluated:examined,within_fairness_bound:withinBound,
  with_verifiable_thread:withThread,
  disclaimer:"Exact public Qloo tag IDs shared across distinct categories; not predicted event availability, actual fairness, satisfaction or cultural causation."
 };
 if(!best)return {status:"no_verified_thread",...common};
 const p=best.plan;
 const selected={
  items:p.items.map(x=>({id:x.id,slot:x.slot,label:x.label,
    evidence_id:x.evidence_id})),
  groupA:p.groupA,groupB:p.groupB,worst:p.worst,mean:p.mean
 };
 return {status:"verified",...common,
  maximin_worst:bridge.worst,alternative:selected,
  worst_rank_proxy_loss:rounded(Math.max(0,bridge.worst-p.worst)),
  verified_motifs:best.motifs.slice(0,4),
  verified_motif_count:best.motifs.length};
}
