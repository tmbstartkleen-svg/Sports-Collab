// Server-side signing-key configuration validation. No network, key creation,
// enrollment, or activation. Never accept a key from the browser request.
import {createPublicKey,createHash} from 'node:crypto';
export const OWNER_BOOTSTRAP_KEY_CONFIG_ENABLED=false;
export function inspectOwnerBootstrapKeyConfig({configuredPublicKey,expectedFingerprint}={}){
 if(!OWNER_BOOTSTRAP_KEY_CONFIG_ENABLED)
  return {ok:false,reason:'Owner bootstrap signing key configuration disabled'};
 if(typeof configuredPublicKey!=='string'||!configuredPublicKey||
    typeof expectedFingerprint!=='string'||!/^[a-f0-9]{64}$/.test(expectedFingerprint))
  return {ok:false,reason:'Missing pinned bootstrap key'};
 try{
  const key=createPublicKey(configuredPublicKey);
  if(key.asymmetricKeyType!=='ed25519')return {ok:false,reason:'Unsupported signing key'};
  const fingerprint=createHash('sha256').update(key.export({type:'spki',format:'der'})).digest('hex');
  if(fingerprint!==expectedFingerprint)return {ok:false,reason:'Signing key fingerprint mismatch'};
  return {ok:true,publicKey:key};
 }catch{return {ok:false,reason:'Invalid signing key'}}
}
