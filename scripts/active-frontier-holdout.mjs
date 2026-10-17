#!/usr/bin/env node
// Preregistered fresh-Qloo exploratory probe, isolated from live service.
// Fully encrypted study rows; public CI logs contain only aggregate counts.
import {QlooRestClient} from "../src/qloo-rest.mjs";
import {discoverCulturalEvidence,extractItems,matchRanks} from "../src/qloo.mjs";
import {probeActiveFrontier} from "../src/active-frontier-probe.mjs";
import {evaluatePlan,SLOTS} from "../src/engine.mjs";
import {writeEncryptedAblation} from "./encrypt-ablation.mjs";
import {performance} from "node:perf_hooks";

const profiles=Object.freeze([
 {id:"soul-synth",place:"Chicago",
  a:["Artist: Nina Simone","Movie: Moonlight (2016)"],
  b:["Artist: Kraftwerk","Movie: Her (2013)"],
  holdA:["Artist: Norah Jones"],holdB:["Artist: Boards of Canada"]},
 {id:"afrobeats-indie",place:"Boston",
  a:["Artist: Burna Boy","Movie: Black Panther (2018)"],
  b:["Artist: The National","Movie: Lost in Translation (2003)"],
  holdA:["Artist: Wizkid"],holdB:["Artist: Bon Iver"]},
 {id:"latin-minimalism",place:"Miami",
  a:["Artist: Bad Bunny","Movie: Coco (2017)"],
  b:["Artist: Ludovico Einaudi","Movie: Amélie (2001)"],
  holdA:["Artist: J Balvin"],holdB:["Artist: Max Richter"]},
 {id:"garage-ambient",place:"Austin",
  a:["Artist: Arctic Monkeys","Movie: Whiplash (2014)"],
  b:["Artist: Nils Frahm","Movie: Arrival (2016)"],
  holdA:["Artist: The Strokes"],holdB:["Artist: Ólafur Arnalds"]}
]);
const kind={music:"artist",food:"place",experience:"movie"};
const norm=x=>String(x).normalize("NFKC").trim().toLowerCase();
const round=x=>Math.round((x+Number.EPSILON)*1000)/1000;
const cleanError=x=>String(x?.message||"UNKNOWN")
 .replace(/[^A-Z0-9_]/g,"").slice(0,58);
async function evaluateWithHeldout({client,profile,candidatePool,baselinePlan,expandedPlan}){
 const byId=new Map();
 let missing=0;
 for(const slot of SLOTS){
  const choices=candidatePool.filter(x=>x.slot===slot);
  const options=choices.map(x=>x.label);
  if(options.length<2||options.length>8)throw Error("HELDOUT_BAD_CANDIDATE_SET");
  const [left,right]=await Promise.all([
   client.call("qloo_rank",{option_type:kind[slot],options,signals:profile.holdA}),
   client.call("qloo_rank",{option_type:kind[slot],options,signals:profile.holdB})
  ]);
  const l=extractItems(left).map(x=>x.name);
  const r=extractItems(right).map(x=>x.name);
  const lset=new Set(l.map(norm)),rset=new Set(r.map(norm));
  const shared=options.filter(x=>lset.has(norm(x))&&rset.has(norm(x)));
  missing+=options.length-shared.length;
  if(shared.length<2)return {status:"heldout_too_sparse",missing};
  const ranks=new Map(matchRanks(shared,l,r).map(x=>[norm(x.name),x]));
  for(const item of choices){
   const score=ranks.get(norm(item.label));
   if(score)byId.set(item.id,{...item,scoreA:score.scoreA,scoreB:score.scoreB});
  }
 }
 const scorePlan=plan=>{
  const evaluated=plan.items.map(x=>byId.get(x.id));
  if(evaluated.some(x=>!x))return null;
  return evaluatePlan(evaluated);
 };
 const base=scorePlan(baselinePlan),expanded=scorePlan(expandedPlan);
 if(!base||!expanded)return {status:"heldout_chosen_missing",missing};
 const diff=round(expanded.worst-base.worst);
 return {status:"evaluated",missing,
  baseline_worst:base.worst,expanded_worst:expanded.worst,
  delta_worst:diff,win:diff>0,tie:diff===0,loss:diff<0};
}

async function runProfile(profile){
 const started=performance.now();
 const client=new QlooRestClient({maxRequests:40});
 try{
  const call=(tool,args)=>client.call(tool,args);
  const discovery=await discoverCulturalEvidence({
   a:profile.a,b:profile.b,place:profile.place,call
  });
  const found=await probeActiveFrontier({
   candidates:discovery.candidates,a:profile.a,b:profile.b,
   place:profile.place,call,
   evaluateHeldout:({candidatePool,baselinePlan,expandedPlan})=>
    evaluateWithHeldout({client,profile,candidatePool,baselinePlan,expandedPlan})
  });
  // Only metadata and ordinal aggregates inside an encrypted artifact.
  const {nominated,...rest}=found;
  return {case:profile.id,status:found.status,requests:client.requests,
   elapsed_seconds:round((performance.now()-started)/1000),
   ...rest,heldout:found.heldout??null};
 }finally{client.key="";}
}
if(!process.env.QLOO_API_KEY){
 console.error("ACTIVE_HOLDOUT_BLOCKED: QLOO_CREDENTIAL_NOT_CONFIGURED");
 process.exit(2);
}
const rows=[];
for(const profile of profiles){
 try{rows.push(await runProfile(profile));}
 catch(error){
  rows.push({case:profile.id,status:"blocked",
   code:cleanError(error)});
 }
}
const evaluated=rows.filter(x=>x.heldout?.status==="evaluated");
const delta=evaluated.map(x=>x.heldout.delta_worst);
const win=delta.filter(x=>x>0).length,tie=delta.filter(x=>x===0).length;
const loss=delta.filter(x=>x<0).length;
const avg=delta.length?round(delta.reduce((x,y)=>x+y,0)/delta.length):null;
const report={
 study:"active_search_vs_original_qloo_selection",
 prereg_version:"1.0-20261017",
 classification:"small exploratory fresh-case pilot, NOT confirmatory human or market validation",
 candidates_pool:"same union per rank call; held-out identities not used by planner",
 planned_cases:profiles.length,evaluated_cases:evaluated.length,
 not_evaluated_cases:profiles.length-evaluated.length,
 wins:win,ties:tie,losses:loss,mean_heldout_delta:avg,
 comparison_notice:"In-sample candidate expansion is a mathematical superset. Primary metric is held-out lower-group ordinal proxy, NOT observed satisfaction or calibrated Qloo affinity.",
 rows
};
try{
 writeEncryptedAblation(report,{
  publicKeyPath:process.env.QLOO_RESULT_PUBLIC_KEY,
  outputPath:process.env.QLOO_RESULT_OUTPUT
 });
 console.log("ACTIVE_HOLDOUT_SEALED pilot_cases="+profiles.length+
  " evaluated="+evaluated.length+" blocked="+(profiles.length-evaluated.length));
}catch(error){
 console.error("ACTIVE_HOLDOUT_SEALING_BLOCKED: "+
  String(error?.code||"UNKNOWN").replace(/[^A-Z0-9_]/g,""));
 process.exitCode=3;
}
if(!evaluated.length)process.exitCode=1;
