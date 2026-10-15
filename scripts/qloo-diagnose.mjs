// Diagnostic: summarize public entity-search schema, never raw IDs, entity names or key.
import {QlooRestClient} from "../src/qloo-rest.mjs";
const variations=[
 ["unfiltered",{}],
 ["artist",{types:"urn:entity:artist"}],
 ["movie",{types:"urn:entity:movie"}],
 ["artist_movie",{types:["urn:entity:artist","urn:entity:movie"]}]
];
const api=new QlooRestClient();
function summary(data){
 const arr=Array.isArray(data?.results)?data.results:Array.isArray(data?.results?.entities)?
  data.results.entities:Array.isArray(data?.entities)?data.entities:[];
 const types={};let exact=0,nested=0,noType=0;
 for(const x of arr){
  const e=x?.entity??x?.item??x;
  const type=e?.type??"(absent)";
  types[type]=(types[type]||0)+1;
  if(String(e?.name??e?.title??"").trim().toLowerCase()==="radiohead")exact++;
  if(x?.entity)nested++;
  if(!e?.type)noType++;
 }
 return {topKeys:Object.keys(data||{}).slice(0,12).sort(),resultCount:arr.length,
  exactMatchCount:exact,nestedCount:nested,untypedCount:noType,types};
}
try{
 for(const [label,params] of variations){
  try{
   const result=await api.request("/search",{query:"Radiohead",take:15,...params});
   console.log("QLOO_DIAG_"+label+"="+JSON.stringify(summary(result)));
  }catch(e){
   console.log("QLOO_DIAG_"+label+"_ERROR="+String(e?.message||"ERROR").replace(/[^A-Z0-9_]/g,"").slice(0,45));
  }
 }
}finally{api.key="";}
