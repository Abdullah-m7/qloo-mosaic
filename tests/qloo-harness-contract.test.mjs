import test from "node:test";
import assert from "node:assert/strict";
import {Client} from "@modelcontextprotocol/sdk/client/index.js";
import {StdioClientTransport} from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {EVENT_BASE_URL} from "../src/qloo.mjs";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");

test("official Qloo MCP harness exposes required read-only agent workflow contracts",async()=>{
 const command=path.resolve(root,"node_modules/.bin/qloo");
 const transport=new StdioClientTransport({
  command,args:["mcp"],env:{...process.env,QLOO_BASE_URL:EVENT_BASE_URL}
 });
 const client=new Client({name:"mosaic-public-contract-check",version:"0.1.0"});
 try{
  await client.connect(transport);
  const {tools}=await client.listTools();
  const byName=new Map(tools.map(x=>[x.name,x]));
  for(const name of ["qloo_capabilities","qloo_recommend","qloo_rank","qloo_find_tags","qloo_entity_tags"]){
   assert.ok(byName.has(name),"Missing official Qloo tool: "+name);
  }
  assert.deepEqual(byName.get("qloo_rank").inputSchema.required,["options","option_type"]);
  assert.ok(byName.get("qloo_recommend").inputSchema.required.includes("target_type"));
  const cap=await client.callTool({name:"qloo_capabilities",arguments:{}});
  assert.equal(cap?.isError??false,false);
  assert.equal(typeof cap?.structuredContent?.adapter?.ready,"boolean");
  // No credential-bearing API call is made here; capabilities are offline.
  assert.equal(EVENT_BASE_URL,"https://hackathon.api.qloo.com");
 }finally{await client.close();}
});
