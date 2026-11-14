import test from 'node:test';
import assert from 'node:assert/strict';
import {authorizeOwnerRequest,requireOwner} from '../lib/owner-guard.js';

function response(){
  return {headers:{},code:200,body:null,setHeader(k,v){this.headers[k.toLowerCase()]=v},
    status(code){this.code=code;return this},json(body){this.body=body;return this}};
}
test('authorization fails closed for forged owner claims',()=>{
  for(const req of [
    {},{headers:{'x-owner':'true'}},{headers:{authorization:'Bearer fake'}},
    {headers:{cookie:'__Host-sports_owner=fake'}}
  ]){
    assert.deepEqual(authorizeOwnerRequest(req,{identityVerified:true,sessionStore:{}}),
      {ok:false,status:401,error:'Owner authentication required'});
  }
});
test('owner guard never invokes protected handler without verified session',async()=>{
  let calls=0;
  const guarded=requireOwner(()=>{calls++;});
  const res=response();
  await guarded({headers:{'x-owner':'true'}},res);
  assert.equal(calls,0);
  assert.equal(res.code,401);
  assert.equal(res.headers['cache-control'],'no-store');
});
