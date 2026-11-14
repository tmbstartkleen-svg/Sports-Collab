// Offline preparation: no route, session, enrollment or credential writes.
// This coordinator must remain disabled until independent owner-key provisioning,
// durable nonce issuance and approved database integration are completed.
import {OWNER_BOOTSTRAP_ENABLED,verifyOwnerBootstrapProof} from './owner-bootstrap-proof.js';
import {OWNER_ENROLLMENT_ENABLED} from './passkey-owner-enrollment.js';
export const OWNER_BOOTSTRAP_AUTHORIZATION_ENABLED=false;
export async function authorizeOwnerBootstrap({ownerId,proof,publicKey,nonceStore,now}={}){
 if(!OWNER_BOOTSTRAP_AUTHORIZATION_ENABLED||!OWNER_BOOTSTRAP_ENABLED||!OWNER_ENROLLMENT_ENABLED)
  return {ok:false,reason:'Owner bootstrap authorization disabled'};
 // This publicKey must come from independently provisioned server configuration.
 // Never accept a signing key supplied in a browser request or proof payload.
 const verified=verifyOwnerBootstrapProof({ownerId,proof,publicKey,now});
 if(verified.ok!==true||verified.requiresAtomicNonceRedemption!==true)
  return {ok:false,reason:'Bootstrap proof rejected'};
 if(typeof nonceStore?.redeem!=='function')
  return {ok:false,reason:'Bootstrap nonce store unavailable'};
 let nonce;
 try{nonce=JSON.parse(proof.payload).nonce}catch{return {ok:false,reason:'Malformed bootstrap proof'}}
 try{
  const redeemed=await nonceStore.redeem({ownerId,nonce});
  if(redeemed!==true)return {ok:false,reason:'Bootstrap nonce unavailable'};
  return {ok:true,ownerId};
 }catch{return {ok:false,reason:'Bootstrap nonce redemption failed'}}
}
