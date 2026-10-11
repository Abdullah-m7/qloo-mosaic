// MOSAIC: deterministic evidence-gated optimization of relative group preference proxies.
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

export function buildBridge({candidates, maxBudget=210, exclude=[]}) {
  if (!Array.isArray(candidates)) throw new TypeError("Candidate array required");
  if (!Number.isFinite(maxBudget) || maxBudget < 0 || maxBudget > 100000)
    throw new RangeError("Invalid budget");
  if (!Array.isArray(exclude) || exclude.some(x => !text(x)) || exclude.length > 50)
    throw new TypeError("Invalid exclusions");

  const blocked = new Set(exclude);
  const available = candidates.filter(x => valid(x) && !blocked.has(x.id));
  const seen = new Set();
  // Duplicate identity would make veto/evidence ambiguous. Refuse rather than
  // accidentally allowing one identity twice in separate plan slots.
  if (available.some(x => seen.has(x.id) || (seen.add(x.id),false)))
    return {status:"needs_input",reason:"Ambiguous duplicate candidate IDs.", rejected:candidates.length-available.length};
  if (new Set(available.map(x=>x.source)).size > 1)
    return {status:"needs_input",reason:"Mixed evidence sources must be reconciled before planning.", rejected:candidates.length-available.length};

  const buckets = SLOTS.map(slot => available.filter(x=>x.slot===slot));
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

  return {
    status:"ok",
    source_mode: synthetic?"synthetic":"evidence-backed",
    bridge,
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
