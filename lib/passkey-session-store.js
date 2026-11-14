// Server-only session storage adapter. Never enables issuance or authorization.
// A verified WebAuthn ceremony and explicit owner approval are prerequisites.
import {makeOpaqueToken,hashToken,SESSION_TTL_MS} from './owner-session.js';
export function makePasskeySessionStore({pool,enabled=false,clock=()=>Date.now()}={}){
  return {
    async create({ownerId,verified=false}={}){
      if(!enabled||!verified||!pool||typeof pool.query!=='function'||typeof ownerId!=='string'||!ownerId)return {ok:false};
      const now=clock();
      if(!Number.isSafeInteger(now)||now<0)return {ok:false};
      const token=makeOpaqueToken();
      try{
        const result=await pool.query(
          'INSERT INTO passkey_auth.sessions(token_hash,owner_id,expires_at) VALUES($1,$2,$3)',
          [hashToken(token),ownerId,new Date(now+SESSION_TTL_MS)]
        );
        if(result.rowCount!==1)return {ok:false};
        return {ok:true,token};
      }catch{return {ok:false}}
    },
    async validate({token,ownerId}={}){
      if(!enabled||!pool||typeof pool.query!=='function'||typeof ownerId!=='string'||!ownerId)return false;
      let digest;
      try{digest=hashToken(token)}catch{return false}
      try{
        const result=await pool.query(
          'SELECT 1 FROM passkey_auth.sessions WHERE token_hash=$1 AND owner_id=$2 AND revoked_at IS NULL AND expires_at>now() LIMIT 1',
          [digest,ownerId]
        );
        return result.rowCount===1;
      }catch{return false}
    },
    async revoke({token}={}){
      if(!enabled||!pool||typeof pool.query!=='function')return false;
      let digest;
      try{digest=hashToken(token)}catch{return false}
      try{
        const result=await pool.query('UPDATE passkey_auth.sessions SET revoked_at=now() WHERE token_hash=$1 AND revoked_at IS NULL RETURNING token_hash',[digest]);
        return result.rowCount===1;
      }catch{return false}
    }
  };
}
