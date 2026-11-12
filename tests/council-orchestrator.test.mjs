import test from 'node:test';
import assert from 'node:assert/strict';
import {buildCouncilPrompts,runCouncilOffline} from '../lib/council-orchestrator.js';
test('all five council seats get independent roles',()=>{
 const p=buildCouncilPrompts('NBA analysis');
 assert.deepEqual(Object.keys(p),['openai','gemini','llama','claude','grok']);
 assert.notEqual(p.openai,p.gemini);assert.notEqual(p.gemini,p.llama);
});
test('full offline council orchestration uses only injected responses',async()=>{
 const calls=[];
 const result=await runCouncilOffline({question:'Analyze the game',respond:async(provider,prompt)=>{calls.push(provider);return provider+' response about odds and injury'}});
 assert.deepEqual(calls,['openai','gemini','llama','claude','grok']);
 assert.equal(result.liveProviderCalls,false);assert.equal(result.review.verifiedFacts,0);assert.equal(result.approvedBetSlip,false);
});
test('pasted responses avoid redundant responder calls',async()=>{
 let calls=0;
 const result=await runCouncilOffline({question:'Game',responses:{openai:'Pasted GPT response'},respond:async()=>{calls++;return 'offline stub'}});
 assert.equal(calls,4);assert.equal(result.responses.openai,'Pasted GPT response');
});
test('invalid question rejects before any response',async()=>{
 await assert.rejects(runCouncilOffline({question:'',respond:async()=>''}));
});
