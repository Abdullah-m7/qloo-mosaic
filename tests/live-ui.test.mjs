import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import {readFileSync} from "node:fs";

const appSource=readFileSync(new URL("../public/app.js",import.meta.url),"utf8")
  .split("init().catch(e=>{")[0];

function makeView(){
 const elements=new Map();
 function element(id){
  if(elements.has(id))return elements.get(id);
  const node={
   textContent:"",innerHTML:"",hidden:false,value:"210",style:{width:""},
   children:{},handlers:{},
   classList:{toggle(){},add(){},remove(){}},
   addEventListener(name,callback){this.handlers[name]=callback;},
   setAttribute(){},
   querySelector(selector){return element(id+" "+selector);}
  };
  elements.set(id,node);
  return node;
 }
 const document={
  getElementById(id){return element(id);},
  querySelector(selector){return element("selector "+selector);}
 };
 const context=vm.createContext({document,fetch:async()=>({
  ok:false,json:async()=>({message:"Real Qloo evidence unavailable"})
 }),navigator:{clipboard:{writeText:async()=>{}}}});
 vm.runInContext(appSource,context);
 return {context,element};
}
test("live UI never displays mock zero cost as a verified real-world price",()=>{
 const {context,element}=makeView();
 const plan={groupA:.667,groupB:.667,worst:.667,mean:.667,gap:0,
  items:[{id:"music:abc",label:"Culture Artist",slot:"music",cost:0,evidence_id:"QL-abc",source:"qloo-rest:insights+rank"}]};
 const response={status:"ok",mode:"qloo-live",
  scenario:{groupA:{title:"Audience A",anchors:["Radiohead"]},groupB:{title:"Audience B",anchors:["Daft Punk"]}},
  bridge:plan,baselines:{majority:plan,average:plan},
  trace:[],treaty:null};
 context.fixture=response;
 vm.runInContext("render(fixture)",context);
 assert.match(element("plan-items").innerHTML,/No verified price/);
 assert.doesNotMatch(element("plan-items").innerHTML,/0 pts/);
});
test("failed live rerun clears old agreement, bars and copyable evidence",async()=>{
 const {context,element}=makeView();
 vm.runInContext('runtimeMode="live"; latest={mode:"qloo-live",treaty:{selected:[]}}',context);
 element("treaty-panel").hidden=false;
 element("agent-trace-panel").hidden=false;
 element("newAT").textContent="99%";
 element("ledger-items").textContent="Old evidence";
 element("group-a").value="Radiohead";
 element("group-b").value="Daft Punk";
 element("location").value="New York";
 await vm.runInContext("run()",context);
 assert.equal(vm.runInContext("latest",context),null);
 assert.equal(element("treaty-panel").hidden,true);
 assert.equal(element("agent-trace-panel").hidden,true);
 assert.equal(element("newAT").textContent,"—");
 assert.match(element("plan-items").textContent,/Real Qloo evidence unavailable/);
 assert.match(element("ledger-items").textContent,/No verified evidence/);
 assert.equal(element("copy-feedback").textContent,"");
});
