// Synthetic results and live Qloo results use the same pure maximin planner.
// No user taste inference or Qloo API responses are generated here.
export const SLOTS=["music","food","experience"];
const round=n=>Math.round(n*1000)/1000;
const valid=c=>c && typeof c.id==="string" && SLOTS.includes(c.slot) &&
  typeof c.label==="string" && typeof c.source==="string" &&
  typeof c.evidence_id==="string" && c.evidence_id.length>0 &&
  Number.isFinite(c.scoreA) && c.scoreA>=0 && c.scoreA<=1 &&
  Number.isFinite(c.scoreB) && c.scoreB>=0 && c.scoreB<=1 &&
  Number.isFinite(c.cost) && c.cost>=0;
export function evaluatePlan(items) {
  const n=items.length;if(!n)return null;
  const a=items.reduce((s,x)=>s+x.scoreA,0)/n;
  const b=items.reduce((s,x)=>s+x.scoreB,0)/n;
  const worst=Math.min(a,b);
  return {items,cost:round(items.reduce((s,x)=>s+x.cost,0)),
    groupA:round(a),groupB:round(b),worst:round(worst),gap:round(Math.abs(a-b)),
    mean:round((a+b)/2)};
}
const cmp=(a,b)=>b.worst-a.worst||b.mean-a.mean||a.gap-b.gap||a.cost-b.cost||
  a.items.map(x=>x.id).join("|").localeCompare(b.items.map(x=>x.id).join("|"));
export function buildBridge({candidates,maxBudget=210,exclude=[]}) {
  if(!Array.isArray(candidates))throw Error("Candidate array required");
  if(!Number.isFinite(maxBudget)||maxBudget<0||maxBudget>100000)throw Error("Invalid budget");
  const blocked=new Set(exclude);
  const available=candidates.filter(x=>valid(x)&&!blocked.has(x.id));
  const groups=SLOTS.map(slot=>available.filter(x=>x.slot===slot));
  if(groups.some(a=>!a.length))return {status:"needs_input",reason:"Not enough evidence-backed options in every category.",rejected:candidates.length-available.length};
  const feasible=[];
  for(const x of groups[0])for(const y of groups[1])for(const z of groups[2]){
    const plan=evaluatePlan([x,y,z]);if(plan.cost<=maxBudget)feasible.push(plan);
  }
  if(!feasible.length)return {status:"no_feasible_plan",reason:"No evidence-backed combination fits the budget.",rejected:candidates.length-available.length};
  feasible.sort(cmp);
  let remaining=maxBudget;
  const majority=[];
  for(let i=0;i<groups.length;i++){
    const laterMin=groups.slice(i+1).reduce((s,g)=>s+Math.min(...g.map(x=>x.cost)),0);
    const choice=[...groups[i]].sort((a,b)=>b.scoreA-a.scoreA||a.cost-b.cost).find(x=>x.cost+laterMin<=remaining);
    if(!choice)break;
    majority.push(choice);remaining-=choice.cost;
  }
  const bridge=feasible[0],baseline=majority.length===SLOTS.length?evaluatePlan(majority):feasible[feasible.length-1];
  return {status:"ok",source_mode:available.every(x=>x.source==="synthetic-fixture")?"synthetic":"evidence-backed",
    bridge,baseline,improvement:round(bridge.worst-baseline.worst),
    alternatives:feasible.slice(1,4),evaluated:feasible.length,rejected:candidates.length-available.length,
    explanation:{policy:"Maximize the lower of the two group-affinity averages; break ties by total mean.",
      limitation:"Aggregate affinity is not a prediction of an individual's taste or attendance.",
      evidence:bridge.items.map(x=>({option_id:x.id,source:x.source,evidence_id:x.evidence_id}))}};
}
