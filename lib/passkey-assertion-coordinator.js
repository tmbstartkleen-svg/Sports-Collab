// Authenticator assertion coordinator. Disabled by default and never issues
// sessions. Caller must bind challenge to a verified owner and use a durable
// challenge store; the final public login endpoint remains disabled.
import {verifyPasskeyAssertion} from './passkey-assertion-verifier.js';
export function makeVerifiedAssertionCoordinator({credentials,challenges,enabled=false}={}){
 return {
  async verifyAndConsume({credentialId,ownerId,challenge,expectedOrigin,clientDataJSON,authenticatorData,signature}={}){
   if(!enabled||!credentials||!challenges)return {ok:false};
   if(typeof credentialId!=='string'||!credentialId||typeof ownerId!=='string'||!ownerId||
      typeof challenge!=='string'||challenge.length<32)return {ok:false};
   try{
    const credential=await credentials.getActiveCredential(credentialId);
    if(!credential||credential.owner_id!==ownerId)return {ok:false};
    const previousSignCount=Number(credential.sign_count);
    if(!Number.isSafeInteger(previousSignCount)||previousSignCount<0)return {ok:false};
    const verified=verifyPasskeyAssertion({
      clientDataJSON,authenticatorData,signature,
      publicKeySpki:credential.public_key,
      expectedChallenge:challenge,expectedOrigin
    });
    if(!verified.ok)return {ok:false};
    // A challenge is consumed atomically once, including for zero-counter
    // authenticators, before any counter update or session can be considered.
    const consumed=await challenges.consume({ownerId,purpose:'authenticate',challenge});
    if(!consumed)return {ok:false};
    const counterUpdated=await credentials.recordVerifiedAssertion({
      credentialId,ownerId,previousSignCount,nextSignCount:verified.signCount
    });
    if(!counterUpdated)return {ok:false};
    return {ok:true,ownerId,credentialId};
   }catch{return {ok:false}}
  }
 };
}
