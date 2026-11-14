import test from 'node:test';
import assert from 'node:assert/strict';
import {providerReadiness} from '../lib/provider-readiness.js';
import {buildProviderRequest,redactProviderRequest} from '../lib/provider-request-builders.js';
test('SambaNova Llama adapter constructs correct disabled chat request',()=>{
 const r=buildProviderRequest({provider:'llama',llamaHost:'sambanova',model:'Meta-Llama-3.3-70B-Instruct',prompt:'Analyze the matchup',apiKey:'fake-key'});
 assert.equal(r.url,'https://api.sambanova.ai/v1/chat/completions');
 assert.equal(JSON.parse(r.body).model,'Meta-Llama-3.3-70B-Instruct');
 assert.equal(JSON.parse(r.body).messages[0].content,'Analyze the matchup');
 assert.equal(JSON.stringify(redactProviderRequest(r)).includes('fake-key'),false);
});
test('SambaNova readiness requires configured key and explicit provider selection',()=>{
 assert.equal(providerReadiness({LLAMA_API_KEY:'fake',LLAMA_PROVIDER:'sambanova'}).llama.readyForActivation,true);
 assert.equal(providerReadiness({LLAMA_API_KEY:'fake'}).llama.readyForActivation,false);
 assert.equal(providerReadiness({LLAMA_PROVIDER:'sambanova'}).llama.readyForActivation,false);
 assert.equal(providerReadiness({LLAMA_API_KEY:'fake',LLAMA_PROVIDER:'sambanova'}).llama.requestsEnabled,false);
});
