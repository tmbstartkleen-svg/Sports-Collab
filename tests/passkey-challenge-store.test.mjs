import test from 'node:test';
import assert from 'node:assert/strict';
import {makePasskeyChallengeStore,PASSKEY_CHALLENGE_SCHEMA_SQL} from '../lib/passkey-challenge-store.js';
test('challenge store defaults disabled without database calls',async()=>{
 let count=0;const store=makePasskeyChallengeStore({pool:{query:async()=>{count++}}});
 assert.equal((await store.issue({ownerId:'owner',purpose:'authentication'})).ok,false);
 assert.equal(await store.consume({ownerId:'owner',purpose:'authentication',challenge:'x'.repeat(40)}),false);
 assert.equal(count,0);
});
test('challenge can be consumed only once and for correct owner and purpose',async()=>{
 const rows=new Map();
 const pool={async query(sql,args){
  if(sql.startsWith('INSERT')){rows.set(args[0],{owner:args[1],purpose:args[2],used:false});return {rowCount:1}};
  if(sql.startsWith('UPDATE')){const row=rows.get(args[0]);if(!row||row.owner!==args[1]||row.purpose!==args[2]||row.used)return {rowCount:0};row.used=true;return {rowCount:1}};
  throw Error('Unexpected query');
 }};
 const store=makePasskeyChallengeStore({pool,enabled:true});
 const result=await store.issue({ownerId:'owner',purpose:'authentication'});
 assert.equal(result.ok,true);
 assert.equal(await store.consume({ownerId:'intruder',purpose:'authentication',challenge:result.challenge}),false);
 assert.equal(await store.consume({ownerId:'owner',purpose:'registration',challenge:result.challenge}),false);
 assert.equal(await store.consume({ownerId:'owner',purpose:'authentication',challenge:result.challenge}),true);
 assert.equal(await store.consume({ownerId:'owner',purpose:'authentication',challenge:result.challenge}),false);
 assert.match(PASSKEY_CHALLENGE_SCHEMA_SQL,/consumed_at TIMESTAMPTZ/);
});
test('invalid purpose and clock fail closed',async()=>{
 let calls=0;const store=makePasskeyChallengeStore({pool:{query:async()=>{calls++}},enabled:true,clock:()=>NaN});
 assert.equal((await store.issue({ownerId:'owner',purpose:'authentication'})).ok,false);
 assert.equal((await store.issue({ownerId:'owner',purpose:'unknown'})).ok,false);
 assert.equal(calls,0);
});

test('concurrent challenge consumption permits exactly one winner',async()=>{
 const rows=new Map();
 const pool={async query(sql,args){
  if(sql.startsWith('INSERT')){
   rows.set(args[0],{owner:args[1],purpose:args[2],used:false});
   return {rowCount:1};
  }
  if(sql.startsWith('UPDATE')){
   // Simulates PostgreSQL atomic UPDATE ... WHERE consumed_at IS NULL.
   const row=rows.get(args[0]);
   if(!row||row.owner!==args[1]||row.purpose!==args[2]||row.used)return {rowCount:0};
   row.used=true;
   await Promise.resolve();
   return {rowCount:1};
  }
  throw Error('Unexpected query');
 }};
 const store=makePasskeyChallengeStore({pool,enabled:true});
 const issued=await store.issue({ownerId:'owner',purpose:'authentication'});
 assert.equal(issued.ok,true);
 const results=await Promise.all(Array.from({length:20},()=>store.consume({
  ownerId:'owner',purpose:'authentication',challenge:issued.challenge
 })));
 assert.equal(results.filter(Boolean).length,1);
});

test('authentication-specific consume rejects unknown and replayed challenges',async()=>{
 const hashes=new Map();
 const pool={async query(sql,args){
  if(sql.startsWith('INSERT')){hashes.set(args[0],{owner:args[1],purpose:args[2],used:false});return {rowCount:1}};
  if(sql.startsWith('UPDATE')){
   const row=hashes.get(args[0]);
   if(!row||row.used||row.owner!==args[1]||row.purpose!==args[2])return {rowCount:0};
   row.used=true;return {rowCount:1};
  }
  throw Error('Unexpected query');
 }};
 const store=makePasskeyChallengeStore({enabled:true,pool});
 const issued=await store.issue({ownerId:'owner',purpose:'authentication'});
 assert.equal(await store.consumeAuthentication({ownerId:'owner',challenge:'X'.repeat(43)}),false);
 assert.equal(await store.consumeAuthentication({ownerId:'other',challenge:issued.challenge}),false);
 assert.equal(await store.consumeAuthentication({ownerId:'owner',challenge:issued.challenge}),true);
 assert.equal(await store.consumeAuthentication({ownerId:'owner',challenge:issued.challenge}),false);
});

test('authentication challenge consumer works when method is detached',async()=>{
 const rows=new Map();
 const pool={async query(sql,args){
  if(sql.startsWith('INSERT')){rows.set(args[0],{owner:args[1],used:false});return {rowCount:1}};
  if(sql.startsWith('UPDATE')){
   const row=rows.get(args[0]);
   if(!row||row.owner!==args[1]||row.used||args[2]!=='authentication')return {rowCount:0};
   row.used=true;return {rowCount:1};
  }
  throw Error('Unexpected query');
 }};
 const store=makePasskeyChallengeStore({enabled:true,pool});
 const issued=await store.issue({ownerId:'owner',purpose:'authentication'});
 const {consumeAuthentication}=store;
 assert.equal(await consumeAuthentication({ownerId:'owner',challenge:issued.challenge}),true);
 assert.equal(await consumeAuthentication({ownerId:'owner',challenge:issued.challenge}),false);
});

test('malformed challenge encodings fail before database access',async()=>{
 let calls=0;
 const store=makePasskeyChallengeStore({enabled:true,pool:{query:async()=>{calls++;return {rowCount:1}}}});
 for(const challenge of ['','short','a'.repeat(42),'a'.repeat(44),'a'.repeat(42)+'=','a'.repeat(42)+'+','a'.repeat(42)+'/','a'.repeat(43)+'\\n']){
  assert.equal(await store.consumeAuthentication({ownerId:'owner',challenge}),false,challenge);
 }
 assert.equal(calls,0);
});
