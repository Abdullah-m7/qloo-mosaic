import test from "node:test";
import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {readFileSync} from "node:fs";
import path from "node:path";
import {pathToFileURL,fileURLToPath} from "node:url";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
test("offline lineup browser adapter is visibly hypothetical and never calls Qloo",async()=>{
 const run=spawnSync(process.execPath,["scripts/build-lineup-preview.mjs"],{cwd:root,encoding:"utf8",timeout:10000});
 assert.equal(run.status,0,run.stderr);
 const out=path.join(root,"dist-lineup-preview");
 const html=readFileSync(path.join(out,"index.html"),"utf8");
 assert.match(html,/FICTIONAL SIMULATION — NOT QLOO DATA/);
 assert.match(html,/href="\.\/lineup.css"/);
 assert.match(html,/src="\.\/lineup.js"/);
 const script=readFileSync(path.join(out,"lineup.js"),"utf8");
 assert.match(script,/offlineFetch as fetch/);
 const shim=await import(pathToFileURL(path.join(out,"lineup-offline.mjs")).href);
 const one=await shim.offlineFetch("/api/lineup-demo",{method:"POST",body:"{}"});
 assert.equal(one.status,200);
 const data=await one.json();
 assert.equal(data.mode,"synthetic");
 assert.equal(data.plan.status,"repair");
 assert.equal(data.plan.changes.length,1);
 const no=await shim.offlineFetch("/api/lineup-demo",{
   method:"POST",body:JSON.stringify({availability:{"artist:D":false,"artist:E":false}})});
 assert.equal((await no.json()).plan.status,"needs_input");
});
