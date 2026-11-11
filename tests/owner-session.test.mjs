import test from 'node:test';
import assert from 'node:assert/strict';
import {makeOpaqueToken,hashToken,verifyToken,sessionCookie,issueSession,SESSION_ISSUANCE_ENABLED} from '../lib/owner-session.js';
test('session issuance is disabled',()=>{assert.equal(SESSION_ISSUANCE_ENABLED,false);assert.equal(issueSession().ok,false)});
test('tokens are random and hash verifiable',()=>{const a=makeOpaqueToken(),b=makeOpaqueToken();assert.notEqual(a,b);assert.ok(verifyToken(a,hashToken(a)));assert.equal(verifyToken(b,hashToken(a)),false)});
test('cookie is secure httpOnly sameSite',()=>{const c=sessionCookie(makeOpaqueToken());assert.match(c,/Secure; HttpOnly; SameSite=Strict/);assert.match(c,/__Host-sports_owner=/)});
test('insecure cookie is refused',()=>assert.throws(()=>sessionCookie(makeOpaqueToken(),{secure:false})));
