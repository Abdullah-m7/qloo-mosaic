// Bounded Qloo REST adapter; no secrets or response payloads are persisted.
export const EVENT_BASE_URL="https://hackathon.api.qloo.com";
const types={artist:"urn:entity:artist",place:"urn:entity:place",movie:"urn:entity:movie"};
const normalize=x=>String(x).trim().normalize("NFKC").toLowerCase();
// Public, optional identity hints: "Artist: Radiohead" or "Movie: Barbie (2023)".
// This is an explicit hint, NOT automatic disambiguation by popularity or rank.
export function parsePublicTasteAnchor(input){
 if(typeof input!=="string")return input;
 const value=input.trim();
 const prefix=/^(artist|movie)\s*:/i.exec(value);
 if(!prefix)return {name:value,type:null,year:null};
 const type=prefix[1].toLowerCase();
 let name=value.slice(prefix[0].length).trim();
 let year=null;
 const suffix=/\s+\((\d{4})\)$/.exec(name);
 if(suffix){
  year=Number(suffix[1]);
  name=name.slice(0,-suffix[0].length).trim();
 }
 if(!name)throw Error("QLOO_INVALID_SIGNALS");
 if(year!==null&&type!=="movie")throw Error("QLOO_INVALID_RELEASE_YEAR");
 return {name,type,year};
}
// A process-wide pacing gate prevents concurrent ranking calls from bursting the
// event API. Pure injected-fetch unit tests do not touch this network gate.
let nextRequestAt=0;
let requestGate=Promise.resolve();
const pace=()=>{
 const slot=requestGate.then(async()=>{
  const delay=Math.max(0,nextRequestAt-Date.now());
  if(delay)await new Promise(resolve=>setTimeout(resolve,delay));
  nextRequestAt=Date.now()+900;
 });
 requestGate=slot.catch(()=>{});
 return slot;
};
const resultList=(data,key="entities")=>{
 const results=data?.results;
 return Array.isArray(results)?results:Array.isArray(results?.[key])?results[key]:
  Array.isArray(data?.[key])?data[key]:[];
};
const parseEntity=value=>{
 const x=value?.entity??value?.item??value;
 const name=x?.name??x?.title??x?.properties?.name;
 const id=x?.entity_id??x?.id;
 return typeof name==="string"&&typeof id==="string"&&name.trim()&&id.trim()?
  {name:name.trim(),id:id.trim(),type:x?.type??null,subtype:x?.subtype??null,
   releaseYear:x?.properties?.release_year??x?.release_year??null}:null;
};
// Qloo Insights returns type='urn:entity' for a typed category request.
// The subtype, when present, may carry the specific category URN.
const matchesCategory=(item,expected)=>{
 if(item?.type===expected||item?.subtype===expected)return true;
 if(item?.type==='urn:entity'){
  return !item.subtype||typeof item.subtype!=='string'||
   !item.subtype.startsWith('urn:entity:');
 }
 return !item?.type&&!item?.subtype;
};
export class QlooRestClient {
 constructor({apiKey=process.env.QLOO_API_KEY,fetchImpl=globalThis.fetch,maxRequests=26}={}){
  if(!apiKey||typeof apiKey!=="string")throw Error("QLOO_CREDENTIAL_MISSING");
  if(typeof fetchImpl!=="function")throw TypeError("Fetch required");
  if(!Number.isInteger(maxRequests)||maxRequests<1||maxRequests>40)
   throw Error('QLOO_INVALID_REQUEST_LIMIT');
  this.maxRequests=maxRequests;
  this.key=apiKey.trim();this.fetchImpl=fetchImpl;this.requests=0;
  this.networkPacing=fetchImpl===globalThis.fetch;
  this.resolved=new Map();this.candidates=new Map();
 }
 async request(path,params={}){
  if(!["/search","/v2/insights"].includes(path))throw Error("QLOO_ENDPOINT_BLOCKED");
  if(++this.requests>this.maxRequests)throw Error("QLOO_BOUNDED_CALL_LIMIT");
  const url=new URL(path,EVENT_BASE_URL);
  for(const [name,value] of Object.entries(params)){
   if(value!==undefined&&value!==null)
    url.searchParams.set(name,Array.isArray(value)?value.join(","):String(value));
  }
  // Event API burst protection: no more than roughly one outbound request per second.
  if(this.networkPacing)await pace();
  let response;
  try{
   response=await this.fetchImpl(url,{method:"GET",redirect:"error",
    headers:{"X-Api-Key":this.key,Accept:"application/json"},signal:AbortSignal.timeout(12000)});
  }catch{throw Error("QLOO_NETWORK_FAILURE");}
  if(!response.ok)throw Error("QLOO_HTTP_"+response.status);
  try{return await response.json();}catch{throw Error("QLOO_INVALID_JSON");}
 }
 async resolveSeed(input){
  const parsed=parsePublicTasteAnchor(input);
  const name=parsed?.name;
  const category=parsed?.type??null;
  const year=parsed?.year??null;
  if(typeof name!=='string'||!name.trim()||name.length>72||name.includes('@'))
   throw Error('QLOO_INVALID_SIGNALS');
  // Explicit type hints narrow known public artist/movie anchors, but never
  // guess which entity a genuinely ambiguous name denotes.
  if(category!==null&&category!==undefined&&!['artist','movie'].includes(category))
   throw Error('QLOO_INVALID_SIGNAL_TYPE');
  if(year!==null&&(category!=='movie'||!Number.isInteger(year)||year<1888||year>2100))
   throw Error('QLOO_INVALID_RELEASE_YEAR');
  const allowed=category?[types[category]]:['urn:entity:artist','urn:entity:movie'];
  const n=normalize(name),cacheKey=n+'|'+allowed.join(',')+'|'+(year??'');
  if(this.resolved.has(cacheKey))return this.resolved.get(cacheKey);
  const data=await this.request('/search',{query:name,types:allowed,take:15});
  const matches=resultList(data).map(parseEntity).filter(Boolean)
   .filter(x=>normalize(x.name)===n&&(!x.type||x.type==='urn:entity'||allowed.includes(x.type))
    &&(!x.subtype||!String(x.subtype).startsWith('urn:entity:')||allowed.includes(x.subtype))
    &&(year===null||Number(x.releaseYear)===year));
  const ids=new Set(matches.map(x=>x.id.toLowerCase()));
  if(ids.size!==1){
   const error=Error(ids.size?'QLOO_AMBIGUOUS_SIGNAL':'QLOO_SIGNAL_UNRESOLVED');
   // Public anchor input only; never attach Qloo candidate identities or API responses.
   error.publicAnchor={name,category:category??'unspecified',year,exactMatches:ids.size};
   throw error;
  }
  const id=matches[0].id;this.resolved.set(cacheKey,id);return id;
 }
 async resolveSeeds(names){
  if(!Array.isArray(names)||names.length<1||names.length>10)throw Error("QLOO_INVALID_SIGNALS");
  const resolved=await Promise.all(names.map(name=>this.resolveSeed(name)));
  // An aliased, year-qualified and unqualified name may resolve to the SAME
  // public entity. Never give duplicated evidence an artificial signal weight.
  const unique=new Map(resolved.map(id=>[id.toLowerCase(),id]));
  return [...unique.values()];
 }
 async call(tool,args){
  if(tool==="qloo_recommend"){
   const type=types[args.target_type];
   if(!type)throw Error("QLOO_INVALID_TARGET");
   const signals=await this.resolveSeeds(args.signals);
   const query={"filter.type":type,"signal.interests.entities":signals,
    sort_by:'affinity',take:Math.min(8,Math.max(2,Number(args.limit)||5))};
   if(args.filter_location&&type===types.place)
    query["filter.location.query"]=args.filter_location;
   const data=await this.request("/v2/insights",query);
   const raw=resultList(data);
   const results=raw.map(parseEntity).filter(Boolean)
    .filter(x=>matchesCategory(x,type));
   if(process.env.QLOO_TEST_INSPECT==="1"){
    const first=raw[0];
    console.log("QLOO_INSIGHTS_META="+JSON.stringify({slot:args.target_type,
      responseKeys:Object.keys(data??{}).slice(0,10),rawCount:raw.length,
      acceptedCount:results.length,firstKeys:first&&typeof first==="object"?
        Object.keys(first).slice(0,16):[],
      typeShape:Array.isArray(first?.type)?"array":typeof first?.type,
      typeNamespace:typeof first?.type==="string"?first.type.slice(0,100):null,
      parseableCount:raw.filter(x=>Boolean(parseEntity(x))).length,
      success:data?.success??null,
      hasError:Boolean(data?.error||data?.errors)}));
   }
   for(const item of results)this.candidates.set(type+"|"+normalize(item.name),item.id);
   return {status:"ok",results};
  }
  if(tool==="qloo_rank"){
   const type=types[args.option_type];
   if(!type)throw Error("QLOO_INVALID_TARGET");
   if(!Array.isArray(args.options)||args.options.length<2||args.options.length>8)
    throw Error("QLOO_INVALID_OPTIONS");
   const options=args.options.map(name=>({name,id:this.candidates.get(type+"|"+normalize(name))}));
   if(options.some(x=>!x.id))throw Error("QLOO_OPTION_NOT_DISCOVERED");
   if(new Set(options.map(x=>x.id.toLowerCase())).size!==options.length)
    throw Error("QLOO_DUPLICATE_OPTION_IDS");
   const signals=await this.resolveSeeds(args.signals);
   const data=await this.request("/v2/insights",{"filter.type":type,
    "filter.results.entities":options.map(x=>x.id),
    "signal.interests.entities":signals,sort_by:'affinity',take:options.length});
   const byId=new Map(options.map(x=>[x.id.toLowerCase(),x]));
   const seen=new Set(),results=[];
   for(const raw of resultList(data)){
    const item=parseEntity(raw);
    const id=item?.id.toLowerCase();
    if(!id||!byId.has(id)||seen.has(id))continue;
    seen.add(id);results.push({name:byId.get(id).name,id:item.id});
   }
   // A provider may rank only part of the requested shortlist.
   // Preserve the grounded subset; callers must intersect audience coverage.
   if(results.length<2)throw Error("QLOO_INCOMPLETE_RANKING");
   return {status:"ok",results,requested:options.length,returned:results.length};
  }
  if(tool==="qloo_entity_tags"){
   if(!Array.isArray(args.entities)||args.entities.length!==1)
    throw Error("QLOO_INVALID_TAG_REQUEST");
   // Optional; gracefully abstain when the event tenant disallows urn:tag.
   const data=await this.request("/v2/insights",{"filter.type":"urn:tag",
    "signal.interests.entities":args.entities,take:Math.min(10,Number(args.limit)||10)});
   const results=resultList(data,"tags").map(x=>({
    id:x?.id??x?.tag_id,name:x?.name,type:x?.type??x?.subtype
   })).filter(x=>typeof x.id==="string"&&typeof x.name==="string");
   return {status:"ok",results};
  }
  throw Error("QLOO_TOOL_NOT_ALLOWLISTED");
 }
}
