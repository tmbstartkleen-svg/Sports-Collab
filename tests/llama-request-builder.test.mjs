import test from 'node:test';
import assert from 'node:assert/strict';
import {buildProviderRequest,redactProviderRequest} from '../lib/provider-request-builders.js';
test('Llama requires explicitly selected supported host and model',()=>{
 for(const llamaHost of [undefined,'meta','invalid',''])assert.throws(()=>buildProviderRequest({provider:'llama',prompt:'test',apiKey:'fake',llamaHost,model:'llama-test'}));
 assert.throws(()=>buildProviderRequest({provider:'llama',prompt:'test',apiKey:'fake',llamaHost:'groq'}));
});
test('Llama request is constructed locally without contacting a provider',()=>{
 const request=buildProviderRequest({provider:'llama',prompt:'Analyze match',apiKey:'fake-secret',llamaHost:'groq',model:'llama-test'});
 assert.equal(request.url,'https://api.groq.com/openai/v1/chat/completions');
 assert.equal(JSON.parse(request.body).messages[0].content,'Analyze match');
 const safe=redactProviderRequest(request);
 assert.equal(safe.host,'api.groq.com');
 assert.equal(JSON.stringify(safe).includes('fake-secret'),false);
});
