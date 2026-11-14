import test from 'node:test';
import assert from 'node:assert/strict';
import {OWNER_IDENTITY_CEREMONY_ENABLED,verifyIndependentOwnerIdentity,
 establishBootstrapNonceAuthorization} from '../lib/owner-identity-ceremony.js';
test('unimplemented identity ceremony cannot be bypassed with a verified boolean',async()=>{
 assert.equal(OWNER_IDENTITY_CEREMONY_ENABLED,false);
 assert.equal(verifyIndependentOwnerIdentity({verified:true,ownerId:'owner'}).ok,false);
 let called=0;
 const result=await establishBootstrapNonceAuthorization({
  ownerId:'owner',configuredOwnerId:'owner',
  identityCeremony:{async verify(){called++;return {verified:true}}}
 });
 assert.equal(result.ok,false);
 assert.equal(called,0);
});
test('different owner and absent ceremony never authorize bootstrap',async()=>{
 for(const args of [{ownerId:'intruder',configuredOwnerId:'owner'},
  {ownerId:'owner',configuredOwnerId:'owner'}]){
  assert.equal((await establishBootstrapNonceAuthorization(args)).ok,false);
 }
});
