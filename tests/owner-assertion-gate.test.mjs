import test from 'node:test';
import assert from 'node:assert/strict';
import {completeOwnerAssertion,OWNER_ASSERTION_TRANSACTION_ENABLED} from '../lib/owner-assertion-transaction.js';

test('owner assertion remains fail closed for credential mismatch and disabled activation',async()=>{
 assert.equal(OWNER_ASSERTION_TRANSACTION_ENABLED,false);
 let reads=0,consumes=0,updates=0;
 const credentialStore={
  async getOwnerCredential(){reads++;return {credential_id:'credential-A',owner_id:'owner-A',public_key:Buffer.from([1]),sign_count:0,transports:[]}},
  async recordVerifiedAssertion(){updates++;return true}
 };
 const challengeStore={async consumeAuthentication(){consumes++;return true}};
 const base={ownerId:'owner-A',configuredOwnerId:'owner-A',credentialId:'credential-A',challenge:'challenge-A',
  response:{id:'credential-A',rawId:'credential-A',type:'public-key'},credentialStore,challengeStore};
 for(const response of [
  {...base.response,rawId:'credential-B'},
  {...base.response,type:'not-public-key'},
  {...base.response,id:'credential-B'},
  base.response
 ]){
  const result=await completeOwnerAssertion({...base,response});
  assert.equal(result.ok,false);
 }
 assert.equal(reads,0);
 assert.equal(consumes,0);
 assert.equal(updates,0);
});
