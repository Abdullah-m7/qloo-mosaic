import test from "node:test";
import assert from "node:assert/strict";
import {QlooRestClient} from "../src/qloo-rest.mjs";

// Synthetic provider payloads: no network, real Qloo IDs or credentials.
function fakeProvider(batches) {
 let discovery = 0;
 return async url => {
  const parsed = new URL(url);
  const records = parsed.pathname === "/search"
   ? [{name:"Radiohead",entity_id:"seed-id",type:"urn:entity:artist"}]
   : batches[Math.min(discovery++,batches.length-1)];
  return new Response(JSON.stringify({results:{entities:records}}),{status:200});
 };
}
const record=(name,id)=>({name,entity_id:id,type:"urn:entity:artist"});
const discover=client=>client.call("qloo_recommend",{
 target_type:"artist",signals:["Radiohead"],limit:5
});

test("same display name with two provider IDs must not contaminate ranking identity",async()=>{
 const client=new QlooRestClient({apiKey:"offline-test",fetchImpl:fakeProvider([[
  record("Same Artist","id-one"),record("Same Artist","id-two"),record("Distinct Artist","id-three")
 ]])});
 await assert.rejects(discover(client),/QLOO_AMBIGUOUS_CANDIDATE/);
 assert.equal(client.candidates.has("urn:entity:artist|same artist"),false);
});

test("a second discovery batch cannot silently rebind a previous name to a new ID",async()=>{
 const client=new QlooRestClient({apiKey:"offline-test",fetchImpl:fakeProvider([
  [record("Same Artist","id-one"),record("Distinct Artist","id-three")],
  [record("Same Artist","id-two"),record("Distinct Artist","id-three")]
 ])});
 await discover(client);
 assert.equal(client.candidates.get("urn:entity:artist|same artist"),"id-one");
 await assert.rejects(discover(client),/QLOO_AMBIGUOUS_CANDIDATE/);
 assert.equal(client.candidates.get("urn:entity:artist|same artist"),"id-one");
});

test("repeated name referring to same canonical provider ID remains safe",async()=>{
 const client=new QlooRestClient({apiKey:"offline-test",fetchImpl:fakeProvider([[
  record("Same Artist","id-one"),record("same artist","id-one"),
  record("Distinct Artist","id-three")
 ]])});
 const result=await discover(client);
 assert.equal(result.results.length,3);
 assert.equal(client.candidates.get("urn:entity:artist|same artist"),"id-one");
});
