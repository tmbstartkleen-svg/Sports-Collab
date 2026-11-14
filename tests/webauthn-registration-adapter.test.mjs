import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyOwnerRegistration} from '../lib/webauthn-registration-adapter.js';
test('registration fails closed without owner bootstrap',async()=>{
 assert.deepEqual(await verifyOwnerRegistration(),{ok:false,reason:'Owner registration disabled'});
});
test('injected successful verifier is never invoked while disabled',async()=>{
 let calls=0;
 const result=await verifyOwnerRegistration({
  verifier:{verifyRegistrationResponse:async()=>{calls++;return {verified:true,registrationInfo:{}}}},
  response:{id:'credential'},expectedChallenge:'challenge',
  expectedOrigin:'https://sports.example.com',expectedRPID:'sports.example.com',
  ownerId:'owner',configuredOwnerId:'owner',bootstrapVerified:true
 });
 assert.equal(result.ok,false);
 assert.equal(calls,0);
});
