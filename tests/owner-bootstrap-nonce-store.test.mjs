import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {makeOwnerBootstrapNonceStore,OWNER_BOOTSTRAP_NONCE_SCHEMA_SQL} from '../lib/owner-bootstrap-nonce-store.js';
test('bootstrap nonce store disabled by default',async()=>{
 let calls=0;
 const store=makeOwnerBootstrapNonceStore({pool:{query:async()=>{calls++}}});
 assert.equal(await store.redeem({ownerId:'owner',nonce:'a'.repeat(32)}),false);
 assert.equal(calls,0);
});
test('nonce redemption is owner-bound, single-use, and atomic',async()=>{
 const nonce='a'.repeat(32),hash=createHash('sha256').update(nonce).digest('hex');
 let used=false;
 const pool={async query(sql,args){
  assert.match(sql,/redeemed_at IS NULL/);
  assert.match(sql,/expires_at>now\(\)/);
  if(args[0]!==hash||args[1]!=='owner'||used)return {rowCount:0};
  used=true;await Promise.resolve();return {rowCount:1};
 }};
 const store=makeOwnerBootstrapNonceStore({enabled:true,pool});
 assert.equal(await store.redeem({ownerId:'intruder',nonce}),false);
 const results=await Promise.all(Array.from({length:20},()=>store.redeem({ownerId:'owner',nonce})));
 assert.equal(results.filter(Boolean).length,1);
 assert.equal(await store.redeem({ownerId:'owner',nonce}),false);
 assert.match(OWNER_BOOTSTRAP_NONCE_SCHEMA_SQL,/REVOKE ALL/);
});
test('invalid nonces never reach database',async()=>{
 let calls=0;
 const store=makeOwnerBootstrapNonceStore({enabled:true,pool:{query:async()=>{calls++;return {rowCount:1}}}});
 for(const nonce of ['', 'a'.repeat(31),'z'.repeat(32),'a'.repeat(129)]){
  assert.equal(await store.redeem({ownerId:'owner',nonce}),false);
 }
 assert.equal(calls,0);
});
