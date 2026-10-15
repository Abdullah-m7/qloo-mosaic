#!/usr/bin/env node
// Exploratory multi-signal versus single-signal held-out Qloo experiment.
// No raw Qloo entity responses or private metrics go to public CI logs.
import {QlooRestClient} from "../src/qloo-rest.mjs";
import {discoverCulturalEvidence,extractItems,matchRanks} from "../src/qloo.mjs";
import {buildBridge,evaluatePlan,SLOTS} from "../src/engine.mjs";
import {writeEncryptedAblation} from "./encrypt-ablation.mjs";

const E=(name,type,year=null)=>({name,type,...(year?{year}:{})});
const cases=[
 {case:"indie-electronic-multi",location:"New York",
  a:[E("Radiohead","artist"),E("The Grand Budapest Hotel","movie")],
  b:[E("Daft Punk","artist"),E("Blade Runner 2049","movie")],
  heldA:E("Arcade Fire","artist"),heldB:E("Justice","artist")},
 {case:"alternative-jazz-multi",location:"London",
  a:[E("Björk","artist"),E("Spirited Away","movie")],
  b:[E("Miles Davis","artist"),E("Casablanca","movie")],
  heldA:E("Sigur Rós","artist"),heldB:E("John Coltrane","artist")},
 {case:"global-pop-multi",location:"Los Angeles",
  a:[E("Taylor Swift","artist"),E("Barbie","movie",2023)],
  b:[E("BTS","artist"),E("Parasite","movie")],
  heldA:E("Olivia Rodrigo","artist"),heldB:E("BLACKPINK","artist")}
];
const types={music:"artist",food:"place",experience:"movie"};
const round=x=>Math.round(x*1000)/1000;
const average=arr=>arr.reduce((s,x)=>s+x,0)/arr.length;
const assess=(plan,held)=>{
 if(!plan?.items?.length)return null;
 const items=plan.items.map(x=>held.get(x.id));
 return items.every(Boolean)?evaluatePlan(items):null;
};
function polarizedBridge(candidates,penalty=0.25){
 const bySlot=SLOTS.map(slot=>candidates.filter(x=>x.slot===slot));
 if(bySlot.some(bucket=>bucket.length===0))throw Error("INCOMPLETE_CULTURAL_SLOTS");
 let best=null;
 for(const a of bySlot[0])for(const b of bySlot[1])for(const c of bySlot[2]){
  const plan=evaluatePlan([a,b,c]);
  const polar=average([a,b,c].map(x=>Math.abs(x.scoreA-x.scoreB)));
  const objective=plan.worst-penalty*polar;
  if(!best||objective>best.objective+1e-9||
   (Math.abs(objective-best.objective)<1e-9&&plan.mean>best.plan.mean)){
   best={plan,objective};
  }
 }
 return best.plan;
}
async function rankedAgainst(client,candidates,signalsA,signalsB){
 const scores=new Map();
 for(const slot of SLOTS){
  const list=candidates.filter(x=>x.slot===slot);
  const names=list.map(x=>x.label),option_type=types[slot];
  const [a,b]=await Promise.all([
   client.call("qloo_rank",{options:names,option_type,signals:signalsA}),
   client.call("qloo_rank",{options:names,option_type,signals:signalsB})
  ]);
  const results=matchRanks(names,extractItems(a).map(x=>x.name),
   extractItems(b).map(x=>x.name));
  for(const item of list){
   const result=results.find(x=>x.name===item.label);
   if(!result)throw Error("INCOMPLETE_MATCHED_RANKS");
   scores.set(item.id,{...item,scoreA:result.scoreA,scoreB:result.scoreB});
  }
 }
 return scores;
}
async function runOne(s){
 const client=new QlooRestClient({maxRequests:36});
 try{
  const {candidates}=await discoverCulturalEvidence({
   a:s.a,b:s.b,place:s.location,
   call:(name,args)=>client.call(name,args)
  });
  const multi=buildBridge({candidates,maxBudget:210});
  if(multi.status!=="ok")throw Error("MULTI_ANCHOR_PLAN_UNAVAILABLE");
  const oneRanks=await rankedAgainst(client,candidates,[s.a[0]],[s.b[0]]);
  const single=buildBridge({
   candidates:candidates.map(x=>oneRanks.get(x.id)),maxBudget:210
  });
  if(single.status!=="ok")throw Error("SINGLE_ANCHOR_PLAN_UNAVAILABLE");
  const robust=polarizedBridge(candidates,0.25);
  const blind=SLOTS.map(slot=>candidates.filter(x=>x.slot===slot)
   .sort((a,b)=>a.label.localeCompare(b.label))[0]);
  const held=await rankedAgainst(client,candidates,[s.heldA],[s.heldB]);
  const eMulti=assess(multi.bridge,held);
  const eSingle=assess(single.bridge,held);
  const eRobust=assess(robust,held);
  const eBlind=assess({items:blind},held);
  if(!eMulti||!eSingle||!eRobust||!eBlind)
   throw Error("HELDOUT_ASSESSMENT_INCOMPLETE");
  return {case:s.case,status:"evaluated",calls:client.requests,
   candidates:candidates.length,
   heldout_multi_worst:eMulti.worst,heldout_single_worst:eSingle.worst,
   heldout_blind_worst:eBlind.worst,heldout_robust_worst:eRobust.worst,
   multi_vs_single:round(eMulti.worst-eSingle.worst),
   multi_vs_blind:round(eMulti.worst-eBlind.worst),
   robust_vs_multi:round(eRobust.worst-eMulti.worst)};
 }finally{client.key="";}
}
if(!process.env.QLOO_API_KEY){
 console.error("QLOO_MULTI_ABLATION_BLOCKED: CREDENTIAL_NOT_CONFIGURED");
 process.exitCode=2;
}else{
 const rows=[];
 for(const scenario of cases){
  try{rows.push(await runOne(scenario));}
  catch(error){rows.push({case:scenario.case,status:"blocked",
   code:String(error?.message||"UNKNOWN").replace(/[^A-Z0-9_]/g,"").slice(0,60),
   ...(error.publicAnchor?{blocked_public_anchor:error.publicAnchor}:{})});}
 }
 const good=rows.filter(x=>x.status==="evaluated");
 const report={
  study:"exploratory_two_vs_one_anchor_heldout_qloo",
  disclaimer:"Same Qloo-discovered candidates in all arms. Heldout Qloo ranks are not human outcomes or real-world fairness. Exploratory after previous pilot results.",
  cases:rows.length,successes:good.length,failures:rows.length-good.length,
  avg_multi_vs_single:good.length?round(average(good.map(x=>x.multi_vs_single))):null,
  avg_multi_vs_blind:good.length?round(average(good.map(x=>x.multi_vs_blind))):null,
  avg_robust_vs_multi:good.length?round(average(good.map(x=>x.robust_vs_multi))):null,
  rows
 };
 try{
  writeEncryptedAblation(report,{
   publicKeyPath:process.env.QLOO_RESULT_PUBLIC_KEY,
   outputPath:process.env.QLOO_RESULT_OUTPUT
  });
  console.log("QLOO_MULTI_ABLATION_RESULT_ENCRYPTED");
 }catch(error){
  console.error("QLOO_MULTI_ENCRYPTION_BLOCKED: "+String(error?.code||"UNKNOWN"));
  process.exitCode=3;
 }
 if(!good.length)process.exitCode=1;
}
