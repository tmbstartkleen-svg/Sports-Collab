import {randomBytes} from 'node:crypto';
// Passkey registration/authentication cannot be completed until a durable,
// single-use challenge store and verified credential registry are configured.
export const PASSKEY_AUTH_ENABLED = false;
export const CHALLENGE_TTL_MS = 5 * 60 * 1000;
export function validateRelyingParty({origin,rpId}={}){
  if(typeof origin!=='string'||typeof rpId!=='string'||!rpId) return false;
  try{
    const url=new URL(origin);
    if(url.origin!==origin||url.protocol!=='https:'||url.port||url.username||url.password||url.search||url.hash||url.pathname!=='/') return false;
    return url.hostname===rpId || url.hostname.endsWith('.'+rpId);
  }catch{return false}
}
export function newChallenge(){return randomBytes(32).toString('base64url')}
export function beginPasskeyAuthentication(_request){
  return {ok:false,status:503,error:'Passkey authentication disabled until challenge storage and credential verification are configured'};
}
export function finishPasskeyAuthentication(_request){
  return {ok:false,status:503,error:'Passkey authentication disabled until challenge storage and credential verification are configured'};
}
