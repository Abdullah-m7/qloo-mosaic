import test from "node:test";
import assert from "node:assert/strict";
import {generateKeyPairSync,privateDecrypt,createDecipheriv,constants} from "node:crypto";
import {mkdtempSync,writeFileSync,readFileSync,rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {writeEncryptedAblation} from "../scripts/encrypt-ablation.mjs";

test("sealed research results decrypt privately and are never written as plaintext",()=>{
 const {publicKey,privateKey}=generateKeyPairSync("rsa",{
  modulusLength:2048,
  publicKeyEncoding:{type:"spki",format:"pem"},
  privateKeyEncoding:{type:"pkcs8",format:"pem"}
 });
 const dir=mkdtempSync(join(tmpdir(),"mosaic-ablation-encryption-"));
 try{
  const pub=join(dir,"public.pem"),dest=join(dir,"result.enc.json");
  writeFileSync(pub,publicKey);
  const secret={case:"synthetic-unit-test",delta:0.123456,neverPublish:"private-lab-result"};
  writeEncryptedAblation(secret,{publicKeyPath:pub,outputPath:dest});
  const file=readFileSync(dest,"utf8");
  assert.equal(file.includes("private-lab-result"),false);
  const sealed=JSON.parse(file);
  const key=privateDecrypt({key:privateKey,oaepHash:"sha256",
   padding:constants.RSA_PKCS1_OAEP_PADDING},Buffer.from(sealed.wrapped_key,"base64"));
  const decipher=createDecipheriv("aes-256-gcm",key,Buffer.from(sealed.iv,"base64"));
  decipher.setAuthTag(Buffer.from(sealed.auth_tag,"base64"));
  const decoded=Buffer.concat([
   decipher.update(Buffer.from(sealed.ciphertext,"base64")),decipher.final()
  ]).toString("utf8");
  assert.deepEqual(JSON.parse(decoded),secret);
  assert.throws(()=>writeEncryptedAblation(secret,{
   publicKeyPath:pub,outputPath:dest
  }),/EEXIST/);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
