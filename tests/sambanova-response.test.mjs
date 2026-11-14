import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeProviderResponse} from '../lib/provider-response.js';
import {sendProviderRequestForTesting,executeProvider} from '../lib/provider-executor.js';
test('SambaNova chat completion normalizes into attributed Llama text',()=>{
 const r=normalizeProviderResponse('llama',{choices:[{message:{content:'Evidence is unverified'}}]});
 assert.equal(r.ok,true);assert.equal(r.provider,'llama');assert.equal(r.text,'Evidence is unverified');
 assert.equal(normalizeProviderResponse('llama',{choices:[]}).ok,false);
});
test('injected Llama test transport requires explicit host and never enables production executor',async()=>{
 let calls=0;
 const result=await sendProviderRequestForTesting({provider:'llama',llamaHost:'sambanova',model:'Meta-Llama-3.3-70B-Instruct',prompt:'Analyze',apiKey:'placeholder',httpClient:async(url)=>{calls++;assert.equal(url,'https://api.sambanova.ai/v1/chat/completions');return {ok:true,json:async()=>({choices:[{message:{content:'Offline fixture'}}]})}}});
 assert.equal(result.text,'Offline fixture');assert.equal(calls,1);
 const blocked=await executeProvider({authorization:{ownerVerified:true,explicitProviderApproval:true,enforcedBudgetAvailable:true}});
 assert.equal(blocked.status,503);
});
