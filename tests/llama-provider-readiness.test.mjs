import test from 'node:test';
import assert from 'node:assert/strict';
import {providerReadiness,LLAMA_PROVIDER_OPTIONS} from '../lib/provider-readiness.js';
import {buildProviderRequest} from '../lib/provider-request-builders.js';
test('every Llama host marked ready has a corresponding request builder',()=>{
 for(const llamaHost of LLAMA_PROVIDER_OPTIONS){
  const ready=providerReadiness({LLAMA_API_KEY:'placeholder',LLAMA_PROVIDER:llamaHost});
  assert.equal(ready.llama.readyForActivation,true);
  const request=buildProviderRequest({provider:'llama',llamaHost,model:'llama-test',prompt:'Analyze',apiKey:'placeholder'});
  assert.ok(request.url.startsWith('https://'));
 }
});
test('unsupported Llama hosts are not marked ready',()=>{
 for(const host of ['meta','openai','unknown','']){
  assert.equal(providerReadiness({LLAMA_API_KEY:'placeholder',LLAMA_PROVIDER:host}).llama.readyForActivation,false);
 }
});
