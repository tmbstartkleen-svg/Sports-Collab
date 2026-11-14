import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,sign} from 'node:crypto';
import {OWNER_BOOTSTRAP_AUTHORIZATION_ENABLED,authorizeOwnerBootstrap} from '../lib/owner-bootstrap-authorization.js';
test('even signed owner proof cannot invoke nonce redemption while bootstrap disabled',async()=>{
 const {publicKey,privateKey}=generateKeyPairSync('ed25519');
 const now=Date.now();
 const payload=JSON.stringify({purpose:'sports-collab-owner-passkey-bootstrap',ownerId:'owner',
  issuedAt:now,expiresAt:now+60000,nonce:'a'.repeat(32)});
 const signature=sign(null,Buffer.from(payload),privateKey).toString('base64url');
 let redemptions=0;
 const nonceStore={async redeem(){redemptions++;return true}};
 assert.equal(OWNER_BOOTSTRAP_AUTHORIZATION_ENABLED,false);
 assert.deepEqual(await authorizeOwnerBootstrap({
  ownerId:'owner',proof:{payload,signature},publicKey,nonceStore,now
 }),{ok:false,reason:'Owner bootstrap authorization disabled'});
 assert.equal(redemptions,0);
});
test('untrusted bootstrap flag cannot redeem a nonce',async()=>{
 let calls=0;
 const result=await authorizeOwnerBootstrap({ownerId:'owner',proof:{bootstrapVerified:true},
  nonceStore:{async redeem(){calls++;return true}}});
 assert.equal(result.ok,false);
 assert.equal(calls,0);
});
