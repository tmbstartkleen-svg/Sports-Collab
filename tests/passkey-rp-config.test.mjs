import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateRpConfiguration} from '../lib/passkey-rp-config.js';
test('stable production origin accepted',()=>assert.equal(evaluateRpConfiguration({origin:'https://sports-collab.vercel.app',configuredOrigin:'https://sports-collab.vercel.app',configuredRpId:'sports-collab.vercel.app'}).ok,true));
test('reject preview hostname',()=>assert.equal(evaluateRpConfiguration({origin:'https://sports-collab-abc.vercel.app',configuredOrigin:'https://sports-collab-abc.vercel.app',configuredRpId:'sports-collab-abc.vercel.app'}).ok,false));
test('reject mismatched origin',()=>assert.equal(evaluateRpConfiguration({origin:'https://evil.example',configuredOrigin:'https://sports-collab.vercel.app',configuredRpId:'sports-collab.vercel.app'}).ok,false));
