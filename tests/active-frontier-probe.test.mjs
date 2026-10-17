import test from "node:test";
import assert from "node:assert/strict";
import {probeActiveFrontier} from "../src/active-frontier-probe.mjs";

const c=(slot,name,a,b)=>({
 slot,id:slot+":"+name,label:name,scoreA:a,scoreB:b,cost:0,
 source:"qloo-rest:insights+rank",evidence_id:"QL-"+name,
 qloo_entity_id:slot+":"+name,qloo_explanations:{groupA:[],groupB:[]}
});
const original=[
 c("music","A",.3,.9),c("music","B",.9,.3),
 c("food","F1",.9,.9),c("food","F2",.7,.7),
 c("experience","X1",.9,.9),c("experience","X2",.7,.7)
];

test("active Qloo discovery finds new third option and compares both policies on same reranked union",async()=>{
 const calls=[];
 const call=async(name,args)=>{
  calls.push({name,args});
  if(name==="qloo_recommend")return {results:[{name:"C",id:"music:C"}]};
  if(name==="qloo_rank"){
   assert.equal(args.option_type,"artist");
   assert.deepEqual(args.options,["A","B","C"]);
   return {results:(args.signals[0]==="Aseed"?
     ["C","B","A"]:["C","A","B"]).map(name=>({name}))};
  }
  throw Error("Unexpected call");
 };
 const p=await probeActiveFrontier({candidates:original,a:["Aseed"],b:["Bseed"],call});
 assert.equal(p.status,"evaluated");
 assert.equal(p.slot,"music");
 assert.equal(p.underrepresented,"groupA");
 assert.equal(p.provider_calls,3);
 assert.equal(p.discovered_new,1);
 assert.equal(p.mutually_ranked_new,1);
 assert.equal(p.selected_new_in_expanded_plan,true);
 assert.ok(p.difference_on_same_union>0);
 assert.equal(p.source_scope,"same_union_reranked_both_audiences");
 assert.ok(p.nominated.some(x=>x.from_expanded_discovery&&x.label==="C"));
 assert.deepEqual(calls.map(x=>x.name),["qloo_recommend","qloo_rank","qloo_rank"]);
 assert.deepEqual(calls[0].args.signals,["Aseed"]);
 assert.match(p.disclaimer,/cannot prove held-out/);
});

test("if lower group's search yields no new Qloo entities, no extra Qloo ranks are spent",async()=>{
 const calls=[];
 const call=async(name)=>{
  calls.push(name);
  return {results:[{name:"A",id:"music:A"},{name:"B",id:"music:B"}]};
 };
 const p=await probeActiveFrontier({candidates:original,a:["Aseed"],b:["Bseed"],call});
 assert.equal(p.status,"no_new_entities");
 assert.equal(p.provider_calls,1);
 assert.deepEqual(calls,["qloo_recommend"]);
});

test("if union rankings omit an existing option, comparison abstains instead of inventing baseline",async()=>{
 const call=async(name,args)=>{
  if(name==="qloo_recommend")return {results:[{name:"C",id:"music:C"}]};
  if(name==="qloo_rank")return {
   results:(args.signals[0]==="Aseed"?["C","B"]:["C","A"]).map(name=>({name}))
  };
 };
 const p=await probeActiveFrontier({candidates:original,a:["Aseed"],b:["Bseed"],call});
 assert.equal(p.status,"blocked_missing_original_ranks");
 assert.equal(p.provider_calls,3);
});

test("never expand invented/synthetic Qloo identities",async()=>{
 const bad=original.map(x=>({...x}));
 bad[0].source="synthetic-fixture";
 await assert.rejects(
  probeActiveFrontier({candidates:bad,a:["Aseed"],b:["Bseed"],call:()=>{throw Error("must not call");}}),
  /Only complete, Qloo-grounded/);
});

test("held-out evaluator runs only after two Qloo plans are frozen",async()=>{
 const events=[];
 const call=async(name,args)=>{
  events.push(name);
  if(name==="qloo_recommend")return {results:[{name:"C",id:"music:C"}]};
  if(name==="qloo_rank")return {results:
   (args.signals[0]==="Aseed"?["C","B","A"]:["C","A","B"])
   .map(name=>({name}))};
  throw Error("Unexpected tool");
 };
 const result=await probeActiveFrontier({
  candidates:original,a:["Aseed"],b:["Bseed"],call,
  evaluateHeldout:async({candidatePool,baselinePlan,expandedPlan,expandedSlot})=>{
   assert.deepEqual(events,["qloo_recommend","qloo_rank","qloo_rank"]);
   assert.equal(expandedSlot,"music");
   assert.ok(candidatePool.some(x=>x.label==="C"&&x.slot==="music"));
   assert.ok(!baselinePlan.items.some(x=>x.label==="C"));
   assert.ok(expandedPlan.items.some(x=>x.label==="C"));
   return {status:"evaluated",delta_worst:-.123};
  }
 });
 assert.equal(result.heldout.status,"evaluated");
 assert.equal(result.heldout.delta_worst,-.123);
 assert.ok(result.difference_on_same_union>0);
});
