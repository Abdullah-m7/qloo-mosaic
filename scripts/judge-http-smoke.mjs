#!/usr/bin/env node
// One bounded real-credential HTTP smoke for the exact path a judge will use.
// Prints only invariant/status labels; never prints raw Qloo payloads or keys.
import {spawn} from "node:child_process";
import {once} from "node:events";
import {setTimeout as delay} from "node:timers/promises";

if(!process.env.QLOO_API_KEY){
 console.error("JUDGE_HTTP_BLOCKED: CREDENTIAL_NOT_CONFIGURED");
 process.exit(2);
}
const app=spawn(process.execPath,["server.mjs"],{
 cwd:process.cwd(),
 env:{...process.env,PORT:"0",QLOO_MODE:"live",QLOO_TEST_INSPECT:"0"},
 stdio:["ignore","pipe","pipe"]
});
let port=null,ended=false;
const failures=[];
app.stdout.setEncoding("utf8");
app.stdout.on("data",s=>{
 const m=String(s).match(/ready at http:\/\/localhost:(\d+)/);
 if(m)port=Number(m[1]);
});
app.stderr.on("data",s=>{
 // Any provider diagnostic here is NOT forwarded to CI logs.
 if(String(s).includes("Qloo request blocked"))failures.push("APP_REJECTED_PLAN");
});
app.on("exit",()=>{ended=true;});
const stop=async()=>{
 if(!ended){app.kill("SIGTERM");await Promise.race([once(app,"exit").catch(()=>{}),delay(1500)]);}
};
const request=async(body)=>{
 const res=await fetch("http://127.0.0.1:"+port+"/api/plan",{
  method:"POST",headers:{"content-type":"application/json"},
  body:JSON.stringify(body),signal:AbortSignal.timeout(95000)
 });
 let data;
 try{data=await res.json();}catch{throw Error("INVALID_JUDGE_API_JSON");}
 if(!res.ok)throw Error("JUDGE_HTTP_"+res.status+"_"+String(data?.code??data?.status??"UNKNOWN").replace(/[^A-Z0-9_]/g,""));
 return data;
};
try{
 for(let attempt=0;attempt<40&&!port&&!ended;attempt++)await delay(100);
 if(!port||ended)throw Error("JUDGE_SERVER_NOT_READY");
 const base="http://127.0.0.1:"+port;
 const health=await(await fetch(base+"/health",{signal:AbortSignal.timeout(5000)})).json();
 if(health.status!=="ok"||health.mode!=="live")throw Error("JUDGE_NOT_IN_LIVE_MODE");
 console.log("JUDGE_HTTP_HEALTH_OK");
 // Exactly the default cultural anchors that appear in the live UI.
 const first=await request({maxBudget:210});
 if("threadTagIndex" in first||"tagEvidence" in first||
   "candidates" in first)throw Error("JUDGE_RAW_PROVIDER_TAG_CACHE_LEAK");
 if(first.mode!=="qloo-live"||first.source_mode!=="evidence-backed"||
  first.status!=="ok"||first.bridge?.items?.length!==3||
  !first.bridge.items.every(x=>x.source?.startsWith("qloo-rest:")&&x.qloo_entity_id&&x.evidence_id))
  throw Error("JUDGE_LIVE_PROVENANCE_INCOMPLETE");
 const ranks=(first.trace??[]).filter(x=>x.stage==="rank");
 if(ranks.length!==3)throw Error("JUDGE_RANK_TRACE_INCOMPLETE");
 const stress=first.resilience;
 if(stress?.method!=="single-option-veto"||stress.provider_calls!==0||
  stress.impacts?.length!==3||
  !stress.impacts.every(x=>first.bridge.items.some(y=>y.id===x.removed?.id)&&
   (x.status==="unavailable"&&x.worst_after===null||
    x.status==="feasible"&&Number.isFinite(x.worst_rank_loss)&&
     x.worst_rank_loss>=0&&x.worst_after<=first.bridge.worst)))
  throw Error("JUDGE_RESILIENCE_EVIDENCE_MISSING");
 const atlas=first.negotiation;
 if(atlas?.method!=="exact-nondominated-ordinal-frontier"||
   atlas.calls!==0||!atlas.points?.length||!atlas.tasteBlind||
   atlas.points?.length>10||!atlas.maximinId||
   !atlas.points.some(p=>p.id===atlas.maximinId&&p.isMaximin)||
   !atlas.tasteBlind.items?.every(x=>x.id&&x.evidence_id))
  throw Error("JUDGE_NEGOTIATION_FRONTIER_INCOMPLETE");
 const explanationCount=first.bridge.items.reduce((count,item)=>count+
  ["groupA","groupB"].reduce((n,k)=>n+
   (Array.isArray(item.qloo_explanations?.[k])?item.qloo_explanations[k].length:0),0),0);
 console.log("JUDGE_HTTP_EXPLANATION_META categories="+first.bridge.items.length+
  " verified_contributions="+explanationCount);
 console.log("JUDGE_HTTP_LIVE_OK slots=3 rank_stages=3");
 console.log("JUDGE_HTTP_COUNTERFACTUAL_OK exclusions=3 extra_provider_calls=0");
 console.log("JUDGE_HTTP_FRONTIER_OK blind_baseline=grounded extra_provider_calls=0");
 const thread=first.threadChoice;
 if(!thread||thread.method!=="bounded-exact-qloo-tag-intersection"||
  thread.provider_calls!==0||!
  ["verified","no_verified_thread"].includes(thread.status))
  throw Error("JUDGE_THREAD_EVIDENCE_INVALID");
 if(thread.status==="verified"&&(
  thread.alternative?.items?.length!==3||
  !thread.verified_motifs?.length||
  thread.worst_rank_proxy_loss<0||
  thread.worst_rank_proxy_loss>thread.max_rank_proxy_loss+1e-6||
  !thread.verified_motifs.every(m=>m.id?.startsWith("urn:tag:")&&m.slots?.length>=2)
 ))throw Error("JUDGE_THREAD_ALTERNATIVE_UNVERIFIED");
 console.log("JUDGE_PROVIDER_THREAD_META status="+thread.status+
  " matched_tag_count="+(thread.verified_motif_count||0)+
  " additional_provider_calls=0");
 const enrichment=(first.trace||[]).filter(x=>x.stage==="enrich");
 if(enrichment.length!==3||enrichment.some(x=>
   x.tool!=="cached-qloo-discovery-tags"||x.calls!==0))
  throw Error("JUDGE_QLOO_TAG_PROVENANCE_INCOMPLETE");
 console.log("JUDGE_QLOO_TAG_CACHE_OK slots=3 additional_calls=0");
 const veto=first.bridge.items[0].id;
 const next=await request({maxBudget:210,exclude:[veto]});
 if(next.mode!=="qloo-live"||next.status!=="ok"||
  next.bridge?.items?.some(x=>x.id===veto)||
  !next.trace?.some(x=>x.stage==="renegotiate"&&x.calls===0))
  throw Error("JUDGE_CACHE_VETO_FAILED");
 if(next.threadChoice?.provider_calls!==0||!
  ["verified","no_verified_thread"].includes(next.threadChoice?.status))
  throw Error("JUDGE_VETO_THREAD_CACHE_NOT_UPDATED");
 console.log("JUDGE_HTTP_CACHED_REPLAN_OK");
 // Input error must not consume provider calls or silently use synthetic values.
 const invalid=await fetch(base+"/api/plan",{
  method:"POST",headers:{"content-type":"application/json"},
  body:JSON.stringify({groupA:["private@example.com"]}),
  signal:AbortSignal.timeout(5000)
 });
 const invalidBody=await invalid.json();
 if(invalid.status!==400||"bridge" in invalidBody)
  throw Error("JUDGE_INVALID_INPUT_NOT_REJECTED");
 console.log("JUDGE_HTTP_FAIL_CLOSED_OK");
 console.log("JUDGE_HTTP_SMOKE_PASS");
}catch(error){
 const code=String(error?.message??"UNKNOWN").replace(/[^A-Z0-9_]/g,"").slice(0,72);
 console.error("JUDGE_HTTP_SMOKE_BLOCKED: "+code);
 process.exitCode=1;
}finally{
 await stop();
}
