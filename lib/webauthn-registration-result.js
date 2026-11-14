// Pure validation of a verified WebAuthn registration result.
// This helper grants no authorization and never persists credentials.
export function validVerifiedRegistrationCredential(info){
 const credential=info?.credential;
 return !!credential&&typeof credential.id==='string'&&
  /^[A-Za-z0-9_-]+$/.test(credential.id)&&
  Buffer.from(credential.id,'base64url').toString('base64url')===credential.id&&
  credential.publicKey instanceof Uint8Array&&credential.publicKey.length>0&&
  Number.isSafeInteger(credential.counter)&&credential.counter>=0&&
  (credential.transports===undefined||
   (Array.isArray(credential.transports)&&credential.transports.every(t=>
     typeof t==='string'&&['usb','nfc','ble','internal','hybrid','smart-card'].includes(t))));
}
