import test from "node:test";
import assert from "node:assert/strict";
import {buildBridge} from "../src/engine.mjs";
import {sample} from "../src/fixtures.mjs";

test("protected public choice must remain in resulting combination",()=>{
 const plan=buildBridge({candidates:sample.candidates,required:["acoustic"],maxBudget:210});
 assert.equal(plan.status,"ok");
 assert.ok(plan.bridge.items.some(x=>x.id==="acoustic"));
 assert.ok(plan.negotiation.points.every(p=>p.items.some(x=>x.id==="acoustic")));
 assert.equal(plan.resilience.impacts.find(x=>x.removed.id==="acoustic").status,"unavailable");
});
test("two incompatible protected options in the same category cause explicit no-agreement",()=>{
 const plan=buildBridge({candidates:sample.candidates,
  required:["acoustic","electronic"],maxBudget:210});
 assert.equal(plan.status,"no_feasible_plan");
 assert.match(plan.reason,/same category/);
});
test("rejecting another representative's protected choice cannot be silently overridden",()=>{
 const plan=buildBridge({candidates:sample.candidates,
  required:["downtempo"],exclude:["downtempo"],maxBudget:210});
 assert.equal(plan.status,"no_feasible_plan");
 assert.match(plan.reason,/both protected and rejected/);
});
test("invented protected candidate ID must be refused with no plan",()=>{
 const p=buildBridge({candidates:sample.candidates,required:["not-evidenced"],maxBudget:210});
 assert.equal(p.status,"needs_input");
 assert.match(p.reason,/unavailable/);
});
test("the unconstrained baseline remains the same when no choice is protected",()=>{
 const a=buildBridge({candidates:sample.candidates,maxBudget:210});
 const b=buildBridge({candidates:sample.candidates,maxBudget:210,required:[]});
 assert.deepEqual(a.bridge,b.bridge);
 assert.deepEqual(a.baselines,b.baselines);
});
test("malformed and duplicate protected ID fields are never silently tolerated",()=>{
 for(const required of [["acoustic","acoustic"],[42],[""],["a","b","c","d"]]){
  assert.throws(()=>buildBridge({candidates:sample.candidates,required}),/Invalid protected choices/);
 }
});

test("every protected plan carries exact same-evidence concession certificate",()=>{
 const baseline=buildBridge({candidates:sample.candidates,maxBudget:210});
 const guarded=buildBridge({candidates:sample.candidates,maxBudget:210,
  required:["acoustic"]});
 assert.equal(guarded.status,"ok");
 const result=guarded.protectionImpact;
 assert.equal(result.method,"same-evidence-protected-choice-regret");
 assert.equal(result.provider_calls,0);
 assert.equal(result.protected_count,1);
 assert.equal(result.unconstrained_worst,baseline.bridge.worst);
 assert.equal(result.protected_worst,guarded.bridge.worst);
 assert.equal(result.worst_proxy_loss,
  Math.round((baseline.bridge.worst-guarded.bridge.worst)*1000)/1000);
 assert.ok(result.worst_proxy_loss>=0);
 assert.match(result.limitation,/not measured audience/);
 assert.equal(baseline.protectionImpact,null);
});
