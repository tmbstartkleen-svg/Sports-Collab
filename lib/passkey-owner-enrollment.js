import {validateRelyingParty} from './passkey-ceremony.js';
// Owner enrollment policy only. Does not issue registration challenges,
// accept credentials, grant access, or enable public registration.
export const OWNER_ENROLLMENT_ENABLED=false;
export function checkOwnerEnrollment({ownerId,configuredOwnerId,bootstrapVerified=false,existingCredentials=0,origin,rpId}={}){
  if(!OWNER_ENROLLMENT_ENABLED)return {ok:false,reason:'Owner enrollment disabled'};
  if(typeof ownerId!=='string'||!ownerId||ownerId!==configuredOwnerId)return {ok:false,reason:'Owner identity mismatch'};
  if(bootstrapVerified!==true)return {ok:false,reason:'Independent owner bootstrap required'};
  if(!Number.isSafeInteger(existingCredentials)||existingCredentials<0)return {ok:false,reason:'Invalid credential count'};
  if(existingCredentials>0)return {ok:false,reason:'Existing owner must authorize additional passkeys'};
  try{
    if(!validateRelyingParty({expectedOrigin:origin,expectedRPID:rpId}))return {ok:false,reason:'Invalid relying party'};
  }catch{return {ok:false,reason:'Invalid relying party'}}
  return {ok:true};
}
