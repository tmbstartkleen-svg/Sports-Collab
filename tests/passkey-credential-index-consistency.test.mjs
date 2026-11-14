import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('credential lookup and revocation index align with proposed migration',()=>{
 const sql=readFileSync(new URL('../db/supabase-passkey-schema.sql',import.meta.url),'utf8');
 const source=readFileSync(new URL('../lib/passkey-credential-store.js',import.meta.url),'utf8');
 assert.match(sql,/create index if not exists passkey_credentials_owner_idx\s+on passkey_auth\.credentials\s*\(owner_id\)\s*where revoked_at is null/i);
 assert.match(source,/WHERE credential_id=\$1 AND owner_id=\$2 AND revoked_at IS NULL/);
 assert.match(source,/UPDATE passkey_auth\.credentials SET sign_count=\$4 WHERE credential_id=\$1 AND owner_id=\$2 AND sign_count=\$3 AND revoked_at IS NULL/);
 assert.match(sql,/revoke all on all tables in schema passkey_auth from public, anon, authenticated/i);
});
