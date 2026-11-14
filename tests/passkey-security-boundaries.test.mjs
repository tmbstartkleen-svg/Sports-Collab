import test from 'node:test';
import assert from 'node:assert/strict';
import {PASSKEY_AUTH_ENABLED,beginPasskeyAuthentication,finishPasskeyAuthentication} from '../lib/passkey-ceremony.js';
import {WEBAUTHN_VERIFICATION_ENABLED} from '../lib/webauthn-verifier-gate.js';
import {OWNER_ENROLLMENT_ENABLED} from '../lib/passkey-owner-enrollment.js';
import {SESSION_ISSUANCE_ENABLED,issueSession} from '../lib/owner-session.js';
import {authorizeOwnerRequest} from '../lib/owner-guard.js';
test('all activation gates remain disabled simultaneously',()=>{
 assert.equal(PASSKEY_AUTH_ENABLED,false);
 assert.equal(WEBAUTHN_VERIFICATION_ENABLED,false);
 assert.equal(OWNER_ENROLLMENT_ENABLED,false);
 assert.equal(SESSION_ISSUANCE_ENABLED,false);
});
test('no challenge or forged identity can authorize owner session',()=>{
 assert.equal(beginPasskeyAuthentication({}).status,503);
 assert.equal(finishPasskeyAuthentication({}).status,503);
 assert.equal(issueSession().ok,false);
 for(const req of [{headers:{authorization:'Bearer forged'}},{headers:{cookie:'__Host-sports_owner=forged'}},{}]){
  assert.equal(authorizeOwnerRequest(req,{identityVerified:true,sessionStore:{}}).ok,false);
 }
});
