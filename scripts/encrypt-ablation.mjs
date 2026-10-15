// Encrypt aggregate Qloo holdout data before it leaves the CI runner.
// Only the recipient's public key is stored in the Git repository.
import {createCipheriv,publicEncrypt,randomBytes,constants} from "node:crypto";
import {readFileSync,writeFileSync,mkdirSync} from "node:fs";
import {dirname} from "node:path";

export function writeEncryptedAblation(summary,{publicKeyPath,outputPath}={}){
 if(!publicKeyPath||!outputPath)throw Error("QLOO_ABLATION_ENCRYPTION_REQUIRED");
 const pub=readFileSync(publicKeyPath);
 const aesKey=randomBytes(32);
 const nonce=randomBytes(12);
 const cipher=createCipheriv("aes-256-gcm",aesKey,nonce);
 const plaintext=Buffer.from(JSON.stringify(summary));
 const ciphertext=Buffer.concat([cipher.update(plaintext),cipher.final()]);
 const wrappedKey=publicEncrypt({
  key:pub,oaepHash:"sha256",padding:constants.RSA_PKCS1_OAEP_PADDING
 },aesKey);
 const envelope={
  schema:"mosaic-qloo-ablation-encrypted-v1",
  key_wrap:"rsa-oaep-sha256",
  data_cipher:"aes-256-gcm",
  wrapped_key:wrappedKey.toString("base64"),
  iv:nonce.toString("base64"),
  auth_tag:cipher.getAuthTag().toString("base64"),
  ciphertext:ciphertext.toString("base64")
 };
 mkdirSync(dirname(outputPath),{recursive:true});
 writeFileSync(outputPath,JSON.stringify(envelope)+"\n",{encoding:"utf8",flag:"wx",mode:0o600});
 aesKey.fill(0);
 plaintext.fill(0);
 return outputPath;
}
