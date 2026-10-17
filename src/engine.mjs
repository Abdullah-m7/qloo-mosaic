// MOSAIC: deterministic evidence-gated optimization of relative group preference proxies.
import {buildNegotiationAtlas} from "./negotiation-atlas.mjs";
// These values are NEVER Qloo absolute preference probabilities or attendance predictions.
export const SLOTS = Object.freeze(["music", "food", "experience"]);
const round = x => Math.round((x + Number.EPSILON) * 1000) / 1000;
const text = x => typeof x === "string" && x.trim().length > 0 && x.length <= 160;
const score = x => Number.isFinite(x) && x >= 0 && x <= 1;
const valid = x => x && text(x.id) && SLOTS.includes(x.slot) && text(x.label) &&
  text(x.source) && text(x.evidence_id) &&
  score(x.scoreA) && score(x.scoreB) && Number.isFinite(x.cost) &&
  x.cost >= 0 && x.cost <= 100000;

export function evaluatePlan(items) {
  if (!Array.isArray(items) || !items.length) return null;
  const A = items.reduce((s,x) => s+x.scoreA, 0) / items.length;
  const B = items.reduce((s,x) => s+x.scoreB, 0) / items.length;
  return {
    items,
    cost: round(items.reduce((s,x) => s+x.cost, 0)),
    groupA: round(A), groupB: round(B),
    worst: round(Math.min(A,B)), mean: round((A+B)/2),
    gap: round(Math.abs(A-B))
  };
}

const key = p => p.items.map(x => x.id).join("|");
const byFairness = (a,b) => b.worst-a.worst || b.mean-a.mean ||
  a.gap-b.gap || a.cost-b.cost || key(a).localeCompare(key(b));
const byMajority = (a,b) => b.groupA-a.groupA || b.mean-a.mean ||
  a.cost-b.cost || key(a).localeCompare(key(b));
const byAverage = (a,b) => b.mean-a.mean || b.worst-a.worst ||
  a.cost-b.cost || key(a).localeCompare(key(b));

