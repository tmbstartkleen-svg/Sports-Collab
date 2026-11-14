// Internal passkey-to-session bridge. No public login endpoint is enabled.
export function makePasskeySessionCoordinator({assertions,sessions,enabled=false}={}){
 return {async authenticateAndCreateSession(input={}){
  if(!enabled||typeof assertions?.verifyAndConsume!=='function'||typeof sessions?.createVerifiedSession!=='function')return {ok:false,error:'Owner login disabled'};
  try{
   const verified=await assertions.verifyAndConsume(input);
   if(!verified?.ok||typeof verified.ownerId!=='string'||!verified.ownerId||typeof verified.credentialId!=='string'||!verified.credentialId)return {ok:false,error:'Passkey verification failed'};
   const session=await sessions.createVerifiedSession({verifiedOwnerId:verified.ownerId,credentialId:verified.credentialId});
   if(!session?.ok||typeof session.token!=='string'||!session.token)return {ok:false,error:'Session creation failed'};
   return {ok:true,token:session.token,expiresAt:session.expiresAt};
  }catch{return {ok:false,error:'Owner login unavailable'}}
 }};
}
