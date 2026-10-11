#!/usr/bin/env node
// Reproducible synthetic verification, NOT a Qloo or human-subject experiment.
import {buildBridge,SLOTS} from "../src/engine.mjs";
import fs from "node:fs";
const seed=20261012;let state=seed>>>0;
const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
const int=(lo,hi)=>lo+Math.floor(random()*(hi-lo+1));
const avg=xs=>xs.reduce((s,x)=>s+x,0)/(xs.length||1);
const N=500;const rows=[];
for(let scenario=0;scenario<N;scenario++){
 const candidates=[];const perSlot=int(3,7),maxBudget=int(90,290);
 for(const slot of SLOTS)for(let i=0;i<perSlot;i++){
  candidates.push({id:slot+":"+scenario+":"+i,slot,label:"Synthetic "+slot+" "+i,
   scoreA:random(),scoreB:random(),cost:int(25,110),source:"synthetic-fixture",
   evidence_id:"SYN-"+scenario+"-"+slot+"-"+i});
 }
 const start=performance.now();
 const r=buildBridge({candidates,maxBudget});
 rows.push({scenario,status:r.status,elapsed_ms:performance.now()-start,
   ...(r.status==="ok"?{feasible:r.evaluated,maximin_worst:r.bridge.worst,
    majority_worst:r.baselines.majority.worst,average_worst:r.baselines.average.worst,
    delta_majority:r.improvement,delta_average:r.improvementVsAverage,
    mean_tradeoff:r.tradeoff.meanChange}:null)});
}
const feasible=rows.filter(x=>x.status==="ok");
const ordered=feasible.map(x=>x.elapsed_ms).sort((a,b)=>a-b);
const round=x=>Math.round(x*1000)/1000;
const summary={type:"offline synthetic algorithm verification",seed,
 disclaimer:"500 seeded synthetic score assignments only. This is not Qloo-derived evidence, nor a human preference or product impact experiment.",
 cases:rows.length,feasible_cases:feasible.length,unavailable_cases:rows.length-feasible.length,
 maximin_at_least_majority:feasible.filter(x=>x.delta_majority>=0).length,
 maximin_at_least_mean:feasible.filter(x=>x.delta_average>=0).length,
 mean_worst_delta_vs_majority:round(avg(feasible.map(x=>x.delta_majority))),
 mean_worst_delta_vs_average:round(avg(feasible.map(x=>x.delta_average))),
 mean_change_vs_average:round(avg(feasible.map(x=>x.mean_tradeoff))),
 latency_ms_p50:round(ordered[Math.floor(ordered.length*.5)]),
 latency_ms_p95:round(ordered[Math.floor(ordered.length*.95)])};
const dir=new URL("../evidence/",import.meta.url);
fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(new URL("synthetic_benchmark_summary.json",dir),JSON.stringify(summary,null,2)+"\n");
fs.writeFileSync(new URL("synthetic_benchmark_rows.json",dir),JSON.stringify(rows,null,2)+"\n");
console.log(JSON.stringify(summary,null,2));
