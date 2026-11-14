import test from 'node:test';
import assert from 'node:assert/strict';
import {validateRelyingParty} from '../lib/passkey-ceremony.js';
import {verifyOwnerAssertion} from '../lib/webauthn-verification-adapter.js';
import {verifyOwnerRegistration} from '../lib/webauthn-registration-adapter.js';
test('relying party validation rejects deceptive and insecure origins',()=>{
 assert.equal(validateRelyingParty({origin:'https://app.example.com',rpId:'example.com'}),true);
 for(const origin of [
  'http://app.example.com','https://example.com.evil.test',
  'https://evil-example.com','https://app.example.com:444',
  'https://user:pass@app.example.com','https://app.example.com/path',
  'https://app.example.com?query=1','https://app.example.com#fragment'
 ])assert.equal(validateRelyingParty({origin,rpId:'example.com'}),false,origin);
});
test('both owner verification adapters stay disabled even with injected verifier',async()=>{
 let calls=0;
 const verifier={
  verifyAuthenticationResponse:async()=>{calls++;return {verified:true,authenticationInfo:{}};},
  verifyRegistrationResponse:async()=>{calls++;return {verified:true,registrationInfo:{}};}
 };
 assert.equal((await verifyOwnerAssertion({verifier})).ok,false);
 assert.equal((await verifyOwnerRegistration({verifier})).ok,false);
 assert.equal(calls,0);
});
