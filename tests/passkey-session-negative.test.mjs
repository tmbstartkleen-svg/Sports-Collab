import test from 'node:test';
import assert from 'node:assert/strict';
import {makePasskeySessionCoordinator} from '../lib/passkey-session-coordinator.js';
test('session cannot issue after verification throws',async()=>{
 let calls=0;
 const coordinator=makePasskeySessionCoordinator({enabled:true,assertions:{verifyAndConsume:async()=>{throw Error('database offline')}},sessions:{createVerifiedSession:async()=>{calls++;return {ok:true,token:'token'}}}});
 assert.equal((await coordinator.authenticateAndCreateSession()).ok,false);assert.equal(calls,0);
});
test('verified assertion without credential identity cannot issue session',async()=>{
 let calls=0;
 const coordinator=makePasskeySessionCoordinator({enabled:true,assertions:{verifyAndConsume:async()=>({ok:true,ownerId:'owner'})},sessions:{createVerifiedSession:async()=>{calls++;return {ok:true,token:'token'}}}});
 assert.equal((await coordinator.authenticateAndCreateSession()).ok,false);assert.equal(calls,0);
});
test('session persistence failure does not return token',async()=>{
 const coordinator=makePasskeySessionCoordinator({enabled:true,assertions:{verifyAndConsume:async()=>({ok:true,ownerId:'owner',credentialId:'cred'})},sessions:{createVerifiedSession:async()=>({ok:false,error:'database unavailable'})}});
 const result=await coordinator.authenticateAndCreateSession();assert.equal(result.ok,false);assert.equal(result.token,undefined);
});
