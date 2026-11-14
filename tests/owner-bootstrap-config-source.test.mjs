import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,createHash} from 'node:crypto';
import {OWNER_BOOTSTRAP_CONFIG_SOURCE_ENABLED,loadTrustedBootstrapKey} from '../lib/owner-bootstrap-config-source.js';
test('server configuration source cannot enable bootstrap without activation',()=>{
 const {publicKey}=generateKeyPairSync('ed25519');
 const serverConfig={
  OWNER_BOOTSTRAP_PUBLIC_KEY:publicKey.export({format:'pem',type:'spki'}),
  OWNER_BOOTSTRAP_PUBLIC_KEY_SHA256:createHash('sha256').update(publicKey.export({format:'der',type:'spki'})).digest('hex')
 };
 assert.equal(OWNER_BOOTSTRAP_CONFIG_SOURCE_ENABLED,false);
 assert.deepEqual(loadTrustedBootstrapKey({serverConfig}),
  {ok:false,reason:'Trusted bootstrap key source disabled'});
});
test('caller objects and missing configuration cannot enable bootstrap',()=>{
 for(const serverConfig of [null,{},[],{OWNER_BOOTSTRAP_PUBLIC_KEY:'untrusted'}]){
  assert.equal(loadTrustedBootstrapKey({serverConfig}).ok,false);
 }
});
