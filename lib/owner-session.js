// Offline-only design helpers. No session is issued until secure auth is approved.
import {randomBytes,createHash,timingSafeEqual} from 'node:crypto';
export const SESSION_ISSUANCE_ENABLED=false;
export const SESSION_TTL_MS=15*60*1000;
export function makeOpaqueToken(){return randomBytes(32).toString('base64url')}
export function hashToken(token){if(typeof token!=='string'||token.length<32)throw new Error('Invalid token');return createHash('sha256').update(token).digest('hex')}
export function verifyToken(token,expectedHash){if(typeof expectedHash!=='string'||!/^[a-f0-9]{64}$/.test(expectedHash))return false;try{const a=Buffer.from(hashToken(token),'hex'),b=Buffer.from(expectedHash,'hex');return timingSafeEqual(a,b)}catch{return false}}
export function sessionCookie(token,{secure=true}={}){if(!secure)throw new Error('Secure cookie required');return '__Host-sports_owner='+encodeURIComponent(token)+'; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=900'}
export function issueSession(){return {ok:false,status:503,error:'Owner session issuance disabled pending identity provider and server-side storage'}}
