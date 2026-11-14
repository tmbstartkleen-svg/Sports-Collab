import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,sign} from 'node:crypto';
import {OWNER_BOOTSTRAP_ENABLED,verifyOwnerBootstrapProof} from '../lib/owner-bootstrap-proof.js';
test('owner bootstrap stays disabled even with correctly signed owner evidence',()=>{
 const {publicKey,privateKey}=generateKeyPairSync('ed25519');
 const now=Date.now();
 const payload=JSON.stringify({purpose:'sports-collab-owner-passkey-bootstrap',
  ownerId:'owner',issuedAt:now,expiresAt:now+60000,nonce:'a'.repeat(32)});
 const signature=sign(null,Buffer.from(payload),privateKey).toString('base64url');
 assert.equal(OWNER_BOOTSTRAP_ENABLED,false);
 assert.deepEqual(verifyOwnerBootstrapProof({ownerId:'owner',proof:{payload,signature},publicKey,now}),
  {ok:false,reason:'Owner bootstrap disabled'});
});
test('caller-supplied bootstrap flags and unsigned objects cannot enable enrollment',()=>{
 assert.equal(verifyOwnerBootstrapProof({ownerId:'owner',proof:{bootstrapVerified:true}}).ok,false);
 assert.equal(verifyOwnerBootstrapProof({ownerId:'owner',proof:{payload:'{}',signature:''}}).ok,false);
});
