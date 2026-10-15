// Public, credential-safe errors for the Qloo planning API.
// Never relay raw provider payloads, user identifiers or HTTP headers.
export function publicQlooFailure(error){
 const code=String(error?.message||"UNKNOWN");
 if(code==="QLOO_AMBIGUOUS_SIGNAL")
  return {httpStatus:422,status:"needs_input",code:"AMBIGUOUS_CULTURAL_ANCHOR",
   message:"That cultural name matches multiple Qloo entities. Use a more distinctive public artist or movie title."};
 if(code==="QLOO_SIGNAL_UNRESOLVED")
  return {httpStatus:422,status:"needs_input",code:"CULTURAL_ANCHOR_NOT_FOUND",
   message:"Qloo could not uniquely identify that public cultural name. Try a better-known artist or movie."};
 if(code==="QLOO_INCOMPLETE_RANKING"||code.startsWith("Insufficient matched Qloo ranking overlap")||
  code.startsWith("Insufficient verifiable Qloo candidates"))
  return {httpStatus:422,status:"blocked",code:"INSUFFICIENT_MUTUAL_QLOO_EVIDENCE",
   message:"Qloo did not rank enough shared options for both audiences. Try different public cultural anchors."};
 if(code==="QLOO_HTTP_429"||code==="QLOO_BOUNDED_CALL_LIMIT")
  return {httpStatus:429,status:"blocked",code:"QLOO_REQUEST_LIMIT",
   message:"The Qloo event API is temporarily rate-limiting requests. Try again after the quota recovers."};
 if(code==="QLOO_CREDENTIAL_MISSING"||code==="QLOO_HTTP_401"||code==="QLOO_HTTP_403")
  return {httpStatus:503,status:"blocked",code:"QLOO_AUTH_UNAVAILABLE",
   message:"Qloo authentication is unavailable. The server administrator needs to verify the protected event credential."};
 return {httpStatus:503,status:"blocked",code:"QLOO_LIVE_UNAVAILABLE",
  message:"Real Qloo evidence is temporarily unavailable. No synthetic fallback or unverified plan is shown."};
}
