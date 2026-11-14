// Cryptographic verification primitive for WebAuthn authentication assertions.
// Not wired to public login: owner bootstrap, challenge consumption and
// credential lookup must be combined transactionally before activation.
import {createHash,createPublicKey,verify,timingSafeEqual} from 'node:crypto';
import {normalizeRpOrigin,validateWebAuthnClientData} from './webauthn-validation.js';
export function verifyPasskeyAssertion({clientDataJSON,authenticatorData,signature,publicKeySpki,expectedChallenge,expectedOrigin}={}){
 try{
  if(!Buffer.isBuffer(clientDataJSON)||clientDataJSON.length<2||clientDataJSON.length>8192||
     !Buffer.isBuffer(authenticatorData)||authenticatorData.length<37||authenticatorData.length>1024||
     !Buffer.isBuffer(signature)||signature.length<8||signature.length>512||
     !Buffer.isBuffer(publicKeySpki)||publicKeySpki.length<32||publicKeySpki.length>2048)return {ok:false};
  const rp=normalizeRpOrigin(expectedOrigin);
  if(!rp)return {ok:false};
  const clientData=JSON.parse(clientDataJSON.toString('utf8'));
  if(!validateWebAuthnClientData({clientData,expectedType:'webauthn.get',expectedChallenge,expectedOrigin}))return {ok:false};
  const rpHash=createHash('sha256').update(rp.rpId).digest();
  if(!timingSafeEqual(authenticatorData.subarray(0,32),rpHash))return {ok:false};
  const flags=authenticatorData[32];
  // Require user presence and verification, reject backup-state inconsistency.
  if((flags&0x01)===0||(flags&0x04)===0)return {ok:false};
  if((flags&0x10)!==0&&(flags&0x08)===0)return {ok:false};
  // Authentication assertions must not contain attested credential data.
  // Reject extensions until their CBOR payloads are explicitly parsed.
  if((flags&0x40)!==0||(flags&0x80)!==0||authenticatorData.length!==37)return {ok:false};
  const signCount=authenticatorData.readUInt32BE(33);
  const publicKey=createPublicKey({key:publicKeySpki,format:'der',type:'spki'});
  if(publicKey.asymmetricKeyType!=='ec'||publicKey.asymmetricKeyDetails?.namedCurve!=='prime256v1')return {ok:false};
  const signed=Buffer.concat([authenticatorData,createHash('sha256').update(clientDataJSON).digest()]);
  if(!verify('sha256',signed,publicKey,signature))return {ok:false};
  return {ok:true,signCount};
 }catch{return {ok:false}}
}
