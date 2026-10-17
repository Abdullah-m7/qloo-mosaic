import test from "node:test";
import assert from "node:assert/strict";
import {buildBridge} from "../src/engine.mjs";
import {findVerifiedThreadChoice,cachedSelectedTagEvidence} from "../src/thread-choice.mjs";
const entity=(slot,id,score)=>({id:slot+":"+id,slot,
 label:"Public "+id,source:"qloo-rest:insights+rank",evidence_id:"QL-"+id,
 qloo_entity_id:id,cost:0,scoreA:score,scoreB:score});
const list=[
 entity("music","lead",.9),entity("music","artist-thread",.87),
 entity("food","place-lead",.9),entity("food","place-other",.85),
 entity("experience","film-lead",.9),entity("experience","film-other",.7)
];
const tags=new Map([
 ["lead",[{id:"urn:tag:music:other",name:"Other"}]],
 ["artist-thread",[{id:"urn:tag:shared:concept",name:"Common public culture"}]],
 ["place-lead",[{id:"urn:tag:place:alone",name:"Place descriptor"}]],
 ["place-other",[]],
 ["film-lead",[{id:"urn:tag:shared:concept",name:"Common public culture"}]],
 ["film-other",[]]
]);
test("verified cultural thread can trade a small explicit proxy margin for exact Qloo overlap",()=>{
 const maximin=buildBridge({candidates:list,maxBudget:0});
 assert.equal(maximin.status,"ok");
 const result=findVerifiedThreadChoice({candidates:list,tagIndex:tags,
  bridge:maximin.bridge,maxBudget:0,maxLoss:.05});
 assert.equal(result.status,"verified");
 assert.equal(result.provider_calls,0);
 assert.equal(result.maximin_worst,.9);
 assert.ok(result.worst_rank_proxy_loss>0&&result.worst_rank_proxy_loss<=.05);
 assert.ok(result.alternative.items.some(x=>x.id==="music:artist-thread"));
 assert.ok(result.alternative.items.some(x=>x.id==="experience:film-lead"));
 assert.equal(result.verified_motifs.length,1);
 assert.equal(result.verified_motifs[0].id,"urn:tag:shared:concept");
 assert.deepEqual(result.verified_motifs[0].slots,["experience","music"]);
 assert.match(result.disclaimer,/not predicted/i);
});
test("thread choice abstains when requested evidence is missing or exceeds fairness threshold",()=>{
 const maximin=buildBridge({candidates:list,maxBudget:0});
 const none=findVerifiedThreadChoice({candidates:list,tagIndex:new Map(),
  bridge:maximin.bridge,maxLoss:.05});
 assert.equal(none.status,"no_verified_thread");
 assert.equal(none.with_verifiable_thread,0);
 const strict=findVerifiedThreadChoice({candidates:list,tagIndex:tags,
  bridge:maximin.bridge,maxLoss:.001});
 assert.equal(strict.status,"no_verified_thread");
 assert.ok(strict.within_fairness_bound>=1);
});
test("thread evidence respects the user's exclusions and cannot reuse vetoed candidates",()=>{
 const plan=buildBridge({candidates:list,maxBudget:0,exclude:["music:artist-thread"]});
 const result=findVerifiedThreadChoice({candidates:list,tagIndex:tags,
  bridge:plan.bridge,exclude:["music:artist-thread"]});
 assert.equal(result.status,"no_verified_thread");
});
test("cached evidence for new selected plan only carries exact provider tag IDs",()=>{
 const selected=[list[1],list[2],list[4]];
 const evidence=cachedSelectedTagEvidence(selected,tags);
 assert.equal(evidence.length,3);
 assert.equal(evidence.find(x=>x.slot==="music").tags[0].id,"urn:tag:shared:concept");
 assert.ok(evidence.every(x=>x.tags.every(tag=>tag.id.startsWith("urn:tag:"))));
 assert.ok(!evidence.some(x=>x.optionId==="music:lead"));
 assert.deepEqual(cachedSelectedTagEvidence([],new Map()),[]);
});
test("malformed or ungrounded tag data cannot fabricate a documented cultural link",()=>{
 const wrong=new Map([
 ["artist-thread",[{id:"urn:tag:one",name:"Shared name"}]],
 ["film-lead",[{id:"urn:tag:two",name:"Shared name"}]]
 ]);
 const base=buildBridge({candidates:list,maxBudget:0});
 assert.equal(findVerifiedThreadChoice({candidates:list,tagIndex:wrong,
  bridge:base.bridge}).status,"no_verified_thread");
 assert.throws(()=>findVerifiedThreadChoice({candidates:list,tagIndex:null,
  bridge:base.bridge}),/Invalid grounded/);
});

test("a provider-tag thread is forbidden from silently replacing an organizer-protected choice",()=>{
 const locked=buildBridge({candidates:list,maxBudget:0,required:["music:lead"]});
 assert.equal(locked.status,"ok");
 const thread=findVerifiedThreadChoice({candidates:list,tagIndex:tags,
  bridge:locked.bridge,maxBudget:0,required:["music:lead"]});
 assert.equal(thread.status,"no_verified_thread");
 assert.equal(thread.provider_calls,0);
 const shared=buildBridge({candidates:list,maxBudget:0,required:["experience:film-lead"]});
 const permitted=findVerifiedThreadChoice({candidates:list,tagIndex:tags,
  bridge:shared.bridge,maxBudget:0,required:["experience:film-lead"]});
 assert.equal(permitted.status,"verified");
 assert.ok(permitted.alternative.items.some(x=>x.id==="experience:film-lead"));
});
