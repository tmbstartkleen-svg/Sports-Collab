import test from 'node:test';
import assert from 'node:assert/strict';
import {makePasskeySessionCoordinator} from '../lib/passkey-session-coordinator.js';
test('passkey session bridge defaults disabled',async()=>{
 let called=false;
 const c=makePasskeySessionCoordinator({assertions:{verifyAndConsume:async()=>{called=true;return {ok:true,ownerId:'owner',credentialId:'cred'}}},sessions:{createVerifiedSession:async()=>({ok:true,token:'token'})}});
 assert.equal((await c.authenticateAndCreateSession({})).ok,false);assert.equal(called,false);
});
test('passkey session bridge issues only after verified assertion',async()=>{
 let created=0;
 const sessions={createVerifiedSession:async({verifiedOwnerId,credentialId})=>{created++;assert.equal(verifiedOwnerId,'owner');assert.equal(credentialId,'cred');return {ok:true,token:'opaque',expiresAt:'future'}}};
 const denied=makePasskeySessionCoordinator({enabled:true,assertions:{verifyAndConsume:async()=>({ok:false})},sessions});
 assert.equal((await denied.authenticateAndCreateSession()).ok,false);assert.equal(created,0);
 const approved=makePasskeySessionCoordinator({enabled:true,assertions:{verifyAndConsume:async()=>({ok:true,ownerId:'owner',credentialId:'cred'})},sessions});
 assert.equal((await approved.authenticateAndCreateSession()).token,'opaque');assert.equal(created,1);
});
