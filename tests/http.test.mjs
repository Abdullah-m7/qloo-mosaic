import test from "node:test";
import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {once} from "node:events";
import {fileURLToPath} from "node:url";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
async function startServer(mode){
 // Deliberately isolate credentials: this test must never contact Qloo even
 // if a valid event key is configured on the developer machine later.
 const isolatedHome=fs.mkdtempSync(path.join(os.tmpdir(),"mosaic-no-key-"));
 const env={...process.env,PORT:"0",QLOO_MODE:mode,QLOO_HOME:isolatedHome};
 delete env.QLOO_API_KEY;
 const child=spawn(process.execPath,["server.mjs"],{
   cwd:root,env,stdio:["ignore","pipe","pipe"]
 });
 const timeout=setTimeout(()=>child.kill("SIGTERM"),13000);
 let buffer="";
 const port=await new Promise((resolve,reject)=>{
   child.on("error",reject);
   child.on("exit",code=>reject(new Error("Server exited "+code+" before readiness: "+buffer)));
   child.stdout.on("data",chunk=>{
     buffer+=chunk.toString();
     const found=buffer.match(/ready at http:\/\/localhost:(\d+)/);
     if(found)resolve(Number(found[1]));
   });
 });
 clearTimeout(timeout);
 return {url:"http://127.0.0.1:"+port,
   close:async()=>{
    if(child.exitCode===null){child.kill("SIGTERM");await once(child,"exit").catch(()=>{});}
    fs.rmSync(isolatedHome,{recursive:true,force:true});
   }};
}
async function json(base,payload){
 const res=await fetch(base+"/api/plan",{method:"POST",
  headers:{"content-type":"application/json"},body:JSON.stringify(payload)});
 return {status:res.status,body:await res.json()};
}

test("sample mode is honestly synthetic, budget enforced, and veto replan works",async()=>{
 const s=await startServer("sample");
 try{
  const h=await(await fetch(s.url+"/health")).json();
  assert.equal(h.mode,"sample");
  const response=await json(s.url,{maxBudget:210});
  assert.equal(response.status,200);
  assert.equal(response.body.mode,"synthetic");
  assert.equal(response.body.source_mode,"synthetic");
  assert.equal(response.body.treaty.label,"Cultural Bridge Agreement");
  assert.equal(response.body.treaty.motifs.length,0);
  const plan=response.body.bridge;
  assert.ok(plan.cost<=210);
  const excluded=plan.items[0].id;
  const result=await json(s.url,{maxBudget:210,exclude:[excluded]});
  assert.equal(result.body.status,"ok");
  assert.ok(!result.body.bridge.items.some(x=>x.id===excluded));
  const impossible=await json(s.url,{maxBudget:0});
  assert.equal(impossible.body.status,"no_feasible_plan");
  assert.equal((await json(s.url,{maxBudget:-5})).status,400);
  const page=await fetch(s.url+"/");
  assert.equal(page.status,200);
  assert.match(await page.text(),/SYNTHETIC DATA/i);
  assert.equal((await fetch(s.url+"/src/qloo.mjs")).status,404);
 }finally{await s.close();}
});

test("unconfigured live mode fails closed and never returns synthetic candidates",async()=>{
 const s=await startServer("live");
 try{
  const h=await(await fetch(s.url+"/health")).json();
  assert.equal(h.mode,"live");
  const response=await json(s.url,{maxBudget:210});
  assert.equal(response.status,503);
  assert.equal(response.body.status,"blocked");
  assert.equal(response.body.code,"QLOO_AUTH_UNAVAILABLE");
  assert.match(response.body.message,/protected event credential/i);
  assert.doesNotMatch(JSON.stringify(response.body),/QLOO_API_KEY=|secret=/i);
  assert.ok(!("bridge" in response.body));
  assert.ok(!("candidates" in response.body));
 }finally{await s.close();}
});

test("HTTP accepts a grounded protected choice, but rejects incompatible group locks",async()=>{
 const s=await startServer("sample");
 try{
  const locked=await json(s.url,{maxBudget:210,required:["acoustic"]});
  assert.equal(locked.status,200);
  assert.equal(locked.body.status,"ok");
  assert.ok(locked.body.bridge.items.some(x=>x.id==="acoustic"));
  const conflict=await json(s.url,{
   maxBudget:210,required:["acoustic","electronic"]
  });
  assert.equal(conflict.status,200);
  assert.equal(conflict.body.status,"no_feasible_plan");
  const vetoed=await json(s.url,{
   maxBudget:210,required:["acoustic"],exclude:["acoustic"]
  });
  assert.equal(vetoed.body.status,"no_feasible_plan");
  assert.equal((await json(s.url,{required:["acoustic","acoustic"]})).status,400);
  assert.equal((await json(s.url,{required:["acoustic","electronic","jazz"]})).status,400);
 }finally{await s.close();}
});
