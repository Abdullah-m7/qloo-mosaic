#!/usr/bin/env node
// Preregistered, falsifiable held-out ablation using real Qloo scores only.
// Never commit output from live API; results are aggregate and may be negative.
import {QlooRestClient} from "../src/qloo-rest.mjs";
import {writeEncryptedAblation} from "./encrypt-ablation.mjs";
import {discoverCulturalEvidence,matchRanks,extractItems} from "../src/qloo.mjs";
import {buildBridge,evaluatePlan,SLOTS} from "../src/engine.mjs";

// Anchor categories are preregistered semantic facts, not Qloo ranking feedback.
// Public user-entered names remain ambiguity-gated in the production agent.
const A=(name,type,year=null)=>({name,type,...(year?{year}:{})});
const scenarios=[
 {name:"indie-vs-electronic",place:"New York",
  a:[A("Radiohead","artist"),A("The Grand Budapest Hotel","movie")],
  b:[A("Daft Punk","artist"),A("Blade Runner 2049","movie")]},
 {name:"alternative-vs-jazz",place:"London",
  a:[A("Björk","artist"),A("Spirited Away","movie")],
  b:[A("Miles Davis","artist"),A("Casablanca","movie")]},
 {name:"global-pop-contrast",place:"Los Angeles",
  a:[A("Taylor Swift","artist"),A("Barbie","movie",2023)],
  b:[A("BTS","artist"),A("Parasite","movie")]}
];
const slotType={music:"artist",food:"place",experience:"movie"};
const avg=xs=>xs.reduce((sum,x)=>sum+x,0)/(xs.length||1);
const compact=x=>Math.round(x*1000)/1000;
const scorePlan=(plan,map)=>{
 if(!plan?.items?.length)return null;
 const scores=plan.items.map(x=>map.get(x.id)).filter(Boolean);
 return scores.length===plan.items.length?evaluatePlan(scores):null;
};
const correlation=(xs,ys)=>{
 if(xs.length!==ys.length||xs.length<2)return null;
 const mx=avg(xs),my=avg(ys);
 const cov=xs.reduce((s,x,i)=>s+(x-mx)*(ys[i]-my),0);
 const vx=xs.reduce((s,x)=>s+(x-mx)**2,0);
 const vy=ys.reduce((s,y)=>s+(y-my)**2,0);
 return vx*vy>0?compact(cov/Math.sqrt(vx*vy)):null;
};

async function runScenario(s){
 const client=new QlooRestClient();
 try{
  const call=(name,args)=>client.call(name,args);
  const {candidates}=await discoverCulturalEvidence({
   a:[s.a[0]],b:[s.b[0]],place:s.place,call
  });
  const trained=buildBridge({candidates,maxBudget:210});
  if(trained.status!=="ok")throw Error("QLOO_PLAN_UNAVAILABLE");
  const blindItems=SLOTS.map(slot=>candidates.filter(x=>x.slot===slot)
   .sort((x,y)=>x.label.localeCompare(y.label))[0]);
  const holdout=new Map();
  for(const slot of SLOTS){
   const bucket=candidates.filter(x=>x.slot===slot);
   const names=bucket.map(x=>x.label),option_type=slotType[slot];
   const [a,b]=await Promise.all([
    call("qloo_rank",{options:names,option_type,signals:[s.a[1]]}),
    call("qloo_rank",{options:names,option_type,signals:[s.b[1]]})
   ]);
   const rankings=matchRanks(names,extractItems(a).map(x=>x.name),extractItems(b).map(x=>x.name));
   for(const candidate of bucket){
    const rank=rankings.find(x=>x.name===candidate.label);
    holdout.set(candidate.id,{...candidate,scoreA:rank.scoreA,scoreB:rank.scoreB});
   }
  }
  const live=scorePlan(trained.bridge,holdout);
  const blind=scorePlan({items:blindItems},holdout);
  const majority=scorePlan(trained.baselines?.majority,holdout);
  const average=scorePlan(trained.baselines?.average,holdout);
  if(!live||!blind||!majority||!average)throw Error("QLOO_HOLDOUT_INCOMPLETE");
  const anchorTransfer={};
  for(const group of ['scoreA','scoreB']){
   const perSlot=SLOTS.map(slot=>{
    const bucket=candidates.filter(x=>x.slot===slot);
    return correlation(bucket.map(x=>x[group]),
      bucket.map(x=>holdout.get(x.id)[group]));
   });
   anchorTransfer[group]=perSlot.every(Number.isFinite)?compact(avg(perSlot)):null;
  }
  return {case:s.name,status:"verified_qloo_holdout",requests:client.requests,
   candidates:candidates.length,
   heldout_trained_worst:live.worst,
   heldout_blind_worst:blind.worst,
   heldout_majority_worst:majority.worst,
   heldout_average_worst:average.worst,
   anchor_transfer_rank_correlation:anchorTransfer,
   heldout_difference:compact(live.worst-blind.worst)};
 }finally{
  client.key="";
 }
}
if(!process.env.QLOO_API_KEY){
 console.error("LIVE_ABLATION_BLOCKED: server-side QLOO_API_KEY is not configured.");
 process.exitCode=2;
}else{
 const rows=[];
 for(const scenario of scenarios){
  try{rows.push(await runScenario(scenario));}
  catch(error){rows.push({case:scenario.name,status:"blocked",
   code:String(error.message||"UNKNOWN").replace(/[^A-Z0-9_]/g,"").slice(0,60),
   ...(error.publicAnchor?{blocked_public_anchor:error.publicAnchor}:{})});}
 }
 const good=rows.filter(x=>x.status==="verified_qloo_holdout");
 const summary={method:"held-out within-provider Qloo ranking ablation",
  disclaimer:"This is not human preference, causal impact, or full no-Qloo discovery: the blind comparator uses identical Qloo-discovered candidates but ignores taste ranks.",
  cases:rows.length,successes:good.length,failures:rows.length-good.length,
  mean_holdout_difference:good.length?compact(avg(good.map(x=>x.heldout_difference))):null,
  positive:good.filter(x=>x.heldout_difference>0).length,
  negative:good.filter(x=>x.heldout_difference<0).length,rows};
 try{
  writeEncryptedAblation(summary,{
   publicKeyPath:process.env.QLOO_RESULT_PUBLIC_KEY,
   outputPath:process.env.QLOO_RESULT_OUTPUT
  });
  console.log("QLOO_ABLATION_RESULT_ENCRYPTED");
 }catch(error){
  console.error("QLOO_ABLATION_ENCRYPTION_BLOCKED: "+String(error?.code||error?.message||"UNKNOWN").replace(/[^A-Z0-9_]/g,""));
  process.exitCode=3;
 }
 if(!good.length)process.exitCode=1;
}
