import test from 'node:test';
import assert from 'node:assert/strict';
import {makePasskeyChallengeStore} from '../lib/passkey-challenge-store.js';
test('disabled challenge store never accesses database',async()=>{
 let calls=0;const store=makePasskeyChallengeStore({pool:{query:async()=>{calls++;return {rowCount:1}}}});
 assert.equal((await store.issue({ownerId:'owner',purpose:'authentication'})).ok,false);
 assert.equal(await store.consume({ownerId:'owner',purpose:'authentication',challenge:'x'.repeat(40)}),false);
 assert.equal(calls,0);
});
test('challenge issuance fails closed on persistence error',async()=>{
 const store=makePasskeyChallengeStore({enabled:true,pool:{query:async()=>{throw Error('offline')}}});
 const result=await store.issue({ownerId:'owner',purpose:'authentication'});
 assert.equal(result.ok,false);assert.equal(result.challenge,undefined);
});
test('challenge consumption is bound to owner and purpose',async()=>{
 let sql='',args=[];const store=makePasskeyChallengeStore({enabled:true,pool:{query:async(s,a)=>{sql=s;args=a;return {rowCount:0}}}});
 assert.equal(await store.consume({ownerId:'owner',purpose:'authentication',challenge:'x'.repeat(40)}),false);
 assert.match(sql,/owner_id=\$2/);assert.match(sql,/ceremony=\$3/);assert.match(sql,/consumed_at IS NULL/);assert.match(sql,/expires_at>now\(\)/);
 assert.equal(args[1],'owner');assert.equal(args[2],'authentication');
});
test('invalid challenge purpose is rejected without database access',async()=>{
 let calls=0;const store=makePasskeyChallengeStore({enabled:true,pool:{query:async()=>{calls++;return {rowCount:1}}}});
 assert.equal((await store.issue({ownerId:'owner',purpose:'admin'})).ok,false);
 assert.equal(await store.consume({ownerId:'owner',purpose:'admin',challenge:'x'.repeat(40)}),false);
 assert.equal(calls,0);
});
