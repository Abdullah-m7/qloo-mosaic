// Offline static preview is deliberately synthetic; never submits network API calls.
import {buildBridge} from "./shared/engine.mjs";
import {sample} from "./shared/fixtures.mjs";
const reply=(status,data)=>new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json"}});
export async function offlineFetch(url,init={}){
 const route=String(url);
 if(route==="/health" && (!init.method||init.method==="GET"))
  return reply(200,{status:"ok",product:"MOSAIC",mode:"sample",staticPreview:true});
 if(route==="/api/plan" && init.method==="POST"){
  try{
   const values=JSON.parse(init.body||"{}");
   if(values.groupA!==undefined||values.groupB!==undefined||values.location!==undefined)
    return reply(422,{status:"needs_input",message:"The public preview uses fixed synthetic groups."});
   const budget=Number(values.maxBudget??210);
   const exclude=Array.isArray(values.exclude)?values.exclude:[];
   const plan=buildBridge({candidates:sample.candidates,maxBudget:budget,exclude});
   return reply(200,{mode:"synthetic",notice:"Invented demo-only data, no Qloo API.",scenario:{title:sample.title,groupA:sample.groupA,groupB:sample.groupB},...plan});
  }catch(e){return reply(400,{status:"error",message:e.message});}
 }
 return reply(404,{status:"not_found"});
}
