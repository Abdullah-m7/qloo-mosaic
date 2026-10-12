import {offlineFetch as fetch} from "./static-offline.mjs";
const $=id=>document.getElementById(id);
const money=x=>Number(x).toFixed(0)+" pts";
const percent=x=>(Number(x)*100).toFixed(0)+"%";
const safe=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const vetoes=new Map();
let latest=null, baselineType="majority";
let runtimeMode=null;
function bar(name,value){
 $(name).style.width=percent(value);
 $(name+"T").textContent=percent(value);
}
function renderVetoes(){
 const el=$("rejection-list");
 if(!vetoes.size){el.innerHTML="";return;}
 el.innerHTML='<span class="veto-caption">REJECTED</span>'+
 [...vetoes].map(([id,label])=>'<button class="veto-chip" data-undo="'+safe(id)+'" title="Undo rejection">'+safe(label)+' <span>×</span></button>').join("")+
 '<button class="clear-vetoes" id="clear-vetoes">Reset all</button>';
}
function drawBaselines(){
 if(!latest||latest.status!=="ok")return;
 const chosen=latest.baselines?.[baselineType]??latest.baseline;
 const bridge=latest.bridge;
 const modeLabel=baselineType==="majority"?"Group A–first baseline":"Average–first baseline";
 $("baseline-title").textContent=modeLabel;
 bar("baseA",chosen.groupA);bar("baseB",chosen.groupB);
 const delta=bridge.worst-chosen.worst;
 $("gain").textContent=(delta>=0?"+":"")+Math.round(delta*100)+"pp worst-group rank proxy";
 $("tradeoff").textContent=baselineType==="majority"?
  "Against a one-sided plan: Group A "+signed(bridge.groupA-chosen.groupA)+", Group B "+signed(bridge.groupB-chosen.groupB)+". The aim is a better balance, not a guarantee about real attendance.":
  "Against the highest mean proxy plan: worst-group rank "+signed(delta)+", with group mean change "+signed(bridge.mean-chosen.mean)+".";
 for(const name of ["majority","average"]){
  const button=$("baseline-"+name);
  button.classList.toggle("active",name===baselineType);
  button.setAttribute("aria-pressed",String(name===baselineType));
 }
}
const signed=n=>(n>=0?"+":"")+Math.round(n*100)+"pp";
function render(result){
 latest=result;
 renderVetoes();
 if(result.mode==="qloo-live"){
  const banner=document.querySelector(".notice");
  const scenario=result.scenario;
  if(scenario){
   document.querySelector(".audience.first h3").textContent=scenario.groupA.title;
   document.querySelector(".audience.first p").textContent=scenario.groupA.anchors.join(" · ");
   document.querySelector(".audience.second h3").textContent=scenario.groupB.title;
   document.querySelector(".audience.second p").textContent=scenario.groupB.anchors.join(" · ");
  }
  document.querySelector(".score-foot").textContent="Qloo-derived relative ordinal rank proxies on identical candidate sets, not real satisfaction, probabilities, or causal evidence.";
  banner.querySelector("b").textContent="QLOO API MODE — SERVER-VERIFIED EVIDENCE";
  banner.querySelector("p").textContent="Relative ordinal ranks grounded in Qloo entity IDs. No actual pricing, availability, or attendance predictions.";
  banner.querySelector(".notice-tag").textContent="QLOO LIVE";
  $("ledger-mode").textContent="QLOO TOOL TRACE";
 }
 if(result.status!=="ok"){
  $("plan-title").textContent=result.reason||"No valid plan found";
  $("plan-items").textContent="";
  $("plan-cost").textContent="—";
  $("gain").textContent="NO FEASIBLE PLAN";
  $("ledger-items").textContent="Undo a veto or raise the budget to retry.";
  $("tradeoff").textContent="No partial or invented plan is shown.";
  $("exclude").innerHTML='<option value="">No options available</option>';
  return;
 }
 const bridge=result.bridge;
 $("plan-title").textContent="A little of both. All together.";
 $("plan-cost").textContent=result.mode==="qloo-live"?"—":money(bridge.cost);
 if(result.mode==="qloo-live")document.querySelector(".cost span").textContent="NO REAL PRICES";
 $("plan-items").innerHTML=bridge.items.map((o,i)=>
  '<article class="plan-card"><span class="category">'+
  String(i+1).padStart(2,"0")+" / "+safe(o.slot.toUpperCase())+
  '</span><strong>'+safe(o.label)+'</strong><div class="under"><span>'+money(o.cost)+'</span><small>Evidence '+safe(o.evidence_id)+'</small></div>'+
  '<button class="card-veto" data-veto="'+safe(o.id)+'" aria-label="Reject '+safe(o.label)+'">Reject option ↗</button></article>'
 ).join("");
 bar("newA",bridge.groupA);bar("newB",bridge.groupB);
 drawBaselines();
 $("ledger-items").innerHTML=bridge.items.map(o=>
  '<div class="ledger-row"><b>'+safe(o.label)+'</b><span>'+safe(o.source)+'</span><code>'+safe(o.evidence_id)+'</code></div>'
 ).join("");
 const ex=$("exclude");
 ex.innerHTML='<option value="">Select an option to reject</option>'+
 bridge.items.map(x=>'<option value="'+safe(x.id)+'">'+safe(x.label)+'</option>').join("");
}
async function run(){
 const button=$("run");button.disabled=true;button.textContent="Renegotiating…";
 try{
  const payload={maxBudget:Number($("budget").value),exclude:[...vetoes.keys()]};
  if(runtimeMode==="live"){
   payload.groupA=$("group-a").value.split(";").map(x=>x.trim()).filter(Boolean);
   payload.groupB=$("group-b").value.split(";").map(x=>x.trim()).filter(Boolean);
   payload.location=$("location").value.trim();
  }
  const r=await fetch("/api/plan",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload)});
  const data=await r.json();
  if(!r.ok)throw Error(data.message||"Unable to plan");
  render(data);
 }catch(e){
  $("plan-title").textContent="Can't complete this plan.";
  $("plan-items").textContent=e.message;
  $("gain").textContent="NOT AVAILABLE";
 }finally{
  button.disabled=false;button.innerHTML='Find common ground <span>↗</span>';
 }
}
function addVeto(id,label){
 if(!id || vetoes.has(id))return;
 vetoes.set(id,label||id);
 run();
}
$("budget").addEventListener("input",()=>{$("budget-value").textContent=money($("budget").value);});
$("run").addEventListener("click",run);
$("exclude").addEventListener("change",ev=>{
 const id=ev.target.value;
 if(id)addVeto(id,ev.target.selectedOptions[0].textContent);
});
$("plan-items").addEventListener("click",ev=>{
 const b=ev.target.closest("[data-veto]");
 if(b)addVeto(b.dataset.veto,b.closest(".plan-card")?.querySelector("strong")?.textContent);
});
$("rejection-list").addEventListener("click",ev=>{
 const undo=ev.target.closest("[data-undo]");
 if(undo){vetoes.delete(undo.dataset.undo);return run();}
 if(ev.target.closest("#clear-vetoes")){vetoes.clear();run();}
});
for(const name of ["majority","average"]){
 $("baseline-"+name).addEventListener("click",()=>{baselineType=name;drawBaselines();});
}
async function init(){
 const response=await fetch("/health",{cache:"no-store"});
 if(!response.ok)throw Error("Server health probe failed");
 const health=await response.json();
 runtimeMode=health.mode;
 if(!["sample","live"].includes(runtimeMode))throw Error("Unknown server mode");
 const enabled=runtimeMode==="live";
 for(const name of ["group-a","group-b","location"])$(name).disabled=!enabled;
 $("seed-help").textContent=enabled?
 "Enter 1–5 publicly known cultural entities for each audience, separated with semicolons. No names, personal data or emails.":
 "Sample mode: fixed fictional audience preferences. Custom seeds become available when the Qloo event key is configured on the server.";
 if(enabled){
  document.querySelector('label[for="budget"]').style.display="none";
  $("budget").style.display="none";
  document.querySelector(".slider-ends").style.display="none";
  document.querySelector(".hint").textContent="Change public cultural anchors or reject options to renegotiate. Qloo has no verified price or booking data.";
  const banner=document.querySelector(".notice");
  banner.querySelector("b").textContent="LIVE QLOO MODE — VERIFYING EVIDENCE";
  banner.querySelector("p").textContent="No simulated Qloo results will be shown if the API is unavailable.";
  banner.querySelector(".notice-tag").textContent="VERIFYING";
 }
 await run();
}
init().catch(e=>{
 $("plan-title").textContent="Server unavailable";
 $("plan-items").textContent=e.message;
 $("gain").textContent="NOT AVAILABLE";
});
