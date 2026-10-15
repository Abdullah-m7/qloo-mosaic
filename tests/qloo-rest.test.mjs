import test from "node:test";
import assert from "node:assert/strict";
import {QlooRestClient} from "../src/qloo-rest.mjs";

function fixture(){
 const calls=[];
 const anchors=new Map([["Radiohead","seed-a"],["Daft Punk","seed-b"]]);
 const choices=[
  {name:"Mosaic Artist",entity_id:"artist-1",type:"urn:entity:artist"},
  {name:"Lantern Artist",entity_id:"artist-2",type:"urn:entity:artist"},
  {name:"Gallery Artist",entity_id:"artist-3",type:"urn:entity:artist"}
 ];
 const fetchImpl=async(url,request)=>{
  const path=new URL(url);
  calls.push({path,request});
  let results=[];
  if(path.pathname==="/search"){
   const name=path.searchParams.get("query");
   if(anchors.has(name))results=[{name,entity_id:anchors.get(name),type:"urn:entity:artist"}];
  }else if(path.pathname==="/v2/insights"){
   const fixed=path.searchParams.get("filter.results.entities");
   results=fixed?choices.filter(x=>fixed.split(",").includes(x.entity_id)).reverse():choices;
  }
  return new Response(JSON.stringify({results:{entities:results}}),{status:200});
 };
 return {calls,fetchImpl};
}

test("documented two-stage Qloo flow grounds candidates and independently ranks",async()=>{
 const mock=fixture();
 const client=new QlooRestClient({apiKey:"synthetic-test",fetchImpl:mock.fetchImpl});
 const rec=await client.call("qloo_recommend",{target_type:"artist",
  signals:["Radiohead","Daft Punk"],limit:3});
 assert.equal(rec.results.length,3);
 const names=rec.results.map(x=>x.name);
 const ranked=await client.call("qloo_rank",{option_type:"artist",
  options:names,signals:["Radiohead"]});
 assert.deepEqual(ranked.results.map(x=>x.name),names.slice().reverse());
 assert.equal(mock.calls.filter(x=>x.path.pathname==="/search").length,2);
 for(const search of mock.calls.filter(x=>x.path.pathname==="/search")){
  assert.equal(search.path.searchParams.get("types"),"urn:entity:artist,urn:entity:movie");
 }
 const rank=mock.calls.find(x=>x.path.searchParams.has("filter.results.entities"));
 assert.equal(rank.path.searchParams.get("filter.type"),"urn:entity:artist");
 assert.equal(rank.path.searchParams.get("filter.results.entities"),"artist-1,artist-2,artist-3");
 assert.equal(rank.path.searchParams.get("signal.interests.entities"),"seed-a");
 assert.ok(mock.calls.every(x=>x.path.origin==="https://hackathon.api.qloo.com"));
 assert.ok(mock.calls.every(x=>x.request.method==="GET"));
 assert.ok(mock.calls.every(x=>!x.path.search.includes("synthetic-test")));
});

test("live mode refuses incomplete ranking instead of filling missing values",async()=>{
 const mock=fixture();
 const fetchImpl=async(url,request)=>{
  const response=await mock.fetchImpl(url,request);
  const u=new URL(url);
  if(!u.searchParams.has("filter.results.entities"))return response;
  return new Response(JSON.stringify({results:{entities:[
   {name:"Mosaic Artist",entity_id:"artist-1",type:"urn:entity:artist"}
  ]}}),{status:200});
 };
 const client=new QlooRestClient({apiKey:"synthetic-test",fetchImpl});
 const rec=await client.call("qloo_recommend",{target_type:"artist",signals:["Radiohead"],limit:3});
 await assert.rejects(()=>client.call("qloo_rank",{
  option_type:"artist",options:rec.results.map(x=>x.name),signals:["Radiohead"]
 }),/QLOO_INCOMPLETE_RANKING/);
});
test("failed Qloo authentication is not silently treated as synthetic evidence",async()=>{
 const client=new QlooRestClient({apiKey:"synthetic-test",
  fetchImpl:async()=>new Response("",{status:401})});
 await assert.rejects(()=>client.call("qloo_recommend",{
  target_type:"movie",signals:["Radiohead"]
 }),/QLOO_HTTP_401/);
});

test("real Qloo search items without type still resolve inside a typed query",async()=>{
 let called=false;
 const client=new QlooRestClient({apiKey:"synthetic-test",
  fetchImpl:async(url)=>{
   const parsed=new URL(url);
   assert.equal(parsed.pathname,"/search");
   assert.equal(parsed.searchParams.get("types"),"urn:entity:artist,urn:entity:movie");
   called=true;
   return new Response(JSON.stringify({results:[
    {name:"Radiohead",entity_id:"typed-artist-id"},
    {name:"Radiohead Deluxe",entity_id:"irrelevant-id"}
   ]}),{status:200});
  }});
 assert.equal(await client.resolveSeed("Radiohead"),"typed-artist-id");
 assert.equal(called,true);
});
