import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyOwnerRegistration} from '../lib/webauthn-registration-adapter.js';
import {WEBAUTHN_VERIFICATION_ENABLED} from '../lib/webauthn-verifier-gate.js';
import {OWNER_ENROLLMENT_ENABLED} from '../lib/passkey-owner-enrollment.js';
test('registration cannot call verifier or persist without independent activation',async()=>{
 assert.equal(WEBAUTHN_VERIFICATION_ENABLED,false);
 assert.equal(OWNER_ENROLLMENT_ENABLED,false);
 let called=0;
 const verifier={async verifyRegistrationResponse(){called++;return {verified:true,registrationInfo:{credential:{id:'YQ',publicKey:new Uint8Array([1]),counter:0}}}}};
 for(const response of [{id:'YQ',rawId:'YQ',type:'public-key'},{id:'YQ',rawId:'Yg',type:'public-key'},{id:'YQ',rawId:'YQ',type:'invalid'}]){
  const result=await verifyOwnerRegistration({verifier,response,expectedChallenge:'challenge',expectedOrigin:'https://example.com',expectedRPID:'example.com',ownerId:'owner',configuredOwnerId:'owner',bootstrapVerified:true});
  assert.equal(result.ok,false);
 }
 assert.equal(called,0);
});
