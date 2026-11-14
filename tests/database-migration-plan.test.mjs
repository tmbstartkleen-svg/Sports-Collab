import test from 'node:test';
import assert from 'node:assert/strict';
import {DATABASE_MIGRATIONS,planDatabaseMigrations} from '../lib/database-migration-plan.js';
test('database migrations are review-only and ordered',()=>{
 const plan=planDatabaseMigrations();
 assert.equal(plan.executionEnabled,false);
 assert.equal(plan.requiresExplicitApproval,true);
 assert.deepEqual(DATABASE_MIGRATIONS.map(x=>x.id),[
  '001-owner-bootstrap','002-owner-credentials','003-passkey-challenges','004-owner-sessions','005-spending-budget'
 ]);
 assert.ok(plan.migrations.every(x=>x.sql.includes('CREATE TABLE IF NOT EXISTS')));
});
test('database migration plan never enables spending or public enrollment',()=>{
 const plan=planDatabaseMigrations();
 assert.match(plan.migrations[4].sql,/DEFAULT 0 CHECK \(limit_cents >= 0\)/);
 assert.match(plan.migrations[1].sql,/revoked_at TIMESTAMPTZ/);
 assert.match(plan.migrations[2].sql,/consumed_at TIMESTAMPTZ/);
});
