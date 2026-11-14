import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectOwnerSecurity} from '../lib/owner-security-readiness.js';
test('security readiness never enables passkeys by itself',()=>{
 const empty=inspectOwnerSecurity();assert.equal(empty.activationAllowed,false);assert.equal(empty.implementedControls,0);assert.ok(empty.totalControls>0);
 const controls=Object.fromEntries(empty.missing.map(x=>[x,true]));
 const all=inspectOwnerSecurity({controls,ownerApproved:true});assert.equal(all.missing.length,0);assert.equal(all.activationAllowed,false);
});
