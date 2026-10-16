import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import {readFileSync} from "node:fs";
import {buildBridge} from "../src/engine.mjs";
import {sample} from "../src/fixtures.mjs";

const appSource=readFileSync(new URL("../public/app.js",import.meta.url),"utf8")
  .split("init().catch(e=>{")[0];

function makeView(fetchOverride=null){
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
 const defaultFetch=async()=>({
  ok:false,json:async()=>({message:"Real Qloo evidence unavailable"})
 });
 const context=vm.createContext({document,fetch:fetchOverride??defaultFetch,
  navigator:{clipboard:{writeText:async()=>{}}}});
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

test("counterfactual treaty stress test exposes bounded fallback without invented claims",()=>{
 const {context,element}=makeView();
 const row=(id,slot,label)=>({id,slot,label,cost:0,evidence_id:"QL-"+id,source:"qloo-rest:insights+rank"});
 const chosen=[row("m1","music","<Untrusted Artist>"),row("f1","food","Public Place"),row("x1","experience","Public Film")];
 const plan={groupA:.6,groupB:.7,worst:.6,mean:.65,gap:.1,items:chosen};
 const impacts=chosen.map((removed,i)=>({
  removed,status:"feasible",worst_after:.5,worst_rank_loss:.1,
  changes:[{id:removed.id+"new",slot:removed.slot,label:"Replacement "+i,evidence_id:"QL-new"}]
 }));
 impacts[0].removed={id:"m1",slot:"music",label:"<Untrusted Artist>"};
 const result={status:"ok",mode:"qloo-live",bridge:plan,baselines:{majority:plan,average:plan},
  resilience:{method:"single-option-veto",provider_calls:0,impacts},trace:[],treaty:null};
 context.fixture=result;
 vm.runInContext("render(fixture)",context);
 assert.equal(element("resilience-panel").hidden,false);
 assert.equal((element("resilience-items").innerHTML.match(/data-resilience-veto=/g)||[]).length,3);
 assert.match(element("resilience-items").innerHTML,/10.0 pp/);
 assert.match(element("resilience-items").innerHTML,/&lt;Untrusted Artist&gt;/);
 assert.doesNotMatch(element("resilience-items").innerHTML,/<Untrusted Artist>/);
 vm.runInContext('showUnavailable("No verified rank")',context);
 assert.equal(element("resilience-panel").hidden,true);
 assert.equal(element("resilience-items").textContent,"");
});

test("slow stale Qloo response cannot overwrite a later successfully renegotiated plan",async()=>{
 const pending=[];
 const mockFetch=()=>new Promise(resolve=>pending.push(resolve));
 const {context,element}=makeView(mockFetch);
 vm.runInContext('runtimeMode="live"',context);
 const candidate=label=>({id:"music:"+label,label,slot:"music",cost:0,evidence_id:"QL-"+label,
   source:"qloo-rest:insights+rank"});
 const makeResult=label=>{
  const item=candidate(label),plan={items:[item],groupA:.6,groupB:.6,worst:.6,mean:.6,gap:0};
  return {mode:"qloo-live",status:"ok",bridge:plan,baselines:{majority:plan,average:plan},trace:[],treaty:null};
 };
 const first=vm.runInContext("run()",context);
 const second=vm.runInContext("run()",context);
 assert.equal(pending.length,2);
 pending[1]({ok:true,json:async()=>makeResult("NEW_PLAN")});
 await second;
 pending[0]({ok:false,json:async()=>({message:"Outdated failure"})});
 await first;
 assert.match(element("plan-items").innerHTML,/NEW_PLAN/);
 assert.doesNotMatch(element("plan-items").innerHTML,/Outdated failure/);
 assert.equal(vm.runInContext("latest.bridge.items[0].label",context),"NEW_PLAN");
 assert.equal(element("run").disabled,false);
});

test("editing cultural anchors invalidates any in-flight response and old vetoes",async()=>{
 const pending=[];
 const {context,element}=makeView(()=>new Promise(resolve=>pending.push(resolve)));
 vm.runInContext('runtimeMode="live"',context);
 const request=vm.runInContext("run()",context);
 vm.runInContext('vetoes.set("old-id","Old Group Option")',context);
 element("group-a").handlers.input();
 assert.equal(vm.runInContext("vetoes.size",context),0);
 assert.equal(vm.runInContext("latest",context),null);
 pending[0]({ok:false,json:async()=>({message:"Stale Qloo error"})});
 await request;
 assert.match(element("plan-items").textContent,/Cultural anchors changed/);
 assert.equal(element("run").disabled,false);
});

test("starting a new query immediately hides the previously copyable treaty",async()=>{
 const pending=[];
 const {context,element}=makeView(()=>new Promise(resolve=>pending.push(resolve)));
 vm.runInContext('runtimeMode="live"',context);
 const row=(id,slot)=>({id,slot,label:"Option "+id,cost:0,scoreA:.5,scoreB:.5,evidence_id:"QL-"+id,source:"qloo-rest:insights+rank"});
 const plan={groupA:.5,groupB:.5,worst:.5,mean:.5,gap:0,
  items:[row("m","music"),row("f","food"),row("x","experience")]};
 const mock={status:"ok",mode:"qloo-live",bridge:plan,
  baselines:{majority:plan,average:plan},trace:[],treaty:null,
  resilience:{impacts:plan.items.map(y=>({
   status:"unavailable",removed:{id:y.id,slot:y.slot,label:y.label},
   worst_after:null,worst_rank_loss:null,changes:[]
  }))}};
 context.fixture=mock;
 vm.runInContext("render(fixture)",context);
 assert.equal(element("resilience-panel").hidden,false);
 const p=vm.runInContext("run()",context);
 assert.equal(vm.runInContext("latest",context),null);
 assert.equal(element("resilience-panel").hidden,true);
 assert.equal(element("plan-title").textContent,"Evaluating cultural evidence…");
 assert.equal(element("copy-feedback").textContent,"");
 pending[0]({ok:false,json:async()=>({message:"Provider currently unavailable"})});
 await p;
 assert.equal(element("resilience-panel").hidden,true);
 assert.match(element("plan-items").textContent,/Provider currently unavailable/);
});

test("negotiation dial previews real nondominated evidence without networking",()=>{
 let fetches=0;
 const {context,element}=makeView(async()=>{fetches++;throw Error("Unexpected network");});
 const best=buildBridge({candidates:sample.candidates,maxBudget:210});
 context.fixture={...best,mode:"synthetic",treaty:null};
 vm.runInContext("render(fixture)",context);
 const atlas=best.negotiation;
 assert.equal(element("negotiation-panel").hidden,false);
 assert.equal(Number(element("negotiation-slider").max),atlas.points.length-1);
 assert.match(element("negotiation-chart").innerHTML,/<svg/);
 assert.match(element("negotiation-chart").innerHTML,/data-frontier-index/);
 assert.match(element("negotiation-blind").textContent,/in-sample/);
 const pointIndex=atlas.points.length-1;
 element("negotiation-slider").handlers.input({target:{value:String(pointIndex)}});
 assert.equal(element("negotiation-slider").value,String(pointIndex));
 assert.equal(element("negotiation-a").textContent,
  (atlas.points[pointIndex].groupA*100).toFixed(1)+"%");
 assert.match(element("negotiation-options").innerHTML,/evidence|SYN-/i);
 assert.equal(fetches,0);
 vm.runInContext('showUnavailable("No shared Qloo evidence")',context);
 assert.equal(element("negotiation-panel").hidden,true);
 assert.equal(element("negotiation-chart").innerHTML,"");
});
test("untrusted cultural option names cannot inject markup in frontier preview",()=>{
 const candidates=sample.candidates.map(x=>({...x,label:x.id==="acoustic"?'<img src=x onerror=alert(1)>':x.label}));
 const best=buildBridge({candidates,maxBudget:210});
 const {context,element}=makeView();
 context.fixture={...best,mode:"synthetic",treaty:null};
 vm.runInContext("render(fixture)",context);
 assert.ok(best.negotiation.points.length>=1);
 for(let i=0;i<best.negotiation.points.length;i++){
  vm.runInContext("showNegotiationPoint("+i+")",context);
  assert.doesNotMatch(element("negotiation-options").innerHTML,/<img /i);
 }
 assert.equal(element("negotiation-panel").hidden,false);
});
