#!/usr/bin/env node
// GitHub Actions / local credentialed Qloo smoke; NEVER prints secrets or raw API data.
import {QlooRestClient} from "../src/qloo-rest.mjs";
import {liveBridge} from "../src/qloo.mjs";
const cleanError=e=>String(e?.message??"UNKNOWN").replace(/[^A-Za-z0-9_]/g,"").slice(0,56);
if(!process.env.QLOO_API_KEY){
 console.error("QLOO_SMOKE_BLOCKED: CREDENTIAL_NOT_CONFIGURED");
 process.exit(2);
}
try{
 const client=new QlooRestClient();
 try{
  const signal=await client.resolveSeed("Radiohead");
  if(!signal)throw Error("QLOO_SIGNAL_UNRESOLVED");
  console.log("QLOO_SEARCH_OK requests="+client.requests);
  const data=await client.call("qloo_recommend",{
   target_type:"artist",signals:["Radiohead"],limit:5
  });
  if(!data.results?.length)throw Error("QLOO_EMPTY_INSIGHTS");
  console.log("QLOO_INSIGHTS_OK candidates="+data.results.length+" requests="+client.requests);
 }finally{client.key="";}
 const plan=await liveBridge({groupA:["Radiohead"],groupB:["Daft Punk"],location:"New York"});
 if(plan.status!=="ok")throw Error("QLOO_PLAN_"+String(plan.status));
 const counts=plan.trace?.filter(x=>x.tool==="qloo_rank").length??0;
 console.log("QLOO_AGENT_OK slots="+plan.bridge.items.length+" rank_stages="+counts);
 console.log("QLOO_SMOKE_PASS (real event endpoint, no raw response persistence)");
}catch(error){
 console.error("QLOO_SMOKE_BLOCKED: "+cleanError(error));
 process.exitCode=1;
}
