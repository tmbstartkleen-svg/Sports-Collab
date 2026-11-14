import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PASSKEY_CHALLENGE_SCHEMA_SQL,makePasskeyChallengeStore} from '../lib/passkey-challenge-store.js';
const sql=readFileSync(new URL('../db/supabase-passkey-schema.sql',import.meta.url),'utf8');
test('Supabase challenge adapter uses the private schema and remains disabled',async()=>{
  assert.match(sql,/passkey_auth\.challenges/);
  assert.match(PASSKEY_CHALLENGE_SCHEMA_SQL,/passkey_auth\.challenges/);
  assert.match(PASSKEY_CHALLENGE_SCHEMA_SQL,/ceremony IN \('registration','authentication'\)/);
  let calls=0;
  const store=makePasskeyChallengeStore({pool:{query:async()=>{calls++;throw Error('must not query')}},enabled:false});
  assert.equal((await store.issue({ownerId:'owner',purpose:'authentication'})).ok,false);
  assert.equal(calls,0);
});
