import test from 'node:test';
import assert from 'node:assert/strict';
import {executeProvider} from '../lib/provider-executor.js';
test('transport never calls fetch without authorization',async()=>{
 let calls=0;
 const fetchImpl=async()=>{calls++;throw Error('network must not run')};
 const result=await executeProvider({provider:'gemini',prompt:'test',apiKey:'secret',fetchImpl});
 assert.equal(result.ok,false);assert.equal(calls,0);
});
test('transport stays disabled even if caller forges approval flags',async()=>{
 let calls=0;
 const result=await executeProvider({provider:'openai',prompt:'test',apiKey:'secret',authorization:{ownerVerified:true,explicitProviderApproval:true,enforcedBudgetAvailable:true},fetchImpl:async()=>{calls++;throw Error('network must not run')}});
 assert.equal(result.ok,false);assert.equal(calls,0);
});
