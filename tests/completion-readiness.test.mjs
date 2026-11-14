import test from 'node:test';
import assert from 'node:assert/strict';
import {completionReadiness} from '../lib/completion-readiness.js';
test('completion readiness is fail closed and has four milestones',()=>{
 const r=completionReadiness();assert.equal(r.remaining,4);assert.equal(r.launchReady,false);assert.equal(r.stages.length,4);
});
test('all required gates must be independently verified',()=>{
 const gates={ownerAuthentication:true,passkeyAuthentication:true,providerConnections:true,durableSpendingControls:true,verifiedSportsResearch:true,mobileAcceptanceVerified:true,productionApproved:true};
 assert.equal(completionReadiness({...gates,verifiedSportsResearch:false}).launchReady,false);
 assert.equal(completionReadiness(gates).remaining,0);
});
