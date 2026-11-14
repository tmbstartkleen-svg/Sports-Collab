// Preparation only: never authenticates users until the independently reviewed
// server-side activation gate is enabled. Do not expose this as an HTTP route.
import {WEBAUTHN_VERIFICATION_ENABLED} from './webauthn-verifier-gate.js';
import {PASSKEY_AUTH_ENABLED} from './passkey-ceremony.js';
import {verifyOwnerAssertion} from './webauthn-verification-adapter.js';
export const OWNER_ASSERTION_TRANSACTION_ENABLED=false;
export async function completeOwnerAssertion({
 ownerId,configuredOwnerId,credentialId,response,challenge,expectedOrigin,expectedRPID,
 credentialStore,challengeStore,verifier
}={}){
 if(!OWNER_ASSERTION_TRANSACTION_ENABLED||!WEBAUTHN_VERIFICATION_ENABLED||!PASSKEY_AUTH_ENABLED)
  return {ok:false,reason:'Owner assertion transaction disabled'};
 if(typeof ownerId!=='string'||!ownerId||typeof configuredOwnerId!=='string'||!configuredOwnerId||ownerId!==configuredOwnerId||typeof credentialId!=='string'||!credentialId||
    typeof response?.id!=='string'||response.id!==credentialId||
    typeof challenge!=='string'||!challenge||
    typeof credentialStore?.getOwnerCredential!=='function'||
    typeof credentialStore?.recordVerifiedAssertion!=='function'||
    typeof challengeStore?.consumeAuthentication!=='function')
  return {ok:false,reason:'Invalid assertion context'};
 try{
  const row=await credentialStore.getOwnerCredential({ownerId,credentialId});
  if(!row||row.owner_id!==ownerId||row.credential_id!==credentialId||
     !Number.isSafeInteger(Number(row.sign_count))||Number(row.sign_count)<0||
     !row.public_key)return {ok:false,reason:'Unknown credential'};
  const authenticator={id:credentialId,publicKey:new Uint8Array(row.public_key),
    counter:Number(row.sign_count),transports:row.transports||[]};
  // Consume before verifying to make each challenge single-use, including failed attempts.
  const consumed=await challengeStore.consumeAuthentication({ownerId,challenge});
  if(consumed!==true)return {ok:false,reason:'Challenge unavailable'};
  const verified=await verifyOwnerAssertion({verifier,response,expectedChallenge:challenge,
    expectedOrigin,expectedRPID,authenticator,ownerId,credentialOwnerId:row.owner_id});
  if(verified.ok!==true)return {ok:false,reason:'Assertion rejected'};
  const next=verified.authenticationInfo?.newCounter;
  if(!Number.isSafeInteger(next)||next<0)return {ok:false,reason:'Invalid verified counter'};
  const updated=await credentialStore.recordVerifiedAssertion({credentialId,ownerId,
    previousSignCount:authenticator.counter,nextSignCount:next});
  if(updated!==true)return {ok:false,reason:'Credential counter conflict'};
  // No session token or cookie is issued here.
  return {ok:true,ownerId};
 }catch{return {ok:false,reason:'Assertion transaction failed'}}
}
