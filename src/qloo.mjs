// Bounded Qloo REST tool orchestration. Real data never falls back to synthetic fixtures.
import {QlooRestClient} from "./qloo-rest.mjs";
export {EVENT_BASE_URL} from "./qloo-rest.mjs";
import {buildBridge} from "./engine.mjs";
import {createTreaty,extractTagFacts} from "./treaty.mjs";
import {summarizeThreadOpportunity} from "./thread-opportunity.mjs";

// The event base URL is pinned by qloo-rest.mjs.
const types=[["music","artist"],["food","place"],["experience","movie"]];
export const DEFAULT_SEEDS=Object.freeze({
  groupA:["Radiohead","The Grand Budapest Hotel"],
  groupB:["Daft Punk","Blade Runner 2049"]
});
export function validateSeeds(values, fallback){
  const given=values===undefined?fallback:values;
  if(!Array.isArray(given)||given.length<1||given.length>5)throw new TypeError("Provide one to five public cultural entity names per audience.");
  const cleaned=given.map(x=>typeof x==="string"?x.trim():"");
  if(cleaned.some(x=>!x||x.length>72||x.includes("@")||/https?:\/\//i.test(x)||/[\r\n]/.test(x))){
    throw new TypeError("Only public cultural entity names allowed (no personal data, URLs, or emails).");
  }
  if(new Set(cleaned.map(x=>x.toLowerCase())).size!==cleaned.length)throw new TypeError("Duplicate cultural anchors are not allowed.");
  return cleaned;
}
export function validateLocation(location){
  const result=(location??"New York");
  if(typeof result!=="string"||!result.trim()||result.length>72||/[@<>\r\n]/.test(result))
    throw new TypeError("Invalid public geographic location");
  return result.trim();
}
const normalized=s=>String(s).trim().toLocaleLowerCase("en-US");
export function extractItems(envelope){
  if(!envelope || !Array.isArray(envelope.results))return [];
  return envelope.results.map((x)=>{
    const entity=x?.entity??x?.item??x;
    const name=entity?.name??entity?.title??entity?.properties?.name??x?.entity_name;
    const uuid=entity?.id??entity?.entity_id??x?.entity_id;
    return {name:typeof name==="string"?name:null,
      id:typeof uuid==="string"?uuid:null,
      ...(Array.isArray(x?.contributors)&&x.contributors.length?
        {contributors:x.contributors}:{})};
  }).filter(x=>x.name&&x.name.length<=160);
}
export function percentileRanks(orderedNames,expected){
  // Qloo explicitly warns scores from separate ranking calls are NOT comparable.
  // Percentile order proxies are computed independently on the SAME option set.
  const seen=new Set(),ordered=[];
  for(const name of orderedNames){
    const key=normalized(name);
    if(!seen.has(key)&&expected.some(x=>normalized(x)===key)){seen.add(key);ordered.push(key);}
  }
  if(ordered.length!==expected.length)throw Error("Incomplete Qloo ranking: abstaining instead of inventing missing preferences.");
  const n=ordered.length;
  return new Map(ordered.map((name,i)=>[name,n===1?0.5:Math.round((1-i/(n-1))*1000)/1000]));
}
export function matchRanks(options,a,b){
  const left=percentileRanks(a,options),right=percentileRanks(b,options);
  return options.map(name=>({name,scoreA:left.get(normalized(name)),scoreB:right.get(normalized(name))}));
}
// A bounded, observable multi-tool planning loop. Tool calls are injected so
// its contract can be falsified with mocks even before the Qloo key arrives.
// Important: it never substitutes synthetic output when Qloo evidence is sparse.
export async function discoverCulturalEvidence({a,b,place,call}){
  if(typeof call!=="function")throw new TypeError("Qloo tool caller required");
  const candidates=[],trace=[];
  for(const [slot,type] of types){
    const args={target_type:type,signals:[...a,...b],limit:5,
      ...(slot==="food"?{filter_location:place}:{})};
    let found=await call("qloo_recommend",args);
    let pool=extractItems(found).filter(x=>x.id);
    trace.push({stage:"discover",slot,tool:"qloo_recommend",strategy:"combined",
      count:pool.length});
    // A bounded adaptive step: when joint taste discovery is too sparse,
    // explore an alternate group signal once. No infinite retries.
    if(new Set(pool.map(x=>normalized(x.name))).size<2){
      found=await call("qloo_recommend",{...args,signals:b});
      const alt=extractItems(found).filter(x=>x.id);
      pool=[...pool,...alt];
      trace.push({stage:"discover",slot,tool:"qloo_recommend",
        strategy:"second-audience-fallback",count:alt.length});
    }
    const normalizedPool=new Map();
    for(const item of pool){
      const key=normalized(item.name);
      if(!normalizedPool.has(key))normalizedPool.set(key,item);
    }
    const shortlist=[...normalizedPool.values()].slice(0,5);
    const names=shortlist.map(x=>x.name);
    if(names.length<2)
      throw new Error("Insufficient verifiable Qloo candidates for "+slot+
        ". Refuse to invent a shared cultural option.");
    const [left,right]=await Promise.all([
      call("qloo_rank",{options:names,option_type:type,signals:a}),
      call("qloo_rank",{options:names,option_type:type,signals:b})
    ]);
    const leftItems=extractItems(left);
    const rightItems=extractItems(right);
    const leftNames=leftItems.map(x=>x.name);
    const rightNames=rightItems.map(x=>x.name);
    const leftReasons=new Map(leftItems.map(x=>[normalized(x.name),x.contributors]));
    const rightReasons=new Map(rightItems.map(x=>[normalized(x.name),x.contributors]));
    const leftSet=new Set(leftNames.map(normalized));
    const rightSet=new Set(rightNames.map(normalized));
    const shared=names.filter(x=>leftSet.has(normalized(x))&&rightSet.has(normalized(x)));
    if(shared.length<2)
      throw Error('Insufficient matched Qloo ranking overlap for '+slot);
    // Discard options not independently ranked for both groups; never impute.
    const ranked=matchRanks(shared,leftNames,rightNames);
    trace.push({stage:"rank",slot,tool:"qloo_rank",calls:2,
      comparable:"ordinal ranks on shared, independently ranked candidates",
      candidates:shared.length,discarded:names.length-shared.length});
    for(const record of ranked){
      const source=normalizedPool.get(normalized(record.name));
      if(!source?.id)throw Error("Qloo candidate lacks a verifiable entity ID.");
      candidates.push({
        id:slot+":"+source.id,slot,label:record.name,
        cost:0,scoreA:record.scoreA,scoreB:record.scoreB,
        source:"qloo-rest:insights+rank",
        qloo_entity_id:source.id,
        evidence_id:"QL-"+source.id.replace(/[^a-zA-Z0-9]/g,"").slice(0,12),
        qloo_explanations:{
          groupA:leftReasons.get(normalized(record.name))??[],
          groupB:rightReasons.get(normalized(record.name))??[]
        }
      });
    }
  }
  trace.push({stage:"negotiate",tool:"maximin-search",
    candidates:candidates.length,
    policy:"Optimize the lower ordinal group rank; never infer prices or attendance."});
  return {candidates,trace};
}
export async function enrichSelectedTags({selected,call}){
  if(!Array.isArray(selected)||selected.length>3)throw new TypeError("At most three selected candidates permitted");
  const tagEvidence=[],trace=[];
  for(const option of selected){
    const entityType=types.find(([slot])=>slot===option.slot)?.[1];
    if(!entityType||typeof option.qloo_entity_id!=="string"||!option.qloo_entity_id)
      throw new TypeError("Selected candidate lacks original Qloo identity");
    try{
      const result=await call("qloo_entity_tags",{
        entities:[option.qloo_entity_id],entity_type:entityType,limit:10
      });
      const verified=extractTagFacts(result);
      tagEvidence.push({optionId:option.id,slot:option.slot,tags:verified});
      trace.push({stage:"enrich",tool:"cached-qloo-discovery-tags",slot:option.slot,
        calls:0,status:verified.length?"verified":"no_tags",count:verified.length});
    }catch{
      trace.push({stage:"enrich",tool:"cached-qloo-discovery-tags",slot:option.slot,
        calls:0,status:"unavailable",count:0});
    }
  }
  return {tagEvidence,trace};
}
export async function liveBridge({maxBudget=210,exclude=[],groupA,groupB,location}={}){
  const a=validateSeeds(groupA,DEFAULT_SEEDS.groupA);
  const b=validateSeeds(groupB,DEFAULT_SEEDS.groupB);
  const place=validateLocation(location);
  // The event key NEVER works against the default production Qloo endpoint.
  // All outbound REST calls are pinned to the official hackathon hostname.
  // A small, auditable tool executor over documented Qloo GET APIs.
  const client=new QlooRestClient();
  const call=(name,args)=>client.call(name,args);
  try{
    const {candidates:all,trace}=await discoverCulturalEvidence({
      a,b,place,call
    });
    const result=buildBridge({candidates:all,maxBudget,exclude});
    const threadOpportunity=summarizeThreadOpportunity(all,client.entityTags);
    // Reuse provider tag IDs from already discovered Qloo entities. No extra
    // API queries, and missing tags never manufacture cultural overlap.
    const tagStep=result.status==="ok"?
      await enrichSelectedTags({selected:result.bridge.items,call}):
      {tagEvidence:[],trace:[]};
    trace.push(...tagStep.trace);
    const tagEvidence=tagStep.tagEvidence;
    const treaty=createTreaty({candidates:all,plan:result,tagEvidence});
    return {candidates:all,trace,tagEvidence,treaty,threadOpportunity,mode:"qloo-live",scenario:{title:"Custom cultural bridge",groupA:{title:"First audience",anchors:a},groupB:{title:"Second audience",anchors:b},location:place},notice:"Relative rank-percentile proxies from Qloo tool calls on matched shortlists. Real Qloo entities have NO pricing or availability guarantee. Budget is disabled in live mode.",...result};
  }finally{
    // Drop the in-memory credential reference after each bounded request cycle.
    client.key="";
  }
}
