import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectOwnerStorageSchemas,OWNER_STORAGE_SCHEMAS} from '../lib/owner-storage-schema.js';
test('owner security and budget schema bundle is review-only',()=>{
 const state=inspectOwnerStorageSchemas();assert.equal(state.readyForReview,true);assert.equal(state.migrationExecuted,false);assert.deepEqual(state.schemas,['credentials','challenges','sessions','budget']);
 assert.equal(OWNER_STORAGE_SCHEMAS.length,4);
});
