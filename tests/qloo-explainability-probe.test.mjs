import test from "node:test";
import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {dirname,resolve} from "node:path";
import {fileURLToPath} from "node:url";

test("explainability capability probe refuses an absent protected key",()=>{
 const env={...process.env};delete env.QLOO_API_KEY;
 const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
 const p=spawnSync(process.execPath,["scripts/qloo-explainability-probe.mjs"],{
  cwd:root,env,encoding:"utf8",timeout:5000
 });
 assert.equal(p.status,2);
 assert.match(p.stderr,/QLOO_EXPLAINABILITY_PROBE_BLOCKED/);
 assert.equal(p.stdout.trim(),"");
});
