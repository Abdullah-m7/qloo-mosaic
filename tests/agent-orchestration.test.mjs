import test from "node:test";
import assert from "node:assert/strict";
import {discoverCulturalEvidence} from "../src/qloo.mjs";

const GROUP_A=["Radiohead"];
const GROUP_B=["Daft Punk"];
const kinds={artist:["Aster","Cobalt","Fern"],place:["Mosaic Hall","Garden Room","The Atrium"],movie:["Moonrise","Tide","Nocturne"]};
const makeTool=({sparseArtist=false,dropRank=false,alwaysEmpty=false}={})=>{
 const logs=[];
 const tool=async(name,args)=>{
  logs.push({name,args});
  if(name==="qloo_recommend"){
   const list=alwaysEmpty?[]:kinds[args.target_type];
   const fallbackArtist=sparseArtist && args.target_type==="artist" && args.signals.includes("Radiohead");
   const selected=fallbackArtist?list.slice(0,1):list;
   return {status:"ok",results:selected.map((name,i)=>({name,id:args.target_type+"-id-"+i}))};
  }
  if(name==="qloo_rank"){
   let ordered=args.signals.includes("Radiohead")?args.options:[...args.options].reverse();
   if(dropRank)ordered=ordered.slice(0,-1);
   return {status:"ok",results:ordered.map(name=>({name}))};
  }
  throw Error("Unexpected Qloo tool "+name);
 };
 return {tool,logs};
};

test("agent chooses bounded discovery, same-list ranks and maximin-ready evidence",async()=>{
 const mock=makeTool();
 const result=await discoverCulturalEvidence({a:GROUP_A,b:GROUP_B,place:"Jeddah",call:mock.tool});
 assert.equal(mock.logs.filter(x=>x.name==="qloo_recommend").length,3);
 assert.equal(mock.logs.filter(x=>x.name==="qloo_rank").length,6);
 assert.equal(result.candidates.length,9);
 assert.equal(result.trace.filter(x=>x.stage==="rank").length,3);
 assert.equal(result.trace.at(-1).stage,"negotiate");
 assert.ok(result.candidates.every(x=>x.qloo_entity_id&&x.evidence_id&&x.cost===0));
 assert.ok(result.candidates.every(x=>x.scoreA>=0&&x.scoreA<=1&&x.scoreB>=0&&x.scoreB<=1));
 for(const type of ["artist","place","movie"]){
  const requests=mock.logs.filter(x=>x.name==="qloo_rank"&&x.args.option_type===type);
  assert.deepEqual(requests[0].args.options,requests[1].args.options);
 }
});

test("agent adapts once to sparse joint discovery, but does not retry indefinitely",async()=>{
 const mock=makeTool({sparseArtist:true});
 const result=await discoverCulturalEvidence({a:GROUP_A,b:GROUP_B,place:"New York",call:mock.tool});
 const fallback=result.trace.filter(x=>x.strategy==="second-audience-fallback");
 assert.equal(fallback.length,1);
 assert.equal(fallback[0].slot,"music");
 assert.equal(mock.logs.filter(x=>x.name==="qloo_recommend").length,4);
 assert.equal(result.candidates.length,9);
});

test("agent abstains when neither primary nor bounded fallback has evidence",async()=>{
 const mock=makeTool({alwaysEmpty:true});
 await assert.rejects(()=>discoverCulturalEvidence({
  a:GROUP_A,b:GROUP_B,place:"Jeddah",call:mock.tool
 }),/Insufficient verifiable Qloo candidates/);
 assert.equal(mock.logs.filter(x=>x.name==="qloo_recommend").length,2);
 assert.equal(mock.logs.filter(x=>x.name==="qloo_rank").length,0);
});

test("agent abstains when Qloo ranks are incomplete, instead of guessing",async()=>{
 const mock=makeTool({dropRank:true});
 await assert.rejects(()=>discoverCulturalEvidence({
  a:GROUP_A,b:GROUP_B,place:"Jeddah",call:mock.tool
 }),/Incomplete Qloo ranking/);
});

test("agent never receives private user identifiers from the sample driver",async()=>{
 const mock=makeTool();
 await discoverCulturalEvidence({a:GROUP_A,b:GROUP_B,place:"Jeddah",call:mock.tool});
 assert.ok(mock.logs.every(x=>!JSON.stringify(x.args).includes("@")));
});
