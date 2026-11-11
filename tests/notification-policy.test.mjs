import test from 'node:test';
import assert from 'node:assert/strict';
import {appendNotice,sanitizeNotice,shouldNotify,MAX_NOTICES} from '../lib/notification-policy.js';
test('only known events accepted',()=>assert.throws(()=>sanitizeNotice({type:'api_key',message:'secret'})));
test('messages are bounded',()=>assert.throws(()=>sanitizeNotice({type:'blocked',message:'x'.repeat(241)})));
test('history is bounded',()=>{let a=[];for(let i=0;i<60;i++)a=appendNotice(a,{type:'blocked',message:'Request blocked'});assert.equal(a.length,MAX_NOTICES)});
test('silent prep never notifies',()=>assert.deepEqual(shouldNotify({type:'completed',silent:true}),{inApp:false,push:false}));
test('push never claimed active',()=>assert.equal(shouldNotify({type:'completed',iphonePush:true}).push,false));
