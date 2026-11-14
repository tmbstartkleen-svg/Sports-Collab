import test from 'node:test';
import assert from 'node:assert/strict';
import {providerReadiness} from '../lib/provider-readiness.js';
import handler from '../api/providers-status.js';
test('provider inventory does not leak secrets or activate requests',()=>{
 const env={GEMINI_API_KEY:'gemini-secret',OPENAI_API_KEY:'openai-secret',LLAMA_API_KEY:'llama-secret'};
 const data=providerReadiness(env);
 assert.ok(Object.values(data).every(x=>x.configured&&!x.requestsEnabled));
 assert.ok(!JSON.stringify(data).includes('secret'));
});
test('missing keys are reported without requesting providers',()=>{
 const data=providerReadiness({});
 assert.ok(Object.values(data).every(x=>!x.configured&&!x.requestsEnabled));
});
test('provider status endpoint is read-only',()=>{
 const res={status(n){this.code=n;return this},json(x){this.body=x;return this},setHeader(){}};
 handler({method:'GET'},res);
 assert.equal(res.code,200);
 assert.equal(res.body.providerRequestsEnabled,false);
 assert.equal(res.body.monthlySpendLimitUsd,0);
});
