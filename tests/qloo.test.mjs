import test from "node:test";
import assert from "node:assert/strict";
import {extractItems,percentileRanks,matchRanks} from "../src/qloo.mjs";
test("Qloo normalized entity wrappers are resolved without invented IDs",()=>{
 const rows=extractItems({results:[{entity:{id:"123",name:"Foo"}},{name:"Bar"},{}]});
 assert.deepEqual(rows,[{id:"123",name:"Foo"},{id:null,name:"Bar"}]);
});
test("scores from separate Qloo calls are NOT combined raw",()=>{
 const ranks=matchRanks(["Alpha","Beta","Gamma"],["Alpha","Beta","Gamma"],["Gamma","Beta","Alpha"]);
 assert.deepEqual(ranks.map(x=>[x.scoreA,x.scoreB]),[[1,0],[0.5,0.5],[0,1]]);
});
test("incomplete ranking triggers refusal, not imputation",()=>{
 assert.throws(()=>percentileRanks(["Alpha"],["Alpha","Beta"]),/Incomplete Qloo ranking/);
});
test("the same ranking list yields the same rank proxy",()=>{
 assert.deepEqual([...percentileRanks(["Blue","Red"],["Red","Blue"])], [["blue",1],["red",0]]);
});
