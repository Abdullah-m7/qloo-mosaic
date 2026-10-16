// An auditable, non-generative negotiation explanation. Outputs are ordinal
// proxy comparisons, never real-world satisfaction or causal impact claims.
const round=n=>Math.round(n*1000)/1000;
const normalized=s=>String(s??"").trim().toLowerCase();
const allowed=s=>typeof s==="string"&&s.length>0&&s.length<100;

export function deriveCulturalMotifs(tagged=[]){
  if(!Array.isArray(tagged))return [];
  const byKey=new Map();
  for(const entry of tagged){
    if(!entry || !Array.isArray(entry.tags) || !allowed(entry.optionId))continue;
    for(const tag of entry.tags){
      if(!tag || !allowed(tag.name) || !allowed(tag.id))continue;
      const key=normalized(tag.id);
      if(!byKey.has(key))byKey.set(key,{id:tag.id,label:tag.name,optionIds:new Set(),types:new Set()});
      const x=byKey.get(key);x.optionIds.add(entry.optionId);x.types.add(entry.slot);
    }
  }
  return [...byKey.values()].filter(x=>x.optionIds.size>=2&&x.types.size>=2)
    .sort((a,b)=>b.optionIds.size-a.optionIds.size||a.label.localeCompare(b.label))
    .slice(0,4).map(x=>({id:x.id,label:x.label,options:[...x.optionIds].sort(),slots:[...x.types].sort()}));
}

export function createTreaty({candidates,plan,tagEvidence=[]}){
  if(!plan || plan.status!=="ok")return null;
  if(!Array.isArray(candidates))throw Error("Candidate evidence required");
  const selected=plan.bridge.items;
  const majority=plan.baselines?.majority??plan.baseline;
  const average=plan.baselines?.average??majority;
  const diagnostics=selected.map(choice=>{
    const others=candidates.filter(c=>c.slot===choice.slot && c.evidence_id);
    const topA=Math.max(...others.map(c=>c.scoreA));
    const topB=Math.max(...others.map(c=>c.scoreB));
    return {
      id:choice.id,slot:choice.slot,name:choice.label,
      source:choice.source,evidence_id:choice.evidence_id,
      a:choice.scoreA,b:choice.scoreB,
      aTop:choice.scoreA>=topA-1e-9,bTop:choice.scoreB>=topB-1e-9,
      commonGround:round(Math.min(choice.scoreA,choice.scoreB)),
      gap:round(Math.abs(choice.scoreA-choice.scoreB))
    };
  });
  const common=diagnostics.filter(x=>!x.aTop&&!x.bTop).length;
  const motifs=deriveCulturalMotifs(tagEvidence.filter(x=>selected.some(s=>s.id===x.optionId)));
  const groupAChange=round(plan.bridge.groupA-majority.groupA);
  const groupBChange=round(plan.bridge.groupB-majority.groupB);
  const gapBefore=round(Math.abs(majority.groupA-majority.groupB));
  const gapAfter=round(Math.abs(plan.bridge.groupA-plan.bridge.groupB));
  return {
    label:"Cultural Bridge Agreement",
    policy:"maximize the lower of two ordinal group ranking proxies",
    groupAChange,groupBChange,
    meanSacrifice:round(plan.bridge.mean-average.mean),
    worstGain:round(plan.bridge.worst-majority.worst),
    gapBefore,gapAfter,
    compromiseOptions:common,
    selected:diagnostics,
    motifs,
    provenance:{
      kind:plan.source_mode,
      verifiedCrossDomainMotif:motifs.length>0,
      limitations:"Ranking proxies are not calibrated satisfaction, audience size, individual preferences, real event feasibility or venue prices.",
      qlooTagsStatus:motifs.length?"verified_shared_tag":"no_shared_tag_verified"
    }
  };
}

export function extractTagFacts(envelope){
  if(!envelope || !Array.isArray(envelope.results))return [];
  const seen=new Set(),out=[];
  const add=x=>{
    const core=x?.tag??x?.entity??x;
    const name=core?.name??core?.label??core?.properties?.name??core?.properties?.label;
    const id=core?.id??core?.urn??core?.tag_id;
    if(!allowed(name)||!allowed(id)||seen.has(id))return;
    seen.add(id);out.push({id,name});
  };
  for(const item of envelope.results){
    if(Array.isArray(item?.tags))for(const t of item.tags)add(t);
    else if(Array.isArray(item?.results))for(const t of item.results)add(t);
    else add(item);
  }
  // Discovery may include dozens of genuine provider tags per entity. Keep
  // enough to detect intersections; the public treaty exposes only up to 4.
  return out.slice(0,150);
}
