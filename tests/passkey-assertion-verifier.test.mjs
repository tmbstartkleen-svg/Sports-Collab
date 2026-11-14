import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,generateKeyPairSync,sign} from 'node:crypto';
import {verifyPasskeyAssertion} from '../lib/passkey-assertion-verifier.js';
const origin='https://sports-collab.vercel.app',challenge='a'.repeat(43);
const {publicKey,privateKey}=generateKeyPairSync('ec',{namedCurve:'prime256v1'});
const publicKeySpki=publicKey.export({type:'spki',format:'der'});
function assertion({rpId='sports-collab.vercel.app',uv=true,up=true,challengeValue=challenge,originValue=origin,count=1}={}){
 const clientDataJSON=Buffer.from(JSON.stringify({type:'webauthn.get',challenge:challengeValue,origin:originValue,crossOrigin:false}));
 const authenticatorData=Buffer.alloc(37);
 createHash('sha256').update(rpId).digest().copy(authenticatorData);
 authenticatorData[32]=(up?1:0)|(uv?4:0);
 authenticatorData.writeUInt32BE(count,33);
 const signed=Buffer.concat([authenticatorData,createHash('sha256').update(clientDataJSON).digest()]);
 const signature=sign('sha256',signed,privateKey);
 return {clientDataJSON,authenticatorData,signature,publicKeySpki,expectedChallenge:challenge,expectedOrigin:origin};
}
test('valid signed ES256 assertion with verified user succeeds',()=>{
 const result=verifyPasskeyAssertion(assertion({count:7}));
 assert.deepEqual(result,{ok:true,signCount:7});
});
test('tampered signature and wrong relying party fail',()=>{
 const original=assertion();
 assert.equal(verifyPasskeyAssertion({...original,signature:Buffer.from(original.signature).fill(0)}).ok,false);
 assert.equal(verifyPasskeyAssertion(assertion({rpId:'evil.example'})).ok,false);
});
test('wrong challenge origin and missing user verification fail',()=>{
 assert.equal(verifyPasskeyAssertion(assertion({challengeValue:'b'.repeat(43)})).ok,false);
 assert.equal(verifyPasskeyAssertion(assertion({originValue:'https://evil.example'})).ok,false);
 assert.equal(verifyPasskeyAssertion(assertion({uv:false})).ok,false);
 assert.equal(verifyPasskeyAssertion(assertion({up:false})).ok,false);
});
test('malformed assertion data fails closed',()=>{
 assert.equal(verifyPasskeyAssertion({}).ok,false);
 assert.equal(verifyPasskeyAssertion({...assertion(),clientDataJSON:Buffer.from('{bad')}).ok,false);
});
