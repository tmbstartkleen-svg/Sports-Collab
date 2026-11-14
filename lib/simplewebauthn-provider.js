// Loads the vetted server verifier only when a future reviewed activation
// explicitly allows it. No provider calls or session issuance occur here.
import {WEBAUTHN_VERIFICATION_ENABLED} from './webauthn-verifier-gate.js';
export async function loadSimpleWebAuthnVerifier(){
  if(!WEBAUTHN_VERIFICATION_ENABLED)return {ok:false,reason:'WebAuthn verification disabled'};
  try{
    const {verifyAuthenticationResponse,verifyRegistrationResponse}=await import('@simplewebauthn/server');
    if(typeof verifyAuthenticationResponse!=='function'||typeof verifyRegistrationResponse!=='function')
      return {ok:false,reason:'Vetted verifier exports unavailable'};
    return {ok:true,verifier:{verifyAuthenticationResponse,verifyRegistrationResponse}};
  }catch{return {ok:false,reason:'Vetted verifier unavailable'}}
}
