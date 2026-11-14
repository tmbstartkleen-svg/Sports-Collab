import test from 'node:test';
import assert from 'node:assert/strict';
import {makePasskeyCredentialStore} from '../lib/passkey-credential-store.js';
test('owner-scoped credential lookup disabled by default',async()=>{
 let calls=0;
 const store=makePasskeyCredentialStore({pool:{query:async()=>{calls++}}});
 assert.equal(await store.getOwnerCredential({credentialId:'cred',ownerId:'owner'}),null);
 assert.equal(calls,0);
});
test('credential lookup filters by owner and active status',async()=>{
 const store=makePasskeyCredentialStore({enabled:true,pool:{query:async(sql,args)=>{
  assert.match(sql,/owner_id=\$2/);
  assert.match(sql,/revoked_at IS NULL/);
  assert.deepEqual(args,['cred','owner']);
  return {rows:[{credential_id:'cred',owner_id:'owner',sign_count:0}]};
 }}});
 assert.equal((await store.getOwnerCredential({credentialId:'cred',ownerId:'owner'})).owner_id,'owner');
 assert.equal(await store.getOwnerCredential({credentialId:'cred',ownerId:''}),null);
});
test('lookup rejects ambiguous rows and database failures',async()=>{
 const store=makePasskeyCredentialStore({enabled:true,pool:{query:async()=>({rows:[{},{}]})}});
 assert.equal(await store.getOwnerCredential({credentialId:'cred',ownerId:'owner'}),null);
 const broken=makePasskeyCredentialStore({enabled:true,pool:{query:async()=>{throw Error('offline')}}});
 assert.equal(await broken.getOwnerCredential({credentialId:'cred',ownerId:'owner'}),null);
});
