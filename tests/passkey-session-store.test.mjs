import test from 'node:test';
import assert from 'node:assert/strict';
import {makePasskeySessionStore} from '../lib/passkey-session-store.js';
test('session store disabled by default and makes no database calls',async()=>{
 let calls=0;const store=makePasskeySessionStore({pool:{query:async()=>{calls++}}});
 assert.deepEqual(await store.create({ownerId:'owner',verified:true}),{ok:false});
 assert.equal(await store.revoke({token:'a'.repeat(43)}),false);
 assert.equal(calls,0);
});
test('unverified identity never issues a session',async()=>{
 let calls=0;const store=makePasskeySessionStore({enabled:true,pool:{query:async()=>{calls++}}});
 assert.deepEqual(await store.create({ownerId:'owner',verified:false}),{ok:false});
 assert.equal(calls,0);
});
test('verified session stores only hashed token and short expiry',async()=>{
 const queries=[];
 const store=makePasskeySessionStore({enabled:true,clock:()=>1000000,pool:{query:async(sql,args)=>{queries.push({sql,args});return {rowCount:1}}}});
 const issued=await store.create({ownerId:'owner',verified:true});
 assert.equal(issued.ok,true);
 assert.equal(issued.token.length>=40,true);
 assert.match(queries[0].sql,/INSERT INTO passkey_auth\.sessions/);
 assert.notEqual(queries[0].args[0],issued.token);
 assert.match(queries[0].args[0],/^[a-f0-9]{64}$/);
 assert.equal(queries[0].args[2].getTime(),1000000+900000);
 assert.equal(await store.revoke({token:issued.token}),true);
 assert.match(queries[1].sql,/revoked_at IS NULL/);
});
