import assert from 'node:assert/strict';
import {createHash, generateKeyPairSync, sign} from 'node:crypto';
import {verifyAuthenticationResponse} from '@simplewebauthn/server';
import {makePasskeyChallengeStore} from '../lib/passkey-challenge-store.js';
import {makePasskeyCredentialStore} from '../lib/passkey-credential-store.js';

// Synthetic, local P-256 credential: no user enrollment, network calls, or sessions.
const origin='https://example.com', rpID='example.com';
// In-memory SQL emulator exercises the actual store methods without a database.
const challenges=new Map();
let storedCounter=1;
const pool={async query(sql,args){
 if(sql.startsWith('INSERT INTO passkey_auth.challenges')){
  challenges.set(args[0],{owner:args[1],purpose:args[2],used:false});return {rowCount:1};
 }
 if(sql.startsWith('UPDATE passkey_auth.challenges')){
  const row=challenges.get(args[0]);
  if(!row||row.used||row.owner!==args[1]||row.purpose!==args[2])return {rowCount:0};
  row.used=true;return {rowCount:1};
 }
 if(sql.startsWith('SELECT credential_id,owner_id')){
  return {rows:args[0]===credentialID&&args[1]==='owner'?[{credential_id:credentialID,owner_id:'owner',public_key:Buffer.from(credential.publicKey),sign_count:storedCounter,transports:['internal']}]:[]};
 }
 if(sql.startsWith('UPDATE passkey_auth.credentials SET sign_count=')){
  if(args[0]!==credentialID||args[1]!=='owner'||args[2]!==storedCounter)return {rowCount:0};
  storedCounter=args[3];return {rowCount:1};
 }
 throw Error('Unexpected offline SQL');
}};
const challengeStore=makePasskeyChallengeStore({pool,enabled:true});
const credentialStore=makePasskeyCredentialStore({pool,enabled:true});
const issued=await challengeStore.issue({ownerId:'owner',purpose:'authentication'});
assert.equal(issued.ok,true);
const challenge=issued.challenge;
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
await assert.rejects(()=>verifyAuthenticationResponse({...args,expectedRPID:'other.example.com'}),'Wrong RP ID must fail');
const noUVData=Buffer.from(authenticatorData);
noUVData[32]=0x01; // User present, but user verification absent
const noUVResponse=structuredClone(response);
noUVResponse.response.authenticatorData=noUVData.toString('base64url');
noUVResponse.response.signature=sign('sha256',Buffer.concat([noUVData,createHash('sha256').update(clientDataJSON).digest()]),privateKey).toString('base64url');
await assert.rejects(()=>verifyAuthenticationResponse({...args,response:noUVResponse}),'Correct signature without user verification must fail');
const noUPData=Buffer.from(authenticatorData);
noUPData[32]=0x04; // User verified, but user presence absent
const noUPResponse=structuredClone(response);
noUPResponse.response.authenticatorData=noUPData.toString('base64url');
noUPResponse.response.signature=sign('sha256',Buffer.concat([noUPData,createHash('sha256').update(clientDataJSON).digest()]),privateKey).toString('base64url');
await assert.rejects(()=>verifyAuthenticationResponse({...args,response:noUPResponse}),'Correct signature without user presence must fail');
// Complete offline verification rehearsal: owner-scoped lookup, one-time challenge,
// genuine signature verification, and atomic counter update. Not a live login.
const stored=await credentialStore.getOwnerCredential({ownerId:'owner',credentialId:credentialID});
assert.equal(stored.owner_id,'owner');
assert.equal(await challengeStore.consumeAuthentication({ownerId:'other-owner',challenge}),false);
assert.equal(await challengeStore.consumeAuthentication({ownerId:'owner',challenge}),true);
const verified=await verifyAuthenticationResponse({...args,credential:{
 id:stored.credential_id,publicKey:new Uint8Array(stored.public_key),
 counter:Number(stored.sign_count),transports:stored.transports
}});
assert.equal(verified.verified,true);
assert.equal(await credentialStore.recordVerifiedAssertion({
 credentialId:credentialID,ownerId:'owner',previousSignCount:1,
 nextSignCount:verified.authenticationInfo.newCounter
}),true);
assert.equal(storedCounter,2);
assert.equal(await credentialStore.getOwnerCredential({ownerId:'other-owner',credentialId:credentialID}),null);
assert.equal(await challengeStore.consumeAuthentication({ownerId:'owner',challenge}),false);
assert.equal(await credentialStore.recordVerifiedAssertion({
 credentialId:credentialID,ownerId:'owner',previousSignCount:1,nextSignCount:2
}),false);
console.log('Signed WebAuthn assertion and owner-scoped store integration checks passed');
