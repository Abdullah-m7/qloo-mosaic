import test from "node:test";
import assert from "node:assert/strict";
import {buildBridge} from "../src/engine.mjs";
import {buildNegotiationAtlas} from "../src/negotiation-atlas.mjs";
import {sample} from "../src/fixtures.mjs";

const key=items=>items.map(x=>x.id).join("|");
const allCombinations=(candidates,budget=210)=>{
 const slots=["music","food","experience"].map(x=>candidates.filter(c=>c.slot===x));
 const out=[];
 for(const a of slots[0])for(const b of slots[1])for(const c of slots[2]){
  if(a.cost+b.cost+c.cost>budget)continue;
  const avg=(field)=>(a[field]+b[field]+c[field])/3;
  out.push({id:key([a,b,c]),groupA:Math.round(avg("scoreA")*1000)/1000,
   groupB:Math.round(avg("scoreB")*1000)/1000});
 }
 return out;
};
test("atlas enumerates a deterministic, exact nondominated frontier",()=>{
 const result=buildBridge({candidates:sample.candidates,maxBudget:210});
 assert.equal(result.status,"ok");
 const atlas=result.negotiation;
 assert.equal(atlas.method,"exact-nondominated-ordinal-frontier");
 assert.equal(atlas.calls,0);
 assert.ok(atlas.evaluated>0&&atlas.nondominated>0);
 assert.ok(atlas.points.length<=10);
 assert.equal(atlas.points.filter(x=>x.isMaximin).length,1);
 assert.ok(atlas.points.some(x=>x.id===atlas.maximinId));
 const all=allCombinations(sample.candidates,210);
 for(const point of atlas.points){
  assert.ok(all.some(x=>x.id===point.id));
  assert.ok(!all.some(x=>x.groupA>=point.groupA&&x.groupB>=point.groupB
   &&(x.groupA>point.groupA||x.groupB>point.groupB)));
  assert.ok(point.regretA>=0&&point.regretB>=0);
  assert.equal(point.items.length,3);
 }
 const bestA=Math.max(...all.map(x=>x.groupA));
 const bestB=Math.max(...all.map(x=>x.groupB));
 assert.equal(atlas.points.at(-1).groupA,bestA);
 assert.equal(atlas.points[0].groupB,bestB);
 assert.deepEqual(
  buildBridge({candidates:sample.candidates,maxBudget:210}).negotiation,
  result.negotiation
 );
});
test("taste-blind control uses alphabetical candidate labels, not rank scores",()=>{
 const result=buildBridge({candidates:sample.candidates,maxBudget:210});
 const atlas=result.negotiation;
 const all=allCombinations(sample.candidates,210);
 const labels=new Map(sample.candidates.map(x=>[x.id,x.label.toLowerCase()]));
 const lex=id=>id.split("|").map(x=>labels.get(x)).join("|")+"|"+id;
 const alphabetic=[...all].sort((a,b)=>lex(a.id).localeCompare(lex(b.id)))[0];
 assert.equal(atlas.tasteBlind.id,alphabetic.id);
 assert.equal(atlas.tasteBlind.groupA,alphabetic.groupA);
 assert.equal(atlas.tasteBlind.groupB,alphabetic.groupB);
 assert.match(atlas.disclosure,/not evidence of out-of-sample human satisfaction/i);
});
test("atlas respects veto and finite budgets; it cannot reintroduce rejected IDs",()=>{
 const input=sample.candidates;
 const result=buildBridge({candidates:input,maxBudget:195,exclude:["downtempo"]});
 assert.equal(result.status,"ok");
 for(const point of [...result.negotiation.points,result.negotiation.tasteBlind]){
  assert.ok(!point.items.some(item=>item.id==="downtempo"));
  assert.ok(input.some(x=>x.id===point.items[0].id));
 }
 assert.throws(()=>buildNegotiationAtlas({feasible:[],bridge:{}}),/Grounded feasible plans/);
 assert.throws(()=>buildNegotiationAtlas({feasible:[result.bridge],bridge:result.bridge,limit:16}),/Invalid negotiation atlas budget/);
});
test("same-rank ties never fabricate a different nondominated preference point",()=>{
 const c=["music","food","experience"].flatMap((slot,i)=>[
  {id:slot+"a",slot,label:"A",source:"synthetic-fixture",evidence_id:"SYN-"+i+"A",cost:0,scoreA:.5,scoreB:.5},
  {id:slot+"b",slot,label:"B",source:"synthetic-fixture",evidence_id:"SYN-"+i+"B",cost:0,scoreA:.5,scoreB:.5}
 ]);
 const result=buildBridge({candidates:c,maxBudget:0});
 assert.equal(result.status,"ok");
 assert.equal(result.negotiation.nondominated,1);
 assert.equal(result.negotiation.calls,0);
 assert.ok(result.negotiation.points.length<=2);
});
