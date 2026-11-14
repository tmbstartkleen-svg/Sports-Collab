import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {OWNER_BOOTSTRAP_NONCE_SCHEMA_SQL} from '../lib/owner-bootstrap-nonce-store.js';
test('reviewed migration contains private bootstrap nonce table and replay guard',()=>{
 const sql=readFileSync(new URL('../db/supabase-passkey-schema.sql',import.meta.url),'utf8');
 assert.match(sql,/create table if not exists passkey_auth\.bootstrap_nonces/i);
 assert.match(sql,/nonce_hash text primary key/i);
 assert.match(sql,/redeemed_at timestamptz/i);
 assert.match(sql,/expires_at timestamptz not null/i);
 assert.match(sql,/revoke all on all tables in schema passkey_auth from public, anon, authenticated/i);
 assert.match(OWNER_BOOTSTRAP_NONCE_SCHEMA_SQL,/redeemed_at TIMESTAMPTZ/);
});
