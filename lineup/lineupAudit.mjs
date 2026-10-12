// MOSAIC Lineup Red-Team: audit and repair an EXISTING cultural program.
// A proof-carrying, one-change policy. Real Qloo adapter and API validation pending.
// All rank proxies derive from ONE FIXED CANDIDATE UNIVERSE per audience.
const R=x=>Math.round((x+Number.EPSILON)*100000)/100000;
const validId=x=>typeof x==="string"&&/^[a-zA-Z0-9_:.\-]{1,128}$/.test(x);
const validName=x=>typeof x==="string"&&x.trim().length>0&&x.length<=160;
const check=(v,msg)=>{if(!v)throw new Error(msg);};
const median=xs=>([...xs].sort((a,b)=>a-b)[Math.floor(xs.length/2)]);
const allUnique=xs=>new Set(xs).size===xs.length;

function scoreSelected(selected,rankings,slotCount){
  const groupScores=rankings.map(audience=>{
    // Intentional: cancelled slots in the baseline count as zero coverage,
    // rather than silently changing the denominator.
    const sum=selected.reduce((s,id)=>s+audience.scores.get(id),0);
    return {id:audience.id,label:audience.label,proxy:R(sum/slotCount)};
  });
  const values=groupScores.map(x=>x.proxy);
  return {groups:groupScores,worst:R(Math.min(...values)),
    mean:R(values.reduce((s,x)=>s+x,0)/values.length),
    gap:R(Math.max(...values)-Math.min(...values))};
}

const cmp=(a,b)=>b.result.worst-a.result.worst||
 b.result.mean-a.result.mean||a.changeCount-b.changeCount||
 a.lossFromOriginal-b.lossFromOriginal||
 a.removedId.localeCompare(b.removedId)||a.replacementId.localeCompare(b.replacementId);

/**
 * @param {object} input
 * lineup: existing public artist entity records, 2..8, each {id,label}.
 * candidatePool: 1..8 verified public artist entity records,
 *  {id,label,organizerConfirmedAvailable:true}.
 * audienceRankings: 2..5 audiences, each {id,label,orderedIds} as a COMPLETE
 *  exact permutation of the same fixed lineup+candidate Qloo ID set.
 * cancelledId: optional lineup id; when present, exactly one replacement is mandatory.
 * protectedIds: existing lineup identities that may not be changed.
 * maxLossFromOriginal: maximum allowable decline in any audience rank proxy vs
 *  historical pre-cancellation program (0..1, explicitly a policy not Qloo).
 */
