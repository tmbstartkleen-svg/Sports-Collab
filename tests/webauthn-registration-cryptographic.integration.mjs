// Offline self-attestation using a locally generated P-256 authenticator.
// No live enrollment, database connection, or user credentials.
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {verifyRegistrationResponse} from '@simplewebauthn/server';
import {validVerifiedRegistrationCredential} from '../lib/webauthn-registration-result.js';

const rpID='example.com',origin='https://example.com';
const challenge=Buffer.from('offline-registration-challenge').toString('base64url');
const credentialID=Buffer.from('offline-registration-credential').toString('base64url');
const {publicKey,privateKey}=generateKeyPairSync('ec',{namedCurve:'prime256v1'});
const jwk=publicKey.export({format:'jwk'});
const decode=s=>Buffer.from(s,'base64url');
const cborInt=n=>n>=0?(n<24?Buffer.from([n]):Buffer.from([24,n])):(-1-n<24?Buffer.from([0x20+(-1-n)]):Buffer.from([0x38,-1-n]));
const cose=Buffer.concat([Buffer.from([0xa5]),cborInt(1),cborInt(2),cborInt(3),cborInt(-7),
 cborInt(-1),cborInt(1),cborInt(-2),Buffer.from([0x58,32]),decode(jwk.x),
 cborInt(-3),Buffer.from([0x58,32]),decode(jwk.y)]);
const authData=Buffer.concat([
 createHash('sha256').update(rpID).digest(),Buffer.from([0x45]),Buffer.alloc(4),
 Buffer.alloc(16),Buffer.from([credentialID.length>>8,credentialID.length&255]),
 Buffer.from(credentialID),cose
]);
const clientData=Buffer.from(JSON.stringify({type:'webauthn.create',challenge,origin,crossOrigin:false}));
const attestationObject=Buffer.concat([
 Buffer.from([0xa3,0x63,0x66,0x6d,0x74,0x64,0x6e,0x6f,0x6e,0x65]),
 Buffer.from([0x67,0x61,0x74,0x74,0x53,0x74,0x6d,0x74,0xa0]),
 Buffer.from([0x68,0x61,0x75,0x74,0x68,0x44,0x61,0x74,0x61]),
 Buffer.from([0x59,authData.length>>8,authData.length&255]),authData
]);
const response={id:credentialID,rawId:credentialID,type:'public-key',response:{
 clientDataJSON:clientData.toString('base64url'),attestationObject:attestationObject.toString('base64url')
},clientExtensionResults:{}};
const args={response,expectedChallenge:challenge,expectedOrigin:origin,expectedRPID:rpID,requireUserVerification:true};
const verified=await verifyRegistrationResponse(args);
assert.equal(verified.verified,true);
assert.equal(validVerifiedRegistrationCredential(verified.registrationInfo),true);
await assert.rejects(()=>verifyRegistrationResponse({...args,expectedOrigin:'https://wrong.example.com'}));
await assert.rejects(()=>verifyRegistrationResponse({...args,expectedRPID:'wrong.example.com'}));
await assert.rejects(()=>verifyRegistrationResponse({...args,expectedChallenge:'wrong-challenge'}));
const withoutUV=structuredClone(response);
const changed=Buffer.from(authData);changed[32]=0x41;
const modified=Buffer.concat([attestationObject.subarray(0,attestationObject.length-authData.length),changed]);
withoutUV.response.attestationObject=modified.toString('base64url');
await assert.rejects(()=>verifyRegistrationResponse({...args,response:withoutUV}));
console.log('Offline WebAuthn registration positive and negative checks passed');
