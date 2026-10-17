import test from "node:test";
import assert from "node:assert/strict";
import {publicQlooFailure} from "../src/qloo-errors.mjs";

const mappings=[
 ["QLOO_INVALID_SIGNALS",422,"INVALID_TASTE_ANCHOR_HINT"],
 ["QLOO_INVALID_RELEASE_YEAR",422,"INVALID_TASTE_ANCHOR_HINT"],
 ["QLOO_INVALID_SIGNAL_TYPE",422,"INVALID_TASTE_ANCHOR_HINT"],
 ["QLOO_AMBIGUOUS_SIGNAL",422,"AMBIGUOUS_CULTURAL_ANCHOR"],
 ["QLOO_SIGNAL_UNRESOLVED",422,"CULTURAL_ANCHOR_NOT_FOUND"],
 ["QLOO_INCOMPLETE_RANKING",422,"INSUFFICIENT_MUTUAL_QLOO_EVIDENCE"],
 ["Insufficient matched Qloo ranking overlap for music",422,"INSUFFICIENT_MUTUAL_QLOO_EVIDENCE"],
 ["QLOO_HTTP_429",429,"QLOO_REQUEST_LIMIT"],
 ["QLOO_BOUNDED_CALL_LIMIT",429,"QLOO_REQUEST_LIMIT"],
 ["QLOO_CREDENTIAL_MISSING",503,"QLOO_AUTH_UNAVAILABLE"],
 ["QLOO_HTTP_401",503,"QLOO_AUTH_UNAVAILABLE"],
 ["QLOO_HTTP_403",503,"QLOO_AUTH_UNAVAILABLE"]
];
for(const [message,expectedStatus,expectedCode] of mappings){
 test("safe public API mapping for "+expectedCode+" ("+message+")",()=>{
  const value=publicQlooFailure(Error(message));
  assert.equal(value.httpStatus,expectedStatus);
  assert.equal(value.code,expectedCode);
  assert.ok(value.message && value.message.length<250);
  assert.ok(!/token|secret|password|header|key value/i.test(value.message));
 });
}
test("unknown provider text and attached inputs never escape API error response",()=>{
 const incident=Error("SENSITIVE_PROVIDER_PAYLOAD secret=some-private-token");
 incident.publicAnchor={name:"Private Culture",exactMatches:7};
 const out=publicQlooFailure(incident);
 assert.equal(out.httpStatus,503);
 assert.equal(out.code,"QLOO_LIVE_UNAVAILABLE");
 assert.doesNotMatch(JSON.stringify(out),/SENSITIVE_PROVIDER_PAYLOAD|some-private-token|Private Culture/);
});
