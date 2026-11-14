import test from 'node:test';
import assert from 'node:assert/strict';
import {makeDurableBudgetAdapter} from '../lib/durable-budget.js';
function mockPool({limit=0,reserved=0,duplicate=false,fail=false}={}){
 const statements=[];let released=false;
 const client={async query(sql,args){statements.push({sql,args});if(fail&&sql==='COMMIT')throw Error('commit failed');if(sql.includes('SELECT limit_cents'))return {rows:[{limit_cents:limit,reserved_cents:reserved}]};if(sql.includes('SELECT request_id'))return {rows:duplicate?[{request_id:args[0]}]:[]};return {rowCount:1}},release(){released=true}};
 return {pool:{async connect(){return client}},statements,get released(){return released}};
}
test('zero dollar monthly budget cannot reserve provider usage',async()=>{
 const db=mockPool();const result=await makeDurableBudgetAdapter({pool:db.pool,enabled:true,monthKey:'2026-11'}).reserveAtomic({requestId:'r1',estimatedUsd:0.01});
 assert.equal(result.reserved,false);assert.equal(db.statements.some(s=>s.sql==='COMMIT'),false);assert.equal(db.released,true);
});
test('duplicate request cannot reserve twice',async()=>{
 const db=mockPool({limit:100,duplicate:true});const result=await makeDurableBudgetAdapter({pool:db.pool,enabled:true,monthKey:'2026-11'}).reserveAtomic({requestId:'r1',estimatedUsd:0.01});
 assert.equal(result.reserved,false);assert.equal(db.statements.some(s=>s.sql.startsWith('UPDATE council_budget_months')),false);
});
test('fractional cents round upward and never bypass budget',async()=>{
 const db=mockPool({limit:1});const result=await makeDurableBudgetAdapter({pool:db.pool,enabled:true,monthKey:'2026-11'}).reserveAtomic({requestId:'r1',estimatedUsd:0.011});
 assert.equal(result.reserved,false);assert.equal(db.statements.some(s=>s.sql==='COMMIT'),false);
});
test('database commit failure denies reservation and rolls back',async()=>{
 const db=mockPool({limit:100,fail:true});const result=await makeDurableBudgetAdapter({pool:db.pool,enabled:true,monthKey:'2026-11'}).reserveAtomic({requestId:'r1',estimatedUsd:0.01});
 assert.equal(result.reserved,false);assert.equal(db.statements.some(s=>s.sql==='ROLLBACK'),true);assert.equal(db.released,true);
});
