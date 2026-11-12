import test from 'node:test';
import assert from 'node:assert/strict';
import {synthesizeCouncil} from '../lib/council-synthesis.js';
test('synthesis retains attribution and makes no factual assertions',()=>{
 const r=synthesizeCouncil({openai:'Moneyline -120 is unverified until odds are checked.',gemini:'Player questionable in injury report.',llama:'Need to verify the total and lineup.'});
 assert.equal(r.verifiedFacts,0);assert.equal(r.approvedWagers,0);
 assert.equal(r.marketClaims[0].provider,'openai');assert.equal(r.marketClaims[0].verified,false);
 assert.ok(r.evidenceCandidates.some(x=>x.provider==='gemini'));
});
test('bad inputs do not create facts',()=>{
 const r=synthesizeCouncil({openai:3,gemini:null,llama:[]});
 assert.deepEqual(r.marketClaims,[]);assert.equal(r.generatedByAI,false);
});
