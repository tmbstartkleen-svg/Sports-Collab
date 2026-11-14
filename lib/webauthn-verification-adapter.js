// Integration boundary for a vetted WebAuthn library (e.g. SimpleWebAuthn).
// Vetted verifier dependency is installed; activation remains disabled.
// This adapter is not itself a signature verifier and never issues sessions.
import {WEBAUTHN_VERIFICATION_ENABLED} from './webauthn-verifier-gate.js';
import {validateRelyingParty} from './passkey-ceremony.js';
// Pure binding checks are testable without activating authentication.
// A caller-supplied owner ID alone is never authentication evidence.
export function assertionCredentialBinding({response,authenticator,ownerId,credentialOwnerId}={}){
  if(typeof ownerId!=='string'||!ownerId||credentialOwnerId!==ownerId)return false;
  if(typeof response?.id!=='string'||!response.id||
     typeof authenticator?.id!=='string'||!authenticator.id)return false;
  if(response.id!==authenticator.id)return false;
  if(response.type!=='public-key')return false;
  if(!(authenticator.publicKey instanceof Uint8Array)||!authenticator.publicKey.length)return false;
  if(!Number.isSafeInteger(authenticator.counter)||authenticator.counter<0)return false;
  return true;
}
export async function verifyOwnerAssertion({
  verifier, response, expectedChallenge, expectedOrigin, expectedRPID,
  authenticator, ownerId, credentialOwnerId
}={}){
  if(!WEBAUTHN_VERIFICATION_ENABLED)return {ok:false,reason:'WebAuthn verification disabled'};
  if(typeof verifier?.verifyAuthenticationResponse!=='function')return {ok:false,reason:'Missing verifier'};
  if(!assertionCredentialBinding({response,authenticator,ownerId,credentialOwnerId}))return {ok:false,reason:'Credential or owner mismatch'};
  if(typeof expectedChallenge!=='string'||!expectedChallenge||
     !validateRelyingParty({origin:expectedOrigin,rpId:expectedRPID})||
     !authenticator||!response)return {ok:false,reason:'Missing assertion context'};
  try{
    const result=await verifier.verifyAuthenticationResponse({
      response,expectedChallenge,expectedOrigin,expectedRPID,
      credential:authenticator,requireUserVerification:true
    });
    if(result?.verified!==true||!result.authenticationInfo)return {ok:false,reason:'Assertion not verified'};
    return {ok:true,authenticationInfo:result.authenticationInfo};
  }catch{return {ok:false,reason:'Assertion verification failed'}}
}
