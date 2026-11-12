import test from 'node:test';
import assert from 'node:assert/strict';
import {providerReadiness,LLAMA_PROVIDER_OPTIONS} from '../lib/provider-readiness.js';
test('Llama requires explicit provider identity and does not expose keys',()=>{
 const env={GEMINI_API_KEY:'g-secret',OPENAI_API_KEY:'o-secret',LLAMA_API_KEY:'l-secret'};
 const status=providerReadiness(env);
 assert.equal(status.llama.configured,true);
 assert.equal(status.llama.endpointConfigured,false);
 assert.equal(status.llama.readyForActivation,false);
 assert.ok(!JSON.stringify(status).includes('secret'));
});
test('only allowlisted Llama provider identifiers qualify',()=>{
 const env={LLAMA_API_KEY:'test',LLAMA_PROVIDER:'unknown.example'};
 assert.equal(providerReadiness(env).llama.readyForActivation,false);
 for(const provider of LLAMA_PROVIDER_OPTIONS){
  const result=providerReadiness({...env,LLAMA_PROVIDER:provider});
  assert.equal(result.llama.readyForActivation,true);
  assert.equal(result.llama.requestsEnabled,false);
 }
});
