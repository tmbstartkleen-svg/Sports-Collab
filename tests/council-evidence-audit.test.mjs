import test from 'node:test';
import assert from 'node:assert/strict';
import {auditCouncilEvidence} from '../lib/council-evidence-audit.js';
test('offline audit reports missing citations and dates without asserting truth',()=>{
 const r=auditCouncilEvidence({openai:'Odds estimate from https://example.org/game on 2026-11-14',gemini:'No references',llama:''});
 assert.equal(r.liveProviderCalls,false);
 assert.equal(r.verifiedSources,0);
 assert.equal(r.seats[0].sourceUrls[0],'https://example.org/game');
 assert.equal(r.seats[0].sourcesVerified,false);
 assert.ok(r.gaps.some(x=>x.includes('gemini: no source URL')));
 assert.ok(r.gaps.some(x=>x.includes('llama: response missing')));
});
test('audit tolerates malformed responses and never trusts URLs as verified',()=>{
 const r=auditCouncilEvidence({openai:{url:'https://example.com'},gemini:null,llama:42});
 assert.equal(r.gaps.length,9);
 assert.ok(r.seats.every(x=>x.sourcesVerified===false));
});
