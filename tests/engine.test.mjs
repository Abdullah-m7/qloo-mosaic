import test from "node:test";
import assert from "node:assert/strict";
import {buildBridge,evaluatePlan} from "../src/engine.mjs";
import {sample} from "../src/fixtures.mjs";
test("maximin bridge improves the worst-off group",()=>{
 const r=buildBridge({candidates:sample.candidates,maxBudget:210});
 assert.equal(r.status,"ok");assert.equal(r.bridge.items.length,3);
 assert.ok(r.bridge.worst>r.baseline.worst);assert.ok(r.bridge.cost<=210);
 assert.equal(r.source_mode,"synthetic");
});
test("rejecting one option forces a different plan",()=>{
 const first=buildBridge({candidates:sample.candidates,maxBudget:210});
 const banned=first.bridge.items[0].id;
 const second=buildBridge({candidates:sample.candidates,maxBudget:210,exclude:[banned]});
 assert.equal(second.status,"ok");assert.ok(!second.bridge.items.some(x=>x.id===banned));
});
test("budget is hard constraint",()=>{
 const r=buildBridge({candidates:sample.candidates,maxBudget:140});
 if(r.status==="ok")assert.ok(r.bridge.cost<=140);
 else assert.equal(r.status,"no_feasible_plan");
});
test("no evidence yields no result",()=>{
 assert.equal(buildBridge({candidates:sample.candidates.map(x=>({...x,evidence_id:""}))}).status,"needs_input");
});
test("missing group score is never imputed",()=>{
 assert.equal(buildBridge({candidates:sample.candidates.map(x=>({...x,scoreB:null}))}).status,"needs_input");
});
test("do not claim individual behavior",()=>{
 assert.match(buildBridge({candidates:sample.candidates}).explanation.limitation,/not a prediction/i);
});
test("invalid budgets rejected",()=>{
 assert.throws(()=>buildBridge({candidates:sample.candidates,maxBudget:-1}),/Invalid budget/);
});
test("planner doesn't mutate inputs",()=>{
 const original=JSON.stringify(sample.candidates);
 buildBridge({candidates:sample.candidates,maxBudget:180});
 assert.equal(JSON.stringify(sample.candidates),original);
});
test("scoring arithmetic",()=>{
 const p=evaluatePlan([sample.candidates[0],sample.candidates[1]]);
 assert.equal(p.cost,120);assert.equal(p.groupA,.615);assert.equal(p.groupB,.64);
});
