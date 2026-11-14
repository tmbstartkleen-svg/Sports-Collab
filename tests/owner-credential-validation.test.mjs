import test from 'node:test';
import assert from 'node:assert/strict';
import {validStoredOwnerCredential} from '../lib/owner-assertion-transaction.js';
const context={ownerId:'owner',credentialId:'credential'};
const good={owner_id:'owner',credential_id:'credential',sign_count:'12',public_key:Buffer.from([1,2,3]),transports:[]};
test('valid stored owner credential permits byte keys and safe counters',()=>{
 assert.equal(validStoredOwnerCredential(good,context),true);
});
test('stored credential validation rejects malformed or substituted database fields',()=>{
 for(const bad of [
  {...good,owner_id:'attacker'}, {...good,credential_id:'other'},
  {...good,sign_count:''},{...good,sign_count:null},
  {...good,sign_count:-1},{...good,sign_count:'9007199254740993'},
  {...good,sign_count:'1e2'},{...good,sign_count:'0x10'},
  {...good,sign_count:'01'},{...good,sign_count:' 12 '},
  {...good,public_key:'fake'}, {...good,public_key:Buffer.alloc(0)},
  {...good,transports:null},{...good,transports:['internal',1]}
 ])assert.equal(validStoredOwnerCredential(bad,context),false);
});
