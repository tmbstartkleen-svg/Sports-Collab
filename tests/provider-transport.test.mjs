import test from 'node:test';
import assert from 'node:assert/strict';
import {executeProvider,sendProviderRequestForTesting} from '../lib/provider-executor.js';
test('mocked GPT request normalizes response without real network',async()=>{
 let count=0;
 const r=await sendProviderRequestForTesting({provider:'openai',model:'test-openai-model',prompt:'test',apiKey:'fake',httpClient:async(url,opts)=>{count++;assert.match(url,/api.openai.com/);assert.match(opts.headers.Authorization,/fake/);return {ok:true,json:async()=>({output:[{content:[{type:'output_text',text:'GPT response'}]}]})}}});
 assert.equal(r.text,'GPT response');assert.equal(count,1);
});
test('mocked Gemini request normalizes response without real network',async()=>{
 const r=await sendProviderRequestForTesting({provider:'gemini',model:'test-gemini-model',prompt:'test',apiKey:'fake',httpClient:async()=>({ok:true,json:async()=>({candidates:[{content:{parts:[{text:'Gemini response'}]}}]})})});
 assert.equal(r.text,'Gemini response');
});
test('provider errors never trigger retry',async()=>{
 let count=0;
 const r=await sendProviderRequestForTesting({provider:'gemini',model:'test-gemini-model',prompt:'test',apiKey:'fake',httpClient:async()=>{count++;return {ok:false,status:429}}});
 assert.equal(r.retryAutomatically,false);assert.equal(count,1);
});
test('public execution stays blocked even with forged approvals',async()=>{
 const r=await executeProvider({authorization:{ownerVerified:true,explicitProviderApproval:true,enforcedBudgetAvailable:true}});
 assert.equal(r.ok,false);assert.equal(r.status,503);
});

test('mock transport passes a bounded abort signal and never retries',async()=>{
 let calls=0;
 const result=await sendProviderRequestForTesting({
  provider:'openai',model:'test-openai-model',prompt:'test',apiKey:'fake',
  httpClient:async(_url,options)=>{
   calls++;
   assert.ok(options.signal instanceof AbortSignal);
   assert.equal(options.signal.aborted,false);
   return {ok:false,status:429};
  }
 });
 assert.equal(calls,1);
 assert.equal(result.retryAutomatically,false);
});

test('missing explicit model blocks even mock HTTP transport',async()=>{
 let calls=0;
 const result=await sendProviderRequestForTesting({
  provider:'openai',prompt:'test',apiKey:'fake',
  httpClient:async()=>{calls++;return {ok:true,json:async()=>({})}}
 });
 assert.equal(result.ok,false);
 assert.equal(result.retryAutomatically,false);
 assert.equal(calls,0);
});

test('offline council cancellation stops before contacting mock responder',async()=>{
 const {simulateCouncilExchange}=await import('../lib/provider-executor.js');
 const controller=new AbortController();
 controller.abort();
 let calls=0;
 const result=await simulateCouncilExchange({question:'Research games',signal:controller.signal,mockResponder:async()=>{calls++;return 'mock'}});
 assert.equal(result.ok,false);
 assert.equal(result.liveCalls,false);
 assert.equal(calls,0);
 assert.equal(result.responses.length,0);
});
test('offline council cancellation between stages preserves only completed replies',async()=>{
 const {simulateCouncilExchange}=await import('../lib/provider-executor.js');
 const controller=new AbortController();
 let calls=0;
 const result=await simulateCouncilExchange({question:'Research games',signal:controller.signal,mockResponder:async()=>{calls++;controller.abort();return 'mock'}});
 assert.equal(result.ok,false);
 assert.equal(result.liveCalls,false);
 assert.equal(calls,1);
 assert.equal(result.responses.length,0);
});

test('offline council preserves completed stages after later responder failure',async()=>{
 const {simulateCouncilExchange}=await import('../lib/provider-executor.js');
 let calls=0;
 const result=await simulateCouncilExchange({question:'Research games',mockResponder:async()=>{
  calls++;
  if(calls===3)throw new Error('Mock failure');
  return 'mock answer '+calls;
 }});
 assert.equal(result.ok,false);
 assert.equal(result.liveCalls,false);
 assert.equal(result.round,3);
 assert.deepEqual(result.responses,['mock answer 1','mock answer 2']);
 assert.equal(calls,3);
});

test('provider preflight fails closed until verified free and authorized',async()=>{
 const {preflightProviderExecution}=await import('../lib/provider-executor.js');
 const auth={ownerVerified:true,explicitProviderApproval:true};
 const policy={serverVerifiedFree:true,billingDisabled:true,authenticated:true,requestsRemaining:2,requestBudget:1};
 assert.equal(preflightProviderExecution({provider:'openai'}).ok,false);
 assert.equal(preflightProviderExecution({authorization:auth,provider:'openai'}).reason,'free_billing_not_verified');
 assert.equal(preflightProviderExecution({authorization:auth,policy:{...policy,billingDisabled:false},provider:'openai'}).ok,false);
 assert.equal(preflightProviderExecution({authorization:auth,policy,provider:'unknown'}).reason,'unknown_provider');
 assert.equal(preflightProviderExecution({authorization:auth,policy:{...policy,requestsRemaining:0},provider:'openai'}).reason,'free_quota_exhausted');
 assert.equal(preflightProviderExecution({authorization:auth,policy,provider:'openai'}).requiresAtomicReservation,true);
 assert.equal(preflightProviderExecution({authorization:auth,policy,provider:'openai'}).transportEnabled,false);
 assert.equal((await executeProvider({authorization:{...auth,enforcedBudgetAvailable:true}})).ok,false);
});
