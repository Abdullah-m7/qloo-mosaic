import test from "node:test";
import assert from "node:assert/strict";
import {EVENT_BASE_URL,QlooRestClient} from "../src/qloo-rest.mjs";

test("Qloo transport pinned and credential required",()=>{
 assert.equal(EVENT_BASE_URL,"https://hackathon.api.qloo.com");
 assert.throws(()=>new QlooRestClient({apiKey:""}),/QLOO_CREDENTIAL_MISSING/);
});
test("Qloo transport only accepts official endpoints",async()=>{
 const client=new QlooRestClient({apiKey:"test",
  fetchImpl:async()=>new Response(JSON.stringify({results:[]}),{status:200})});
 await assert.rejects(()=>client.request("/recommendations"),/QLOO_ENDPOINT_BLOCKED/);
 await assert.rejects(()=>client.request("/recs"),/QLOO_ENDPOINT_BLOCKED/);
 assert.equal(client.requests,0);
});
