// PostgreSQL schema only; no migrations or connections are run automatically.
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
// The caller must supply a trusted month and an owner-approved limit.
// No client-side request can set or raise the database's limit.
export function makeDurableBudgetAdapter({pool,enabled=false,monthKey}={}){
 return {async reserveAtomic({requestId,estimatedUsd}={}){
  if(!enabled||!pool||typeof pool.connect!=='function')return {reserved:false,reason:'Budget adapter disabled'};
  if(typeof requestId!=='string'||!requestId||requestId.length>128||
     typeof monthKey!=='string'||!/^\d{4}-(0[1-9]|1[0-2])$/.test(monthKey)||
     !Number.isFinite(estimatedUsd)||estimatedUsd<=0)return {reserved:false,reason:'Invalid reservation'};
  // Round UP to whole cents so tiny requests never reserve zero.
  // Convert the decimal representation to cents without binary-float multiplication.
  // 0.07 must reserve 7 cents, not 8; fractional cents round upward.
  const [whole,fraction='']=estimatedUsd.toString().split('.');
  if(!/^\\d+$/.test(whole)||!/^\\d*$/.test(fraction))return {reserved:false,reason:'Invalid amount'};
  const cents=Number(BigInt(whole)*100n+BigInt((fraction+'00').slice(0,2))+
    (fraction.slice(2).replace(/0/g,'').length?1n:0n));
  if(!Number.isSafeInteger(cents)||cents<=0)return {reserved:false,reason:'Invalid amount'};
  let client;
  try{
   client=await pool.connect();
   await client.query('BEGIN');
   // Lock the month row BEFORE checking the idempotency key.
   // All reservations for this month serialize on this row.
   const month=await client.query('SELECT limit_cents,reserved_cents FROM council_budget_months WHERE month_key=$1 FOR UPDATE',[monthKey]);
   if(month.rows.length!==1){await client.query('ROLLBACK');return {reserved:false,reason:'Month budget not configured'}}
   const previous=await client.query('SELECT request_id FROM council_budget_reservations WHERE request_id=$1',[requestId]);
   if(previous.rows.length){await client.query('ROLLBACK');return {reserved:false,reason:'Duplicate request'}}
   const {limit_cents,reserved_cents}=month.rows[0];
   const remaining=BigInt(limit_cents)-BigInt(reserved_cents);
   if(remaining<BigInt(cents)){await client.query('ROLLBACK');return {reserved:false,reason:'Insufficient budget'}}
   await client.query('UPDATE council_budget_months SET reserved_cents=reserved_cents+$2 WHERE month_key=$1',[monthKey,cents]);
   await client.query('INSERT INTO council_budget_reservations(request_id,month_key,reserved_cents) VALUES($1,$2,$3)',[requestId,monthKey,cents]);
   await client.query('COMMIT');
   return {reserved:true};
  }catch{
   if(client)try{await client.query('ROLLBACK')}catch{}
   return {reserved:false,reason:'Transaction unavailable'};
  }finally{if(client&&typeof client.release==='function')client.release()}
 }};
}
