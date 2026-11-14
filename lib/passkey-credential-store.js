// Persistent WebAuthn credential metadata; no registration or login endpoint.
// Only a separately verified, owner-authorized enrollment flow may call insert.
export const PASSKEY_CREDENTIAL_SCHEMA_SQL=`
CREATE TABLE IF NOT EXISTS passkey_auth.credentials (
 credential_id TEXT PRIMARY KEY,
 owner_id TEXT NOT NULL,
 public_key BYTEA NOT NULL,
 sign_count BIGINT NOT NULL DEFAULT 0 CHECK (sign_count >= 0),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 revoked_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS passkey_auth.credentials_owner_idx ON passkey_auth.credentials(owner_id);
`;
export function makePasskeyCredentialStore({pool,enabled=false}={}){
 const available=()=>enabled&&pool&&typeof pool.query==='function';
 return {
  async getActiveCredential(credentialId){
   if(!available()||typeof credentialId!=='string'||!credentialId)return null;
   try{
    const result=await pool.query('SELECT owner_id,public_key,sign_count FROM passkey_auth.credentials WHERE credential_id=$1 AND revoked_at IS NULL',[credentialId]);
    return result.rows.length===1?result.rows[0]:null;
   }catch{return null}
  },
  async getOwnerCredential({credentialId,ownerId}={}){
   if(!available()||typeof credentialId!=='string'||!credentialId||typeof ownerId!=='string'||!ownerId)return null;
   try{
    const result=await pool.query(
     'SELECT credential_id,owner_id,public_key,sign_count,transports FROM passkey_auth.credentials WHERE credential_id=$1 AND owner_id=$2 AND revoked_at IS NULL LIMIT 1',
     [credentialId,ownerId]);
    return result.rows?.length===1?result.rows[0]:null;
   }catch{return null}
  },
  async recordVerifiedAssertion({credentialId,ownerId,previousSignCount,nextSignCount}={}){
   if(!available()||typeof credentialId!=='string'||!credentialId||typeof ownerId!=='string'||!ownerId)return false;
   if(!Number.isSafeInteger(previousSignCount)||previousSignCount<0||!Number.isSafeInteger(nextSignCount)||nextSignCount<0)return false;
   // WebAuthn permits authenticators with counters fixed at zero; otherwise
   // enforce monotonic increments. Signature verification must precede this.
   if(!(previousSignCount===0&&nextSignCount===0)&&nextSignCount<=previousSignCount)return false;
   try{
    const result=await pool.query('UPDATE passkey_auth.credentials SET sign_count=$4 WHERE credential_id=$1 AND owner_id=$2 AND sign_count=$3 AND revoked_at IS NULL',[credentialId,ownerId,previousSignCount,nextSignCount]);
    return result.rowCount===1;
   }catch{return false}
  },
  async revoke({credentialId,ownerId}={}){
   if(!available()||typeof credentialId!=='string'||!credentialId||typeof ownerId!=='string'||!ownerId)return false;
   try{
    const result=await pool.query('UPDATE passkey_auth.credentials SET revoked_at=now() WHERE credential_id=$1 AND owner_id=$2 AND revoked_at IS NULL',[credentialId,ownerId]);
    return result.rowCount===1;
   }catch{return false}
  }
 };
}
