// Persist one-time WebAuthn challenges. No public enrollment or login enabled.
// The verified assertion handler must consume the challenge before issuing a session.
import {randomBytes,createHash} from 'node:crypto';
export const PASSKEY_CHALLENGE_SCHEMA_SQL=`
CREATE TABLE IF NOT EXISTS council_passkey_challenges (
 challenge_hash CHAR(64) PRIMARY KEY,
 owner_id TEXT NOT NULL,
 purpose TEXT NOT NULL CHECK (purpose IN ('register','authenticate')),
 expires_at TIMESTAMPTZ NOT NULL,
 consumed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS council_passkey_challenges_expiry_idx ON council_passkey_challenges(expires_at);
`;
export function makePasskeyChallengeStore({pool,enabled=false,clock=()=>Date.now()}={}){
 const unavailable={ok:false,error:'Passkey challenge store disabled'};
 return {
  async issue({ownerId,purpose}={}){
   if(!enabled||!pool||typeof pool.query!=='function')return unavailable;
   if(typeof ownerId!=='string'||!ownerId||!['register','authenticate'].includes(purpose))return {ok:false,error:'Invalid challenge request'};
   const now=clock();
   if(!Number.isSafeInteger(now)||now<0)return {ok:false,error:'Invalid clock'};
   const challenge=randomBytes(32).toString('base64url');
   const hash=createHash('sha256').update(challenge).digest('hex');
   try{
    const result=await pool.query('INSERT INTO council_passkey_challenges(challenge_hash,owner_id,purpose,expires_at) VALUES($1,$2,$3,$4)',[hash,ownerId,purpose,new Date(now+300000)]);
    if(result.rowCount!==1)return {ok:false,error:'Challenge persistence failed'};
    return {ok:true,challenge};
   }catch{return {ok:false,error:'Challenge persistence failed'}}
  },
  async consume({ownerId,purpose,challenge}={}){
   if(!enabled||!pool||typeof pool.query!=='function')return false;
   if(typeof ownerId!=='string'||!ownerId||!['register','authenticate'].includes(purpose)||typeof challenge!=='string'||challenge.length<32)return false;
   const hash=createHash('sha256').update(challenge).digest('hex');
   try{
    const result=await pool.query(
     'UPDATE council_passkey_challenges SET consumed_at=now() WHERE challenge_hash=$1 AND owner_id=$2 AND purpose=$3 AND consumed_at IS NULL AND expires_at>now() RETURNING challenge_hash',
     [hash,ownerId,purpose]);
    return result.rowCount===1;
   }catch{return false}
  }
 };
}
