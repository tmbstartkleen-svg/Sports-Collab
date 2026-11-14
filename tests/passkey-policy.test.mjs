import test from 'node:test';
import assert from 'node:assert/strict';
import {passkeyReadiness,PASSKEY_LOGIN_ENABLED,PASSKEY_ENROLLMENT_ENABLED} from '../lib/passkey-policy.js';
import status from '../api/passkey-status.js';
function mock(method){return {req:{method},res:{code:0,body:null,setHeader(){return this},status(n){this.code=n;return this},json(x){this.body=x;return this}}}}
test('removed passkey registration and login routes cannot be used',()=>{
 assert.equal(PASSKEY_LOGIN_ENABLED,false);
 assert.equal(PASSKEY_ENROLLMENT_ENABLED,false);
});
test('readiness never claims passkey sign in active',()=>{
 const {req,res}=mock('GET');status(req,res);
 assert.equal(res.code,200);
 assert.equal(res.body.enabled,false);
 assert.equal(passkeyReadiness().monthlySpendLimitUsd,0);
});
