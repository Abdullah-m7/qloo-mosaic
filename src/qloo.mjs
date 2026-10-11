// Read-only Qloo MCP integration. Actual API data is NEVER replaced with demo fixtures.
import {Client} from "@modelcontextprotocol/sdk/client/index.js";
import {StdioClientTransport} from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {buildBridge} from "./engine.mjs";

const here=path.dirname(fileURLToPath(import.meta.url));
const qlooBinary=path.resolve(here,"../node_modules/.bin/qloo");
const types=[["music","artist"],["food","place"],["experience","movie"]];
const starts={
  groupA:["Radiohead","The Grand Budapest Hotel"],
  groupB:["Daft Punk","Blade Runner 2049"]
};
const normalized=s=>String(s).trim().toLocaleLowerCase("en-US");
export function extractItems(envelope){
  if(!envelope || !Array.isArray(envelope.results))return [];
  return envelope.results.map((x)=>{
    const entity=x?.entity??x?.item??x;
    const name=entity?.name??entity?.title??entity?.properties?.name??x?.entity_name;
    const uuid=entity?.id??entity?.entity_id??x?.entity_id;
    return {name:typeof name==="string"?name:null,
      id:typeof uuid==="string"?uuid:null};
  }).filter(x=>x.name&&x.name.length<=160);
}
export function percentileRanks(orderedNames,expected){
  // Qloo explicitly warns scores from separate ranking calls are NOT comparable.
  // Percentile order proxies are computed independently on the SAME option set.
  const seen=new Set(),ordered=[];
  for(const name of orderedNames){
    const key=normalized(name);
    if(!seen.has(key)&&expected.some(x=>normalized(x)===key)){seen.add(key);ordered.push(key);}
  }
  if(ordered.length!==expected.length)throw Error("Incomplete Qloo ranking: abstaining instead of inventing missing preferences.");
  const n=ordered.length;
  return new Map(ordered.map((name,i)=>[name,n===1?0.5:Math.round((1-i/(n-1))*1000)/1000]));
}
export function matchRanks(options,a,b){
  const left=percentileRanks(a,options),right=percentileRanks(b,options);
  return options.map(name=>({name,scoreA:left.get(normalized(name)),scoreB:right.get(normalized(name))}));
}
const parseResult=response=>{
  let obj=response?.structuredContent;
  if(!obj){
    const text=response?.content?.find(c=>c.type==="text")?.text;
    try{obj=JSON.parse(text??"{}");}catch{throw Error("Qloo MCP returned unparseable result");}
  }
  if(obj.status!=="ok"){
    const err=obj.error?.code??obj.status??"UNKNOWN";
    throw Error("Qloo tool returned "+err+": "+(obj.summary||"Unable to provide grounded evidence"));
  }
  return obj;
};
export async function liveBridge({maxBudget=210,exclude=[]}={}){
  const transport=new StdioClientTransport({command:qlooBinary,args:["mcp"],env:process.env});
  const client=new Client({name:"mosaic-common-ground-agent",version:"0.2.0"});
  await client.connect(transport);
  try{
    const cap=await client.callTool({name:"qloo_capabilities",arguments:{}});
    if(!cap.structuredContent?.adapter?.ready)throw Error("QLOO_CREDENTIAL_MISSING: Request an event API key and configure it server-side.");
    const call=async(name,args)=>parseResult(await client.callTool({name,arguments:args}));
    const all=[];
    for(const [slot,type] of types){
      // One discovery call, then two ranks on the SAME shortlist.
      const found=await call("qloo_recommend",{
        target_type:type,signals:[...starts.groupA,...starts.groupB],limit:5,
        ...(slot==="food"?{filter_location:"New York"}:{})
      });
      const foundItems=extractItems(found).slice(0,5);
      const names=[...new Set(foundItems.map(x=>x.name))];
      if(names.length<2)throw Error("Qloo returned fewer than two unambiguous candidates for "+slot);
      const [left,right]=await Promise.all([
        call("qloo_rank",{options:names,option_type:type,signals:starts.groupA}),
        call("qloo_rank",{options:names,option_type:type,signals:starts.groupB})
      ]);
      const leftNames=extractItems(left).map(x=>x.name);
      const rightNames=extractItems(right).map(x=>x.name);
      const scored=matchRanks(names,leftNames,rightNames);
      for(const [i,record] of scored.entries()){
        const source=foundItems.find(x=>x.name===record.name);
        all.push({
          id:source?.id??(slot+":"+normalized(record.name)),
          slot,label:record.name,
          // DEMO planning tokens only: neither Qloo pricing nor ticket availability.
          cost:slot==="music"?65:slot==="food"?55:50,
          scoreA:record.scoreA,scoreB:record.scoreB,
          source:"qloo-mcp:recommend+rank",
          evidence_id:"QL-"+slot.toUpperCase()+"-"+(i+1)
        });
      }
    }
    const result=buildBridge({candidates:all,maxBudget,exclude});
    return {mode:"qloo-live",notice:"Rank-percentile proxies from verified Qloo tool calls on identical candidate shortlists. Planning costs are fictional tokens, not commercial quotes.",...result};
  }finally{
    await client.close();
  }
}
