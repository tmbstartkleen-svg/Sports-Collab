import test from 'node:test';
import assert from 'node:assert/strict';
import {loadSimpleWebAuthnVerifier} from '../lib/simplewebauthn-provider.js';
test('vetted WebAuthn provider stays unloaded while disabled',async()=>{
 assert.deepEqual(await loadSimpleWebAuthnVerifier(),{ok:false,reason:'WebAuthn verification disabled'});
});
