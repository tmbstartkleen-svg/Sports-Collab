// Central authorization gate. Fail closed until a trusted identity provider
// and server-side session store are integrated and explicitly enabled.
import {SESSION_ISSUANCE_ENABLED} from './owner-session.js';
export function authorizeOwnerRequest(_request, {sessionStore, identityVerified=false}={}){
  if(!SESSION_ISSUANCE_ENABLED || !identityVerified || !sessionStore){
    return {ok:false,status:401,error:'Owner authentication required'};
  }
  // Never grant access based only on headers, cookies or client claims.
  return {ok:false,status:401,error:'Owner authentication required'};
}
export function requireOwner(handler){
  return async function guardedHandler(req,res){
    const result=authorizeOwnerRequest(req);
    if(!result.ok){
      res.setHeader('Cache-Control','no-store');
      return res.status(result.status).json(result);
    }
    return handler(req,res);
  };
}
