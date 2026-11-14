import test from 'node:test';
import assert from 'node:assert/strict';
import {issueOwnerBootstrapNonce,OWNER_BOOTSTRAP_NONCE_ISSUANCE_ENABLED} from '../lib/owner-bootstrap-nonce-issuance.js';
test('bootstrap nonce issuance is disabled despite valid owner context',async()=>{
 let calls=0;
 const pool={async query(){calls++;return {rowCount:1}}};
 assert.equal(OWNER_BOOTSTRAP_NONCE_ISSUANCE_ENABLED,false);
 const result=await issueOwnerBootstrapNonce({ownerId:'owner',configuredOwnerId:'owner',pool});
 assert.deepEqual(result,{ok:false,reason:'Owner bootstrap nonce issuance disabled'});
 assert.equal(calls,0);
});
test('unverified owner cannot issue nonce or reach database',async()=>{
 let calls=0;
 const result=await issueOwnerBootstrapNonce({ownerId:'intruder',configuredOwnerId:'owner',
  pool:{async query(){calls++;return {rowCount:1}}}});
 assert.equal(result.ok,false);
 assert.equal(calls,0);
});
