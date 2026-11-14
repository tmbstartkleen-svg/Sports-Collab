// Owner identity provider contract: intentionally inactive until configured.
// An identity provider must verify a signed assertion server-side before
// any session can be issued. Client-supplied user IDs are never sufficient.
export const IDENTITY_PROVIDER_ENABLED=false;
export function verifyOwnerIdentity(assertion,{trustedVerifier,expectedOwnerId}={}){
  if(!IDENTITY_PROVIDER_ENABLED || typeof trustedVerifier!=='function' ||
     typeof expectedOwnerId!=='string' || !expectedOwnerId){
    return {ok:false,error:'Owner identity verification unavailable'};
  }
  // Fail closed: provider-specific signed assertion verification is not installed.
  return {ok:false,error:'Owner identity verification unavailable'};
}
