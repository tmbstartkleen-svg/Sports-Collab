import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/council-run-offline.js';
import {providerReadiness} from '../lib/provider-readiness.js';
function call(body){const res={setHeader(){},status(n){this.code=n;return this},json(v){this.body=v;return this}};return Promise.resolve(handler({method:'POST',body},res)).then(()=>res)}
test('Claude is manual-only even if environment includes a key',()=>{const status=providerReadiness({ANTHROPIC_API_KEY:'fake'});assert.equal(status.claude.configured,false);assert.equal(status.claude.manualOnly,true);assert.equal(status.claude.requestsEnabled,false)});
test('three core responses complete council without Claude',async()=>{const res=await call({question:'Check game',responses:{openai:'GPT manual response',gemini:'Gemini manual response',llama:'Llama manual response'}});assert.equal(res.code,200);assert.equal(res.body.ok,true);assert.equal(res.body.liveProviderCalls,false);assert.equal(res.body.responses.claude.includes('optional manual'),true)});
test('optional Claude response is retained when pasted',async()=>{const res=await call({question:'Check game',responses:{openai:'GPT response',gemini:'Gemini response',llama:'Llama response',claude:'Claude pasted response'}});assert.equal(res.code,200);assert.equal(res.body.responses.claude,'Claude pasted response')});
