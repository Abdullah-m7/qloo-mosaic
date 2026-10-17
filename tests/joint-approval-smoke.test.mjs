import test from "node:test";
import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {dirname,resolve} from "node:path";
import {fileURLToPath} from "node:url";

test("joint-approval Qloo smoke cannot run without the protected event secret",()=>{
 const env={...process.env};
 delete env.QLOO_API_KEY;
 const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
 const p=spawnSync(process.execPath,["scripts/joint-approval-smoke.mjs"],{
  cwd:root,env,encoding:"utf8",timeout:6000
 });
 assert.equal(p.status,2);
 assert.match(p.stderr,/JUDGE_HTTP_BLOCKED: CREDENTIAL_NOT_CONFIGURED/);
 assert.equal(p.stdout.trim(),"");
});
