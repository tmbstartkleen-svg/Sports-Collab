// Offline owner-bootstrap proof validation only. Not wired to enrollment or HTTP.
// A signature from an independently provisioned administrator key is required;
// caller-provided booleans or unsigned JSON never authorize owner enrollment.
import {verify,createPublicKey} from 'node:crypto';
export const OWNER_BOOTSTRAP_ENABLED=false;
export function verifyOwnerBootstrapProof({proof,ownerId,publicKey,now=Date.now()}={}){
 if(!OWNER_BOOTSTRAP_ENABLED)return {ok:false,reason:'Owner bootstrap disabled'};
 if(typeof ownerId!=='string'||!ownerId||!Number.isSafeInteger(now)||now<0||
    !proof||typeof proof!=='object'||typeof proof.payload!=='string'||typeof proof.signature!=='string')
  return {ok:false,reason:'Invalid bootstrap evidence'};
 try{
  const payload=JSON.parse(proof.payload);
  if(payload.purpose!=='sports-collab-owner-passkey-bootstrap'||payload.ownerId!==ownerId||
     !Number.isSafeInteger(payload.issuedAt)||!Number.isSafeInteger(payload.expiresAt)||
     payload.issuedAt>now||payload.expiresAt<=now||payload.expiresAt-payload.issuedAt>300000||
     typeof payload.nonce!=='string'||!/^[a-f0-9]{32,128}$/.test(payload.nonce))
   return {ok:false,reason:'Bootstrap proof scope or expiry invalid'};
  if(!/^[A-Za-z0-9_-]+$/.test(proof.signature))return {ok:false,reason:'Invalid signature encoding'};
  const key=createPublicKey(publicKey);
  if(key.asymmetricKeyType!=='ed25519')return {ok:false,reason:'Unsupported bootstrap signing key'};
  const signature=Buffer.from(proof.signature,'base64url');
  if(signature.length!==64||signature.toString('base64url')!==proof.signature||
     !verify(null,Buffer.from(proof.payload),key,signature))
   return {ok:false,reason:'Bootstrap signature invalid'};
  // A durable, atomic nonce redemption store is still required before use.
  return {ok:true,requiresAtomicNonceRedemption:true};
 }catch{return {ok:false,reason:'Bootstrap proof invalid'}}
}
