import test from 'node:test';
import assert from 'node:assert/strict';
import {makeOwnerSessionStore} from '../lib/owner-session-store.js';

test('malformed owner session tokens are rejected without database queries',async()=>{
 let queries=0;
 const store=makeOwnerSessionStore({enabled:true,pool:{query:async()=>{queries++;throw Error('must not query')}}});
 for(const token of [null,undefined,0,{},'', 'x'.repeat(4097)]){
  assert.deepEqual(await store.verifySession(token),{ok:false});
  assert.equal(await store.revokeSession(token),false);
 }
 assert.equal(queries,0);
});
