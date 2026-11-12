import test from 'node:test';
import assert from 'node:assert/strict';
import {describeAdapter,requireApprovedExecution} from '../lib/provider-adapters.js';
test('known providers have inert adapter descriptions',()=>{
 for(const p of ['gemini','openai','llama']){const a=describeAdapter(p);assert.equal(a.ok,true);assert.equal(a.liveCallsEnabled,false)}
 assert.equal(describeAdapter('bad').ok,false);
});
test('Llama endpoint is not guessed',()=>assert.equal(describeAdapter('llama').endpointConfigured,false));
test('even approval flags cannot cause unimplemented transport calls',()=>{
 assert.equal(requireApprovedExecution({ownerVerified:true,usageBudgetApproved:true,providerEnabled:true}).ok,false);
});
