import test from 'node:test';
import assert from 'node:assert/strict';
import {makePasskeySessionStore} from '../lib/passkey-session-store.js';
const token='x'.repeat(43);
test('session validation defaults off and never queries database',async()=>{
 let calls=0;const store=makePasskeySessionStore({pool:{query:async()=>{calls++}}});
 assert.equal(await store.validate({token,ownerId:'owner'}),false);
 assert.equal(calls,0);
});
test('session validation checks hashed token, owner, revocation and expiry',async()=>{
 let query='',args=[];
 const store=makePasskeySessionStore({enabled:true,pool:{query:async(s,a)=>{query=s;args=a;return {rowCount:1}}}});
 assert.equal(await store.validate({token,ownerId:'owner'}),true);
 assert.match(query,/passkey_auth\.sessions/);
 assert.match(query,/owner_id=\$2/);
 assert.match(query,/revoked_at IS NULL/);
 assert.match(query,/expires_at>now\(\)/);
 assert.match(args[0],/^[a-f0-9]{64}$/);
 assert.notEqual(args[0],token);
 assert.equal(args[1],'owner');
});
test('invalid owner, token, missing row and database error fail closed',async()=>{
 let calls=0;
 const store=makePasskeySessionStore({enabled:true,pool:{query:async()=>{calls++;return {rowCount:0}}}});
 assert.equal(await store.validate({token,ownerId:''}),false);
 assert.equal(await store.validate({token:'short',ownerId:'owner'}),false);
 assert.equal(calls,0);
 assert.equal(await store.validate({token,ownerId:'owner'}),false);
 const broken=makePasskeySessionStore({enabled:true,pool:{query:async()=>{throw Error('offline')}}});
 assert.equal(await broken.validate({token,ownerId:'owner'}),false);
});
