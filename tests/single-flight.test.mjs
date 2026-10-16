import test from "node:test";
import assert from "node:assert/strict";
import {createSingleFlight} from "../src/single-flight.mjs";

test("simultaneous identical Qloo plans share a single provider operation",async()=>{
 const jobs=createSingleFlight({maxActive:2});
 let resolve;let calls=0;
 const plan=jobs.run("same-context",()=>{calls++;return new Promise(r=>resolve=r);});
 const duplicate=jobs.run("same-context",()=>{calls++;return 999;});
 assert.equal(plan,duplicate);
 assert.equal(jobs.active(),1);
 assert.equal(calls,0);
 await Promise.resolve();
 assert.equal(calls,1);
 resolve({mode:"qloo-live",status:"ok"});
 const [a,b]=await Promise.all([plan,duplicate]);
 assert.deepEqual(a,b);
 assert.equal(calls,1);
 assert.equal(jobs.active(),0);
});

test("different Qloo plans are capped without leaking cached failures",async()=>{
 const jobs=createSingleFlight({maxActive:1});
 let release;const task=jobs.run("first",()=>new Promise(r=>release=r));
 assert.throws(()=>jobs.run("second",()=>99),/DEMO_BUSY/);
 await Promise.resolve();
 release(1);
 assert.equal(await task,1);
 assert.equal(await jobs.run("second",()=>2),2);
});

test("rejected plans clear in-flight state and can be retried",async()=>{
 const jobs=createSingleFlight({maxActive:1});
 await assert.rejects(jobs.run("one",()=>Promise.reject(new Error("QLOO_HTTP_429"))),/QLOO_HTTP_429/);
 assert.equal(jobs.active(),0);
 assert.equal(await jobs.run("one",()=>42),42);
});

test("invalid concurrency settings fail closed",()=>{
 assert.throws(()=>createSingleFlight({maxActive:0}),/Invalid/);
 assert.throws(()=>createSingleFlight({maxActive:100}),/Invalid/);
});
