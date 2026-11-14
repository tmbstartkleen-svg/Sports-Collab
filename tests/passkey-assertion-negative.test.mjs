import test from 'node:test';
import assert from 'node:assert/strict';
import {makeVerifiedAssertionCoordinator} from '../lib/passkey-assertion-coordinator.js';
test('disabled assertion coordinator does not query credential storage',async()=>{
 let calls=0;const c=makeVerifiedAssertionCoordinator({credentials:{getActiveCredential:async()=>{calls++;return {}}},challenges:{consume:async()=>true}});
 assert.equal((await c.verifyAndConsume({credentialId:'cred',ownerId:'owner',challenge:'x'.repeat(40)})).ok,false);assert.equal(calls,0);
});
test('unknown or mismatched credential denies before consuming challenge',async()=>{
 let consumed=0;const c=makeVerifiedAssertionCoordinator({enabled:true,credentials:{getActiveCredential:async()=>({owner_id:'someone-else',sign_count:0})},challenges:{consume:async()=>{consumed++;return true}}});
 assert.equal((await c.verifyAndConsume({credentialId:'cred',ownerId:'owner',challenge:'x'.repeat(40)})).ok,false);assert.equal(consumed,0);
});
test('invalid database sign counter denies before challenge consumption',async()=>{
 let consumed=0;const c=makeVerifiedAssertionCoordinator({enabled:true,credentials:{getActiveCredential:async()=>({owner_id:'owner',sign_count:'9007199254740993'})},challenges:{consume:async()=>{consumed++;return true}}});
 assert.equal((await c.verifyAndConsume({credentialId:'cred',ownerId:'owner',challenge:'x'.repeat(40)})).ok,false);assert.equal(consumed,0);
});
