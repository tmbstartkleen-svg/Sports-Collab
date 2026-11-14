import test from 'node:test';
import assert from 'node:assert/strict';
import {IDENTITY_PROVIDER_ENABLED,verifyOwnerIdentity} from '../lib/owner-identity.js';
test('identity verification never trusts client-supplied owner claims',()=>{
  assert.equal(IDENTITY_PROVIDER_ENABLED,false);
  let verifierCalled=false;
  const trustedVerifier=()=>{verifierCalled=true;return true};
  for(const assertion of [null,{}, {owner:true}, {sub:'owner'}, 'fake-signed-assertion']){
    assert.equal(verifyOwnerIdentity(assertion,{trustedVerifier,expectedOwnerId:'owner'}).ok,false);
  }
  assert.equal(verifierCalled,false);
});
test('identity verification rejects missing provider configuration',()=>{
  assert.equal(verifyOwnerIdentity({},{}).ok,false);
  assert.equal(verifyOwnerIdentity({sub:'owner'},{expectedOwnerId:'owner'}).ok,false);
});
