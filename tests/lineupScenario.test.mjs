import test from "node:test";
import assert from "node:assert/strict";
import {auditLineup} from "../src/lineupAudit.mjs";
import {lineupSample} from "../src/lineupFixtures.mjs";
test("fictional one-act festival cancellation is fixed by a specific replacement",()=>{
 const plan=auditLineup(lineupSample);
 assert.equal(plan.status,"repair");
 assert.equal(plan.changes.length,1);
 assert.equal(plan.changes[0].addId,"artist:D");
 assert.ok(plan.worstProxyGain>0);
 assert.equal(plan.proof.rankingUniverseSize,5);
});
test("replacing unavailable artist is prohibited even if rankings are attractive",()=>{
 const s=structuredClone(lineupSample);
 s.candidatePool[0].organizerConfirmedAvailable=false;
 const plan=auditLineup(s);
 if(plan.status==="repair")assert.notEqual(plan.changes[0].addId,"artist:D");
});
test("locked cancelled act is not silently edited",()=>{
 const s=structuredClone(lineupSample);
 s.protectedIds.push(s.cancelledId);
 assert.throws(()=>auditLineup(s),/non-protected/);
});
