#!/usr/bin/env node
// GitHub Actions / local credentialed Qloo smoke; NEVER prints secrets or raw API data.
import {liveBridge} from "../src/qloo.mjs";
import {QlooRestClient} from "../src/qloo-rest.mjs";
const cleanError=e=>String(e?.message??"UNKNOWN").replace(/[^A-Za-z0-9_]/g,"").slice(0,56);
if(!process.env.QLOO_API_KEY){
 console.error("QLOO_SMOKE_BLOCKED: CREDENTIAL_NOT_CONFIGURED");
 process.exit(2);
}
try{
 // Exercise the complete agent once; avoid duplicate exploratory API traffic.
 const plan=await liveBridge({groupA:["Radiohead"],groupB:["Daft Punk"],location:"New York"});
 if(plan.status!=="ok")throw Error("QLOO_PLAN_"+String(plan.status));
 const counts=plan.trace?.filter(x=>x.tool==="qloo_rank").length??0;
 console.log("QLOO_AGENT_OK slots="+plan.bridge.items.length+" rank_stages="+counts);
 const explain=plan.bridge.items.map(item=>item.qloo_explanations||{});
 const explained=explain.filter(groups=>
  ["groupA","groupB"].some(g=>Array.isArray(groups[g])&&groups[g].length>0)).length;
 const groupEntries=explain.reduce((sum,groups)=>sum+
  ["groupA","groupB"].reduce((n,g)=>n+(groups[g]?.length||0),0),0);
 console.log("QLOO_PROVIDER_EXPLANATION_META selected_items="+explain.length+
  " explained_items="+explained+" public_anchor_contributions="+groupEntries);
 const tags=(plan.trace||[]).filter(x=>x.stage==="enrich");
 if(tags.length!==3||tags.some(x=>x.calls!==0||x.tool!=="cached-qloo-discovery-tags"))
  throw Error("QLOO_TAG_SOURCE_NOT_GROUNDED");
 console.log("QLOO_TAG_SOURCE_OK slots=3 provider_calls=0 verified_slots="+
  tags.filter(x=>x.status==="verified").length);
 const opportunity=plan.threadOpportunity;
 if(opportunity?.provider_calls!==0||opportunity?.candidates!==plan.candidates?.length||
  !Number.isInteger(opportunity.triples_with_verified_cross_slot_tag))
  throw Error("QLOO_TAG_OPPORTUNITY_UNAVAILABLE");
 // Counts only: no provider tags, names, source IDs or research rows printed.
 console.log("QLOO_THREAD_OPPORTUNITY_META="+JSON.stringify({
  candidates:opportunity.candidates,
  tagged:opportunity.with_provider_tag_metadata,
  cross_category_pairs:opportunity.cross_slot_pairs_with_matching_tag,
  candidate_triples:opportunity.all_candidate_triples,
  verified_overlap_triples:opportunity.triples_with_verified_cross_slot_tag
 }));
 const thread=plan.threadChoice;
 if(thread?.method!=="bounded-exact-qloo-tag-intersection"||
   thread.provider_calls!==0||
   !["verified","no_verified_thread"].includes(thread.status))
  throw Error("QLOO_THREAD_CHOICE_INVALID");
 if(thread.status==="verified"&&
  (!thread.verified_motifs?.length||
   thread.alternative?.items?.length!==3||
   thread.worst_rank_proxy_loss>thread.max_rank_proxy_loss+1e-6))
  throw Error("QLOO_THREAD_CHOICE_UNVERIFIED");
 console.log("QLOO_THREAD_CHOICE_META="+JSON.stringify({
  status:thread.status,
  verified_motifs:thread.verified_motif_count||0,
  loss_within_preset_limit:thread.status==="verified"?
    thread.worst_rank_proxy_loss<=thread.max_rank_proxy_loss+1e-6:null,
  provider_calls:thread.provider_calls
 }));
 const typed=new QlooRestClient({maxRequests:2});
 try{
  const entityId=await typed.resolveSeed("Movie: Barbie (2023)");
  if(!entityId)throw Error("QLOO_TYPED_ANCHOR_UNRESOLVED");
  console.log("QLOO_TYPED_PUBLIC_ANCHOR_OK");
 }finally{typed.key="";}
 console.log("QLOO_SMOKE_PASS (real event endpoint, no raw response persistence)");
}catch(error){
 console.error("QLOO_SMOKE_BLOCKED: "+cleanError(error));
 process.exitCode=1;
}
