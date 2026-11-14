import test from 'node:test';
import assert from 'node:assert/strict';
import {validatePasskeyConfig} from '../lib/passkey-config.js';
const base={origin:'https://sports-collab.vercel.app',rpId:'sports-collab.vercel.app',ownerId:'verified-owner',storeConfigured:true,verifierConfigured:true};
test('passkey readiness rejects missing trust dependencies',()=>{
  assert.equal(validatePasskeyConfig({}).ready,false);
  for(const key of ['ownerId','storeConfigured','verifierConfigured']){
    assert.equal(validatePasskeyConfig({...base,[key]:key==='ownerId'?'':false}).ready,false,key);
  }
});
test('passkey readiness enforces exact HTTPS RP origin',()=>{
  assert.equal(validatePasskeyConfig(base).ready,true);
  for(const [origin,rpId] of [
    ['http://sports-collab.vercel.app','sports-collab.vercel.app'],
    ['https://sports-collab.vercel.app','vercel.app'],
    ['https://evil.example','sports-collab.vercel.app'],
    ['https://sports-collab.vercel.app/path','sports-collab.vercel.app']
  ]) assert.equal(validatePasskeyConfig({...base,origin,rpId}).ready,false,origin);
});
