import test from 'node:test';
import assert from 'node:assert/strict';
import { councilCapabilities } from '../lib/council-capabilities.js';
import ownerStatus from '../api/owner-status.js';

test('owner access and paid actions remain fail-closed', () => {
  assert.equal(councilCapabilities.ownerAuthenticationEnabled, false);
  assert.equal(councilCapabilities.providerRequestsEnabled, false);
  assert.equal(councilCapabilities.wageringEnabled, false);
  assert.equal(councilCapabilities.monthlySpendLimitUsd, 0);
  assert.equal(councilCapabilities.backgroundPollingEnabled, false);
  assert.equal(councilCapabilities.automaticRetriesEnabled, false);
  for (const seat of councilCapabilities.seats) {
    assert.equal(seat.requestsEnabled, false, seat.id);
  }
});

function mockResponse() {
  return {
    headers: {},
    statusCode: 200,
    body: undefined,
    setHeader(key, value) { this.headers[key.toLowerCase()] = value; },
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; }
  };
}

test('owner status exposes no credential or authenticated-owner claim', () => {
  const res = mockResponse();
  ownerStatus({ method: 'GET' }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.headers['cache-control'], 'no-store');
  assert.equal(res.body.ownerAuthenticationEnabled, false);
  assert.equal(res.body.providerRequestsEnabled, false);
  assert.equal(res.body.monthlySpendLimitUsd, 0);
  assert.doesNotMatch(JSON.stringify(res.body), /api[_-]?key|secret|token|password/i);
});

test('owner status rejects non-GET methods', () => {
  for (const method of ['POST', 'PUT', 'DELETE']) {
    const res = mockResponse();
    ownerStatus({ method }, res);
    assert.equal(res.statusCode, 405, method);
  }
});
