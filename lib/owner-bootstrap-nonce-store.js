// Proposed one-time bootstrap nonce reservation. No schema is applied.
// Only a trusted server-side verifier may call this after signature validation.
export const OWNER_BOOTSTRAP_NONCE_SCHEMA_SQL=`
CREATE TABLE IF NOT EXISTS passkey_auth.bootstrap_nonces (
 nonce_hash CHAR(64) PRIMARY KEY,
 owner_id TEXT NOT NULL,
 expires_at TIMESTAMPTZ NOT NULL,
 redeemed_at TIMESTAMPTZ
);
REVOKE ALL ON passkey_auth.bootstrap_nonces FROM PUBLIC, anon, authenticated;
`;
import {createHash} from 'node:crypto';
export function makeOwnerBootstrapNonceStore({pool,enabled=false}={}){
 return {
  async redeem({ownerId,nonce}={}){
   if(!enabled||typeof pool?.query!=='function'||typeof ownerId!=='string'||!ownerId||
      typeof nonce!=='string'||!/^[a-f0-9]{32,128}$/.test(nonce))return false;
   const hash=createHash('sha256').update(nonce).digest('hex');
   try{
    const result=await pool.query(
     'UPDATE passkey_auth.bootstrap_nonces SET redeemed_at=now() WHERE nonce_hash=$1 AND owner_id=$2 AND redeemed_at IS NULL AND expires_at>now() RETURNING nonce_hash',
     [hash,ownerId]);
    return result.rowCount===1;
   }catch{return false}
  }
 };
}
