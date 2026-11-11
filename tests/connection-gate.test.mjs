import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateConnection,CONNECTIONS_ENABLED,MONTHLY_SPEND_CAP_USD} from '../lib/connection-gate.js';
test('all supported providers remain blocked',()=>{for(const provider of ['gpt','gemini','llama'])assert.equal(evaluateConnection({provider,question:'Analyze this game'}).status,503)});
test('unsupported provider rejected',()=>assert.equal(evaluateConnection({provider:'unknown',question:'Test'}).status,400));
test('invalid question rejected',()=>assert.equal(evaluateConnection({provider:'gemini',question:''}).status,400));
test('budget is zero and gate closed',()=>{assert.equal(MONTHLY_SPEND_CAP_USD,0);assert.equal(CONNECTIONS_ENABLED,false)});
