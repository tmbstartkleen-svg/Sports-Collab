import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluatePasskeyActivation,REQUIRED_CONTROLS} from '../lib/passkey-activation.js';
test('missing safeguards prevent activation',()=>{const result=evaluatePasskeyActivation({verifiedOwnerBootstrap:true});assert.equal(result.ready,false);assert.ok(result.missing.includes('signatureVerification'))});
test('checkbox completion cannot activate login',()=>{const flags=Object.fromEntries(REQUIRED_CONTROLS.map(k=>[k,true]));assert.equal(evaluatePasskeyActivation(flags).ready,false)});
