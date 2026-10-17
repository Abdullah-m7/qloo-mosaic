// ISOLATED EXPERIMENT: one Qloo-guided frontier expansion, never deployed.
// Scores of old and new options are re-evaluated against the SAME union pool.
// Improvements on that ranking objective are in-sample diagnostics, NOT user uplift.
import {buildBridge, SLOTS} from "./engine.mjs";
import {extractItems,matchRanks} from "./qloo.mjs";

const KINDS={music:"artist",food:"place",experience:"movie"};
const normalize=x=>String(x).trim().normalize("NFKC").toLowerCase();
const round=x=>Math.round((x+Number.EPSILON)*1000)/1000;
const valid=x=>x&&SLOTS.includes(x.slot)&&
 x.source==="qloo-rest:insights+rank"&&typeof x.qloo_entity_id==="string"&&
 typeof x.label==="string"&&x.label.length>0&&
 Number.isFinite(x.scoreA)&&Number.isFinite(x.scoreB);

function targetSlot(candidates,bridge,groupKey){
 return SLOTS.map((slot,i)=>{
  const chosen=bridge.items.find(x=>x.slot===slot);
  const max=Math.max(...candidates.filter(x=>x.slot===slot).map(x=>x[groupKey]));
  return {slot,index:i,regret:round(max-chosen[groupKey]),actual:chosen[groupKey]};
 }).sort((a,b)=>b.regret-a.regret||a.actual-b.actual||a.index-b.index)[0].slot;
}

export async function probeActiveFrontier({
 candidates,a,b,place="New York",maxBudget=210,call,evaluateHeldout
}={}){
 if(!Array.isArray(candidates)||!candidates.length||candidates.some(x=>!valid(x))||
  !Array.isArray(a)||!a.length||!Array.isArray(b)||!b.length||
  typeof place!=="string"||!place.trim()||typeof call!=="function")
  throw TypeError("Only complete, Qloo-grounded candidates and public anchors accepted");
 const original=buildBridge({candidates,maxBudget});
 if(original.status!=="ok")return {status:"blocked_original",reason:original.reason};
 const underrepresented=original.bridge.groupA<=original.bridge.groupB?"groupA":"groupB";
 const slot=targetSlot(candidates,original.bridge,underrepresented==="groupA"?"scoreA":"scoreB");
 const kind=KINDS[slot],bucket=candidates.filter(x=>x.slot===slot);
 if(bucket.length<2||bucket.length>8)throw Error("INVALID_EXPLORATION_POOL");
 const lowSignals=underrepresented==="groupA"?a:b;
 const reply=await call("qloo_recommend",{
  target_type:kind,signals:lowSignals,limit:5,
  ...(slot==="food"?{filter_location:place}:{})
 });
 const discovered=extractItems(reply).filter(x=>x.id);
 const ids=new Set(bucket.map(x=>x.qloo_entity_id.toLowerCase()));
 const names=new Set(bucket.map(x=>normalize(x.label)));
 const extras=[];
 for(const x of discovered){
  if(ids.has(x.id.toLowerCase())||names.has(normalize(x.name)))continue;
  ids.add(x.id.toLowerCase());names.add(normalize(x.name));
  extras.push({...bucket[0],id:slot+":"+x.id,slot,label:x.name,
   qloo_entity_id:x.id,evidence_id:"QL-"+x.id.replace(/[^A-Za-z0-9]/g,"").slice(0,12),
   scoreA:0,scoreB:0,cost:0,qloo_explanations:{groupA:[],groupB:[]}});
  if(extras.length>=Math.min(3,8-bucket.length))break;
 }
 if(!extras.length)return {status:"no_new_entities",slot,underrepresented,
  provider_calls:1,discovered:discovered.length};
 const union=[...bucket,...extras];
 const options=union.map(x=>x.label);
 const [rankA,rankB]=await Promise.all([
  call("qloo_rank",{options,option_type:kind,signals:a}),
  call("qloo_rank",{options,option_type:kind,signals:b})
 ]);
 const left=extractItems(rankA),right=extractItems(rankB);
 const setA=new Set(left.map(x=>normalize(x.name))),setB=new Set(right.map(x=>normalize(x.name)));
 const shared=options.filter(x=>setA.has(normalize(x))&&setB.has(normalize(x)));
 // A changed candidate set only offers a fair pairwise comparison when *all*
 // original options survive for both groups. No missing values are imputed.
 if(bucket.some(x=>!shared.some(y=>normalize(x.label)===normalize(y))))
  return {status:"blocked_missing_original_ranks",slot,underrepresented,
   provider_calls:3,proposed_new:extras.length};
 const ranked=matchRanks(shared,left.map(x=>x.name),right.map(x=>x.name));
 const scoreByName=new Map(ranked.map(x=>[normalize(x.name),x]));
 const reranked=union.filter(x=>scoreByName.has(normalize(x.label)))
  .map(x=>({...x,scoreA:scoreByName.get(normalize(x.label)).scoreA,
   scoreB:scoreByName.get(normalize(x.label)).scoreB}));
 const originalIds=new Set(bucket.map(x=>x.qloo_entity_id.toLowerCase()));
 const stableOther=candidates.filter(x=>x.slot!==slot);
 const rescaledBaseline=buildBridge({candidates:[...stableOther,
  ...reranked.filter(x=>originalIds.has(x.qloo_entity_id.toLowerCase()))],maxBudget});
 const expanded=buildBridge({candidates:[...stableOther,...reranked],maxBudget});
 if(rescaledBaseline.status!=="ok"||expanded.status!=="ok")
  return {status:"blocked_insufficient_evidence",slot,underrepresented,provider_calls:3};
 const newIds=new Set(extras.map(x=>x.id));
 const selectedNew=expanded.bridge.items.filter(x=>newIds.has(x.id));
 // The held-out anchors never influence discovery, slot choice, or either
 // optimized plan: they are consulted strictly after both plans are frozen.
 const heldout=typeof evaluateHeldout==="function"?
  await evaluateHeldout({
   candidatePool:[...stableOther,...reranked],
   baselinePlan:rescaledBaseline.bridge,
   expandedPlan:expanded.bridge,
   expandedSlot:slot
  }):null;
 return {
  status:"evaluated",slot,underrepresented,provider_calls:3,
  discovered_new:extras.length,mutually_ranked_new:reranked.filter(x=>newIds.has(x.id)).length,
  prior_ranked:bucket.length,
  source_scope:"same_union_reranked_both_audiences",
  initial_worst_proxy:original.bridge.worst,
  baseline_on_union_worst_proxy:rescaledBaseline.bridge.worst,
  expanded_on_union_worst_proxy:expanded.bridge.worst,
  difference_on_same_union:round(expanded.bridge.worst-rescaledBaseline.bridge.worst),
  selected_new_in_expanded_plan:selectedNew.length>0,
  ...(heldout?{heldout}:{}),
  nominated:expanded.bridge.items.map(x=>({
   slot:x.slot,id:x.id,label:x.label,evidence_id:x.evidence_id,
   from_expanded_discovery:newIds.has(x.id)
  })),
  disclaimer:"In-sample feasible-set expansion cannot prove held-out taste uplift. This is a bounded technical probe, not a released recommendation."
 };
}
