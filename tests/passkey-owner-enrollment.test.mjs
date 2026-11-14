import test from 'node:test';
import assert from 'node:assert/strict';
import {OWNER_ENROLLMENT_ENABLED,checkOwnerEnrollment} from '../lib/passkey-owner-enrollment.js';
test('owner enrollment remains hard disabled',()=>{
 assert.equal(OWNER_ENROLLMENT_ENABLED,false);
 assert.equal(checkOwnerEnrollment().ok,false);
});
test('even seemingly valid owner enrollment cannot bypass activation',()=>{
 const result=checkOwnerEnrollment({ownerId:'owner',configuredOwnerId:'owner',bootstrapVerified:true,existingCredentials:0,origin:'https://sports.example.com',rpId:'sports.example.com'});
 assert.deepEqual(result,{ok:false,reason:'Owner enrollment disabled'});
});
test('public and unauthenticated enrollment cannot proceed',()=>{
 for(const input of [{ownerId:'intruder',configuredOwnerId:'owner'},{ownerId:'owner',configuredOwnerId:'owner',bootstrapVerified:false}]){
  assert.equal(checkOwnerEnrollment(input).ok,false);
 }
});
