import test from 'node:test';
import assert from 'node:assert/strict';
import {makePasskeyCredentialStore,PASSKEY_CREDENTIAL_SCHEMA_SQL} from '../lib/passkey-credential-store.js';
test('credential store defaults disabled without database calls',async()=>{
 let calls=0;const store=makePasskeyCredentialStore({pool:{query:async()=>{calls++}}});
 assert.equal(await store.getActiveCredential('cred'),null);
 assert.equal(await store.recordVerifiedAssertion({credentialId:'cred',ownerId:'owner',previousSignCount:0,nextSignCount:1}),false);
 assert.equal(await store.revoke({credentialId:'cred',ownerId:'owner'}),false);
 assert.equal(calls,0);
});
test('assertion counter uses atomic compare-and-swap and rejects replay',async()=>{
 let count=2,revoked=false;const pool={async query(sql,args){
  if(sql.startsWith('SELECT'))return {rows:revoked?[]:[{owner_id:'owner',public_key:Buffer.from('key'),sign_count:count}]};
  if(sql.includes('SET sign_count=')){
   if(revoked||args[1]!=='owner'||args[2]!==count)return {rowCount:0};
   count=args[3];return {rowCount:1};
  }
  if(sql.includes('SET revoked_at=')){if(revoked||args[1]!=='owner')return {rowCount:0};revoked=true;return {rowCount:1}};
  throw Error('Unexpected SQL');
 }};
 const store=makePasskeyCredentialStore({enabled:true,pool});
 assert.equal((await store.getActiveCredential('cred')).sign_count,2);
 assert.equal(await store.recordVerifiedAssertion({credentialId:'cred',ownerId:'owner',previousSignCount:2,nextSignCount:3}),true);
 assert.equal(await store.recordVerifiedAssertion({credentialId:'cred',ownerId:'owner',previousSignCount:2,nextSignCount:3}),false);
 assert.equal(await store.recordVerifiedAssertion({credentialId:'cred',ownerId:'owner',previousSignCount:3,nextSignCount:3}),false);
 assert.equal(await store.revoke({credentialId:'cred',ownerId:'owner'}),true);
 assert.equal(await store.getActiveCredential('cred'),null);
 assert.match(PASSKEY_CREDENTIAL_SCHEMA_SQL,/public_key BYTEA NOT NULL/);
});
test('zero-counter authenticators are allowed but decreasing counters rejected',async()=>{
 const store=makePasskeyCredentialStore({enabled:true,pool:{query:async()=>({rowCount:1})}});
 assert.equal(await store.recordVerifiedAssertion({credentialId:'c',ownerId:'o',previousSignCount:0,nextSignCount:0}),true);
 assert.equal(await store.recordVerifiedAssertion({credentialId:'c',ownerId:'o',previousSignCount:5,nextSignCount:0}),false);
});

test('concurrent assertion counter updates permit one winner',async()=>{
 let counter=10;
 const pool={async query(sql,args){
  assert.match(sql,/sign_count=\$3 AND revoked_at IS NULL/);
  if(args[1]!=='owner'||args[2]!==counter)return {rowCount:0};
  counter=args[3];
  await Promise.resolve();
  return {rowCount:1};
 }};
 const store=makePasskeyCredentialStore({enabled:true,pool});
 const outcomes=await Promise.all(Array.from({length:20},()=>store.recordVerifiedAssertion({
  credentialId:'credential',ownerId:'owner',previousSignCount:10,nextSignCount:11
 })));
 assert.equal(outcomes.filter(Boolean).length,1);
 assert.equal(counter,11);
});
