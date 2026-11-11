// WebAuthn RP/origin validation helpers. No enrollment, no secrets, no paid calls.
// Full cryptographic assertion/attestation verification must be provided by an
// audited WebAuthn implementation before these helpers can be used for login.
export function normalizeRpOrigin(value) {
  if(typeof value!=='string')return null;
  try{
    const url=new URL(value);
    if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||url.pathname!=='/')return null;
    const hostname=url.hostname.toLowerCase();
    if(!hostname||hostname==='localhost'||hostname.endsWith('.localhost'))return null;
    return {origin:url.origin,rpId:hostname};
  }catch{return null}
}
export function validateWebAuthnClientData({clientData,expectedType,expectedChallenge,expectedOrigin}={}){
 if(!clientData||typeof clientData!=='object')return false;
 if(!['webauthn.create','webauthn.get'].includes(expectedType)||clientData.type!==expectedType)return false;
 if(typeof expectedChallenge!=='string'||expectedChallenge.length<32||clientData.challenge!==expectedChallenge)return false;
 const rp=normalizeRpOrigin(expectedOrigin);
 if(!rp||clientData.origin!==rp.origin||clientData.crossOrigin===true)return false;
 return true;
}
export function assertNoPublicEnrollment(){return {ok:false,status:503,error:'Owner enrollment requires verified bootstrap and cryptographic WebAuthn verification'}}
