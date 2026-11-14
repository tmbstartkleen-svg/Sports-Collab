import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyOwnerAssertion} from '../lib/webauthn-verification-adapter.js';
test('WebAuthn assertion adapter fails closed without verifier',async()=>{
 assert.deepEqual(await verifyOwnerAssertion(),{ok:false,reason:'WebAuthn verification disabled'});
});
test('injected successful verifier cannot bypass hard-disabled WebAuthn gate',async()=>{
 let calls=0;
 const result=await verifyOwnerAssertion({
  verifier:{verifyAuthenticationResponse:async()=>{calls++;return {verified:true,authenticationInfo:{}}}},
  response:{id:'credential'},expectedChallenge:'A'.repeat(43),
  expectedOrigin:'https://sports.example.com',expectedRPID:'sports.example.com',
  authenticator:{},ownerId:'owner',credentialOwnerId:'owner'
 });
 assert.equal(result.ok,false);
 assert.equal(calls,0);
});
