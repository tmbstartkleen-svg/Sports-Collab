// Pre-verification input validation only. NOT a WebAuthn signature verifier.
// A vetted server-side WebAuthn library must verify RP ID hash, authenticator
// data, credential public key, signature, user presence and counter.
export function validateClientDataJSON({clientDataJSON,expectedType,expectedChallenge,expectedOrigin}={}){
  if(!['webauthn.create','webauthn.get'].includes(expectedType))return false;
  if(typeof expectedChallenge!=='string'||expectedChallenge.length<40)return false;
  if(typeof expectedOrigin!=='string'||!expectedOrigin.startsWith('https://'))return false;
  if(typeof clientDataJSON!=='string'||clientDataJSON.length>8192||clientDataJSON.length<4)return false;
  let obj;
  try{
    const bytes=Buffer.from(clientDataJSON,'base64url');
    if(bytes.length>4096||bytes.toString('base64url')!==clientDataJSON)return false;
    obj=JSON.parse(bytes.toString('utf8'));
  }catch{return false}
  if(!obj||Array.isArray(obj)||typeof obj!=='object')return false;
  if(obj.type!==expectedType||obj.challenge!==expectedChallenge||obj.origin!==expectedOrigin)return false;
  if(obj.crossOrigin===true)return false;
  return true;
}
