import test from 'node:test';
import assert from 'node:assert/strict';
import {makeOwnerSessionStore,OWNER_SESSION_SCHEMA_SQL} from '../lib/owner-session-store.js';
test('owner session store defaults to disabled and never queries database',async()=>{
 let queries=0;const store=makeOwnerSessionStore({pool:{query:async()=>{queries++}}});
 assert.equal((await store.createVerifiedSession({verifiedOwnerId:'owner',credentialId:'cred'})).ok,false);
 assert.equal((await store.verifySession('x')).ok,false);
 assert.equal(await store.revokeSession('x'),false);
 assert.equal(queries,0);
});
test('session creation requires verified owner identity and credential',async()=>{
 let queries=0;const store=makeOwnerSessionStore({enabled:true,pool:{query:async()=>{queries++}}});
 assert.equal((await store.createVerifiedSession({verifiedOwnerId:'owner'})).ok,false);
 assert.equal(queries,0);
});
test('verified session can be created, validated, and revoked with hashed token only',async()=>{
 let hash,owner='owner-1',expiresAt;const seen=[];
 const pool={async query(sql,args){
  seen.push({sql,args});
  if(sql.startsWith('INSERT')){[hash,, ,expiresAt]=args;return {rowCount:1}};
  if(sql.startsWith('SELECT'))return {rows:args[0]===hash?[{owner_id:owner,expires_at:expiresAt}]:[]};
  if(sql.startsWith('DELETE'))return {rowCount:args[0]===hash?1:0};
  throw Error('unexpected SQL');
 }};
 const store=makeOwnerSessionStore({pool,enabled:true,clock:()=>Date.UTC(2026,10,14)});
 const created=await store.createVerifiedSession({verifiedOwnerId:owner,credentialId:'cred-1'});
 assert.equal(created.ok,true);
 assert.ok(created.token.length>=32);
 assert.equal((await store.verifySession(created.token)).ownerId,owner);
 assert.equal(await store.revokeSession(created.token),true);
 assert.ok(seen.every(({args})=>!args.includes(created.token)));
 assert.match(OWNER_SESSION_SCHEMA_SQL,/token_hash CHAR\(64\) PRIMARY KEY/);
});

test('invalid session clock fails closed before querying database',async()=>{
 let calls=0;
 const store=makeOwnerSessionStore({enabled:true,clock:()=>NaN,pool:{query:async()=>{calls++}}});
 const result=await store.createVerifiedSession({verifiedOwnerId:'owner',credentialId:'credential'});
 assert.equal(result.ok,false);
 assert.equal(calls,0);
});

test('session verification requires an active credential joined to its owner',async()=>{
 const sql=[];
 const store=makeOwnerSessionStore({enabled:true,pool:{async query(query){sql.push(query);return {rows:[]}}}});
 assert.equal((await store.verifySession('x'.repeat(40))).ok,false);
 assert.equal(sql.length,1);
 assert.match(sql[0],/JOIN council_owner_credentials/);
 assert.match(sql[0],/c\.revoked_at IS NULL/);
 assert.match(sql[0],/c\.owner_id=s\.owner_id/);
});
