import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const target=path.join(repo,"dist-lineup-preview");
fs.rmSync(target,{recursive:true,force:true});
fs.mkdirSync(target,{recursive:true});
const copy=(from,to)=>fs.copyFileSync(path.join(repo,from),path.join(target,to));
copy("public/lineup.css","lineup.css");
copy("src/lineupAudit.mjs","lineupAudit.mjs");
copy("src/lineupFixtures.mjs","lineupFixtures.mjs");
const html=fs.readFileSync(path.join(repo,"public/lineup.html"),"utf8")
 .replace('href="/lineup.css"','href="./lineup.css"')
 .replace('src="/lineup.js"','src="./lineup.js"')
 .replace(/href="\/"/g,'href="../"');
fs.writeFileSync(path.join(target,"index.html"),html);
const app=fs.readFileSync(path.join(repo,"public/lineup.js"),"utf8");
fs.writeFileSync(path.join(target,"lineup.js"),'import {offlineFetch as fetch} from "./lineup-offline.mjs";\n'+app);
const offline=`import {auditLineup} from "./lineupAudit.mjs";
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
`;
fs.writeFileSync(path.join(target,"lineup-offline.mjs"),offline);
fs.writeFileSync(path.join(target,".nojekyll"),"");
fs.writeFileSync(path.join(target,"README.md"),"Lineup Red-Team is a SYNTHETIC offline experiment. It makes no Qloo calls and cannot be submitted as a live Qloo-powered competition entry. Source: https://github.com/Abdullah-m7/qloo-mosaic/tree/feature/lineup-red-team\n");
console.log("LINEUP_PREVIEW_BUILT",target);
