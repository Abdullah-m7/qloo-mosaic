import test from "node:test";
import assert from "node:assert/strict";
import {buildBridge} from "../src/engine.mjs";
import {sample} from "../src/fixtures.mjs";

test("single-veto resilience equals complete independent re-optimization",()=>{
 const base=buildBridge({candidates:sample.candidates,maxBudget:210});
 assert.equal(base.status,"ok");
 assert.equal(base.resilience.provider_calls,0);
 assert.equal(base.resilience.method,"single-option-veto");
 assert.equal(base.resilience.evaluated_exclusions,3);
 for(const impact of base.resilience.impacts){
  const expected=buildBridge({candidates:sample.candidates,maxBudget:210,exclude:[impact.removed.id]});
  assert.equal(impact.status,expected.status==="ok"?"feasible":"unavailable");
  if(expected.status!=="ok")continue;
  assert.equal(impact.worst_after,expected.bridge.worst);
  assert.equal(impact.worst_rank_loss,Math.max(0,Math.round((base.bridge.worst-expected.bridge.worst)*1000)/1000));
  assert.ok(!expected.bridge.items.some(x=>x.id===impact.removed.id));
  assert.deepEqual(impact.changes.map(x=>x.id),
   expected.bridge.items.filter((x,i)=>x.id!==base.bridge.items[i].id).map(x=>x.id));
  assert.ok(impact.changes.every(x=>x.evidence_id&&x.slot&&x.label));
 }
});
test("no ranked alternative is disclosed honestly without invented proxy loss",()=>{
 const onePerCategory=[
  {id:"m",slot:"music",scoreA:.7,scoreB:.8},
  {id:"f",slot:"food",scoreA:.7,scoreB:.8},
  {id:"x",slot:"experience",scoreA:.7,scoreB:.8}
 ].map(x=>({...x,cost:0,label:"Public cultural option",source:"qloo-rest:insights+rank",evidence_id:"QL-"+x.id}));
 const r=buildBridge({candidates:onePerCategory,maxBudget:0});
 assert.equal(r.status,"ok");
 assert.equal(r.source_mode,"evidence-backed");
 assert.equal(r.resilience.impacts.length,3);
 for(const item of r.resilience.impacts){
  assert.equal(item.status,"unavailable");
  assert.equal(item.worst_after,null);
  assert.equal(item.worst_rank_loss,null);
  assert.deepEqual(item.changes,[]);
 }
});
test("counterfactual impacts exclude already vetoed items and preserve input isolation",()=>{
 const before=JSON.stringify(sample.candidates);
 const r=buildBridge({candidates:sample.candidates,maxBudget:210,exclude:["downtempo"]});
 assert.equal(r.status,"ok");
 for(const row of r.resilience.impacts){
  assert.notEqual(row.removed.id,"downtempo");
  assert.ok(row.changes.every(x=>x.id!=="downtempo"));
 }
 assert.equal(JSON.stringify(sample.candidates),before);
});
