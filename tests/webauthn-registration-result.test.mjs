import test from 'node:test';
import assert from 'node:assert/strict';
import {validVerifiedRegistrationCredential} from '../lib/webauthn-registration-result.js';
const valid={credential:{id:Buffer.from('credential').toString('base64url'),
 publicKey:new Uint8Array([1,2,3]),counter:0,transports:['internal']}};
test('verified registration requires complete canonical credential data',()=>{
 assert.equal(validVerifiedRegistrationCredential(valid),true);
 for(const credential of [
  {...valid.credential,id:'a'}, {...valid.credential,id:'a+'},
  {...valid.credential,publicKey:[]},{...valid.credential,publicKey:new Uint8Array()},
  {...valid.credential,counter:-1},{...valid.credential,counter:1.5},
  {...valid.credential,transports:['untrusted']},
  {...valid.credential,transports:[null]}
 ]){
  assert.equal(validVerifiedRegistrationCredential({credential}),false);
 }
 assert.equal(validVerifiedRegistrationCredential(null),false);
});
