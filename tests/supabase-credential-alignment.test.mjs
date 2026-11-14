import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PASSKEY_CREDENTIAL_SCHEMA_SQL,makePasskeyCredentialStore} from '../lib/passkey-credential-store.js';
const sql=readFileSync(new URL('../db/supabase-passkey-schema.sql',import.meta.url),'utf8');
test('credential adapter is still disabled pending private schema migration',async()=>{
 assert.match(sql,/passkey_auth\.credentials/);
 assert.match(PASSKEY_CREDENTIAL_SCHEMA_SQL,/passkey_auth\.credentials/);
 let queries=0;
 const store=makePasskeyCredentialStore({pool:{query:async()=>{queries++}}});
 assert.equal(await store.getActiveCredential('credential'),null);
 assert.equal(await store.recordVerifiedAssertion({credentialId:'credential',ownerId:'owner',previousSignCount:0,nextSignCount:1}),false);
 assert.equal(queries,0);
});
