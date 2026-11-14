import test from 'node:test';
import assert from 'node:assert/strict';
import {makeOwnerAuthenticationPipeline} from '../lib/owner-authentication-pipeline.js';
test('owner pipeline is disabled by default and does not query database',async()=>{
 let calls=0;const p=makeOwnerAuthenticationPipeline({pool:{query:async()=>{calls++;return {rowCount:1}}},expectedOrigin:'https://example.com'});
 assert.equal(p.enabled,false);assert.equal((await p.issueChallenge({ownerId:'owner'})).ok,false);
 assert.equal((await p.authenticate({ownerId:'owner'})).ok,false);
 assert.equal((await p.verifySession('token')).ok,false);assert.equal(calls,0);
});
test('owner pipeline requires secure trusted server origin',async()=>{
 const pool={query:async()=>({rowCount:1})};
 assert.equal(makeOwnerAuthenticationPipeline({pool,enabled:true,expectedOrigin:'http://example.com'}).enabled,false);
 assert.equal(makeOwnerAuthenticationPipeline({pool,enabled:true,expectedOrigin:'https://example.com'}).enabled,true);
});
test('enabled pipeline refuses invalid assertion before issuing a session',async()=>{
 const queries=[];const pool={query:async(sql)=>{queries.push(sql);return {rows:[],rowCount:0}}};
 const p=makeOwnerAuthenticationPipeline({pool,enabled:true,expectedOrigin:'https://example.com'});
 const result=await p.authenticate({ownerId:'owner',credentialId:'cred',challenge:'x'.repeat(40)});
 assert.equal(result.ok,false);assert.equal(queries.some(sql=>sql.includes('INSERT INTO council_owner_sessions')),false);
});
