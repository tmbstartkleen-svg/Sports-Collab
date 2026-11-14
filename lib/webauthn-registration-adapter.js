// Server-only boundary for a vetted WebAuthn registration verifier.
// This does not register a credential, store a public key, or enable enrollment.
import {WEBAUTHN_VERIFICATION_ENABLED} from './webauthn-verifier-gate.js';
import {OWNER_ENROLLMENT_ENABLED} from './passkey-owner-enrollment.js';
import {validateRelyingParty} from './passkey-ceremony.js';
export async function verifyOwnerRegistration({
 verifier,response,expectedChallenge,expectedOrigin,expectedRPID,
 ownerId,configuredOwnerId,bootstrapVerified=false
}={}){
 if(!WEBAUTHN_VERIFICATION_ENABLED||!OWNER_ENROLLMENT_ENABLED)
   return {ok:false,reason:'Owner registration disabled'};
 if(typeof ownerId!=='string'||!ownerId||ownerId!==configuredOwnerId||bootstrapVerified!==true)
   return {ok:false,reason:'Owner bootstrap required'};
 if(typeof verifier?.verifyRegistrationResponse!=='function'||!response||
    typeof expectedChallenge!=='string'||!expectedChallenge||
    !validateRelyingParty({origin:expectedOrigin,rpId:expectedRPID}))
   return {ok:false,reason:'Missing registration verification context'};
 try{
  const result=await verifier.verifyRegistrationResponse({
   response,expectedChallenge,expectedOrigin,expectedRPID,
   requireUserVerification:true
  });
  if(result?.verified!==true||!result.registrationInfo)
   return {ok:false,reason:'Registration not verified'};
  return {ok:true,registrationInfo:result.registrationInfo};
 }catch{return {ok:false,reason:'Registration verification failed'}}
}
