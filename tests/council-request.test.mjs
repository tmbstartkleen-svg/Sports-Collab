import test from 'node:test';
import assert from 'node:assert/strict';
import {validateCouncilPrompt,councilRequestGate} from '../lib/council-request.js';
import handler from '../api/council-message.js';
test('validates provider and bounded prompts',()=>{
 assert.equal(validateCouncilPrompt({provider:'gemini',prompt:'Research NBA'}).ok,true);
 assert.equal(validateCouncilPrompt({provider:'openai',prompt:'  Test  '}).prompt,'Test');
 assert.equal(validateCouncilPrompt({provider:'llama',prompt:'x'.repeat(4001)}).ok,false);
 assert.equal(validateCouncilPrompt({provider:'unknown',prompt:'Test'}).ok,false);
});
test('no provider can be called yet',()=>assert.equal(councilRequestGate().ok,false));
test('endpoint always blocks valid live requests',()=>{
 const res={status(n){this.code=n;return this},json(x){this.body=x;return this},setHeader(){}};
 handler({method:'POST',body:{provider:'gemini',prompt:'Who wins?'}},res);
 assert.equal(res.code,503);assert.equal(res.body.ok,false);
});
