import test from 'node:test';
import assert from 'node:assert/strict';
import {makePasskeyCredentialStore} from '../lib/passkey-credential-store.js';
const input={credentialId:'cred',ownerId:'owner',publicKey:Buffer.from('public-key'),registrationVerified:true,bootstrapVerified:true};
test('credential enrollment defaults disabled and requires both verifications',async()=>{
 let calls=0;const pool={query:async()=>{calls++;return {rowCount:1}}};
 const disabled=makePasskeyCredentialStore({pool});
 assert.equal(await disabled.insertVerifiedCredential(input),false);
 const store=makePasskeyCredentialStore({pool,enabled:true});
 assert.equal(await store.insertVerifiedCredential({...input,bootstrapVerified:false}),false);
 assert.equal(await store.insertVerifiedCredential({...input,registrationVerified:false}),false);
 assert.equal(await store.insertVerifiedCredential({...input,publicKey:'invalid'}),false);
 assert.equal(calls,0);
});
test('verified insert uses parameters and prevents credential overwrite',async()=>{
 let calls=0;
 const store=makePasskeyCredentialStore({enabled:true,pool:{query:async(sql,args)=>{
  calls++;assert.match(sql,/ON CONFLICT \(credential_id\) DO NOTHING/);
  assert.deepEqual(args.slice(0,2),['cred','owner']);return {rowCount:1};
 }}});
 assert.equal(await store.insertVerifiedCredential(input),true);
 assert.equal(calls,1);
});
test('duplicate credential and database failure deny enrollment',async()=>{
 const duplicate=makePasskeyCredentialStore({enabled:true,pool:{query:async()=>({rowCount:0})}});
 assert.equal(await duplicate.insertVerifiedCredential(input),false);
 const broken=makePasskeyCredentialStore({enabled:true,pool:{query:async()=>{throw Error('offline')}}});
 assert.equal(await broken.insertVerifiedCredential(input),false);
});
