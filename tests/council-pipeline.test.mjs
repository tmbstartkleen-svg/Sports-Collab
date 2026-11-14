import test from 'node:test';
import assert from 'node:assert/strict';
import {assembleOfflineCouncil} from '../lib/council-pipeline.js';
const responses={openai:'Moneyline odds remain unverified 2026-11-14 https://example.com/market',gemini:'Roster injury status unknown 2026-11-14 https://example.com/roster',llama:'Selection bias risk remains unverified 2026-11-14 https://example.com/risk'};
test('offline pipeline produces attributed synthesis and evidence inventory',async()=>{
 const result=await assembleOfflineCouncil({question:'Assess this game',responses});
 assert.equal(result.liveProviderCalls,false);
 assert.equal(result.evidenceAudit.verifiedSources,0);
 assert.equal(result.evidenceAudit.seats.length,3);
 assert.equal(result.synthesis.generatedByAI,false);
 assert.equal(result.approvedBetSlip,false);
});
test('offline pipeline rejects missing AI seats',async()=>{
 await assert.rejects(()=>assembleOfflineCouncil({question:'Assess',responses:{openai:'Only one'}}));
});
