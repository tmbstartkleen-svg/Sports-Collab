import test from 'node:test';
import assert from 'node:assert/strict';
import {decidePull, notificationFor, DEFAULT_POLICY} from '../lib/pull-policy.js';

test('no polling or retries and no default schedules', () => {
  assert.equal(DEFAULT_POLICY.backgroundPolling, false);
  assert.equal(DEFAULT_POLICY.autoRetry, false);
  assert.deepEqual(DEFAULT_POLICY.schedules, []);
  assert.equal(DEFAULT_POLICY.monthlySpendLimitUsd, 0);
});
test('background requests blocked', () => {
  assert.equal(decidePull({trigger:'poll',ownerApproved:true}).allowed, false);
});
test('manual request without owner approval blocked', () => {
  assert.equal(decidePull({trigger:'manual'}).reason, 'Owner approval required');
});
test('unapproved scheduled request blocked', () => {
  assert.equal(decidePull({trigger:'scheduled',ownerApproved:true,scheduleId:'nightly'}).reason, 'Schedule not approved');
});
test('approved request remains disabled before activation', () => {
  assert.equal(decidePull({trigger:'scheduled',ownerApproved:true,scheduleId:'nightly',approvedSchedules:['nightly'],providerFreeQuotaAvailable:true}).allowed, false);
});
test('notifications do not contain API keys or prompts', () => {
  const notice = notificationFor(decidePull({trigger:'poll'}),'req-1');
  assert.equal(notice.status,'blocked');
  assert.equal(JSON.stringify(notice).includes('secret'),false);
});
