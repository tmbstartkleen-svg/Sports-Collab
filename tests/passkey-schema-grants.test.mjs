import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('private passkey schema revokes current and future grants',()=>{
 const sql=readFileSync(new URL('../db/supabase-passkey-schema.sql',import.meta.url),'utf8');
 for(const pattern of [
  /revoke all on schema passkey_auth from public, anon, authenticated/i,
  /revoke all on all tables in schema passkey_auth from public, anon, authenticated/i,
  /revoke all on all sequences in schema passkey_auth from public, anon, authenticated/i,
  /alter default privileges in schema passkey_auth revoke all on tables from public, anon, authenticated/i,
  /alter default privileges in schema passkey_auth revoke all on sequences from public, anon, authenticated/i
 ])assert.match(sql,pattern);
 assert.match(sql,/REVIEW ONLY; not applied to Supabase/);
});
