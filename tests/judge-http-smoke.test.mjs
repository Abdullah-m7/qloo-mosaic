import test from "node:test";
import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import {dirname,resolve} from "node:path";

test("judge HTTP smoke refuses execution without protected event key",()=>{
 const base=resolve(dirname(fileURLToPath(import.meta.url)),"..");
 const env={...process.env};
 delete env.QLOO_API_KEY;
 const run=spawnSync(process.execPath,["scripts/judge-http-smoke.mjs"],{
  cwd:base,env,encoding:"utf8",timeout:7000
 });
 assert.equal(run.status,2);
 assert.match(run.stderr,/JUDGE_HTTP_BLOCKED: CREDENTIAL_NOT_CONFIGURED/);
 assert.equal(run.stdout.trim(),"");
});
