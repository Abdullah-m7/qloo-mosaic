import test from "node:test";
import assert from "node:assert/strict";
import {enrichSelectedTags} from "../src/qloo.mjs";
import {deriveCulturalMotifs,extractTagFacts} from "../src/treaty.mjs";

const selected=[
 {id:"music:art1",slot:"music",qloo_entity_id:"art1"},
 {id:"food:place1",slot:"food",qloo_entity_id:"place1"},
 {id:"experience:film1",slot:"experience",qloo_entity_id:"film1"}
];

test("limited Qloo tag enrichment returns cross-category proof only on repeated exact tags",async()=>{
 const calls=[];
 const fake=async(name,args)=>{
  calls.push({name,args});
  return {status:"ok",results:args.entities[0]==="film1"?[
    {id:"urn:tag:quiet",name:"Quiet"}
  ]:[
    {id:"urn:tag:immersive",name:"Immersive"},
    {id:"urn:tag:"+args.entities[0],name:args.entities[0]}
  ]};
 };
 const result=await enrichSelectedTags({selected,call:fake});
 assert.equal(calls.length,3);
 assert.deepEqual(calls.map(x=>x.args.entity_type),["artist","place","movie"]);
 assert.equal(result.trace.filter(x=>x.status==="verified").length,3);
 const motifs=deriveCulturalMotifs(result.tagEvidence);
 assert.deepEqual(motifs.map(m=>m.label),["Immersive"]);
});

test("missing Qloo tags cannot be invented or crash agent proposal",async()=>{
 const fake=async(name,args)=>{
  if(args.entity_type==="place")throw Error("Qloo currently unavailable");
  return {results:[]};
 };
 const result=await enrichSelectedTags({selected,call:fake});
 assert.equal(result.tagEvidence.length,2);
 assert.equal(result.trace.filter(x=>x.status==="unavailable").length,1);
 assert.deepEqual(deriveCulturalMotifs(result.tagEvidence),[]);
});

test("prevents unbounded enrichment and ungrounded identities",async()=>{
 await assert.rejects(()=>enrichSelectedTags({
  selected:[...selected,selected[0]],call:async()=>({})
 }),/At most three/);
 await assert.rejects(()=>enrichSelectedTags({
  selected:[{id:"orphan",slot:"music"}],call:async()=>({})
 }),/lacks original Qloo identity/);
});

test("late provider tags are retained for exact cross-category motif checks",()=>{
 const filler=Array.from({length:89},(_,i)=>({id:"urn:tag:source-"+i,name:"Cultural descriptor "+i}));
 const overlap={id:"urn:tag:shared-after-eighty",name:"Shared cultural thread"};
 const artist=extractTagFacts({results:[...filler,overlap]});
 const movie=extractTagFacts({results:[overlap]});
 assert.equal(artist.length,90);
 const motifs=deriveCulturalMotifs([
  {optionId:"music:artist1",slot:"music",tags:artist},
  {optionId:"experience:movie1",slot:"experience",tags:movie}
 ]);
 assert.equal(motifs.length,1);
 assert.equal(motifs[0].id,overlap.id);
 assert.deepEqual(motifs[0].slots,["experience","music"]);
});
