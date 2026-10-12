import {auditLineup} from "./lineupAudit.mjs";
import {lineupSample} from "./lineupFixtures.mjs";
const reply=(status,x)=>new Response(JSON.stringify(x),{status,headers:{"content-type":"application/json"}});
export async function offlineFetch(route,init){
 if(route!=="/api/lineup-demo"||init?.method!=="POST")return reply(404,{status:"not_found"});
 try{
  const input=JSON.parse(init.body||"{}");
  const sample=structuredClone(lineupSample);
  if(input.cancelledId!==undefined)sample.cancelledId=input.cancelledId;
  if(input.protectedIds!==undefined)sample.protectedIds=input.protectedIds;
  if(input.maxLossFromOriginal!==undefined)sample.maxLossFromOriginal=Number(input.maxLossFromOriginal);
  if(input.availability!==undefined){
   if(!input.availability||typeof input.availability!=="object"||Array.isArray(input.availability))
     return reply(400,{status:"error",message:"Invalid organizer availability"});
   sample.candidatePool=sample.candidatePool.map(c=>({
    ...c,organizerConfirmedAvailable:
      input.availability[c.id]===undefined?c.organizerConfirmedAvailable:
        input.availability[c.id]===true
   }));
  }
  return reply(200,{mode:"synthetic",
   notice:"Fictional artists, invented audience rankings and self-declared availability; never Qloo results.",
   scenario:sample,plan:auditLineup(sample)});
 }catch(e){return reply(400,{status:"error",message:e.message});}
}
