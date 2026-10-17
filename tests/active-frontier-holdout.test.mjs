import test from "node:test";
import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {dirname,resolve} from "node:path";
import {fileURLToPath} from "node:url";

test("private live holdout must block when protected Qloo key is absent",()=>{
 const base=resolve(dirname(fileURLToPath(import.meta.url)),"..");
 const env={...process.env};delete env.QLOO_API_KEY;
 const result=spawnSync(process.execPath,["scripts/active-frontier-holdout.mjs"],{
  cwd:base,env,encoding:"utf8",timeout:5000
 });
 assert.equal(result.status,2);
 assert.match(result.stderr,/ACTIVE_HOLDOUT_BLOCKED: QLOO_CREDENTIAL_NOT_CONFIGURED/);
 assert.equal(result.stdout.trim(),"");
});
