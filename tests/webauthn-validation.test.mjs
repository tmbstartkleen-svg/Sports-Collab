import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRpOrigin,validateWebAuthnClientData,assertNoPublicEnrollment} from '../lib/webauthn-validation.js';
const origin='https://sports-collab.vercel.app/';
const challenge='x'.repeat(43);
test('accept only HTTPS RP origins without path or credentials',()=>{
 assert.deepEqual(normalizeRpOrigin(origin),{origin:'https://sports-collab.vercel.app',rpId:'sports-collab.vercel.app'});
 for(const s of ['http://sports-collab.vercel.app/','https://user:pass@sports-collab.vercel.app/','https://sports-collab.vercel.app/foo','https://localhost/'])assert.equal(normalizeRpOrigin(s),null);
});
test('reject wrong origin, challenge, type, cross-origin',()=>{
 const data={type:'webauthn.get',challenge,origin:'https://sports-collab.vercel.app',crossOrigin:false};
 const check=clientData=>validateWebAuthnClientData({clientData,expectedType:'webauthn.get',expectedChallenge:challenge,expectedOrigin:origin});
 assert.equal(check(data),true);
 assert.equal(check({...data,challenge:'wrong'}),false);
 assert.equal(check({...data,origin:'https://attacker.example'}),false);
 assert.equal(check({...data,crossOrigin:true}),false);
 assert.equal(check({...data,type:'webauthn.create'}),false);
});
test('public enrollment still fails closed',()=>assert.equal(assertNoPublicEnrollment().ok,false));
