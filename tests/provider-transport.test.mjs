import test from 'node:test';
import assert from 'node:assert/strict';
import {executeProvider,sendProviderRequestForTesting} from '../lib/provider-executor.js';
test('mocked GPT request normalizes response without real network',async()=>{
 let count=0;
 const r=await sendProviderRequestForTesting({provider:'openai',prompt:'test',apiKey:'fake',httpClient:async(url,opts)=>{count++;assert.match(url,/api.openai.com/);assert.match(opts.headers.Authorization,/fake/);return {ok:true,json:async()=>({output:[{content:[{type:'output_text',text:'GPT response'}]}]})}}});
 assert.equal(r.text,'GPT response');assert.equal(count,1);
});
test('mocked Gemini request normalizes response without real network',async()=>{
 const r=await sendProviderRequestForTesting({provider:'gemini',prompt:'test',apiKey:'fake',httpClient:async()=>({ok:true,json:async()=>({candidates:[{content:{parts:[{text:'Gemini response'}]}}]})})});
 assert.equal(r.text,'Gemini response');
});
test('provider errors never trigger retry',async()=>{
 let count=0;
 const r=await sendProviderRequestForTesting({provider:'gemini',prompt:'test',apiKey:'fake',httpClient:async()=>{count++;return {ok:false,status:429}}});
 assert.equal(r.retryAutomatically,false);assert.equal(count,1);
});
test('public execution stays blocked even with forged approvals',async()=>{
 const r=await executeProvider({authorization:{ownerVerified:true,explicitProviderApproval:true,enforcedBudgetAvailable:true}});
 assert.equal(r.ok,false);assert.equal(r.status,503);
});
