import test from 'node:test';
import assert from 'node:assert/strict';
import ownerCouncil from '../api/owner-council.js';
function response(){return {headers:{},code:200,body:null,setHeader(k,v){this.headers[k.toLowerCase()]=v},status(c){this.code=c;return this},json(v){this.body=v;return this}}}
test('owner council denies all requests before authentication is enabled',async()=>{
  for(const method of ['GET','POST']){
    const res=response();
    await ownerCouncil({method,headers:{'x-owner':'true',authorization:'Bearer fake'}},res);
    assert.equal(res.code,401);
    assert.equal(res.body.ok,false);
    assert.equal(res.headers['cache-control'],'no-store');
    assert.equal(res.headers['set-cookie'],undefined);
  }
});
