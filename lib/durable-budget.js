// PostgreSQL durable budget schema and atomic, idempotent reservations.
// Installation requires a separately approved database migration.
// No connection is made and no provider request is authorized by this module.
export const BUDGET_SCHEMA_SQL=`
CREATE TABLE IF NOT EXISTS council_budget_months (
 month_key TEXT PRIMARY KEY,
 limit_cents BIGINT NOT NULL DEFAULT 0 CHECK (limit_cents >= 0),
 reserved_cents BIGINT NOT NULL DEFAULT 0 CHECK (reserved_cents >= 0),
 CHECK (reserved_cents <= limit_cents)
);
CREATE TABLE IF NOT EXISTS council_budget_reservations (
 request_id TEXT PRIMARY KEY,
 month_key TEXT NOT NULL REFERENCES council_budget_months(month_key),
 reserved_cents BIGINT NOT NULL CHECK (reserved_cents > 0),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`;
// No reservation SQL is shipped until a concurrency-safe transaction is implemented and tested.
export function makeDurableBudgetAdapter(){
 return {async reserveAtomic(){return {reserved:false,reason:'Atomic transaction implementation not yet approved'}}};
}
