import assert from 'node:assert/strict';
import {createHash, generateKeyPairSync, sign} from 'node:crypto';
import {verifyAuthenticationResponse} from '@simplewebauthn/server';

// Synthetic, local P-256 credential: no user enrollment, network calls, or sessions.
const origin='https://example.com', rpID='example.com';
const challenge=Buffer.from('offline-signed-challenge').toString('base64url');
const credentialID=Buffer.from('offline-test-credential').toString('base64url');
const {publicKey,privateKey}=generateKeyPairSync('ec',{namedCurve:'prime256v1'});
const jwk=publicKey.export({format:'jwk'});
const b64=s=>Buffer.from(s,'base64url');
const xy=Buffer.concat([Buffer.from([4]),b64(jwk.x),b64(jwk.y)]);
const rpHash=createHash('sha256').update(rpID).digest();
const authenticatorData=Buffer.alloc(37);
rpHash.copy(authenticatorData,0);
authenticatorData[32]=0x05; // user present + user verified
authenticatorData.writeUInt32BE(2,33);
const clientDataJSON=Buffer.from(JSON.stringify({type:'webauthn.get',challenge,origin,crossOrigin:false}));
const signedBytes=Buffer.concat([authenticatorData,createHash('sha256').update(clientDataJSON).digest()]);
const signature=sign('sha256',signedBytes,privateKey);
const response={id:credentialID,rawId:credentialID,type:'public-key',response:{
  authenticatorData:authenticatorData.toString('base64url'),
  clientDataJSON:clientDataJSON.toString('base64url'),
  signature:signature.toString('base64url')
}};
const credential={id:credentialID,publicKey:undefined,counter:1,transports:['internal']};
// COSE EC2 key: kty=2, alg=-7, crv=1, x/y are 32-byte coordinates.
function cborInt(n){if(n>=0)return n<24?Buffer.from([n]):Buffer.from([24,n]);const k=-1-n;return k<24?Buffer.from([0x20+k]):Buffer.from([0x38,k]);}
const cose=Buffer.concat([Buffer.from([0xa5]),cborInt(1),cborInt(2),cborInt(3),cborInt(-7),cborInt(-1),cborInt(1),cborInt(-2),Buffer.from([0x58,32]),b64(jwk.x),cborInt(-3),Buffer.from([0x58,32]),b64(jwk.y)]);
credential.publicKey=new Uint8Array(cose);
const args={response,expectedChallenge:challenge,expectedOrigin:origin,expectedRPID:rpID,credential,requireUserVerification:true};
const good=await verifyAuthenticationResponse(args);
assert.equal(good.verified,true,'Genuine locally signed assertion should verify');
assert.equal(good.authenticationInfo.newCounter,2);
const altered=structuredClone(response);
altered.response.signature=Buffer.from('invalid-signature').toString('base64url');
await assert.rejects(()=>verifyAuthenticationResponse({...args,response:altered}),'Tampered signature must fail');
await assert.rejects(()=>verifyAuthenticationResponse({...args,expectedOrigin:'https://other.example.com'}),'Wrong origin must fail');
await assert.rejects(()=>verifyAuthenticationResponse({...args,expectedChallenge:Buffer.from('wrong').toString('base64url')}),'Wrong challenge must fail');
await assert.rejects(()=>verifyAuthenticationResponse({...args,credential:{...credential,counter:2}}),'Replayed counter must fail');
console.log('Signed WebAuthn assertion positive and negative checks passed');
