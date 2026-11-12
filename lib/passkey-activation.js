// WebAuthn implementation readiness: strict prerequisites, no automatic activation.
export const REQUIRED_CONTROLS=Object.freeze([
 'verifiedOwnerBootstrap','durableCredentialStore','durableChallengeStore',
 'signatureVerification','rpOriginVerification','sessionRevocation',
 'rateLimiting','csrfProtection','negativeTestsPassed'
]);
export function evaluatePasskeyActivation(controls={}){
 const missing=REQUIRED_CONTROLS.filter(key=>controls[key]!==true);
 return {ready:false,missing,reason:'Passkey activation requires a reviewed implementation and explicit owner approval'};
}
