// Integration boundary for a vetted WebAuthn library (e.g. SimpleWebAuthn).
// No library is installed, no network calls occur, and activation is disabled.
// This adapter is not itself a signature verifier and never issues sessions.
import {WEBAUTHN_VERIFICATION_ENABLED} from './webauthn-verifier-gate.js';
export async function verifyOwnerAssertion({
  verifier, response, expectedChallenge, expectedOrigin, expectedRPID,
  authenticator, ownerId, credentialOwnerId
}={}){
  if(!WEBAUTHN_VERIFICATION_ENABLED)return {ok:false,reason:'WebAuthn verification disabled'};
  if(typeof verifier?.verifyAuthenticationResponse!=='function')return {ok:false,reason:'Missing verifier'};
  if(typeof ownerId!=='string'||!ownerId||credentialOwnerId!==ownerId)return {ok:false,reason:'Owner mismatch'};
  if(typeof expectedChallenge!=='string'||!expectedChallenge||
     typeof expectedOrigin!=='string'||!expectedOrigin.startsWith('https://')||
     typeof expectedRPID!=='string'||!expectedRPID||
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
