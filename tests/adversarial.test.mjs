import test from "node:test";
import assert from "node:assert/strict";
import {buildBridge,evaluatePlan,SLOTS} from "../src/engine.mjs";
import {sample} from "../src/fixtures.mjs";
const read = (budget=210, options=sample.candidates)=>buildBridge({candidates:options,maxBudget:budget});
test("worst group optimum is global among all feasible combinations",()=>{
 const run=read();assert.equal(run.status,"ok");
 const buckets=SLOTS.map(slot=>sample.candidates.filter(x=>x.slot===slot));
 for(const x of buckets[0])for(const y of buckets[1])for(const z of buckets[2]){
  const combo=evaluatePlan([x,y,z]);
  if(combo.cost<=210)assert.ok(run.bridge.worst+0.0001>=combo.worst);
 }
});
test("majority baseline globally maximizes A preference rank proxy",()=>{
 const run=read();
 const slots=SLOTS.map(slot=>sample.candidates.filter(x=>x.slot===slot));
 for(const m of slots[0])for(const f of slots[1])for(const e of slots[2]){
  const p=evaluatePlan([m,f,e]);
  if(p.cost<=210)assert.ok(run.baselines.majority.groupA+0.0001>=p.groupA);
 }
});
test("mean baseline globally maximizes average rank proxy",()=>{
 const run=read();
 const slots=SLOTS.map(slot=>sample.candidates.filter(x=>x.slot===slot));
 for(const m of slots[0])for(const f of slots[1])for(const e of slots[2]){
  const p=evaluatePlan([m,f,e]);
  if(p.cost<=210)assert.ok(run.baselines.average.mean+0.0001>=p.mean);
 }
});
test("plan optimality never relies on a particular input ordering",()=>{
 const first=read();
 const second=read(210,[...sample.candidates].reverse());
 assert.deepEqual(first.bridge.items.map(x=>x.id),second.bridge.items.map(x=>x.id));
});
test("duplicate candidate IDs do not become separate options",()=>{
 const c=[...sample.candidates,{...sample.candidates[0],slot:"experience"}];
 const r=read(210,c);
 assert.equal(r.status,"needs_input");
 assert.match(r.reason,/duplicate/i);
});
test("mixed evidence sources cannot be mistaken for one live result",()=>{
 const c=sample.candidates.map((x,i)=>({...x,source:i===0?"qloo-mcp:recommend+rank":x.source}));
 const r=read(210,c);assert.equal(r.status,"needs_input");assert.match(r.reason,/mixed/i);
});
test("impossible budget correctly abstains rather than inventing cheap alternatives",()=>{
 const r=read(5);assert.equal(r.status,"no_feasible_plan");
});
test("evidence-free options are all rejected",()=>{
 const c=sample.candidates.map(x=>({...x,evidence_id:""}));
 const r=read(210,c);assert.equal(r.status,"needs_input");
});
test("exclude all music leaves no partial fake plan",()=>{
 const r=buildBridge({candidates:sample.candidates,maxBudget:210,exclude:sample.candidates.filter(x=>x.slot==="music").map(x=>x.id)});
 assert.equal(r.status,"needs_input");
});
test("reject NaN, negative cost, and overflowing score",()=>{
 const c=sample.candidates.map(x=>({...x,scoreA:Number.NaN,scoreB:1.2,cost:-1}));
 assert.equal(read(210,c).status,"needs_input");
});
test("reject malformed exclusions instead of matching unsafe object fields",()=>{
 assert.throws(()=>buildBridge({candidates:sample.candidates,exclude:{a:1}}),/Invalid exclusions/);
});
test("no claim of calibrated probabilities",()=>{
 const r=read();assert.match(r.explanation.limitation,/not a prediction/i);
 assert.match(r.explanation.limitation,/not.*actual fairness/i);
});
test("a plan always contains one of each type with real evidence ID",()=>{
 for(const budget of [140,160,180,210,260]){
  const r=read(budget);if(r.status!=="ok")continue;
  assert.deepEqual(r.bridge.items.map(x=>x.slot),SLOTS);
  assert.ok(r.bridge.items.every(x=>x.evidence_id&&x.source));
  assert.ok(r.bridge.cost<=budget);
 }
});
test("maximin never less fair on its own ranking proxy than majority or average",()=>{
 const r=read();
 assert.ok(r.bridge.worst>=r.baselines.majority.worst);
 assert.ok(r.bridge.worst>=r.baselines.average.worst);
});
