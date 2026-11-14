import test from 'node:test';
import assert from 'node:assert/strict';
import {BUDGET_SCHEMA_SQL,makeDurableBudgetAdapter} from '../lib/durable-budget.js';
import {reserveProviderBudget} from '../lib/usage-quota.js';
test('durable budget schema starts with zero spending',()=>{
 assert.match(BUDGET_SCHEMA_SQL,/DEFAULT 0/);
 assert.match(BUDGET_SCHEMA_SQL,/PRIMARY KEY/);
});
test('unimplemented durable adapter fails closed even with positive proposed limit',async()=>{
 const store=makeDurableBudgetAdapter();
 const r=await reserveProviderBudget({store,ownerApproved:true,monthlyLimitUsd:5,requestId:'abc',estimatedUsd:0.01});
 assert.equal(r.ok,false);
});
