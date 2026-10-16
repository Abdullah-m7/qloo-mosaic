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
function renderQlooContributors(item,mode){
 if(mode!=="qloo-live")return "";
 const reasons=item?.qloo_explanations||{};
 const groups=[["groupA","A"],["groupB","B"]].map(([key,label])=>{
  const valid=Array.isArray(reasons[key])?reasons[key].filter(x=>
   typeof x?.anchor==="string"&&x.anchor.length<=72&&
   Number.isFinite(x?.contribution)&&x.contribution>=0&&x.contribution<=1):[];
  const content=valid.length?
   valid.slice(0,4).map(x=>safe(x.anchor)+": "+Number(x.contribution).toFixed(3)).join(" · "):
   "No per-anchor attribution supplied";
  return '<p><strong>Group '+label+'</strong> '+content+'</p>';
 }).join("");
 return '<aside class="qloo-contributors"><b>QLOO SOURCE CONTRIBUTIONS</b>'+
  groups+'<small>Provider-normalized explanation values (0–1), not probabilities, measured satisfaction, or causal influence.</small></aside>';
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
let activeNegotiationPoint=0;
function negotiationPosition(value){
 const v=Number(value);
 return Number.isFinite(v)?Math.min(1,Math.max(0,v)):0;
}
function showNegotiationPoint(index){
 const atlas=latest?.negotiation;
 if(!atlas?.points?.length)return;
 const i=Math.max(0,Math.min(atlas.points.length-1,Number(index)||0));
 activeNegotiationPoint=i;
 const p=atlas.points[i];
 $("negotiation-slider").value=String(i);
 $("negotiation-position").textContent=(i+1)+" / "+atlas.points.length;
 $("negotiation-plan-type").textContent=p.isMaximin?
   "MOSAIC BALANCED RECOMMENDATION":"EFFICIENT COMPROMISE · PREVIEW ONLY";
 $("negotiation-a").textContent=(p.groupA*100).toFixed(1)+"%";
 $("negotiation-b").textContent=(p.groupB*100).toFixed(1)+"%";
 $("negotiation-options").innerHTML=p.items.map(x=>
  '<p class="negotiation-option"><b>'+safe(x.slot.toUpperCase())+'</b> · '+
  safe(x.label)+' <small>['+safe(x.evidence_id)+']</small></p>'
 ).join("");
 $("negotiation-preview-note").textContent=p.isMaximin?
  "This plan maximizes the lower group's ordinal rank proxy on this list.":
  "Exploratory preview: Group A regret "+(p.regretA*100).toFixed(1)+
  "pp · Group B regret "+(p.regretB*100).toFixed(1)+
  "pp from each group's own top-ranked feasible plan. The official recommendation is unchanged.";
 // Both axes use 0–1 relative ordinal rank proxies, not satisfaction.
 const sx=v=>(49+negotiationPosition(v)*274).toFixed(2);
 const sy=v=>(231-negotiationPosition(v)*194).toFixed(2);
 const dots=atlas.points.map((x,n)=>{
  const active=n===i;
  return '<circle data-frontier-index="'+n+'" tabindex="0" role="button" '+
   'aria-label="Preview option '+(n+1)+' Group A '+(x.groupA*100).toFixed(1)+
   ' percent rank, Group B '+(x.groupB*100).toFixed(1)+' percent rank" '+
   'cx="'+sx(x.groupA)+'" cy="'+sy(x.groupB)+'" r="'+(active?9:6)+'" '+
   'stroke="'+(active?'#ffa987':'#17221b')+'" stroke-width="'+(active?3:2)+'" '+
   'fill="'+(x.isMaximin?'#d5ff91':'#a2d0b0')+'"><title>'+
   (x.isMaximin?'Maximin recommendation':'Nondominated cultural compromise')+
   '</title></circle>';
 }).join("");
 const blind=atlas.tasteBlind;
 const blindDot=blind?'<rect x="'+(Number(sx(blind.groupA))-5)+'" y="'+
  (Number(sy(blind.groupB))-5)+'" width="10" height="10" '+
  'fill="#ffa987" stroke="#17221b" stroke-width="2" '+
  'transform="rotate(45 '+sx(blind.groupA)+' '+sy(blind.groupB)+')">'+
  '<title>Rank-blind alphabetical control</title></rect>':"";
 $("negotiation-chart").innerHTML='<svg xmlns="http://www.w3.org/2000/svg" '+
  'viewBox="0 0 355 267" role="img" aria-label="Nondominated Qloo-ranked options">'+
  '<rect x="49" y="37" width="274" height="194" fill="#15231a" stroke="#3a5842"/>'+
  '<line x1="49" y1="134" x2="323" y2="134" stroke="#3d5140" stroke-dasharray="3 5"/>'+
  '<line x1="186" y1="37" x2="186" y2="231" stroke="#3d5140" stroke-dasharray="3 5"/>'+
  '<text x="10" y="22" fill="#c5d3c0" font-size="11">B ↑</text>'+
  '<text x="293" y="256" fill="#c5d3c0" font-size="11">A →</text>'+
  '<text x="49" y="252" fill="#97ae9a" font-size="9">0</text>'+
  '<text x="311" y="252" fill="#97ae9a" font-size="9">1</text>'+
  blindDot+dots+'</svg>';
}
function renderNegotiation(result){
 const panel=$("negotiation-panel");
 const atlas=result?.negotiation;
 if(result?.status!=="ok"||!atlas||!Array.isArray(atlas.points)||!atlas.points.length){
  panel.hidden=true;
  $("negotiation-chart").innerHTML="";
  $("negotiation-options").innerHTML="";
  return;
 }
 panel.hidden=false;
 $("negotiation-slider").max=String(atlas.points.length-1);
 $("negotiation-slider").disabled=atlas.points.length<2;
 const blind=atlas.tasteBlind;
 if(blind){
  const optimized=result.bridge.worst;
  const difference=(optimized-blind.worst)*100;
  $("negotiation-blind").textContent=
   "Taste-blind alphabetical plan: weakest audience "+(blind.worst*100).toFixed(1)+
   "% vs MOSAIC "+(optimized*100).toFixed(1)+
   "% ("+(difference>=0?"+":"")+difference.toFixed(1)+
   "pp in-sample, not a tested real-world uplift).";
 }
 const idx=atlas.points.findIndex(p=>p.id===atlas.maximinId);
 showNegotiationPoint(idx>=0?idx:0);
}
function renderThreadChoice(result){
 const panel=$("cultural-thread");
 const current=result?.threadChoice;
 if(result?.mode!=="qloo-live"||result?.status!=="ok"||!current){
  panel.hidden=true;
  $("thread-verified-tags").innerHTML="";
  $("thread-alternative-items").innerHTML="";
  return;
 }
 panel.hidden=false;
 const approved=current.status==="verified"&&
  current.provider_calls===0&&current.alternative?.items?.length===3&&
  Array.isArray(current.verified_motifs)&&current.verified_motifs.length>0;
 const tested=Number.isInteger(current.within_fairness_bound)?
  current.within_fairness_bound:0;
 if(!approved){
  $("thread-status").textContent="NO VERIFIED CULTURAL LINK IN BOUNDED SEARCH";
  $("thread-heading").textContent="No evidence-based shared thread yet";
  $("thread-message").textContent=
   "Across "+tested+" near-balanced candidate agreements, Qloo did not provide a matching public tag in two selected categories. MOSAIC won't invent one.";
  $("thread-verified-tags").innerHTML="";
  $("thread-alternative-items").textContent="No verified alternative under the chosen rank-proxy loss limit.";
  $("thread-rank-cost").textContent="Zero fabricated connections";
  return;
 }
 const loss=Number(current.worst_rank_proxy_loss);
 const safeLoss=Number.isFinite(loss)&&loss>=0&&loss<=.2?loss:0;
 const maxLoss=Number.isFinite(current.max_rank_proxy_loss)?
  current.max_rank_proxy_loss:.05;
 $("thread-status").textContent="MATCHED QLOO PROVIDER TAG IDS";
 $("thread-heading").textContent=
  safeLoss===0?"Cultural common ground — no rank trade-off":
  "A cultural thread with an explicit trade-off";
 $("thread-message").textContent=
  "This alternative shares independently verified cultural tag IDs across"+
  " different types of selected Qloo entities. The maximum accepted drop"+
  " was "+(maxLoss*100).toFixed(1)+" percentage points of the lowest group-relative rank proxy.";
 $("thread-verified-tags").innerHTML=current.verified_motifs.slice(0,4).map(m=>{
  const slots=Array.isArray(m.slots)?m.slots.filter(x=>["music","food","experience"].includes(x)):[];
  if(slots.length<2||typeof m.id!=="string"||!m.id.startsWith("urn:tag:"))return "";
  return '<span class="thread-tag"><strong>'+safe(m.name)+
   '</strong><small>Qloo ID '+safe(m.id)+' · '+safe(slots.join(" + "))+'</small></span>';
 }).join("");
 $("thread-alternative-items").innerHTML=current.alternative.items.map(x=>
  '<p class="thread-alternative-item"><b>'+safe(x.slot?.toUpperCase())+'</b> · '+
  safe(x.label)+' <small>'+safe(x.evidence_id)+'</small></p>').join("");
 $("thread-rank-cost").textContent=
  safeLoss===0?"No loss in the lowest group rank proxy":
  "Balance trade-off: −"+(safeLoss*100).toFixed(1)+" percentage points of ordinal proxy";
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
 renderNegotiation(null);
 renderThreadChoice(null);
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
 renderNegotiation(result);
 renderThreadChoice(result);
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
  renderQlooContributors(o,result.mode)+
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
     step.stage==="enrich" ? "VERIFY" : step.stage==="renegotiate" ? "REPLAN" : "OPTIMIZE";
   const label=step.stage==="discover" ? safe(step.slot)+" · "+safe(step.strategy) +
     " · "+safe(step.count)+" candidate(s)" :
     step.stage==="rank" ? safe(step.slot)+" · "+safe(step.candidates)+" mutually ranked"+
       (step.discarded>0?" · "+safe(step.discarded)+" excluded for missing evidence":"") :
     step.stage==="enrich" ? safe(step.slot)+" · "+safe(step.count)+" grounded Qloo tags, reused from discovery · 0 new API calls" :
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
// Pure local negotiation previews: moving the dial cannot trigger Qloo calls.
$("negotiation-slider").addEventListener("input",value=>{
 const n=typeof value==="object"?value.target?.value:value;
 showNegotiationPoint(n);
});
$("negotiation-chart").addEventListener("click",ev=>{
 const b=ev.target.closest("[data-frontier-index]");
 if(b)showNegotiationPoint(Number(b.dataset.frontierIndex));
});
$("negotiation-chart").addEventListener("keydown",ev=>{
 if(ev.key!=="Enter"&&ev.key!==" ")return;
 const b=ev.target.closest("[data-frontier-index]");
 if(b){ev.preventDefault();showNegotiationPoint(Number(b.dataset.frontierIndex));}
});
$("negotiation-reset").addEventListener("click",()=>{
 const idx=latest?.negotiation?.points?.findIndex(p=>p.id===latest.negotiation.maximinId);
 showNegotiationPoint(idx>=0?idx:0);
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
