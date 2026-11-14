import test from 'node:test';
import assert from 'node:assert/strict';
import {OWNER_BOOTSTRAP_ENABLED,evaluateOwnerBootstrap} from '../lib/owner-bootstrap-policy.js';
test('owner bootstrap remains disabled even with apparent approval',()=>{
 assert.equal(OWNER_BOOTSTRAP_ENABLED,false);
 for(const params of [{},{serverApproved:true,verifiedIdentity:true,existingOwnerCount:0,credentialCount:0},{serverApproved:true,verifiedIdentity:true,existingOwnerCount:1,credentialCount:1}]){
  assert.equal(evaluateOwnerBootstrap(params).ok,false);
 }
});
