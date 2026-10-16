// Read-only judge release validation over the actual public URL.
// A visitor never supplies or receives the Qloo API key.
const assert=(ok,code)=>{if(!ok)throw Error(code);};
const elapsed=t=>Math.round(performance.now()-t);
export async function checkPublicRelease({
 origin="https://mosaic-agent-2026.onrender.com",
 fetchImpl=globalThis.fetch
}={}){
 const site=new URL(origin);
 assert(site.protocol==="https:"&&site.username===""&&site.password===""&&
  !site.search&&!site.hash&&!site.pathname.replaceAll("/",""),
  "INVALID_PUBLIC_RELEASE_URL");
 const root=site.origin;
 const durations={};
 async function get(path,expectJson=true){
  const started=performance.now();
  let response;
  try{
   response=await fetchImpl(new URL(path,root),{
    method:"GET",redirect:"error",cache:"no-store",signal:AbortSignal.timeout(90000)
   });
  }catch{throw Error("RELEASE_NETWORK_UNAVAILABLE");}
  durations[path]=elapsed(started);
  assert(response.ok,"RELEASE_GET_HTTP_"+response.status);
  try{return expectJson?await response.json():await response.text();}
  catch{throw Error("RELEASE_INVALID_RESPONSE");}
 }
 async function post(path,body){
  const started=performance.now();
  let response;
  try{
   response=await fetchImpl(new URL(path,root),{
    method:"POST",redirect:"error",
    headers:{"content-type":"application/json"},
    body:JSON.stringify(body),signal:AbortSignal.timeout(90000)
   });
  }catch{throw Error("RELEASE_NETWORK_UNAVAILABLE");}
  const elapsedMs=elapsed(started);
  let payload;
  try{payload=await response.json();}catch{throw Error("RELEASE_INVALID_JSON");}
  return {status:response.status,payload,elapsedMs};
 }
 const health=await get("/health");
 assert(health?.status==="ok"&&health?.product==="MOSAIC","INVALID_RELEASE_HEALTH");
 assert(health.mode==="live","RENDER_STILL_SAMPLE");
 assert(health.version==="0.3.0","RENDER_WRONG_VERSION");
 const html=await get("/",false);
 assert(typeof html==="string"&&html.includes("<title>MOSAIC")&&
  html.includes('src="/app.js"'),"RELEASE_UI_NOT_FOUND");
 const plan=await post("/api/plan",{maxBudget:210});
 assert(plan.status===200,"RELEASE_PLAN_HTTP_"+plan.status);
 const first=plan.payload;
 assert(first?.status==="ok"&&first?.mode==="qloo-live"&&
  first?.source_mode==="evidence-backed","RELEASE_SYNTHETIC_OR_UNVERIFIED");
 assert(first.bridge?.items?.length===3&&
  first.bridge.items.every(x=>x.qloo_entity_id&&x.evidence_id&&
   x.source?.startsWith("qloo-rest:")),"RELEASE_MISSING_PROVENANCE");
 assert(first.trace?.filter(x=>x.stage==="rank").length===3,
  "RELEASE_RANKING_NOT_VERIFIED");
 assert(first.trace?.filter(x=>x.stage==="enrich").length===3&&
  first.trace.filter(x=>x.stage==="enrich").every(x=>
   x.tool==="cached-qloo-discovery-tags"&&x.calls===0),
  "RELEASE_TAG_PROVENANCE_UNVERIFIED");
 const negotiation=first.negotiation;
 assert(negotiation?.method==="exact-nondominated-ordinal-frontier"&&
  negotiation.calls===0&&negotiation.tasteBlind?.items?.length===3&&
  negotiation.points?.some(x=>x.id===negotiation.maximinId&&x.isMaximin),
  "RELEASE_NEGOTIATION_FRONTIER_MISSING");
 const impacts=first.resilience?.impacts;
 assert(first.resilience?.provider_calls===0&&Array.isArray(impacts)&&
  impacts.length===3&&impacts.every(x=>first.bridge.items.some(y=>y.id===x.removed?.id)),
  "RELEASE_NO_STRESS_TEST");
 const removed=first.bridge.items[0].id;
 const veto=await post("/api/plan",{maxBudget:210,exclude:[removed]});
 assert(veto.status===200,"RELEASE_VETO_HTTP_"+veto.status);
 assert(veto.payload?.status==="ok"&&veto.payload?.mode==="qloo-live"&&
  veto.payload.bridge?.items?.every(x=>x.id!==removed)&&
  veto.payload.trace?.some(x=>x.stage==="renegotiate"&&x.calls===0),
  "RELEASE_CACHE_REPLAN_FAILED");
 const invalid=await post("/api/plan",{groupA:["private@example.com"]});
 assert(invalid.status===400&&!invalid.payload?.bridge&&
  !invalid.payload?.candidates,"RELEASE_FAIL_CLOSED_BROKEN");
 return {
  status:"verified",live:true,provenance:"qloo-rest",
  categories:3,stress_tests:3,
  provider_calls_for_veto:0,
  startup_ms:durations["/health"],
  ui_ms:durations["/"],
  first_plan_ms:plan.elapsedMs,
  veto_ms:veto.elapsedMs,
  invalid_request_status:invalid.status
 };
}
