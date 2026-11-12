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
// Single-statement reservation: only one successful insert per request_id.
// The budget UPDATE is inside the INSERT's source CTE, serialized on month row.
// Duplicate IDs must not increment the monthly reservation.
export const RESERVE_SQL=`
WITH claimed AS (
 SELECT $1::text AS request_id, $2::text AS month_key, $3::bigint AS amount
 WHERE NOT EXISTS (SELECT 1 FROM council_budget_reservations WHERE request_id=$1)
), updated AS (
 UPDATE council_budget_months b
 SET reserved_cents=b.reserved_cents+c.amount
 FROM claimed c
 WHERE b.month_key=c.month_key AND c.amount>0
   AND b.reserved_cents+c.amount<=b.limit_cents
 RETURNING c.request_id,c.month_key,c.amount
)
INSERT INTO council_budget_reservations(request_id,month_key,reserved_cents)
SELECT request_id,month_key,amount FROM updated
ON CONFLICT (request_id) DO NOTHING
RETURNING request_id;
`;
// The reservation SQL above is not safe against simultaneous same-ID requests:
// a conflicting INSERT can occur after the UPDATE. Keep the adapter disabled
// until the transaction-based implementation has been reviewed.
export function makeDurableBudgetAdapter(){
 return {async reserveAtomic(){return {reserved:false,reason:'Atomic transaction implementation not yet approved'}}};
}
