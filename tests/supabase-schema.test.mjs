import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sql=readFileSync(new URL('../db/supabase-passkey-schema.sql',import.meta.url),'utf8');
test('passkey schema remains isolated and non-public',()=>{
  assert.match(sql,/create schema if not exists passkey_auth/i);
  assert.match(sql,/revoke all on schema passkey_auth from public, anon, authenticated/i);
  assert.match(sql,/revoke all on all tables in schema passkey_auth from public, anon, authenticated/i);
  assert.doesNotMatch(sql,/create table if not exists public\./i);
});
test('credentials, one-time challenges, and sessions have durable controls',()=>{
  for(const name of ['credentials','challenges','sessions'])assert.match(sql,new RegExp('create table if not exists passkey_auth\\.'+name,'i'));
  assert.match(sql,/challenge_hash text primary key/i);
  assert.match(sql,/consumed_at timestamptz/i);
  assert.match(sql,/token_hash text primary key/i);
  assert.match(sql,/revoked_at timestamptz/i);
  assert.match(sql,/public_key bytea not null/i);
});
