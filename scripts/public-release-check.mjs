#!/usr/bin/env node
// Public, no-credential release gate; it reads only externally visible URLs.
import {checkPublicRelease} from "../src/release-readiness.mjs";
try{
 const result=await checkPublicRelease({
  origin:process.env.MOSAIC_JUDGE_URL||"https://mosaic-agent-2026.onrender.com"
 });
 console.log("MOSAIC_PUBLIC_RELEASE_PASS "+JSON.stringify(result));
}catch(error){
 // Never expose provider contents, rendered API bodies or credentials.
 const code=String(error?.message||"UNKNOWN").replace(/[^A-Z0-9_]/g,"").slice(0,70);
 console.error("MOSAIC_PUBLIC_RELEASE_BLOCKED: "+code);
 process.exitCode=1;
}
