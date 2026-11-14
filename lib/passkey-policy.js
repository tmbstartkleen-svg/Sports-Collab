// WebAuthn enrollment and login are intentionally disabled until an owner identity
// bootstrap and persistent credential/challenge store are configured.
export const PASSKEY_ENROLLMENT_ENABLED=false;
export const PASSKEY_LOGIN_ENABLED=false;
export const PASSKEY_ALLOWED_UV='required';
export const PASSKEY_CHALLENGE_TTL_SECONDS=300;
export function passkeyReadiness(){
 return {enabled:false,enrollmentEnabled:PASSKEY_ENROLLMENT_ENABLED,loginEnabled:PASSKEY_LOGIN_ENABLED,userVerification:PASSKEY_ALLOWED_UV,requiresOwnerBootstrap:true,requiresPersistentCredentialStore:true,requiresServerChallengeVerification:true,providerRequestsEnabled:false,monthlySpendLimitUsd:0};
}
