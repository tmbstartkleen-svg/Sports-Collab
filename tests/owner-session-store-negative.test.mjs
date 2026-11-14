import test from 'node:test';
import assert from 'node:assert/strict';
import {makeOwnerSessionStore} from '../lib/owner-session-store.js';
test('disabled session store never accesses database',async()=>{
 let calls=0;const store=makeOwnerSessionStore({pool:{query:async()=>{calls++;return {rowCount:1}}}});
 assert.equal((await store.createVerifiedSession({verifiedOwnerId:'owner',credentialId:'cred'})).ok,false);
 assert.equal((await store.verifySession('token')).ok,false);assert.equal(await store.revokeSession('token'),false);assert.equal(calls,0);
});
test('missing verified credential cannot issue session',async()=>{
 let calls=0;const store=makeOwnerSessionStore({enabled:true,pool:{query:async()=>{calls++;return {rowCount:1}}}});
 assert.equal((await store.createVerifiedSession({verifiedOwnerId:'owner'})).ok,false);assert.equal(calls,0);
});
test('session persistence failure cannot expose bearer token',async()=>{
 const store=makeOwnerSessionStore({enabled:true,pool:{query:async()=>{throw Error('offline')}}});
 const result=await store.createVerifiedSession({verifiedOwnerId:'owner',credentialId:'cred'});
 assert.equal(result.ok,false);assert.equal(result.token,undefined);
});
test('session lookup failure rejects authentication',async()=>{
 const store=makeOwnerSessionStore({enabled:true,pool:{query:async()=>{throw Error('offline')}}});
 assert.equal((await store.verifySession('test-token')).ok,false);
});
