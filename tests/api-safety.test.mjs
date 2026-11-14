import test from 'node:test';
import assert from 'node:assert/strict';
import ownerStatus from '../api/owner-status.js';
import gemini from '../api/gemini.js';
import ownerSession from '../api/owner-session.js';
import connectionCheck from '../api/connection-check.js';
function mock(method,body={}){
 const headers={};
 const res={code:200,headers,body:null,setHeader(k,v){headers[k]=v;return this},status(n){this.code=n;return this},json(v){this.body=v;return this},end(){return this}};
 return {req:{method,body,headers:{'content-length':'100'}},res};
}
test('public status is safe and spend cap zero',()=>{const {req,res}=mock('GET');ownerStatus(req,res);assert.equal(res.code,200);assert.equal(res.body.monthlySpendLimitUsd,0);assert.equal(res.body.providerRequestsEnabled,false);assert.equal(res.headers['Cache-Control'],'no-store')});
test('owner session never issued',()=>{const {req,res}=mock('GET');ownerSession(req,res);assert.equal(res.code,503);assert.equal(res.body.ok,false)});
test('Gemini endpoint never calls provider',async()=>{const {req,res}=mock('GET');await gemini(req,res);assert.equal(res.code,503);assert.equal(res.body.enabled,false)});
test('connection endpoint refuses provider calls',()=>{const {req,res}=mock('POST',{provider:'gemini',question:'NBA tonight'});connectionCheck(req,res);assert.equal(res.code,503);assert.equal(res.body.ok,false)});
test('connection endpoint rejects unsupported methods',()=>{const {req,res}=mock('GET');connectionCheck(req,res);assert.equal(res.code,405)});
