import test from 'node:test';
import assert from 'node:assert/strict';
import {validStoredOwnerCredential} from '../lib/owner-assertion-transaction.js';
const ownerId='owner-A',credentialId='Y3JlZGVudGlhbC1B';
const valid=()=>({owner_id:ownerId,credential_id:credentialId,public_key:Buffer.from([1,2,3]),sign_count:0,transports:['internal']});
test('stored owner credentials require correct owner, key, counter, and supported transports',()=>{
 assert.equal(validStoredOwnerCredential(valid(),{ownerId,credentialId}),true);
 for(const patch of [
  {owner_id:'other'},{credential_id:'other'},{public_key:new Uint8Array()},
  {sign_count:-1},{sign_count:'1.1'},{sign_count:'9007199254740992'},
  {transports:['unsupported']},{transports:'internal'}
 ])assert.equal(validStoredOwnerCredential({...valid(),...patch},{ownerId,credentialId}),false);
});
