// Durable owner session lifecycle primitives. Not exposed by an API until
// cryptographically verified passkey login and owner bootstrap are installed.
import {makeOpaqueToken,hashToken,SESSION_TTL_MS} from './owner-session.js';
export function makeOwnerSessionStore({pool,enabled=false,clock=()=>Date.now()}={}){
 return {
  async createVerifiedSession({verifiedOwnerId,credentialId}={}){
   if(!enabled||!pool||typeof pool.query!=='function')return {ok:false,error:'Owner session store disabled'};
   if(typeof verifiedOwnerId!=='string'||!verifiedOwnerId||typeof credentialId!=='string'||!credentialId)
    return {ok:false,error:'Verified owner and credential required'};
   // Caller must be a trusted, verified WebAuthn assertion handler. This
   // module never verifies identities and cannot activate the public endpoint.
   const token=makeOpaqueToken(),tokenHash=hashToken(token);
   const expiresAt=new Date(clock()+SESSION_TTL_MS);
   try{
    const result=await pool.query(
     'INSERT INTO council_owner_sessions(token_hash,owner_id,credential_id,expires_at) VALUES($1,$2,$3,$4) RETURNING token_hash',
     [tokenHash,verifiedOwnerId,credentialId,expiresAt]);
    if(result.rowCount!==1)return {ok:false,error:'Session store unavailable'};
    return {ok:true,token,expiresAt:expiresAt.toISOString()};
   }catch{return {ok:false,error:'Session store unavailable'}}
  },
  async revokeSession(token){
   if(!enabled||!pool||typeof pool.query!=='function')return false;
   try{
    const result=await pool.query('DELETE FROM council_owner_sessions WHERE token_hash=$1',[hashToken(token)]);
    return result.rowCount===1;
   }catch{return false}
  },
  async verifySession(token){
   if(!enabled||!pool||typeof pool.query!=='function')return {ok:false};
   try{
    const result=await pool.query(
     'SELECT owner_id,expires_at FROM council_owner_sessions WHERE token_hash=$1 AND expires_at>now()',
     [hashToken(token)]);
    return result.rows.length===1?{ok:true,ownerId:result.rows[0].owner_id}:{ok:false};
   }catch{return {ok:false}}
  }
 };
}
export const OWNER_SESSION_SCHEMA_SQL=`
CREATE TABLE IF NOT EXISTS council_owner_sessions(
 token_hash CHAR(64) PRIMARY KEY,
 owner_id TEXT NOT NULL,
 credential_id TEXT NOT NULL,
 expires_at TIMESTAMPTZ NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS council_owner_sessions_expiry_idx ON council_owner_sessions(expires_at);
`;
