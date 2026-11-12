import test from 'node:test';
import assert from 'node:assert/strict';
import {PROVIDER_IDS,validateCouncilPrompt} from '../lib/council-request.js';
import {COUNCIL_PROVIDERS,providerReadiness} from '../lib/provider-readiness.js';
import {buildCouncilPrompts} from '../lib/council-orchestrator.js';
import {compareCouncilResponses} from '../lib/council-review.js';
import {synthesizeCouncil} from '../lib/council-synthesis.js';
import {executeProvider} from '../lib/provider-executor.js';
import {authorizeOwner,AUTH_ENABLED} from '../lib/auth-policy.js';
import {evaluatePasskeyActivation} from '../lib/passkey-activation.js';
const expected=['gemini','llama','openai'];
test('all launch surfaces restrict the council to GPT Gemini and Llama',()=>{
 assert.deepEqual([...PROVIDER_IDS].sort(),expected);
 assert.deepEqual(Object.keys(COUNCIL_PROVIDERS).sort(),expected);
 assert.deepEqual(Object.keys(buildCouncilPrompts('Launch audit')).sort(),expected);
 assert.deepEqual(compareCouncilResponses({}).entries.map(x=>x.provider).sort(),expected);
 for(const forbidden of ['claude','grok'])assert.equal(validateCouncilPrompt({provider:forbidden,prompt:'test'}).ok,false);
});
test('missing Llama provider blocks readiness despite API key',()=>{
 const readiness=providerReadiness({LLAMA_API_KEY:'not-a-real-key'});
 assert.equal(readiness.llama.configured,true);
 assert.equal(readiness.llama.readyForActivation,false);
 assert.equal(readiness.llama.requestsEnabled,false);
});
test('owner session and paid execution stay unavailable',async()=>{
 assert.equal(AUTH_ENABLED,false);
 assert.equal(authorizeOwner({session:{owner:true,expiresAt:Date.now()+60000}}).ok,false);
 assert.equal((await executeProvider({authorization:{ownerVerified:true,explicitProviderApproval:true,enforcedBudgetAvailable:true}})).ok,false);
 assert.equal(evaluatePasskeyActivation({}).ready,false);
 assert.equal(synthesizeCouncil({}).approvedWagers,0);
});
