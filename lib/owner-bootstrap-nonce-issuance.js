// Offline bootstrap nonce issuance preparation. No HTTP route or key signing.
// Issuance remains disabled until independent owner verification is approved.
// Authorization evidence must originate from a trusted server-only identity ceremony,
// not an object supplied by a client. This file does not establish that ceremony.
import {randomBytes,createHash} from 'node:crypto';
export const OWNER_BOOTSTRAP_NONCE_ISSUANCE_ENABLED=false;
export async function issueOwnerBootstrapNonce({ownerId,configuredOwnerId,independentOwnerAuthorization,pool,now=Date.now()}={}){
 if(!OWNER_BOOTSTRAP_NONCE_ISSUANCE_ENABLED)
  return {ok:false,reason:'Owner bootstrap nonce issuance disabled'};
 if(typeof ownerId!=='string'||!ownerId||ownerId!==configuredOwnerId||
    independentOwnerAuthorization?.verified!==true||
    independentOwnerAuthorization?.ownerId!==ownerId||
    independentOwnerAuthorization?.purpose!=='bootstrap-nonce-issuance'||
    typeof pool?.query!=='function'||!Number.isSafeInteger(now)||now<0)
  return {ok:false,reason:'Invalid bootstrap nonce issuance context'};
 const nonce=randomBytes(32).toString('hex');
 const hash=createHash('sha256').update(nonce).digest('hex');
 try{
  const result=await pool.query(
   'INSERT INTO passkey_auth.bootstrap_nonces(nonce_hash,owner_id,expires_at) VALUES($1,$2,$3)',
   [hash,ownerId,new Date(now+300000)]);
  if(result.rowCount!==1)return {ok:false,reason:'Bootstrap nonce persistence failed'};
  return {ok:true,nonce,expiresAt:now+300000};
 }catch{return {ok:false,reason:'Bootstrap nonce persistence failed'}}
}
