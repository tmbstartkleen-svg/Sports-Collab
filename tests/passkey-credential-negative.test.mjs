import test from 'node:test';
import assert from 'node:assert/strict';
import {makePasskeyCredentialStore} from '../lib/passkey-credential-store.js';
test('credential store disabled by default and never queries database',async()=>{
 let calls=0;const store=makePasskeyCredentialStore({pool:{query:async()=>{calls++;return {rows:[],rowCount:1}}}});
 assert.equal(await store.getActiveCredential('cred'),null);
 assert.equal(await store.recordVerifiedAssertion({credentialId:'cred',ownerId:'owner',previousSignCount:0,nextSignCount:1}),false);
 assert.equal(await store.revoke({credentialId:'cred',ownerId:'owner'}),false);assert.equal(calls,0);
});
test('credential counter replay and regression rejected before database',async()=>{
 let calls=0;const store=makePasskeyCredentialStore({enabled:true,pool:{query:async()=>{calls++;return {rowCount:1}}}});
 assert.equal(await store.recordVerifiedAssertion({credentialId:'cred',ownerId:'owner',previousSignCount:2,nextSignCount:2}),false);
 assert.equal(await store.recordVerifiedAssertion({credentialId:'cred',ownerId:'owner',previousSignCount:3,nextSignCount:2}),false);
 assert.equal(calls,0);
});
test('database failure denies counter update and revocation',async()=>{
 const store=makePasskeyCredentialStore({enabled:true,pool:{query:async()=>{throw Error('offline')}}});
 assert.equal(await store.recordVerifiedAssertion({credentialId:'cred',ownerId:'owner',previousSignCount:1,nextSignCount:2}),false);
 assert.equal(await store.revoke({credentialId:'cred',ownerId:'owner'}),false);
 assert.equal(await store.getActiveCredential('cred'),null);
});