export function auditLineup(input){
 check(input&&typeof input==="object","Input required");
 const {lineup,candidatePool,audienceRankings,cancelledId=null,
   protectedIds=[],maxLossFromOriginal=0.40,minImprovement=0.001}=input;
 check(Array.isArray(lineup)&&lineup.length>=2&&lineup.length<=8,"Lineup must include 2–8 artists");
 check(Array.isArray(candidatePool)&&candidatePool.length>=1&&candidatePool.length<=8,"Candidate pool required");
 check(Array.isArray(audienceRankings)&&audienceRankings.length>=2&&audienceRankings.length<=5,"Require 2–5 audience profiles");
 check(Array.isArray(protectedIds)&&protectedIds.every(validId),"Invalid protected IDs");
 check(Number.isFinite(maxLossFromOriginal)&&maxLossFromOriginal>=0&&maxLossFromOriginal<=1,"Invalid allowable proxy decline");
 check(Number.isFinite(minImprovement)&&minImprovement>=0&&minImprovement<=1,"Invalid minimum change threshold");

 const all=[...lineup,...candidatePool],ids=all.map(x=>x.id),lineupIds=lineup.map(x=>x.id);
 check(ids.length<=10,"Qloo rank tool supports at most 10 options in one comparable list");
 check(all.every(x=>validId(x.id)&&validName(x.label))&&allUnique(ids),
   "Every candidate needs a unique, verified Qloo entity ID and label");
 check(protectedIds.every(id=>lineupIds.includes(id))&&allUnique(protectedIds),
   "Protected IDs must be unique and already in the lineup");
 check(cancelledId===null||(lineupIds.includes(cancelledId)&&!protectedIds.includes(cancelledId)),
   "Cancelled artist must be a non-protected lineup entity");

 const audienceNames=audienceRankings.map(x=>x.id);
 check(allUnique(audienceNames),"Audience IDs must be unique");
 const stableSet=new Set(ids),n=ids.length;
 const rankings=audienceRankings.map(x=>{
   check(validId(x.id)&&validName(x.label),"Invalid audience ID or label");
   check(Array.isArray(x.orderedIds)&&x.orderedIds.length===n&&
     x.orderedIds.every(validId)&&allUnique(x.orderedIds)&&
     x.orderedIds.every(id=>stableSet.has(id)),
     "Identity mismatch or incomplete Qloo rank result: abstain");
   const scores=new Map(x.orderedIds.map((id,i)=>[id,n===1?0.5:R((n-1-i)/(n-1))]));
   return {id:x.id,label:x.label,scores};
 });
 const orig=scoreSelected(lineupIds,rankings,lineupIds.length);
 const remaining=cancelledId?lineupIds.filter(id=>id!==cancelledId):lineupIds;
 const baseline=scoreSelected(remaining,rankings,lineupIds.length);
 const available=candidatePool.filter(x=>x.organizerConfirmedAvailable===true);
 if(!available.length)
   return {status:"needs_input",reason:"No organizer-confirmed available replacements.",
     baseline,original:orig,source:"rank-order-proxy",dataQuality:"fixed-Qloo-ID-universe"};

 const protect=new Set(protectedIds);
 const removedOptions=cancelledId?[cancelledId]:lineupIds.filter(id=>!protect.has(id));
 const feasible=[];
 for(const removedId of removedOptions){
  for(const replacement of available){
   const proposal=remaining.filter(id=>id!==removedId).concat(replacement.id);
   check(proposal.length===lineupIds.length,"Unexpected lineup length");
   const result=scoreSelected(proposal,rankings,lineupIds.length);
   const changes=orig.groups.map(old=>({
     groupId:old.id,old:old.proxy,
     next:result.groups.find(x=>x.id===old.id).proxy
   }));
   const maxLoss=Math.max(0,...changes.map(x=>x.old-x.next));
   if(maxLoss>maxLossFromOriginal+1e-6)continue;
   feasible.push({removedId,replacementId:replacement.id,
     replacementLabel:replacement.label,
     proposedIds:proposal,result,changeCount:1,lossFromOriginal:R(maxLoss)});
  }
 }
 feasible.sort(cmp);
 if(!feasible.length)
   return {status:"no_safe_repair",reason:"No one-change repair meets availability and audience loss constraints.",
     baseline,original:orig,compared:0,source:"rank-order-proxy"};
 const best=feasible[0],gain=R(best.result.worst-baseline.worst);
 if(cancelledId===null&&gain<minImprovement)
   return {status:"keep",reason:"No meaningful one-change improvement under the declared constraints.",
     baseline,original:orig,compared:feasible.length,source:"rank-order-proxy"};
 return {
  status:"repair",inputMode:cancelledId?"cancellation":"adversarial-audit",
  original:orig,baseline,
  proposed:best.result,
  changes:[{removeId:best.removedId,addId:best.replacementId,
    addLabel:best.replacementLabel,organizerConfirmedAvailable:true}],
  worstProxyGain:R(best.result.worst-baseline.worst),
  proposedLineupIds:best.proposedIds,
  evaluated:feasible.length,
  remainingAlternatives:feasible.slice(1,4).map(x=>({
   removeId:x.removedId,addId:x.replacementId,
   worst:x.result.worst,mean:x.result.mean})),
  proof:{status:"strict-identity",
   candidateUniverse:ids,rankingUniverseSize:n,
   groupRankings:audienceRankings.map(x=>({id:x.id,orderedIds:[...x.orderedIds]})),
   consistency:"Each group ranks exactly the same fixed candidate identities",
   limitations:"Ordinal within-universe rank proxies only, not attendance, actual affinity, booking availability or consumer satisfaction. Organizer availability is self-declared."}
 };
}
