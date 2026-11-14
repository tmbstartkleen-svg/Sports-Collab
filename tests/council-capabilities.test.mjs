import test from 'node:test';
import assert from 'node:assert/strict';
import {councilCapabilities} from '../lib/council-capabilities.js';
test('no provider can make calls',()=>{assert.equal(councilCapabilities.providerRequestsEnabled,false);assert.ok(councilCapabilities.seats.every(seat=>seat.requestsEnabled===false));});
test('spending and autonomous actions disabled',()=>{assert.equal(councilCapabilities.monthlySpendLimitUsd,0);assert.equal(councilCapabilities.backgroundPollingEnabled,false);assert.equal(councilCapabilities.automaticRetriesEnabled,false);assert.equal(councilCapabilities.wageringEnabled,false);assert.equal(councilCapabilities.pushDeliveryEnabled,false);});
test('statuses do not reveal credentials',()=>assert.ok(!JSON.stringify(councilCapabilities).match(/api.?key|secret|token/i)));
