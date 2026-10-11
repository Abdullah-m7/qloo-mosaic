import test from "node:test";
import assert from "node:assert/strict";
import {validateSeeds,validateLocation,DEFAULT_SEEDS} from "../src/qloo.mjs";

test("explicit public artist and movie anchors are accepted",()=>{
 assert.deepEqual(validateSeeds([" Radiohead ", " The Grand Budapest Hotel "]),["Radiohead","The Grand Budapest Hotel"]);
 assert.deepEqual(validateSeeds(undefined,DEFAULT_SEEDS.groupB),DEFAULT_SEEDS.groupB);
});
test("does not forward emails, URLs or multiline personal notes as cultural signals",()=>{
 for(const bad of ["someone@example.com","https://example.org/profile","hello\nprivate notes"]){
  assert.throws(()=>validateSeeds([bad]),/Only public cultural entity names/);
 }
});
test("duplicate and overlong anchors are rejected",()=>{
 assert.throws(()=>validateSeeds(["Radiohead","radiohead"]),/Duplicate/);
 assert.throws(()=>validateSeeds(["a".repeat(73)]),/Only public/);
});
test("limits breadth of Qloo requests to at most five anchors",()=>{
 assert.throws(()=>validateSeeds(["a","b","c","d","e","f"]),/one to five/);
 assert.throws(()=>validateSeeds([]),/one to five/);
});
test("allows public location query and rejects contact strings",()=>{
 assert.equal(validateLocation(undefined),"New York");
 assert.equal(validateLocation("  Jeddah  "),"Jeddah");
 assert.throws(()=>validateLocation("foo@bar.com"),/Invalid/);
});
