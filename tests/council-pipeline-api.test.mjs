import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/council-run-offline.js';
function invoke(body,method='POST'){
 const headers={};let status=200;let payload;
 return handler({method,body},{setHeader:(k,v)=>{headers[k]=v},status:(n)=>{status=n;return {json:(x)=>{payload=x;return x}}}}).then(()=>({status,payload,headers}));
}
test('offline API uses three-seat pipeline with zero verification claims',async()=>{
 const r=await invoke({question:'Evaluate a game',responses:{openai:'Moneyline unknown',gemini:'Roster unknown',llama:'Risk unknown'}});
 assert.equal(r.status,200);assert.equal(r.payload.ok,true);
 assert.equal(r.payload.liveProviderCalls,false);
 assert.equal(r.payload.evidenceAudit.verifiedSources,0);
 assert.equal(r.payload.synthesis.generatedByAI,false);
 assert.equal(r.headers['Cache-Control'],'no-store');
});
test('offline API rejects incomplete input and GET',async()=>{
 assert.equal((await invoke({question:'Q',responses:{openai:'Only one'}})).status,400);
 assert.equal((await invoke({},'GET')).status,405);
});
