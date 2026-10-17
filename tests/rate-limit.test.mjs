import test from "node:test";
import assert from "node:assert/strict";
import {clientIdentity,createRateLimiter} from "../src/rate-limit.mjs";

test("Render identities use Cloudflare's single validated client IP",()=>{
 const req={socket:{remoteAddress:"10.0.0.2"},headers:{
  "cf-connecting-ip":"203.0.113.8",
  "x-forwarded-for":"192.0.2.1, 203.0.113.8"
 }};
 assert.equal(clientIdentity(req,{render:true}),"edge:203.0.113.8");
 assert.equal(clientIdentity(req,{render:false}),"peer:10.0.0.2");
});

test("spoofable forwarded header and malformed Cloudflare IP are ignored",()=>{
 const req={socket:{remoteAddress:"10.0.0.3"},headers:{
  "cf-connecting-ip":"203.0.113.8, 192.0.2.20",
  "x-forwarded-for":"203.0.113.20"
 }};
 assert.equal(clientIdentity(req,{render:true}),"peer:10.0.0.3");
 assert.equal(clientIdentity(req,{render:false}),"peer:10.0.0.3");
});

test("IPv6 client identity is supported without changing the full address",()=>{
 const req={socket:{remoteAddress:"::1"},headers:{"cf-connecting-ip":"2001:db8::cafe"}};
 assert.equal(clientIdentity(req,{render:true}),"edge:2001:db8::cafe");
});

test("per-client limits isolate judges, reset after the window, and avoid accidental coupling",()=>{
 let time=1_000;
 const limited=createRateLimiter({max:2,windowMs:3000,clock:()=>time});
 assert.equal(limited("edge:203.0.113.1"),false);
 assert.equal(limited("edge:203.0.113.1"),false);
 assert.equal(limited("edge:203.0.113.1"),true);
 assert.equal(limited("edge:203.0.113.2"),false);
 time+=3_000;
 assert.equal(limited("edge:203.0.113.1"),false);
});

test("the limiter restricts cardinality without crashing when clients churn",()=>{
 let time=0;
 const limited=createRateLimiter({max:1,windowMs:5000,maxClients:2,clock:()=>time});
 for(let i=0;i<100;i++){
  assert.equal(limited("edge:192.0.2."+i),false);
  time+=5;
 }
 assert.equal(limited("edge:192.0.2.99"),true);
});
