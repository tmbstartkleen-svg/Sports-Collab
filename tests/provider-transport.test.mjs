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

test('quota reservation is required before a council step can proceed',async()=>{
 const {reserveCouncilStepForTesting}=await import('../lib/provider-executor.js');
 const authorization={ownerVerified:true,explicitProviderApproval:true};
 const policy={serverVerifiedFree:true,billingDisabled:true,authenticated:true,requestsRemaining:2,requestBudget:2};
 const args={question:'Analyze tonight games',authorization,policy};
 let calls=0;
 const missing=await reserveCouncilStepForTesting(args);
 assert.equal(missing.ok,false);
 assert.equal(missing.liveCalls,false);
 const denied=await reserveCouncilStepForTesting({...args,reserveQuota:async()=>{calls++;return {reserved:false}}});
 assert.equal(denied.ok,false);
 assert.equal(calls,1);
 const accepted=await reserveCouncilStepForTesting({...args,reserveQuota:async()=>({reserved:true,id:'test-reservation',provider:'openai',round:1})});
 assert.equal(accepted.ok,true);
 assert.equal(accepted.recipient,'openai');
 assert.equal(accepted.reservationId,'test-reservation');
 assert.equal(accepted.transportEnabled,false);
 assert.equal(accepted.liveCalls,false);
 const blocked=await reserveCouncilStepForTesting({...args,policy:{...policy,requestsRemaining:0},reserveQuota:async()=>{calls++;return {reserved:true,id:'bad'}}});
 assert.equal(blocked.ok,false);
 assert.equal(calls,1);
});

test('reservation acknowledgement cannot be reused for a different provider or round',async()=>{
 const {reserveCouncilStepForTesting}=await import('../lib/provider-executor.js');
 const authorization={ownerVerified:true,explicitProviderApproval:true};
 const policy={serverVerifiedFree:true,billingDisabled:true,authenticated:true,requestsRemaining:3,requestBudget:3};
 const args={question:'Analyze games',authorization,policy};
 for(const wrong of [{reserved:true,id:'r1',provider:'gemini',round:1},{reserved:true,id:'r2',provider:'openai',round:2}]){
  const result=await reserveCouncilStepForTesting({...args,reserveQuota:async()=>wrong});
  assert.equal(result.ok,false);
  assert.equal(result.error,'Quota reservation denied');
  assert.equal(result.liveCalls,false);
 }
 const valid=await reserveCouncilStepForTesting({...args,responses:['Initial GPT analysis'],reserveQuota:async()=>({reserved:true,id:'r3',provider:'gemini',round:2})});
 assert.equal(valid.ok,true);
 assert.equal(valid.recipient,'gemini');
 assert.equal(valid.round,2);
 assert.equal(valid.transportEnabled,false);
});

test('offline council emits ordered stage progress without network access',async()=>{
 const {simulateCouncilExchange}=await import('../lib/provider-executor.js');
 const progress=[];
 const result=await simulateCouncilExchange({question:'Research sports',mockResponder:async({round})=>'Mock reply '+round,onStageComplete:async stage=>progress.push(stage)});
 assert.equal(result.ok,true);
 assert.equal(result.liveCalls,false);
 assert.deepEqual(progress.map(x=>x.recipient),['openai','gemini','llama','openai']);
 assert.deepEqual(progress.map(x=>x.completed),[1,2,3,4]);
 assert.equal(progress[3].total,4);
});
test('offline council preserves replies if progress callback fails',async()=>{
 const {simulateCouncilExchange}=await import('../lib/provider-executor.js');
 let calls=0;
 const result=await simulateCouncilExchange({question:'Research sports',mockResponder:async()=>{calls++;return 'Mock reply '+calls},onStageComplete:()=>{throw new Error('UI disconnected')}});
 assert.equal(result.ok,false);
 assert.equal(result.liveCalls,false);
 assert.equal(result.responses.length,1);
 assert.equal(calls,1);
});

test('offline council stops after progress callback cancels without extra stages',async()=>{
 const {simulateCouncilExchange}=await import('../lib/provider-executor.js');
 const controller=new AbortController();
 let calls=0;
 const result=await simulateCouncilExchange({
  question:'Research sports',signal:controller.signal,
  mockResponder:async()=>{calls++;return 'Mock reply '+calls},
  onStageComplete:async()=>controller.abort()
 });
 assert.equal(result.ok,false);
 assert.equal(result.error,'Council exchange cancelled');
 assert.equal(result.liveCalls,false);
 assert.equal(calls,1);
 assert.deepEqual(result.responses,['Mock reply 1']);
});

test('quota reservation cancellation blocks acceptance before and after callback',async()=>{
 const {reserveCouncilStepForTesting}=await import('../lib/provider-executor.js');
 const authorization={ownerVerified:true,explicitProviderApproval:true};
 const policy={serverVerifiedFree:true,billingDisabled:true,authenticated:true,requestsRemaining:2,requestBudget:2};
 const controller=new AbortController();
 controller.abort();
 let calls=0;
 const args={question:'Research sports',authorization,policy,signal:controller.signal};
 const before=await reserveCouncilStepForTesting({...args,reserveQuota:async()=>{calls++;return {reserved:true,id:'x',provider:'openai',round:1}}});
 assert.equal(before.ok,false);
 assert.equal(before.error,'Council reservation cancelled');
 assert.equal(calls,0);
 const later=new AbortController();
 const after=await reserveCouncilStepForTesting({...args,signal:later.signal,reserveQuota:async()=>{calls++;later.abort();return {reserved:true,id:'y',provider:'openai',round:1}}});
 assert.equal(after.ok,false);
 assert.equal(after.error,'Council reservation cancelled');
 assert.equal(after.liveCalls,false);
 assert.equal(calls,1);
});
