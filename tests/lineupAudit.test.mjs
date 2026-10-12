import test from "node:test";
import assert from "node:assert/strict";
import {auditLineup} from "../src/lineupAudit.mjs";

const entities=(ids)=>ids.map(id=>({id,label:"Artist "+id}));
const example=()=>({
 lineup:entities(["A","B","C"]),
 candidatePool:entities(["D","E"]).map(x=>({...x,organizerConfirmedAvailable:true})),
 cancelledId:"B",
 audienceRankings:[
  {id:"film",label:"Film audience",orderedIds:["A","B","C","D","E"]},
  {id:"electronic",label:"Electronic audience",orderedIds:["D","E","C","B","A"]}
 ],
 maxLossFromOriginal:.30
});

test("repairs a cancelled real slot with exactly one available candidate",()=>{
 const result=auditLineup(example());
 assert.equal(result.status,"repair");
 assert.equal(result.changes.length,1);
 assert.equal(result.changes[0].removeId,"B");
 assert.equal(result.changes[0].addId,"D");
 assert.deepEqual(result.proposedLineupIds,["A","C","D"]);
 assert.ok(result.worstProxyGain>0);
 assert.equal(result.proposed.groups.length,2);
 assert.equal(result.proof.rankingUniverseSize,5);
});

test("swapping audience labels/order cannot change the chosen repair",()=>{
 const x=example(),y=example();
 y.audienceRankings.reverse();
 const a=auditLineup(x),b=auditLineup(y);
 assert.equal(a.status,"repair");assert.equal(b.status,"repair");
 assert.deepEqual(a.proposedLineupIds,b.proposedLineupIds);
 assert.equal(a.proposed.worst,b.proposed.worst);
});

test("strict identity rejects same-label different entity and missing ranked IDs",()=>{
 const a=example();
 a.audienceRankings[0].orderedIds=["A","B","C","D","WRONG"];
 assert.throws(()=>auditLineup(a),/Identity mismatch or incomplete Qloo rank result/);
 const b=example();b.audienceRankings[0].orderedIds=["A","B","C","D","D"];
 assert.throws(()=>auditLineup(b),/Identity mismatch or incomplete Qloo rank result/);
});

test("unverified organizer availability is never treated as confirmed",()=>{
 const a=example();a.candidatePool.forEach(c=>c.organizerConfirmedAvailable=false);
 const result=auditLineup(a);
 assert.equal(result.status,"needs_input");
 assert.equal(result.changes,undefined);
});

test("protected artist cannot be replaced",()=>{
 const a=example();a.cancelledId=null;a.protectedIds=["A","C"];a.maxLossFromOriginal=.50;
 const result=auditLineup(a);
 if(result.status==="repair")assert.equal(result.changes[0].removeId,"B");
});

test("impossible constraints produce explicit no_safe_repair",()=>{
 const a=example();a.maxLossFromOriginal=0;
 const result=auditLineup(a);
 assert.equal(result.status,"no_safe_repair");
 assert.ok(!("proposedLineupIds" in result));
});

test("at most ten Qloo identities per compared shortlist, never segment/merge incomparable ranks",()=>{
 const a=example();a.candidatePool.push(...entities(["F","G","H","I","J","K"]).map(x=>({...x,organizerConfirmedAvailable:true})));
 assert.throws(()=>auditLineup(a),/at most 10/);
});

test("no cancellation: evaluate a program or keep it if no reliable gain",()=>{
 const a=example();a.cancelledId=null;a.minImprovement=1;
 const result=auditLineup(a);
 assert.equal(result.status,"keep");
 assert.equal(result.original.worst,result.baseline.worst);
});

test("optional anonymous audience numbers do not imply personal identity",()=>{
 const a=example();
 const r=auditLineup(a);
 assert.match(r.proof.limitations,/not attendance/);
 assert.match(r.proof.limitations,/self-declared/);
});
