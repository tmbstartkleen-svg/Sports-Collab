import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/council-demo.js';
function mock(method,body){return {req:{method,body},res:{setHeader(){},status(n){this.code=n;return this},json(x){this.body=x;return this}}}}
test('demo handles all five providers without AI calls',()=>{
 for(const provider of ['openai','gemini','llama','claude','grok']){
  const {req,res}=mock('POST',{provider,prompt:'Check this game'});handler(req,res);
  assert.equal(res.code,200);assert.equal(res.body.generatedByAI,false);assert.equal(res.body.monthlySpendLimitUsd,0);
 }
});
test('demo rejects bad requests',()=>{
 const {req,res}=mock('POST',{provider:'bad',prompt:'hello'});handler(req,res);assert.equal(res.code,400);
});
