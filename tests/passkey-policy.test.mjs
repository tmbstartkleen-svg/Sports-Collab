import test from 'node:test';
import assert from 'node:assert/strict';
import {passkeyReadiness,PASSKEY_LOGIN_ENABLED,PASSKEY_ENROLLMENT_ENABLED} from '../lib/passkey-policy.js';
import register from '../api/passkey-register.js';
import login from '../api/passkey-login.js';
import status from '../api/passkey-status.js';
function mock(method){return {req:{method},res:{code:0,body:null,setHeader(){return this},status(n){this.code=n;return this},json(x){this.body=x;return this}}}}
test('passkey routes fail closed',()=>{for(const fn of [register,login]){const {req,res}=mock('POST');fn(req,res);assert.equal(res.code,503);assert.equal(res.body.ok,false)}});
test('readiness never claims passkey sign in active',()=>{const {req,res}=mock('GET');status(req,res);assert.equal(res.code,200);assert.equal(res.body.enabled,false);assert.equal(PASSKEY_LOGIN_ENABLED,false);assert.equal(PASSKEY_ENROLLMENT_ENABLED,false);assert.equal(passkeyReadiness().monthlySpendLimitUsd,0)});
