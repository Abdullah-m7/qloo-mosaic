#!/usr/bin/env node
// Qloo explainability capability probe: metadata only, no entities/IDs/affinity
// values/credentials printed. One typed Search and one Insights GET request.
import {QlooRestClient} from "../src/qloo-rest.mjs";
if(!process.env.QLOO_API_KEY){
 console.error("QLOO_EXPLAINABILITY_PROBE_BLOCKED: NO_PROTECTED_KEY");
 process.exit(2);
}
const client=new QlooRestClient({maxRequests:3});
try{
 const id=await client.resolveSeed("Artist: Radiohead");
 const data=await client.request("/v2/insights",{
  "filter.type":"urn:entity:artist",
  "signal.interests.entities":id,
  "feature.explainability":"true",
  take:3
 });
 const rows=Array.isArray(data?.results)?data.results:Array.isArray(data?.results?.entities)?data.results.entities:[];
 const first=rows[0];
 const e=first?.query?.explainability;
 const aggregate=data?.query?.explainability;
 const tags=first?.tags;
 const influence=e?.["signal.interests.entities"];
 const firstInfluence=Array.isArray(influence)?influence[0]:
  influence&&typeof influence==="object"?Object.values(influence)[0]:null;
 console.log("QLOO_CAPABILITY_META="+JSON.stringify({
  http:"success",count:rows.length,explainability_present:Boolean(e),
  per_item_keys:e&&typeof e==="object"?Object.keys(e).slice(0,18):[],
  aggregate_present:Boolean(aggregate),
  aggregate_keys:aggregate&&typeof aggregate==="object"?Object.keys(aggregate).slice(0,18):[],
  item_tags_count:Array.isArray(tags)?tags.length:null,
  tag_keys:Array.isArray(tags)&&tags[0]&&typeof tags[0]==="object"?Object.keys(tags[0]).slice(0,12):[],
  influence_shape:Array.isArray(influence)?"array":typeof influence,
  influence_count:Array.isArray(influence)?influence.length:
   influence&&typeof influence==="object"?Object.keys(influence).length:null,
  first_influence_shape:Array.isArray(firstInfluence)?"array":typeof firstInfluence,
  first_influence_key_kinds:firstInfluence&&typeof firstInfluence==="object"?
   Object.keys(firstInfluence).slice(0,12).map(k=>
    ["id","entity_id","name","score","value","affinity","weight","contribution"].includes(k)?k:"other"):[]
 }));
}catch(error){
 console.error("QLOO_CAPABILITY_UNAVAILABLE: "+String(error?.message||"UNKNOWN").replace(/[^A-Z0-9_]/g,"").slice(0,60));
 process.exitCode=1;
}finally{client.key="";}
