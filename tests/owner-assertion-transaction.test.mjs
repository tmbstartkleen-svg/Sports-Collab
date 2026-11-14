import test from 'node:test';
import assert from 'node:assert/strict';
import {completeOwnerAssertion,OWNER_ASSERTION_TRANSACTION_ENABLED} from '../lib/owner-assertion-transaction.js';
test('owner assertion transaction remains hard-disabled',async()=>{
 assert.equal(OWNER_ASSERTION_TRANSACTION_ENABLED,false);
 let calls=0;
 const store=new Proxy({}, {get(){calls++;throw new Error('unexpected store access')}});
 const result=await completeOwnerAssertion({
  ownerId:'owner',credentialId:'credential',response:{id:'credential'},
  challenge:'challenge',credentialStore:store,challengeStore:store,
  verifier:store
 });
 assert.deepEqual(result,{ok:false,reason:'Owner assertion transaction disabled'});
 assert.equal(calls,0);
});
