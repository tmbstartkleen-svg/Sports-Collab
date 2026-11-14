import test from 'node:test';
import assert from 'node:assert/strict';
import {extractClaims,compareCouncilResponses} from '../lib/council-review.js';
test('review is deterministic and does not claim verification',()=>{
 const r=compareCouncilResponses({openai:'Player questionable on injury report. Moneyline is -120.',gemini:'Moneyline odds are unavailable.',llama:''});
 assert.equal(r.generatedByAI,false);assert.equal(r.verifiedFacts,0);assert.deepEqual(r.missing,['llama']);assert.ok(r.entries[0].claimCount>=1);
});
test('malformed response types are safe',()=>{
 const r=compareCouncilResponses({openai:null,gemini:22,llama:[]});
 assert.equal(r.missing.length,3);assert.deepEqual(extractClaims(null),[]);
});
