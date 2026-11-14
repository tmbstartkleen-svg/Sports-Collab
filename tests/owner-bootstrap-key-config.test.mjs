import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,createHash} from 'node:crypto';
import {OWNER_BOOTSTRAP_KEY_CONFIG_ENABLED,inspectOwnerBootstrapKeyConfig} from '../lib/owner-bootstrap-key-config.js';
test('trusted signing key config is hard-disabled even with correctly pinned key',()=>{
 const {publicKey}=generateKeyPairSync('ed25519');
 const pem=publicKey.export({format:'pem',type:'spki'});
 const fingerprint=createHash('sha256').update(publicKey.export({format:'der',type:'spki'})).digest('hex');
 assert.equal(OWNER_BOOTSTRAP_KEY_CONFIG_ENABLED,false);
 assert.deepEqual(inspectOwnerBootstrapKeyConfig({configuredPublicKey:pem,expectedFingerprint:fingerprint}),
  {ok:false,reason:'Owner bootstrap signing key configuration disabled'});
});
test('browser-provided signing key cannot authorize bootstrap',()=>{
 const {publicKey}=generateKeyPairSync('ed25519');
 assert.equal(inspectOwnerBootstrapKeyConfig({configuredPublicKey:publicKey.export({format:'pem',type:'spki'})}).ok,false);
});
