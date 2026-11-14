// Review-only migration manifest. Never connects to or modifies a database.
// Operators must explicitly approve and execute migrations separately.
import {OWNER_BOOTSTRAP_SCHEMA_SQL} from './owner-bootstrap-policy.js';
import {PASSKEY_CREDENTIAL_SCHEMA_SQL} from './passkey-credential-store.js';
import {PASSKEY_CHALLENGE_SCHEMA_SQL} from './passkey-challenge-store.js';
import {OWNER_SESSION_SCHEMA_SQL} from './owner-session-store.js';
import {BUDGET_SCHEMA_SQL} from './durable-budget.js';
export const DATABASE_MIGRATIONS=Object.freeze([
 {id:'001-owner-bootstrap',sql:OWNER_BOOTSTRAP_SCHEMA_SQL},
 {id:'002-owner-credentials',sql:PASSKEY_CREDENTIAL_SCHEMA_SQL},
 {id:'003-passkey-challenges',sql:PASSKEY_CHALLENGE_SCHEMA_SQL},
 {id:'004-owner-sessions',sql:OWNER_SESSION_SCHEMA_SQL},
 {id:'005-spending-budget',sql:BUDGET_SCHEMA_SQL}
].map(m=>Object.freeze(m)));
export function planDatabaseMigrations(){
 return {executionEnabled:false,requiresExplicitApproval:true,migrations:DATABASE_MIGRATIONS.map(({id,sql})=>({id,sql}))};
}
