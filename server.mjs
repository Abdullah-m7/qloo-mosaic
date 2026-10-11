import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {buildBridge} from "./src/engine.mjs";
import {sample} from "./src/fixtures.mjs";
import {liveBridge,validateSeeds,validateLocation,DEFAULT_SEEDS} from "./src/qloo.mjs";
const root=path.dirname(fileURLToPath(import.meta.url));
const publicDir=path.join(root,"public");
const port=Number(process.env.PORT||8788);
const mode=process.env.QLOO_MODE||"sample";
if(!["sample","live"].includes(mode))throw Error("Invalid QLOO_MODE");
const typeMap={".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"application/javascript; charset=utf-8",".svg":"image/svg+xml"};
const cache=new Map();
const evidenceCache=new Map();
const calls=new Map();
function json(res,status,data){
 res.writeHead(status,{"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"});
 res.end(JSON.stringify(data));
}
async function getBody(req){
 let text="";
 for await(const chunk of req){
   text+=chunk;
   if(text.length>16000)throw Error("Payload too large");
 }
 return JSON.parse(text||"{}");
}
function limited(ip){
 const now=Date.now(),r=calls.get(ip)??{start:now,count:0};
 if(now-r.start>3600000){r.start=now;r.count=0;}
 r.count++;calls.set(ip,r);
 return r.count>12;
}
const server=http.createServer(async(req,res)=>{
 try{
  const u=new URL(req.url,"http://localhost");
  if(u.pathname==="/health"){
    return json(res,200,{status:"ok",product:"MOSAIC",mode,version:"0.2.0"});
  }
  if(u.pathname==="/api/plan"&&req.method==="POST"){
    const input=await getBody(req);
    const budget=Number(input.maxBudget??210);
    const exclude=Array.isArray(input.exclude)?input.exclude.filter(x=>typeof x==="string").slice(0,24):[];
    if(!Number.isFinite(budget)||budget<0||budget>100000)return json(res,400,{status:"error",message:"Invalid budget"});
    if(mode==="live"){
      let context;
      try{
        context={groupA:validateSeeds(input.groupA,DEFAULT_SEEDS.groupA),
          groupB:validateSeeds(input.groupB,DEFAULT_SEEDS.groupB),
          location:validateLocation(input.location)};
      }catch(e){
        return json(res,400,{status:"needs_input",message:e.message});
      }
      const key=JSON.stringify({budget,exclude,...context});
      const contextKey=JSON.stringify(context);
      const hit=cache.get(key);
      if(hit&&Date.now()-hit.time<600000)return json(res,200,hit.value);
      const evidence=evidenceCache.get(contextKey);
      if(evidence&&Date.now()-evidence.time<900000){
        const planned=buildBridge({candidates:evidence.candidates,maxBudget:budget,exclude});
        const result={mode:"qloo-live",scenario:evidence.scenario,notice:evidence.notice,...planned};
        cache.set(key,{time:Date.now(),value:result});
        return json(res,200,result);
      }
      if(limited(req.socket.remoteAddress??"unknown"))return json(res,429,{status:"blocked",message:"Try later: Qloo API rate protection."});
      try{
        const result=await liveBridge({maxBudget:budget,exclude,...context});
        const {candidates,...safeResult}=result;
        if(Array.isArray(candidates)&&candidates.length&&result.status==="ok"){
          evidenceCache.set(contextKey,{time:Date.now(),candidates,scenario:result.scenario,notice:result.notice});
          cache.set(key,{time:Date.now(),value:safeResult});
        }
        return json(res,200,safeResult);
      }catch(e){
        console.error("Qloo integration failed:",e?.message??"unknown");
        return json(res,503,{status:"blocked",code:"QLOO_LIVE_UNAVAILABLE",message:"Live Qloo evidence is unavailable; no synthetic fallback is used. Configure an event-issued Qloo API key and check the Qloo result schema."});
      }
    }
    if(input.groupA!==undefined||input.groupB!==undefined||input.location!==undefined)
      return json(res,422,{status:"needs_input",message:"Sample mode uses fixed synthetic audiences. Custom anchors require Qloo live mode."});
    const result=buildBridge({candidates:sample.candidates,maxBudget:budget,exclude});
    return json(res,200,{mode:"synthetic",notice:"Illustrative synthetic fixture, NOT an actual Qloo API response.",scenario:{title:sample.title,groupA:sample.groupA,groupB:sample.groupB},...result});
  }
  if(u.pathname.startsWith("/api/"))return json(res,404,{status:"not_found"});
  if(req.method!=="GET"&&req.method!=="HEAD")return json(res,405,{status:"bad_method"});
  const rel=u.pathname==="/"?"/index.html":u.pathname;
  const normalized=path.normalize(rel).replace(/^[/\\]+/,"");
  const resolved=path.resolve(publicDir,normalized);
  if(!resolved.startsWith(publicDir+path.sep))return json(res,403,{status:"blocked"});
  let bytes;
  try{bytes=await fs.readFile(resolved);}catch{return json(res,404,{status:"not_found"});}
  res.writeHead(200,{"content-type":typeMap[path.extname(resolved)]||"application/octet-stream",
     "cache-control":"public, max-age=60","x-content-type-options":"nosniff",
     "referrer-policy":"no-referrer"});
  if(req.method==="HEAD")return res.end();
  return res.end(bytes);
 }catch(e){
  return json(res,e.message==="Payload too large"?413:400,{status:"error",message:e.message});
 }
});
server.listen(port,()=>console.log("MOSAIC "+mode+" ready at http://localhost:"+server.address().port));
