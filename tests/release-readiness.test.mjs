import test from "node:test";
import assert from "node:assert/strict";
import {checkPublicRelease} from "../src/release-readiness.mjs";

const json=(body,status=200)=>new Response(JSON.stringify(body),{
 status,headers:{"content-type":"application/json"}
});
const health={status:"ok",product:"MOSAIC",mode:"live",version:"0.3.0"};
const selected=["music","food","experience"].map((slot,i)=>({
 id:slot+":fixture"+i,slot,label:"Public "+slot,
 source:"qloo-rest:insights+rank",qloo_entity_id:"qloo-public-"+i,
 evidence_id:"QL-"+i,scoreA:.6,scoreB:.7,cost:0
}));
const plan=(items=selected)=>({
 status:"ok",mode:"qloo-live",source_mode:"evidence-backed",
 bridge:{items},
 trace:[{stage:"rank",slot:"music"},{stage:"rank",slot:"food"},
  {stage:"rank",slot:"experience"},
  ...["music","food","experience"].map(slot=>({
   stage:"enrich",slot,tool:"cached-qloo-discovery-tags",calls:0,status:"verified"
  }))],
 negotiation:{method:"exact-nondominated-ordinal-frontier",calls:0,
  maximinId:"balanced-1",points:[{id:"balanced-1",isMaximin:true,items}],
  tasteBlind:{items}},
 threadChoice:{method:"bounded-exact-qloo-tag-intersection",
  provider_calls:0,status:"no_verified_thread"},
 resilience:{provider_calls:0,impacts:selected.map(x=>({removed:{id:x.id}}))}
});
test("release check refuses sample Render before calling any Qloo-funded planner",async()=>{
 const calls=[];
 const mock=async url=>{
  calls.push(new URL(url).pathname);
  return json({...health,mode:"sample"});
 };
 await assert.rejects(checkPublicRelease({fetchImpl:mock}),/RENDER_STILL_SAMPLE/);
 assert.deepEqual(calls,["/health"]);
});
test("release check verifies real visitor flow, cached veto, and no browser credentials",async()=>{
 const calls=[];
 const mock=async(url,options)=>{
  const path=new URL(url).pathname;
  calls.push({path,method:options.method,headers:options.headers,body:options.body});
  if(path==="/health")return json(health);
  if(path==="/")return new Response('<title>MOSAIC — common ground</title><script src="/app.js"></script>');
  if(path==="/api/plan"){
   const payload=JSON.parse(options.body);
   if(payload.groupA?.[0]?.includes("@"))return json({status:"needs_input"},400);
   if(payload.exclude?.length){
    return json({...plan([selected[1],selected[2],{
     ...selected[0],id:"music:replacement",label:"Other Music"
    }]),trace:[{stage:"renegotiate",calls:0}]});
   }
   return json(plan());
  }
  throw Error("Unexpected request");
 };
 const result=await checkPublicRelease({fetchImpl:mock});
 assert.equal(result.status,"verified");
 assert.equal(result.live,true);
 assert.equal(result.stress_tests,3);
 assert.equal(result.provider_calls_for_veto,0);
 assert.equal(result.invalid_request_status,400);
 assert.equal(calls.length,5);
 assert.ok(calls.every(x=>!x.headers?.["X-Api-Key"]&&!x.headers?.["x-api-key"]));
 assert.ok(calls.every(x=>x.method!=="POST"||x.headers["content-type"]==="application/json"));
});
test("release check rejects missing real Qloo provenance and stress evidence",async()=>{
 const mock=async(url,options)=>{
  const path=new URL(url).pathname;
  if(path==="/health")return json(health);
  if(path==="/")return new Response('<title>MOSAIC</title><script src="/app.js"></script>');
  if(path==="/api/plan")return json({...plan(),resilience:null});
  throw Error("Unexpected path");
 };
 await assert.rejects(checkPublicRelease({fetchImpl:mock}),/RELEASE_NO_STRESS_TEST/);
});
test("release probe accepts only HTTPS site roots without embedded credentials",async()=>{
 for(const origin of ["http://mosaic-agent-2026.onrender.com","https://abc:password@example.org",
   "https://example.org/some/path","https://example.org/?token=x"]){
  await assert.rejects(checkPublicRelease({origin,fetchImpl:()=>{throw Error("must not call");}}),
   /INVALID_PUBLIC_RELEASE_URL/);
 }
});

test("release probe refuses live app missing nontrivial negotiation frontier",async()=>{
 const mock=async(url)=>{
  const p=new URL(url).pathname;
  if(p==="/health")return json(health);
  if(p==="/")return new Response('<title>MOSAIC</title><script src="/app.js"></script>');
  if(p==="/api/plan")return json({...plan(),negotiation:null});
  throw Error("Unexpected");
 };
 await assert.rejects(checkPublicRelease({fetchImpl:mock}),/RELEASE_NEGOTIATION_FRONTIER_MISSING/);
});

test("public release refuses a provider-tag story without grounded cache provenance",async()=>{
 const mock=async url=>{
  const pathname=new URL(url).pathname;
  if(pathname==="/health")return json(health);
  if(pathname==="/")return new Response('<title>MOSAIC</title><script src="/app.js"></script>');
  if(pathname==="/api/plan")return json({...plan(),
   trace:plan().trace.filter(x=>x.stage!=="enrich")});
  throw Error("Unknown");
 };
 await assert.rejects(checkPublicRelease({fetchImpl:mock}),/RELEASE_TAG_PROVENANCE_UNVERIFIED/);
});
