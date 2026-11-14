// Schema bundle for manual, reviewed database setup. Never runs migrations.
import {PASSKEY_CHALLENGE_SCHEMA_SQL} from './passkey-challenge-store.js';
import {PASSKEY_CREDENTIAL_SCHEMA_SQL} from './passkey-credential-store.js';
import {OWNER_SESSION_SCHEMA_SQL} from './owner-session-store.js';
import {BUDGET_SCHEMA_SQL} from './durable-budget.js';
export const OWNER_STORAGE_SCHEMAS=Object.freeze([
 {name:'credentials',sql:PASSKEY_CREDENTIAL_SCHEMA_SQL},
 {name:'challenges',sql:PASSKEY_CHALLENGE_SCHEMA_SQL},
 {name:'sessions',sql:OWNER_SESSION_SCHEMA_SQL},
 {name:'budget',sql:BUDGET_SCHEMA_SQL}
]);
export function inspectOwnerStorageSchemas(){
 return {readyForReview:OWNER_STORAGE_SCHEMAS.every(s=>typeof s.sql==='string'&&s.sql.includes('CREATE TABLE IF NOT EXISTS')),migrationExecuted:false,schemas:OWNER_STORAGE_SCHEMAS.map(({name})=>name)};
}
