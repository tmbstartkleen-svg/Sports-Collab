// WebAuthn deployment readiness: no network calls and no credentials.
const forbiddenRpIds=new Set(['vercel.app','localhost','com','app']);
export function validatePasskeyConfig({origin,rpId,ownerId,storeConfigured=false,verifierConfigured=false}={}){
  const problems=[];
  let url;
  try{url=new URL(origin)}catch{problems.push('Invalid origin')}
  if(url && (url.protocol!=='https:' || url.origin!==origin || url.hostname!==rpId)) problems.push('Origin must be HTTPS and exactly match RP ID');
  if(typeof rpId!=='string' || forbiddenRpIds.has(rpId) || !/^[a-z0-9.-]+$/.test(rpId)) problems.push('Dedicated RP ID required');
  if(typeof ownerId!=='string'||!ownerId.trim()) problems.push('Verified owner identity required');
  if(storeConfigured!==true) problems.push('Durable challenge and credential storage required');
  if(verifierConfigured!==true) problems.push('WebAuthn signature verifier required');
  return {ready:problems.length===0,problems};
}
