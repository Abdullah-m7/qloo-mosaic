import test from "node:test";
import assert from "node:assert/strict";
import {summarizeThreadOpportunity} from "../src/thread-opportunity.mjs";
const c=(slot,id)=>({id:slot+":"+id,slot,qloo_entity_id:id});
const fixtures=[c("music","art1"),c("music","art2"),c("food","place1"),c("experience","film1")];
const tags=new Map([
 ["art1",[{id:"urn:tag:shared",name:"Private context should not leak"},
  {id:"urn:tag:uniqueA",name:"Only artist"}]],
 ["art2",[{id:"urn:tag:uniqueB",name:"Only other artist"}]],
 ["place1",[{id:"urn:tag:shared",name:"Private context should not leak"}]],
 ["film1",[{id:"urn:tag:film",name:"Only film"}]]
]);
test("cross-category exact Qloo tag IDs support only verifiable candidate combinations",()=>{
 const x=summarizeThreadOpportunity(fixtures,tags);
 assert.equal(x.candidates,4);
 assert.equal(x.with_provider_tag_metadata,4);
 assert.equal(x.cross_slot_pairs_with_matching_tag,1);
 assert.equal(x.all_candidate_triples,2);
 assert.equal(x.triples_with_verified_cross_slot_tag,1);
 assert.equal(x.provider_calls,0);
 assert.doesNotMatch(JSON.stringify(x),/Private context|Only artist|urn:tag:|art1|place1|film1/);
});
test("identical tag names with different provider identifiers cannot fake a cultural link",()=>{
 const t=new Map([
 ["art1",[{id:"urn:tag:artist:modern",name:"Modern"}]],
 ["place1",[{id:"urn:tag:place:modern",name:"Modern"}]],
 ["film1",[{id:"urn:tag:film:modern",name:"Modern"}]],
 ["art2",[]]
 ]);
 const s=summarizeThreadOpportunity(fixtures,t);
 assert.equal(s.cross_slot_pairs_with_matching_tag,0);
 assert.equal(s.triples_with_verified_cross_slot_tag,0);
});
test("missing tag metadata yields explicit zero evidence without guessing",()=>{
 const s=summarizeThreadOpportunity(fixtures,new Map());
 assert.equal(s.with_provider_tag_metadata,0);
 assert.equal(s.triples_with_verified_cross_slot_tag,0);
});
test("invalid metadata input cannot be assessed as a valid cultural link",()=>{
 assert.throws(()=>summarizeThreadOpportunity([],null),/grounded shortlist/);
 assert.throws(()=>summarizeThreadOpportunity({},new Map()),/grounded shortlist/);
});
