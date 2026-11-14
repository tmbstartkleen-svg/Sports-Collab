import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {makeVerifiedAssertionCoordinator} from '../lib/passkey-assertion-coordinator.js';
const origin='https://sports-collab.vercel.app',challenge='a'.repeat(43);
const {privateKey,publicKey}=generateKeyPairSync('ec',{namedCurve:'prime256v1'});
const public_key=publicKey.export({type:'spki',format:'der'});
function signedAssertion(){
 const clientDataJSON=Buffer.from(JSON.stringify({type:'webauthn.get',challenge,origin}));
 const authenticatorData=Buffer.alloc(37);
 createHash('sha256').update('sports-collab.vercel.app').digest().copy(authenticatorData);
 authenticatorData[32]=5;authenticatorData.writeUInt32BE(1,33);
 const signature=sign('sha256',Buffer.concat([authenticatorData,createHash('sha256').update(clientDataJSON).digest()]),privateKey);
 return {credentialId:'cred',ownerId:'owner',challenge,expectedOrigin:origin,clientDataJSON,authenticatorData,signature};
}
test('coordinator fails closed unless explicitly enabled',async()=>{
 const result=await makeVerifiedAssertionCoordinator().verifyAndConsume(signedAssertion());
 assert.equal(result.ok,false);
});
test('signed assertion consumes challenge once and advances credential counter',async()=>{
 let consumed=false,count=0;
 const credentials={
  async getActiveCredential(){return {owner_id:'owner',public_key,sign_count:count}},
  async recordVerifiedAssertion({previousSignCount,nextSignCount}){if(count!==previousSignCount)return false;count=nextSignCount;return true}
 };
 const challenges={async consume(){if(consumed)return false;consumed=true;return true}};
 const coordinator=makeVerifiedAssertionCoordinator({enabled:true,credentials,challenges});
 assert.equal((await coordinator.verifyAndConsume(signedAssertion())).ok,true);
 assert.equal(count,1);
 assert.equal((await coordinator.verifyAndConsume(signedAssertion())).ok,false);
});
test('wrong owner and tampered signature cannot consume challenge',async()=>{
 let consumed=0;
 const credentials={async getActiveCredential(){return {owner_id:'owner',public_key,sign_count:0}},async recordVerifiedAssertion(){return true}};
 const challenges={async consume(){consumed++;return true}};
 const coordinator=makeVerifiedAssertionCoordinator({enabled:true,credentials,challenges});
 assert.equal((await coordinator.verifyAndConsume({...signedAssertion(),ownerId:'other'})).ok,false);
 const tampered=signedAssertion();tampered.signature=Buffer.alloc(64);
 assert.equal((await coordinator.verifyAndConsume(tampered)).ok,false);
 assert.equal(consumed,0);
});
