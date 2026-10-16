// Exact finite Pareto frontier for the same bounded Qloo-grounded
// combinations. No network calls; these are ordinal rank proxies only.
const rankKey=plan=>plan.items.map(x=>x.id).join("|");
const round=x=>Math.round((x+Number.EPSILON)*1000)/1000;
const asPoint=plan=>({
 id:rankKey(plan),groupA:plan.groupA,groupB:plan.groupB,
 worst:plan.worst,mean:plan.mean,
 regretA:0,regretB:0,
 items:plan.items.map(x=>({
  id:x.id,slot:x.slot,label:x.label,evidence_id:x.evidence_id
 }))
});
const lex=plan=>plan.items.map(x=>x.label.normalize("NFKC").toLocaleLowerCase("en")).join("|")+"|"+rankKey(plan);
const dominates=(a,b)=>a.groupA>=b.groupA&&a.groupB>=b.groupB&&
 (a.groupA>b.groupA||a.groupB>b.groupB);

export function buildNegotiationAtlas({feasible,bridge,limit=9}){
 if(!Array.isArray(feasible)||feasible.length<1||!bridge)
  throw TypeError("Grounded feasible plans required");
 if(!Number.isInteger(limit)||limit<3||limit>15)
  throw RangeError("Invalid negotiation atlas budget");
 const byPreference=new Map();
 // Rank-proxy duplicates are equivalent points; pick stable smallest ID.
 for(const p of [...feasible].sort((a,b)=>rankKey(a).localeCompare(rankKey(b)))){
  const xy=p.groupA+"|"+p.groupB;
  if(!byPreference.has(xy))byPreference.set(xy,p);
 }
 const all=[...byPreference.values()];
 const pareto=all.filter(p=>!all.some(q=>dominates(q,p)))
  .sort((a,b)=>a.groupA-b.groupA||b.groupB-a.groupB||rankKey(a).localeCompare(rankKey(b)));
 const chosen=pareto.length<=limit?pareto:
  Array.from({length:limit},(_,i)=>pareto[Math.round(i*(pareto.length-1)/(limit-1))]);
 const ids=new Set(chosen.map(rankKey));
 // Always preserve the actual negotiated maximin outcome, even when multiple
 // plans share the exact same rounded score pair.
 if(!ids.has(rankKey(bridge)))chosen.push(bridge);
 const selected=[...new Map(chosen.map(p=>[rankKey(p),p])).values()]
  .sort((a,b)=>a.groupA-b.groupA||b.groupB-a.groupB||rankKey(a).localeCompare(rankKey(b)));
 const maxA=Math.max(...feasible.map(x=>x.groupA));
 const maxB=Math.max(...feasible.map(x=>x.groupB));
 const point=p=>{
  const o=asPoint(p);
  return {...o,regretA:round(maxA-p.groupA),regretB:round(maxB-p.groupB),
   isMaximin:rankKey(p)===rankKey(bridge)};
 };
 const blind=[...feasible].sort((a,b)=>lex(a).localeCompare(lex(b)))[0];
 return {
  method:"exact-nondominated-ordinal-frontier",
  evaluated:feasible.length,
  nondominated:pareto.length,
  maximinId:rankKey(bridge),
  axes:{groupA:"Within-list ordinal rank proxy",groupB:"Within-list ordinal rank proxy"},
  points:selected.map(point),
  tasteBlind:point(blind),
  calls:0,
  disclosure:"Both plans use Qloo-discovered candidate entities. The taste-blind baseline ignores Qloo affinity rankings when selecting; in-sample optimizer gains are mathematical and are not evidence of out-of-sample human satisfaction."
 };
}
