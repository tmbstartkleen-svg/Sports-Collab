// Stable WebAuthn relying-party configuration. Preview hostnames must not be
// silently promoted to production credentials: credentials bind to RP ID.
import {normalizeRpOrigin} from './webauthn-validation.js';
export function evaluateRpConfiguration({origin,configuredRpId,configuredOrigin}={}){
 const current=normalizeRpOrigin(origin);
 const configured=normalizeRpOrigin(configuredOrigin);
 if(!current||!configured||typeof configuredRpId!=='string')
   return {ok:false,error:'Valid HTTPS relying-party configuration required'};
 if(current.origin!==configured.origin||configured.rpId!==configuredRpId)
   return {ok:false,error:'Relying-party origin or domain mismatch'};
 if(configuredRpId.endsWith('.vercel.app') && configuredRpId.includes('-'))
   return {ok:false,error:'Ephemeral preview hostname cannot be used for owner passkeys'};
 return {ok:true,rpId:configuredRpId,origin:configured.origin};
}
