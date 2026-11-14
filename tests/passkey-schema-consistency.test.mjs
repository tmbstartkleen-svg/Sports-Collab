import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PASSKEY_CREDENTIAL_SCHEMA_SQL} from '../lib/passkey-credential-store.js';
const migration=readFileSync(new URL('../db/supabase-passkey-schema.sql',import.meta.url),'utf8');
test('credential schema and reviewed Supabase migration both define required fields',()=>{
 for(const sql of [migration,PASSKEY_CREDENTIAL_SCHEMA_SQL]){
  const match=sql.match(/create table if not exists passkey_auth\.credentials\s*\(([\s\S]*?)\);/i);
  assert.ok(match,'private credential table must exist');
  for(const field of ['credential_id','owner_id','public_key','sign_count','transports','revoked_at']){
   assert.match(match[1],new RegExp('\\b'+field+'\\b','i'),'missing credential field: '+field);
  }
 }
});
