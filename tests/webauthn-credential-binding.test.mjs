import test from 'node:test';
import assert from 'node:assert/strict';
import {assertionCredentialBinding,verifyOwnerAssertion} from '../lib/webauthn-verification-adapter.js';
const authenticator={id:'credential-1',publicKey:new Uint8Array([1,2]),counter:1};
const response={id:'credential-1',type:'public-key'};
const valid={authenticator,response,ownerId:'owner-1',credentialOwnerId:'owner-1'};
test('credential ID and owner binding accepts only complete matching evidence',()=>{
 assert.equal(assertionCredentialBinding(valid),true);
 for(const invalid of [
  {...valid,response:{...response,id:'credential-2'}},
  {...valid,response:{...response,type:'not-public-key'}},
  {...valid,credentialOwnerId:'owner-2'},
  {...valid,ownerId:''},
  {...valid,authenticator:{...authenticator,id:'credential-2'}},
  {...valid,authenticator:{...authenticator,publicKey:new Uint8Array()}},
  {...valid,authenticator:{...authenticator,counter:-1}},
  {...valid,authenticator:{...authenticator,counter:1.5}},
  {...valid,authenticator:{...authenticator,publicKey:'untrusted'}}
 ])assert.equal(assertionCredentialBinding(invalid),false);
});
test('even matching credential evidence never bypasses disabled login gate',async()=>{
 const result=await verifyOwnerAssertion({...valid,verifier:{verifyAuthenticationResponse:async()=>({verified:true,authenticationInfo:{}})}});
 assert.equal(result.ok,false);
});
