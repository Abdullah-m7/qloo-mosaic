// Judge-safe rate limiting on Render; never log or expose client IP addresses.
import {isIP} from "node:net";

export function clientIdentity(request,{render=process.env.RENDER==="true"}={}){
 // Render's public web edge overwrites CF-Connecting-IP. Do not trust a caller-
 // controlled forwarded header when the app runs outside Render.
 const edge=render?request?.headers?.["cf-connecting-ip"]:null;
 if(typeof edge==="string" && isIP(edge.trim()))
  return "edge:"+edge.trim();
 const peer=request?.socket?.remoteAddress;
 return typeof peer==="string"&&isIP(peer)?"peer:"+peer:"unknown";
}

export function createRateLimiter({max=12,windowMs=3_600_000,maxClients=2048,clock=Date.now}={}){
 if(!Number.isInteger(max)||max<1||!Number.isFinite(windowMs)||windowMs<=0)
  throw new TypeError("Invalid request limiter configuration");
 const clients=new Map();
 return function isLimited(identity){
  const t=clock();
  if(clients.size>=maxClients){
   for(const [key,item] of clients){
    if(t-item.start>=windowMs)clients.delete(key);
   }
   if(clients.size>=maxClients){
    // Bound memory independently of attacker-chosen IP cardinality.
    clients.delete(clients.keys().next().value);
   }
  }
  const prev=clients.get(identity);
  const item=prev&&t-prev.start<windowMs?prev:{start:t,count:0};
  item.count++;
  clients.set(identity,item);
  return item.count>max;
 };
}
