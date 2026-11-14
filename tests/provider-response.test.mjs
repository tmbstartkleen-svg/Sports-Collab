import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeProviderResponse,normalizeProviderFailure} from '../lib/provider-response.js';
test('normalizes GPT responses',()=>{
 const r=normalizeProviderResponse('openai',{output:[{content:[{type:'output_text',text:'Hello'}]}]});
 assert.equal(r.text,'Hello');
});
test('normalizes Gemini responses',()=>{
 const r=normalizeProviderResponse('gemini',{candidates:[{content:{parts:[{text:'World'}]}}]});
 assert.equal(r.text,'World');
});
test('rejects empty responses and never automatically retries',()=>{
 assert.equal(normalizeProviderResponse('gemini',{}).ok,false);
 assert.equal(normalizeProviderFailure(429).retryAutomatically,false);
 assert.equal(normalizeProviderFailure(401).retryAutomatically,false);
});
