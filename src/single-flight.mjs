// Share identical, currently pending live Qloo plans; never cache failures.
export function createSingleFlight({maxActive=3}={}){
 if(!Number.isInteger(maxActive)||maxActive<1||maxActive>50)
  throw new TypeError("Invalid in-flight cap");
 const pending=new Map();
 function run(key,work){
  const existing=pending.get(key);
  if(existing)return existing;
  if(pending.size>=maxActive){
   const error=new Error("DEMO_BUSY");
   error.code="DEMO_BUSY";
   throw error;
  }
  if(typeof work!=="function")throw new TypeError("Work function required");
  const promise=Promise.resolve().then(work);
  pending.set(key,promise);
  const cleanup=()=>{if(pending.get(key)===promise)pending.delete(key);};
  // Do not create an unobserved rejecting promise in cleanup.
  void promise.then(cleanup,cleanup);
  return promise;
 }
 return {run,has:key=>pending.has(key),active:()=>pending.size};
}
