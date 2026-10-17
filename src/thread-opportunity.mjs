// No-network, metadata-only assessment of cultural links across Qloo candidate
// categories. It NEVER returns tag IDs, names or candidate identities.
export function summarizeThreadOpportunity(candidates,entityTags){
 if(!Array.isArray(candidates)||!(entityTags instanceof Map))
  throw TypeError("A grounded shortlist and provider metadata map are required");
 const slots=["music","food","experience"];
 const bySlot=slots.map(slot=>candidates.filter(x=>x.slot===slot));
 const ids=option=>{
  const id=String(option?.qloo_entity_id||"").toLowerCase();
  const tags=entityTags.get(id);
  return new Set((Array.isArray(tags)?tags:[]).filter(t=>
   typeof t?.id==="string"&&t.id.startsWith("urn:tag:")&&t.id.length<180
  ).map(t=>t.id.toLowerCase()));
 };
 const cached=new Map(candidates.map(x=>[x.id,ids(x)]));
 const overlaps=(a,b)=>{
  const A=cached.get(a.id)||new Set(),B=cached.get(b.id)||new Set();
  return [...A].some(id=>B.has(id));
 };
 let tagged=0;
 for(const tags of cached.values())if(tags.size)tagged++;
 let pairs=0,combos=0,total=0;
 for(let i=0;i<slots.length;i++)for(let j=i+1;j<slots.length;j++)
  for(const a of bySlot[i])for(const b of bySlot[j])
   if(overlaps(a,b))pairs++;
 for(const a of bySlot[0])for(const b of bySlot[1])for(const c of bySlot[2]){
  total++;
  if(overlaps(a,b)||overlaps(a,c)||overlaps(b,c))combos++;
 }
 return Object.freeze({
  provider_source:"cached_qloo_discovery_entity_tags",
  candidates:candidates.length,
  with_provider_tag_metadata:tagged,
  cross_slot_pairs_with_matching_tag:pairs,
  triples_with_verified_cross_slot_tag:combos,
  all_candidate_triples:total,
  provider_calls:0,
  interpretation:"Counts refer only to shared exact provider tag IDs among public candidate categories. They are not audience preferences, satisfaction or cultural causality."
 });
}
