import test from 'node:test';
import assert from 'node:assert/strict';
import {buildProviderRequest,redactProviderRequest} from '../lib/provider-request-builders.js';
test('OpenAI request builder constructs server-side request without calling network',()=>{
 const r=buildProviderRequest({provider:'openai',prompt:'NBA tonight',apiKey:'test-secret'});
 assert.equal(new URL(r.url).host,'api.openai.com');
 assert.equal(JSON.parse(r.body).input,'NBA tonight');
 assert.equal(JSON.stringify(redactProviderRequest(r)).includes('test-secret'),false);
});
test('Gemini builder puts key only in server-side header',()=>{
 const r=buildProviderRequest({provider:'gemini',prompt:'Research',apiKey:'test-secret'});
 assert.equal(new URL(r.url).host,'generativelanguage.googleapis.com');
 assert.equal(r.headers['x-goog-api-key'],'test-secret');
 assert.equal(r.url.includes('test-secret'),false);
});
test('reject missing key, oversized prompt and unconfigured Llama',()=>{
 assert.throws(()=>buildProviderRequest({provider:'gemini',prompt:'x',apiKey:''}));
 assert.throws(()=>buildProviderRequest({provider:'openai',prompt:'x'.repeat(4001),apiKey:'key'}));
 assert.throws(()=>buildProviderRequest({provider:'llama',prompt:'x',apiKey:'key'}));
});
