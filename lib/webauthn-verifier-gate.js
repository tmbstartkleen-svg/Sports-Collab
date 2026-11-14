// Contract gate for a vetted WebAuthn verifier; no verifier is bundled or enabled.
// Do not use this gate as proof of authentication or to issue a session.
export const WEBAUTHN_VERIFICATION_ENABLED=false;
export function verifierReadiness({verifier,credentialStore,challengeStore,rpId,origin,ownerId}={}){
  if(!WEBAUTHN_VERIFICATION_ENABLED)return {ok:false,reason:'WebAuthn verification disabled'};
  if(!verifier||typeof verifier.verifyAuthenticationResponse!=='function'||typeof verifier.verifyRegistrationResponse!=='function')return {ok:false,reason:'Vetted verifier required'};
  if(!credentialStore||!challengeStore)return {ok:false,reason:'Durable stores required'};
  if(typeof rpId!=='string'||!rpId||typeof origin!=='string'||!origin.startsWith('https://')||typeof ownerId!=='string'||!ownerId)return {ok:false,reason:'Identity configuration required'};
  return {ok:true};
}