export function buildBridge({candidates, maxBudget=210, exclude=[], required=[]}) {
  if (!Array.isArray(candidates)) throw new TypeError("Candidate array required");
  if (!Number.isFinite(maxBudget) || maxBudget < 0 || maxBudget > 100000)
    throw new RangeError("Invalid budget");
  if (!Array.isArray(exclude) || exclude.some(x => !text(x)) || exclude.length > 50)
    throw new TypeError("Invalid exclusions");
  if (!Array.isArray(required) || required.length > 3 ||
    required.some(x => !text(x)) || new Set(required).size !== required.length)
    throw new TypeError("Invalid protected choices");

  const blocked = new Set(exclude);
  if(required.some(id => blocked.has(id)))return {
    status:"no_feasible_plan",
    reason:"A public option is both protected and rejected; the representatives must resolve this conflict."
  };
  const available = candidates.filter(x => valid(x) && !blocked.has(x.id));
  const seen = new Set();
  // Duplicate identity would make veto/evidence ambiguous. Refuse rather than
  // accidentally allowing one identity twice in separate plan slots.
  if (available.some(x => seen.has(x.id) || (seen.add(x.id),false)))
    return {status:"needs_input",reason:"Ambiguous duplicate candidate IDs.", rejected:candidates.length-available.length};
  if (new Set(available.map(x=>x.source)).size > 1)
    return {status:"needs_input",reason:"Mixed evidence sources must be reconciled before planning.", rejected:candidates.length-available.length};

  // Each role may protect a culturally grounded item; it must be retained
  // in all resulting plans. Two distinct protected options in the same
  // category are incompatible without making either up or discarding one.
  const requiredBySlot=new Map();
  for(const id of required){
    const item=available.find(x=>x.id===id);
    if(!item)return {status:"needs_input",
      reason:"Protected choice is unavailable in the current Qloo candidate evidence."};
    if(requiredBySlot.has(item.slot)&&requiredBySlot.get(item.slot)!==id)
      return {status:"no_feasible_plan",
        reason:"Two protected alternatives occupy the same category; both cannot be included."};
    requiredBySlot.set(item.slot,id);
  }
  const buckets = SLOTS.map(slot => available.filter(x=>x.slot===slot&&
    (!requiredBySlot.has(slot)||x.id===requiredBySlot.get(slot))));
  if (buckets.some(a=>a.length===0))
    return {status:"needs_input",reason:"Not enough evidence-backed options in every category.", rejected:candidates.length-available.length};

  const feasible = [];
  for (const music of buckets[0]) for (const food of buckets[1]) for (const experience of buckets[2]) {
    const plan = evaluatePlan([music,food,experience]);
    if (plan.cost <= maxBudget) feasible.push(plan);
  }
  if (!feasible.length)
    return {status:"no_feasible_plan",reason:"No evidence-backed combination fits the budget.", rejected:candidates.length-available.length};

  const ranked = [...feasible].sort(byFairness);
  const bridge = ranked[0];
  const majority = [...feasible].sort(byMajority)[0];
  const utilitarian = [...feasible].sort(byAverage)[0];
  const synthetic=available.every(x=>x.source==="synthetic-fixture");
  // A protected choice narrows the feasible set. Recompute the original
  // unconstrained solution on the SAME Qloo evidence, not a new API query.
  // The difference is a decision sensitivity certificate, never measured
  // preference satisfaction or a causal effect.
  const unrestricted=required.length?
    buildBridge({candidates,maxBudget,exclude,required:[]}):null;
  const protectionImpact=unrestricted?.status==="ok"?{
    method:"same-evidence-protected-choice-regret",
    protected_count:required.length,provider_calls:0,
    unconstrained_worst:unrestricted.bridge.worst,
    protected_worst:bridge.worst,
    worst_proxy_loss:round(Math.max(0,unrestricted.bridge.worst-bridge.worst)),
    groupA_proxy_change:round(bridge.groupA-unrestricted.bridge.groupA),
    groupB_proxy_change:round(bridge.groupB-unrestricted.bridge.groupB),
    limitation:"Within-list ordinal rank sensitivity, not measured audience approval or satisfaction."
  }:null;
  const negotiation=buildNegotiationAtlas({feasible,bridge});
  // Counterfactual single-option vetoes on the SAME grounded candidate set.
  // Since 'ranked' already maximizes the exact objective, the first feasible
  // non-containing plan is the strongest defensible replacement for each item.
  // No additional taste calls, unmeasured venue claims or imputed preferences.
  const impacts=bridge.items.map(removed=>{
    const alternative=ranked.find(plan=>!plan.items.some(x=>x.id===removed.id));
    return {
      removed:{id:removed.id,slot:removed.slot,label:removed.label},
      status:alternative?"feasible":"unavailable",
      worst_after:alternative?.worst??null,
      worst_rank_loss:alternative?round(Math.max(0,bridge.worst-alternative.worst)):null,
      changes:alternative?alternative.items.filter((item,index)=>
        item.id!==bridge.items[index].id).map(item=>({
          id:item.id,slot:item.slot,label:item.label,evidence_id:item.evidence_id
        })):[]
    };
  });
  const resilience={
    method:"single-option-veto",
    provider_calls:0,
    evaluated_exclusions:impacts.length,
    impacts,
    limitation:"Counterfactual plan substitution using the same ordinal rank proxies, not measured real-world resilience or availability."
  };

  return {
    status:"ok",
    source_mode: synthetic?"synthetic":"evidence-backed",
    bridge,
    protectionImpact,
    negotiation,
    resilience,
    baseline:majority, // retained for backward compatibility of the demo
    baselines:{majority, average:utilitarian},
    improvement:round(bridge.worst-majority.worst),
    improvementVsAverage:round(bridge.worst-utilitarian.worst),
    tradeoff:{majorityAChange:round(bridge.groupA-majority.groupA),
      majorityBChange:round(bridge.groupB-majority.groupB),
      meanChange:round(bridge.mean-utilitarian.mean)},
    alternatives:ranked.slice(1,4),
    evaluated:feasible.length,
    rejected:candidates.length-available.length,
    explanation:{
      policy:"First maximize the lower group rank proxy, then break ties by group mean.",
      limitation:"Each score is an ordinal group-level proxy, not a prediction of individual choices, absolute Qloo affinity, real costs, or actual fairness.",
      evidence:bridge.items.map(x=>({
        option_id:x.id,source:x.source,evidence_id:x.evidence_id,
        groupA_rank_proxy:x.scoreA,groupB_rank_proxy:x.scoreB
      }))
    }
  };
}
