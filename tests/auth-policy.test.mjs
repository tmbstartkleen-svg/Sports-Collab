import test from 'node:test';
import assert from 'node:assert/strict';
import { AUTH_ENABLED, authorizeOwner, safeEqual } from '../lib/auth-policy.js';

test('authentication is disabled until explicitly approved', () => assert.equal(AUTH_ENABLED, false));
test('fails closed for absent session', () => assert.equal(authorizeOwner().status, 503));
test('fails closed even for forged owner session', () => {
  const result = authorizeOwner({session:{owner:true,expiresAt:Date.now()+100000},origin:'https://example.com',allowedOrigin:'https://example.com',csrfToken:'abc',expectedCsrf:'abc'});
  assert.equal(result.ok, false);
  assert.equal(result.status, 503);
});
test('constant-time helper compares text values', () => {
  assert.equal(safeEqual('same','same'), true);
  assert.equal(safeEqual('same','other'), false);
  assert.equal(safeEqual(null,'same'), false);
});
