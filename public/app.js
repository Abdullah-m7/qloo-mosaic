const $=id=>document.getElementById(id);
const money=x=>Number(x).toFixed(0)+" pts";
const percent=x=>(Number(x)*100).toFixed(0)+"%";
const safe=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const vetoes=new Map();
let latest=null, baselineType="majority";
let runtimeMode=null;
let requestRevision=0;
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
function renderTreaty(result){
 const t=result.treaty;
 if(!t){$("treaty-panel").hidden=true;return;}
 $("treaty-panel").hidden=false;
 const delta=x=>(x>=0?"+":"")+Math.round(x*100)+"pp";
 $("treaty-a").textContent=delta(t.groupAChange);
 $("treaty-b").textContent=delta(t.groupBChange);
 $("treaty-compromise").textContent=t.compromiseOptions+" / "+t.selected.length;
 $("treaty-source").textContent=result.mode==="qloo-live"?"QLOO-BASED ORDINAL RANKS":"SYNTHETIC EXAMPLE";
 const motifs=t.motifs||[];
 $("treaty-thread").textContent=motifs.length?motifs.map(x=>x.label).join(" · "):
   "No cross-domain thread verified";
 $("treaty-thread-explain").textContent=motifs.length?
   "Recurring Qloo tag identifiers across more than one selected cultural category. This does not establish causality.":
   "No shared Qloo tag has been established. We won't invent a cultural connection. The agreement is based on comparative ordinal scores.";
 const explanation="The worst-ranked group proxy "+delta(t.worstGain)+
   " versus the one-sided plan. Total mean proxy "+delta(t.meanSacrifice)+
   " versus mean-first. These are ordinal trade-offs, not predicted customer behavior.";
 $("treaty-note").textContent=explanation;
 $("copy-feedback").textContent="";
}
function renderResilience(result){
 const panel=$("resilience-panel"),list=$("resilience-items");
 const impacts=result?.resilience?.impacts;
 if(result?.status!=="ok"||!Array.isArray(impacts)||impacts.length!==3){
  panel.hidden=true;
  list.textContent="";
  return;
 }
 panel.hidden=false;
 $("resilience-mode").textContent="SAME RANK EVIDENCE · ZERO EXTRA API CALLS";
 list.innerHTML=impacts.map(item=>{
  const removed=item?.removed||{};
  const feasible=item.status==="feasible"&&Number.isFinite(item.worst_rank_loss);
  const loss=feasible?(100*item.worst_rank_loss).toFixed(1)+" pp":"No viable alternative";
  const changes=Array.isArray(item.changes)?item.changes.map(x=>
   safe(x.slot)+" → "+safe(x.label)).join(" · "):"";
  return '<article class="resilience-card"><span class="resilience-slot">'+safe(removed.slot)+
   ' / IF REJECTED</span><h4>'+safe(removed.label)+'</h4>'+
   '<p class="resilience-loss">'+safe(loss)+'</p><p>'+
   (feasible?"Worst-group rank proxy loss":"No fully supported replacement plan")+
   '</p><p class="resilience-alt">'+
   (feasible?"Updated choices: "+changes:"This option is required by the current evidence and constraints.")+
   '</p>'+(feasible?'<button type="button" data-resilience-veto="'+safe(removed.id)+
   '" aria-label="Reject '+safe(removed.label)+' and renegotiate">Apply veto ↗</button>':"")+
   '</article>';
 }).join("");
}
function showUnavailable(message){
 // A failed Qloo query must not leave a copyable agreement from an earlier run.
 latest=null;
 $("plan-title").textContent="No verified plan available";
 $("plan-items").textContent=message;
 $("plan-cost").textContent="—";
 $("gain").textContent="EVIDENCE INCOMPLETE";
 $("tradeoff").textContent="No partial or invented plan is shown. Choose other public cultural anchors and retry.";
 $("treaty-panel").hidden=true;
 renderResilience(null);
 $("agent-trace-panel").hidden=true;
 $("agent-trace").textContent="";
 $("ledger-items").textContent="No verified evidence-backed agreement was produced.";
 $("exclude").innerHTML='<option value="">No verified options available</option>';
 $("copy-feedback").textContent="";
 for(const name of ["baseA","baseB","newA","newB"]){
  $(name).style.width="0%";
  $(name+"T").textContent="—";
 }
}
function render(result){
 if(result.status!=="ok"){
  showUnavailable(result.reason||result.message||"Insufficient verified cultural evidence.");
  return;
 }
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
 renderTreaty(result);
 renderResilience(result);
 const bridge=result.bridge;
 $("plan-title").textContent="A little of both. All together.";
 $("plan-cost").textContent=result.mode==="qloo-live"?"—":money(bridge.cost);
 if(result.mode==="qloo-live")document.querySelector(".cost span").textContent="NO REAL PRICES";
 $("plan-items").innerHTML=bridge.items.map((o,i)=>
  '<article class="plan-card"><span class="category">'+
  String(i+1).padStart(2,"0")+" / "+safe(o.slot.toUpperCase())+
  '</span><strong>'+safe(o.label)+'</strong><div class="under"><span>'+
  (result.mode==="qloo-live"?"No verified price":money(o.cost))+
  '</span><small>Evidence '+safe(o.evidence_id)+'</small></div>'+
  '<button class="card-veto" data-veto="'+safe(o.id)+'" aria-label="Reject '+safe(o.label)+'">Reject option ↗</button></article>'
 ).join("");
 bar("newA",bridge.groupA);bar("newB",bridge.groupB);
 drawBaselines();
 const steps=Array.isArray(result.trace)?result.trace:[];
 const panel=$("agent-trace-panel");
 if(panel){
  panel.hidden=result.mode!=="qloo-live"||steps.length===0;
  $("agent-trace").innerHTML=steps.map((step,i)=>{
   const status=step.stage==="discover" ? "DISCOVER" : step.stage==="rank" ? "RANK" :
     step.stage==="renegotiate" ? "REPLAN" : "OPTIMIZE";
   const label=step.stage==="discover" ? safe(step.slot)+" · "+safe(step.strategy) +
     " · "+safe(step.count)+" candidate(s)" :
     step.stage==="rank" ? safe(step.slot)+" · "+safe(step.candidates)+" mutually ranked"+
       (step.discarded>0?" · "+safe(step.discarded)+" excluded for missing evidence":"") :
     step.stage==="renegotiate" ? "Cached Qloo evidence · zero extra API calls" :
     safe(step.candidates)+" options · worst-group objective";
   return '<li><span class="trace-index">'+String(i+1).padStart(2,"0")+'</span><b>'+
     status+'</b><span>'+label+'</span></li>';
  }).join("");
 }
 $("ledger-items").innerHTML=bridge.items.map(o=>
  '<div class="ledger-row"><b>'+safe(o.label)+'</b><span>'+safe(o.source)+'</span><code>'+safe(o.evidence_id)+'</code></div>'
 ).join("");
 const ex=$("exclude");
 ex.innerHTML='<option value="">Select an option to reject</option>'+
 bridge.items.map(x=>'<option value="'+safe(x.id)+'">'+safe(x.label)+'</option>').join("");
}
async function run(){
 const revision=++requestRevision;
 const button=$("run");button.disabled=true;button.textContent="Renegotiating…";
 // Existing evidence cannot be copied or misread while a new veto/profile is pending.
 showUnavailable("Checking verified cultural alternatives. Please wait…");
 $("plan-title").textContent="Evaluating cultural evidence…";
 $("gain").textContent="REQUEST IN PROGRESS";
 try{
  const payload={maxBudget:Number($("budget").value),exclude:[...vetoes.keys()]};
  if(runtimeMode==="live"){
   payload.groupA=$("group-a").value.split(";").map(x=>x.trim()).filter(Boolean);
   payload.groupB=$("group-b").value.split(";").map(x=>x.trim()).filter(Boolean);
   payload.location=$("location").value.trim();
  }
  const r=await fetch("/api/plan",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload)});
  const data=await r.json();
  // Requests may return out of order while a person changes their anchors.
  // Never show an older treaty against newer visible audience preferences.
  if(revision!==requestRevision)return;
  if(!r.ok)throw Error(data.message||"Unable to plan");
  render(data);
 }catch(e){
  if(revision===requestRevision)
   showUnavailable(e?.message||"Unable to produce a verified plan.");
 }finally{
  if(revision===requestRevision){
   button.disabled=false;button.innerHTML='Find common ground <span>↗</span>';
  }
 }
}
function addVeto(id,label){
 if(!id || vetoes.has(id))return;
 vetoes.set(id,label||id);
 run();
}
$("budget").addEventListener("input",()=>{$("budget-value").textContent=money($("budget").value);});
// Editing cultural context invalidates any previous treaty and its veto IDs.
function inputsChanged(){
 requestRevision++;
 vetoes.clear();
 renderVetoes();
 showUnavailable("Cultural anchors changed. Run the planner for a new verified agreement.");
 const button=$("run");
 button.disabled=false;
 button.innerHTML='Find common ground <span>↗</span>';
}
for(const field of ["group-a","group-b","location"]){
 $(field).addEventListener("input",inputsChanged);
}
$("run").addEventListener("click",run);
$("exclude").addEventListener("change",ev=>{
 const id=ev.target.value;
 if(id)addVeto(id,ev.target.selectedOptions[0].textContent);
});
$("plan-items").addEventListener("click",ev=>{
 const b=ev.target.closest("[data-veto]");
 if(b)addVeto(b.dataset.veto,b.closest(".plan-card")?.querySelector("strong")?.textContent);
});
$("resilience-items").addEventListener("click",ev=>{
 const b=ev.target.closest("[data-resilience-veto]");
 if(b){
  const item=latest?.resilience?.impacts?.find(x=>x.removed?.id===b.dataset.resilienceVeto);
  if(item?.status==="feasible")addVeto(item.removed.id,item.removed.label);
 }
});
$("rejection-list").addEventListener("click",ev=>{
 const undo=ev.target.closest("[data-undo]");
 if(undo){vetoes.delete(undo.dataset.undo);return run();}
 if(ev.target.closest("#clear-vetoes")){vetoes.clear();run();}
});
for(const name of ["majority","average"]){
 $("baseline-"+name).addEventListener("click",()=>{baselineType=name;drawBaselines();});
}
$("copy-treaty").addEventListener("click",async()=>{
 if(!latest?.treaty || latest.status!=="ok")return;
 const t=latest.treaty;
 const lines=[
  "MOSAIC | CULTURAL BRIDGE AGREEMENT",
  "Evidence status: "+(latest.mode==="qloo-live"?"Qloo ordinal rankings":"SYNTHETIC EXAMPLE — NOT QLOO DATA"),
  "Selected: "+t.selected.map(x=>x.name+" ["+x.evidence_id+"]").join("; "),
  "Group A difference from A-first: "+Math.round(t.groupAChange*100)+" percentage points of ordinal proxy",
  "Group B difference from A-first: "+Math.round(t.groupBChange*100)+" percentage points of ordinal proxy",
  "Both groups' non-top choice count: "+t.compromiseOptions,
  "Verified cross-domain Qloo tags: "+(t.motifs?.length?t.motifs.map(x=>x.label).join(", "):"none"),
  "Limitations: "+t.provenance.limitations,
  "Project: https://github.com/Abdullah-m7/qloo-mosaic"
 ];
 try{
  await navigator.clipboard.writeText(lines.join("\n"));
  $("copy-feedback").textContent="Brief copied.";
 }catch{
  $("copy-feedback").textContent="Clipboard unavailable in this browser.";
 }
});
async function init(){
 const response=await fetch("/health",{cache:"no-store"});
 if(!response.ok)throw Error("Server health probe failed");
 const health=await response.json();
 runtimeMode=health.mode;
 if(!["sample","live"].includes(runtimeMode))throw Error("Unknown server mode");
 const enabled=runtimeMode==="live";
 for(const name of ["group-a","group-b","location"])$(name).disabled=!enabled;
 $("seed-help").textContent=enabled?
 "Enter 1–5 public artists or movies per audience, separated with semicolons. To clarify an ambiguous title, use Movie: Barbie (2023) or Artist: Radiohead. No attendee names, emails or private profiles.":
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
