import test from 'node:test';
import assert from 'node:assert/strict';
import {verifierReadiness,WEBAUTHN_VERIFICATION_ENABLED} from '../lib/webauthn-verifier-gate.js';
test('WebAuthn verification remains hard-disabled',()=>{
 assert.equal(WEBAUTHN_VERIFICATION_ENABLED,false);
 assert.equal(verifierReadiness().ok,false);
});
test('injected verifier and stores cannot bypass disabled activation',()=>{
 const result=verifierReadiness({
  verifier:{verifyAuthenticationResponse:async()=>({verified:true}),verifyRegistrationResponse:async()=>({verified:true})},
  credentialStore:{},challengeStore:{},rpId:'sports.example.com',origin:'https://sports.example.com',ownerId:'owner'
 });
 assert.deepEqual(result,{ok:false,reason:'WebAuthn verification disabled'});
});
