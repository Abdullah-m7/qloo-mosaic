const $=id=>document.getElementById(id);
const money=x=>Number(x).toFixed(0)+" pts";
const percent=x=>(Number(x)*100).toFixed(0)+"%";
const safe=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let chosen=[];
function bar(name,value){
 $(name).style.width=percent(value);
 $(name+"T").textContent=percent(value);
}
function render(result){
 if(result.mode==="qloo-live"){
   const banner=document.querySelector(".notice");
   banner.querySelector("b").textContent="QLOO API MODE — SERVER-VERIFIED EVIDENCE";
   banner.querySelector("p").textContent="Relative ordinal ranks from Qloo. Estimates are planning tokens, not actual prices.";
   banner.querySelector(".notice-tag").textContent="QLOO LIVE";
   $("ledger-mode").textContent="QLOO TOOL TRACE";
 }
 if(result.status!=="ok"){
  $("plan-title").textContent=result.reason||"No valid plan found";
  $("plan-items").textContent="";
  $("gain").textContent="NO VALID PLAN";
  $("ledger-items").textContent="Change your budget or release an exclusion and try again.";
  return;
 }
 const bridge=result.bridge,base=result.baseline;
 $("plan-title").textContent="A little of both. All together.";
 $("plan-cost").textContent=money(bridge.cost);
 $("plan-items").innerHTML=bridge.items.map((o,i)=>
  '<article class="plan-card"><span class="category">'+
  String(i+1).padStart(2,"0")+" / "+safe(o.slot.toUpperCase())+
  '</span><strong>'+safe(o.label)+'</strong><div class="under"><span>'+money(o.cost)+'</span><small>Evidence '+safe(o.evidence_id)+'</small></div></article>'
 ).join("");
 bar("baseA",base.groupA);bar("baseB",base.groupB);
 bar("newA",bridge.groupA);bar("newB",bridge.groupB);
 $("gain").textContent=(result.improvement>=0?"+":"")+Math.round(result.improvement*100)+"pp worst-off rank proxy";
 $("ledger-items").innerHTML=bridge.items.map(o=>
  '<div class="ledger-row"><b>'+safe(o.label)+'</b><span>'+safe(o.source)+'</span><code>'+safe(o.evidence_id)+'</code></div>'
 ).join("");
 const ex=$("exclude"),last=ex.value;
 chosen=bridge.items.map(x=>({id:x.id,label:x.label}));
 ex.innerHTML='<option value="">No exclusions</option>'+
   chosen.map(x=>'<option value="'+safe(x.id)+'">'+safe(x.label)+'</option>').join("");
 if(chosen.some(x=>x.id===last))ex.value=last;
}
async function run(){
 const button=$("run");button.disabled=true;button.textContent="Finding the bridge…";
 try{
  const payload={maxBudget:Number($("budget").value),exclude:$("exclude").value?[$("exclude").value]:[]};
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
$("budget").addEventListener("input",()=>{$("budget-value").textContent=money($("budget").value);});
$("run").addEventListener("click",run);
run();
