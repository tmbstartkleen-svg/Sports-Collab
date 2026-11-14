// A server-only bootstrap authorization receipt is intentionally unavailable.
// Never trust {verified:true} or other client-supplied authorization objects.
// A future implementation must bind a trusted identity ceremony, owner ID,
// purpose, expiration and atomic single-use redemption before returning a receipt.
export const OWNER_IDENTITY_CEREMONY_ENABLED=false;
export function verifyIndependentOwnerIdentity(_input){
 return {ok:false,reason:'Independent owner identity ceremony not implemented'};
}
export async function establishBootstrapNonceAuthorization({ownerId,configuredOwnerId,identityCeremony}={}){
 if(!OWNER_IDENTITY_CEREMONY_ENABLED)
  return {ok:false,reason:'Independent owner identity ceremony disabled'};
 if(typeof ownerId!=='string'||!ownerId||ownerId!==configuredOwnerId||
    typeof identityCeremony?.verify!=='function')
  return {ok:false,reason:'Invalid owner identity context'};
 // No generic verifier callback is trusted to mint an authorization receipt.
 // Integrate only a reviewed, server-owned identity proof and durable replay guard.
 return {ok:false,reason:'Independent owner identity ceremony not implemented'};
}
