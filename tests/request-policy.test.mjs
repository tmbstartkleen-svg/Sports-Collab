import test from 'node:test';
import assert from 'node:assert/strict';
import { validateQuestion, evaluateRequest, REQUESTS_ENABLED } from '../lib/request-policy.js';

test('provider calls are hard-disabled', () => assert.equal(REQUESTS_ENABLED, false));
test('validates question bounds', () => {
  assert.equal(validateQuestion(' NBA injury report ').question, 'NBA injury report');
  assert.equal(validateQuestion(' ').ok, false);
  assert.equal(validateQuestion('x'.repeat(2001)).ok, false);
  assert.equal(validateQuestion({ text: 'hello' }).ok, false);
});
test('rejects oversized requests', () => {
  assert.equal(evaluateRequest({ method: 'POST', contentLength: 8193 }).status, 413);
});
test('rejects unauthorized API calls even with valid inputs', () => {
  assert.equal(evaluateRequest({ method: 'POST', contentLength: 20 }).status, 503);
  assert.equal(evaluateRequest({ method: 'GET', contentLength: 0 }).status, 405);
});
