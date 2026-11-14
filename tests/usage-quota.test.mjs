import test from 'node:test';
import assert from 'node:assert/strict';
import {reserveProviderBudget,validateQuotaConfiguration} from '../lib/usage-quota.js';
test('default zero spend blocks requests',async()=>{
 let called=0;
 const store={reserveAtomic:async()=>{called++;return {reserved:true}}};
 const result=await reserveProviderBudget({ownerApproved:true,store,requestId:'one',estimatedUsd:0.01});
 assert.equal(result.ok,false);assert.equal(called,0);
});
test('no durable store or owner approval fails closed',()=>{
 assert.equal(validateQuotaConfiguration({monthlyLimitUsd:1,ownerApproved:true}).ok,false);
 assert.equal(validateQuotaConfiguration({monthlyLimitUsd:1,store:{reserveAtomic(){}}}).ok,false);
});
test('atomic reservation refusal and store errors fail closed',async()=>{
 const opts={monthlyLimitUsd:1,ownerApproved:true,requestId:'one',estimatedUsd:0.1};
 assert.equal((await reserveProviderBudget({...opts,store:{reserveAtomic:async()=>({reserved:false})}})).ok,false);
 assert.equal((await reserveProviderBudget({...opts,store:{reserveAtomic:async()=>{throw Error('offline')}}})).ok,false);
});
