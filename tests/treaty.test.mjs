import test from "node:test";
import assert from "node:assert/strict";
import {createTreaty,extractTagFacts,deriveCulturalMotifs} from "../src/treaty.mjs";
import {buildBridge} from "../src/engine.mjs";
import {sample} from "../src/fixtures.mjs";

test("bridge treaty calculates exact verified ordinal proxy trade-offs",()=>{
 const r=buildBridge({candidates:sample.candidates,maxBudget:210});
 const t=createTreaty({candidates:sample.candidates,plan:r});
 assert.equal(t.label,"Cultural Bridge Agreement");
 assert.equal(t.worstGain,r.improvement);
 assert.equal(t.meanSacrifice,r.tradeoff.meanChange);
 assert.ok(Math.abs(t.gapBefore-Math.abs(r.baseline.groupA-r.baseline.groupB))<.00001);
 assert.ok(Math.abs(t.gapAfter-Math.abs(r.bridge.groupA-r.bridge.groupB))<.00001);
 assert.equal(t.selected.length,3);
 assert.equal(t.provenance.kind,"synthetic");
 assert.equal(t.provenance.verifiedCrossDomainMotif,false);
});

test("shared cross-domain motif must actually appear in two distinct event slots",()=>{
 const tags=[
  {optionId:"m1",slot:"music",tags:[{id:"urn:tag:ambient",name:"Ambient"},{id:"urn:tag:hiphop",name:"Hip-hop"}]},
  {optionId:"f1",slot:"food",tags:[{id:"urn:tag:ambient",name:"Ambient"}]},
  {optionId:"m2",slot:"music",tags:[{id:"urn:tag:hiphop",name:"Hip-hop"}]}
 ];
 const motifs=deriveCulturalMotifs(tags);
 assert.equal(motifs.length,1);
 assert.equal(motifs[0].label,"Ambient");
 assert.deepEqual(motifs[0].options,["f1","m1"]);
});

test("no cross-domain intersection means no invented motif",()=>{
 assert.deepEqual(deriveCulturalMotifs([
  {optionId:"a",slot:"music",tags:[{id:"urn:x",name:"Funk"}]},
  {optionId:"b",slot:"food",tags:[{id:"urn:y",name:"Art"}]}
 ]),[]);
});
test("unrelated or unselected tags cannot justify a treaty claim",()=>{
 const r=buildBridge({candidates:sample.candidates,maxBudget:210});
 const chosen=r.bridge.items[0],other=r.bridge.items[1];
 const t=createTreaty({candidates:sample.candidates,plan:r,tagEvidence:[
  {optionId:"other",slot:"music",tags:[{id:"urn:x",name:"Shared"}]},
  {optionId:other.id,slot:other.slot,tags:[{id:"urn:x",name:"Shared"}]},
  {optionId:chosen.id,slot:chosen.slot,tags:[{id:"urn:y",name:"Different"}]}
 ]});
 assert.equal(t.motifs.length,0);
});

test("extract tag objects from a valid normalized Qloo envelope",()=>{
 const r=extractTagFacts({status:"ok",results:[
  {tag:{id:"urn:tag:jazz",name:"Jazz"}},
  {tags:[{id:"urn:tag:pop",name:"Pop"}]},
  {id:"urn:tag:jazz",name:"Jazz"},
  {}
 ]});
 assert.deepEqual(r,[{id:"urn:tag:jazz",name:"Jazz"},{id:"urn:tag:pop",name:"Pop"}]);
});
test("a failed plan does not create an agreement",()=>{
 assert.equal(createTreaty({candidates:[],plan:{status:"needs_input"}}),null);
});
