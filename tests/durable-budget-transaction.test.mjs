import test from 'node:test';
import assert from 'node:assert/strict';
import {makeDurableBudgetAdapter} from '../lib/durable-budget.js';
function fakePool({limit=10,reserved=0,failAt=null}={}){
 const state={limit,reserved,ids:new Set(),queries:[],released:0};
 const pool={async connect(){return {async query(sql,args=[]){
  state.queries.push(sql);
  if(failAt&&sql.startsWith(failAt))throw Error('simulated db failure');
  if(sql==='BEGIN'||sql==='COMMIT'||sql==='ROLLBACK')return {rows:[]};
  if(sql.includes('FOR UPDATE'))return {rows:[{limit_cents:state.limit,reserved_cents:state.reserved}]};
  if(sql.startsWith('SELECT request_id'))return {rows:state.ids.has(args[0])?[{request_id:args[0]}]:[]};
  if(sql.startsWith('UPDATE council_budget_months')){state.reserved+=args[1];return {rows:[]}};
  if(sql.startsWith('INSERT INTO council_budget_reservations')){state.ids.add(args[0]);return {rows:[]}};
  throw Error('Unexpected query');
 },release(){state.released++}}}};
 return {pool,state};
}
test('adapter defaults to disabled and makes no connection',async()=>{
 let calls=0;
 const adapter=makeDurableBudgetAdapter({pool:{connect:async()=>{calls++}},monthKey:'2026-11'});
 assert.equal((await adapter.reserveAtomic({requestId:'x',estimatedUsd:0.01})).reserved,false);
 assert.equal(calls,0);
});
test('transaction reserves cents and blocks duplicates and overspend',async()=>{
 const {pool,state}=fakePool();
 const adapter=makeDurableBudgetAdapter({pool,enabled:true,monthKey:'2026-11'});
 assert.equal((await adapter.reserveAtomic({requestId:'a',estimatedUsd:0.021})).reserved,true);
 assert.equal(state.reserved,3);
 assert.equal((await adapter.reserveAtomic({requestId:'a',estimatedUsd:0.021})).reserved,false);
 assert.equal((await adapter.reserveAtomic({requestId:'b',estimatedUsd:0.08})).reserved,false);
 assert.equal(state.reserved,3);
 assert.equal(state.released,3);
});
test('transaction rolls back and rejects database errors',async()=>{
 const {pool,state}=fakePool({failAt:'INSERT INTO'});
 const adapter=makeDurableBudgetAdapter({pool,enabled:true,monthKey:'2026-11'});
 assert.equal((await adapter.reserveAtomic({requestId:'fail',estimatedUsd:0.01})).reserved,false);
 assert.ok(state.queries.includes('ROLLBACK'));
 assert.equal(state.released,1);
});

test('month key must match real YYYY-MM format',async()=>{
 const {pool,state}=fakePool();
 const valid=makeDurableBudgetAdapter({pool,enabled:true,monthKey:'2026-11'});
 assert.equal((await valid.reserveAtomic({requestId:'valid-month',estimatedUsd:0.01})).reserved,true);
 const bad=makeDurableBudgetAdapter({pool,enabled:true,monthKey:'2026-13'});
 assert.equal((await bad.reserveAtomic({requestId:'invalid-month',estimatedUsd:0.01})).reserved,false);
 assert.equal(state.reserved,1);
});

test('exact one cent is not rounded up to two',async()=>{
 const {pool,state}=fakePool({limit:1});
 const adapter=makeDurableBudgetAdapter({pool,enabled:true,monthKey:'2026-11'});
 assert.equal((await adapter.reserveAtomic({requestId:'cent',estimatedUsd:0.01})).reserved,true);
 assert.equal(state.reserved,1);
});
test('zero budget rejects any positive request',async()=>{
 const {pool,state}=fakePool({limit:0});
 const adapter=makeDurableBudgetAdapter({pool,enabled:true,monthKey:'2026-11'});
 assert.equal((await adapter.reserveAtomic({requestId:'zero',estimatedUsd:0.01})).reserved,false);
 assert.equal(state.reserved,0);
});
