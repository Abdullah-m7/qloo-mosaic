import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const relative=process.env.MOSAIC_PREVIEW_DIR||"dist-preview";
if(relative.startsWith("/")||relative.includes("..")||relative.includes("\\"))throw Error("Unsafe preview directory");
const target=path.resolve(root,relative);
if(target===root)throw Error("Cannot overwrite source");
fs.rmSync(target,{recursive:true,force:true});
fs.mkdirSync(path.join(target,"shared"),{recursive:true});
const copy=(from,to)=>fs.copyFileSync(path.join(root,from),path.join(target,to));
copy("public/styles.css","styles.css");
copy("src/engine.mjs","shared/engine.mjs");
copy("src/fixtures.mjs","shared/fixtures.mjs");
copy("src/treaty.mjs","shared/treaty.mjs");
let html=fs.readFileSync(path.join(root,"public/index.html"),"utf8");
html=html.replace('href="/styles.css"','href="./styles.css"')
  .replace('src="/app.js"','src="./app.js"')
  .replace('<title>MOSAIC','<title>Public synthetic preview — MOSAIC');
const banner='<div style="padding:11px 20px;text-align:center;background:#ffa987;color:#101315;font:700 12px system-ui">PUBLIC OFFLINE PREVIEW · FICTIONAL CULTURAL SCORES · NO QLOO API CONNECTION</div>';
html=html.replace("<body>","<body>"+banner);
fs.writeFileSync(path.join(target,"index.html"),html);
const app=fs.readFileSync(path.join(root,"public/app.js"),"utf8");
fs.writeFileSync(path.join(target,"app.js"),
 'import {offlineFetch as fetch} from "./static-offline.mjs";\n'+app);
fs.writeFileSync(path.join(target,"static-offline.mjs"),`// Offline static preview is deliberately synthetic; never submits network API calls.
import {buildBridge} from "./shared/engine.mjs";
import {sample} from "./shared/fixtures.mjs";
import {createTreaty} from "./shared/treaty.mjs";
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
   return reply(200,{mode:"synthetic",notice:"Invented demo-only data, no Qloo API.",scenario:{title:sample.title,groupA:sample.groupA,groupB:sample.groupB},treaty:createTreaty({candidates:sample.candidates,plan}),...plan});
  }catch(e){return reply(400,{status:"error",message:e.message});}
 }
 return reply(404,{status:"not_found"});
}
`);
fs.writeFileSync(path.join(target,".nojekyll"),"");
fs.writeFileSync(path.join(target,"README.md"),
 `# MOSAIC public synthetic preview\n\nThis GitHub Pages deployment is a fully offline **illustrative** preview. It contains fabricated taste scores and makes no Qloo API calls. It is NOT the Qloo-powered live app required for Devpost submission.\n\nSource: https://github.com/Abdullah-m7/qloo-mosaic\n`);
console.log("Built offline synthetic preview in "+target);
