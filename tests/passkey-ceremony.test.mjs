import test from 'node:test';
import assert from 'node:assert/strict';
import {PASSKEY_AUTH_ENABLED,CHALLENGE_TTL_MS,validateRelyingParty,newChallenge,beginPasskeyAuthentication,finishPasskeyAuthentication} from '../lib/passkey-ceremony.js';
import options from '../api/passkey-options.js';
import verify from '../api/passkey-verify.js';
function response(){return {headers:{},code:200,body:null,setHeader(k,v){this.headers[k.toLowerCase()]=v},status(c){this.code=c;return this},json(v){this.body=v;return this}}}
test('passkey endpoints deny all authentication attempts',()=>{
  assert.equal(PASSKEY_AUTH_ENABLED,false);
  for(const handler of [options,verify]){
    for(const method of ['POST','GET']){
      const res=response();
      handler({method,body:{owner:true,credential:'fake'}},res);
      assert.equal(res.code,method==='POST'?503:405);
      assert.equal(res.headers['set-cookie'],undefined);
      assert.equal(res.headers['cache-control'],'no-store');
    }
  }
  assert.equal(beginPasskeyAuthentication({}).ok,false);
  assert.equal(finishPasskeyAuthentication({}).ok,false);
});
test('relying party origin validation rejects insecure or unrelated origins',()=>{
  assert.equal(validateRelyingParty({origin:'https://sports-collab.vercel.app',rpId:'sports-collab.vercel.app'}),true);
  for(const origin of ['http://sports-collab.vercel.app','https://evil.com','https://sports-collab.vercel.app.evil.com','https://sports-collab.vercel.app/path','https://user@sports-collab.vercel.app']){
    assert.equal(validateRelyingParty({origin,rpId:'sports-collab.vercel.app'}),false,origin);
  }
});
test('challenges are high-entropy and short-lived by design',()=>{
  assert.equal(CHALLENGE_TTL_MS,300000);
  const a=newChallenge(),b=newChallenge();
  assert.ok(a.length>=40);
  assert.notEqual(a,b);
});
