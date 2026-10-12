import {offlineFetch as fetch} from "./lineup-offline.mjs";
const $=id=>document.getElementById(id);
const chosen=()=>({
 cancelledId:$("cancelled").value,
 protectedIds:[],
 maxLossFromOriginal:Number($("maxloss").value)/100,
 availability:{"artist:D":$("available-d").checked,"artist:E":$("available-e").checked}
});
const signed=x=>(x>=0?"+":"")+Math.round(x*100)+" pp";
const pct=x=>Math.round(x*100)+"%";
let serial=0;
function createLineup(scenario){
 const root=$("lineup-list");root.replaceChildren();
 scenario.lineup.forEach((act,index)=>{
  const el=document.createElement("article");
  const gone=act.id===$("cancelled").value;
  el.className="act"+(gone?" cancelled":"");
  const pos=document.createElement("span");pos.className="position";
  pos.textContent=String(index+1).padStart(2,"0");
  const detail=document.createElement("div");
  const bold=document.createElement("strong");bold.textContent=act.label;
  const hint=document.createElement("small");hint.textContent=gone?"Cancelled — needs a replacement":"Already on the program";
  detail.append(bold,hint);
  const badge=document.createElement("span");badge.className="state";badge.textContent=gone?"CANCELLED":"KEEP";
  el.append(pos,detail,badge);root.append(el);
 });
}
function clearResult(message,status="err"){
 $("result-status").textContent="No justified repair · "+status;
 $("result-status").className="result-status "+status;
 $("decision").textContent=message;
 $("decision-subtitle").textContent="The planner won't invent a replacement or pretend Qloo data exists.";
 $("gain").textContent="—";
 $("audiences").replaceChildren();
 $("proof").textContent="Only organizer-confirmed available alternatives can be considered. Reduce constraints or verify more candidates.";
}
function render(result){
 if(result.mode!=="synthetic"||result.scenario===undefined||result.plan===undefined)
  return clearResult("Unexpected response — no plan can be trusted.");
 const {scenario,plan}=result;
 createLineup(scenario);
 if(plan.status!=="repair"){
   return clearResult(plan.reason||"No safe repair",plan.status);
 }
 $("result-status").textContent="A one-change rescue is feasible · synthetic rankings";
 $("result-status").className="result-status";
 const cancelled=scenario.lineup.find(x=>x.id===plan.changes[0].removeId);
 $("decision").textContent=(cancelled?.label||"Cancelled act")+" → "+plan.changes[0].addLabel;
 $("decision-subtitle").textContent="One replacement; the remaining lineup stays intact. Availability flags were set by the organizer in this demo.";
 $("gain").textContent=signed(plan.worstProxyGain);
 const groups=$("audiences");groups.replaceChildren();
 for(const before of plan.baseline.groups){
   const after=plan.proposed.groups.find(x=>x.id===before.id);
   const article=document.createElement("article");article.className="audience";
   const h=document.createElement("h4");h.textContent=before.label;
   article.append(h);
   for(const [name,value,isNew] of [["Vacant slot",before.proxy,false],["Repaired",after.proxy,true]]){
     const row=document.createElement("div");row.className="row";
     const lbl=document.createElement("span");lbl.textContent=name;
     const track=document.createElement("div");track.className="track"+(isNew?" new":"");
     const bar=document.createElement("i");bar.style.width=pct(value);track.append(bar);
     const out=document.createElement("output");out.textContent=pct(value);
     row.append(lbl,track,out);article.append(row);
   }
   groups.append(article);
 }
 $("proof").textContent=
  "All "+plan.proof.rankingUniverseSize+" artist IDs use the same fixed comparison universe for both audiences. "+
  "The surviving artists were not removed. One organizer-confirmed replacement was selected from "+
  plan.evaluated+" feasible comparison(s). Worst-group rank change: "+signed(plan.worstProxyGain)+
  ". No concert rights, ticket availability, or real audience satisfaction is inferred.";
}
async function run(){
 const request=++serial;
 const button=$("audit");button.disabled=true;button.textContent="Running independent audit…";
 $("result-status").textContent="Comparing the fixed lineup identities…";
 try{
  const response=await fetch("/api/lineup-demo",{method:"POST",headers:{"content-type":"application/json"},
   body:JSON.stringify(chosen())});
  const result=await response.json();
  if(request!==serial)return;
  if(!response.ok)throw Error(result.message||"Failed to evaluate lineup");
  render(result);
 }catch(e){
  if(request!==serial)return;
  clearResult(e.message);
 }finally{
  if(request===serial){button.disabled=false;button.innerHTML='Run rescue audit <span aria-hidden="true">↗</span>';}
 }
}
$("audit").addEventListener("click",run);
$("cancelled").addEventListener("change",run);
$("available-d").addEventListener("change",run);
$("available-e").addEventListener("change",run);
$("maxloss").addEventListener("input",()=>{
 $("maxloss-value").textContent=$("maxloss").value+"%";
});
$("maxloss").addEventListener("change",run);
run();
