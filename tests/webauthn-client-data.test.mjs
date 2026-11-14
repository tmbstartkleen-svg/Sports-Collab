import test from 'node:test';
import assert from 'node:assert/strict';
import {validateClientDataJSON} from '../lib/webauthn-client-data.js';
const expectedChallenge='A'.repeat(43),expectedOrigin='https://sports.example.com';
const encode=o=>Buffer.from(JSON.stringify(o)).toString('base64url');
const data={type:'webauthn.get',challenge:expectedChallenge,origin:expectedOrigin,crossOrigin:false};
const check=(obj,override={})=>validateClientDataJSON({clientDataJSON:encode(obj),expectedType:'webauthn.get',expectedChallenge,expectedOrigin,...override});
test('accepts correctly shaped client data only as a preliminary check',()=>assert.equal(check(data),true));
test('rejects wrong origin, challenge, type, cross origin',()=>{
 for(const obj of [{...data,origin:'https://evil.example.com'},{...data,challenge:'B'.repeat(43)},{...data,type:'webauthn.create'},{...data,crossOrigin:true}]){
  assert.equal(check(obj),false);
 }
});
test('rejects malformed encoding and insecure expected origin',()=>{
 assert.equal(validateClientDataJSON({clientDataJSON:'%%%'}),false);
 assert.equal(check(data,{expectedOrigin:'http://sports.example.com'}),false);
 assert.equal(check(data,{expectedType:'wrong'}),false);
});
