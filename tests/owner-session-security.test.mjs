import test from 'node:test';
import assert from 'node:assert/strict';
import {SESSION_ISSUANCE_ENABLED, makeOpaqueToken, hashToken, verifyToken, sessionCookie, issueSession} from '../lib/owner-session.js';
import ownerSession from '../api/owner-session.js';

function response(){
  return {headers:{},code:200,body:null,setHeader(k,v){this.headers[k.toLowerCase()]=v},
    status(code){this.code=code;return this},json(body){this.body=body;return this}};
}
test('owner session issuance stays disabled',()=>{
  assert.equal(SESSION_ISSUANCE_ENABLED,false);
  assert.equal(issueSession().ok,false);
  const res=response();ownerSession({method:'GET'},res);
  assert.equal(res.code,503);
  assert.equal(res.body.ok,false);
  assert.equal(res.headers['cache-control'],'no-store');
  assert.equal(res.headers['set-cookie'],undefined);
});
test('owner session endpoint rejects mutation requests',()=>{
  for(const method of ['POST','PUT','PATCH','DELETE']){
    const res=response();ownerSession({method},res);
    assert.equal(res.code,405);
    assert.equal(res.headers['set-cookie'],undefined);
  }
});
test('opaque token helpers reject invalid or modified tokens',()=>{
  const token=makeOpaqueToken();
  assert.ok(token.length>=32);
  const digest=hashToken(token);
  assert.equal(verifyToken(token,digest),true);
  assert.equal(verifyToken(token+'x',digest),false);
  assert.equal(verifyToken(token,'invalid'),false);
  assert.equal(verifyToken('',digest),false);
});
test('session cookie requires secure httpOnly host-only settings',()=>{
  const cookie=sessionCookie(makeOpaqueToken());
  for(const part of ['__Host-sports_owner=','Path=/','Secure','HttpOnly','SameSite=Strict','Max-Age=900']){
    assert.ok(cookie.includes(part),part);
  }
  assert.throws(()=>sessionCookie(makeOpaqueToken(),{secure:false}));
});

test('forged owner claims cannot bypass the disabled owner guard',async()=>{
 const {authorizeOwnerRequest,requireOwner}=await import('../lib/owner-guard.js');
 const forged={headers:{authorization:'Bearer forged',cookie:'__Host-sports_owner=forged','x-owner-id':'owner'},user:{id:'owner'}};
 assert.equal(authorizeOwnerRequest(forged,{identityVerified:true,sessionStore:{}}).ok,false);
 let invoked=false;
 const guarded=requireOwner(async()=>{invoked=true});
 const res=response();await guarded(forged,res);
 assert.equal(invoked,false);assert.equal(res.code,401);
 assert.equal(res.headers['cache-control'],'no-store');
});
