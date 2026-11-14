// Pure policy module. Does not initiate network traffic.
export const PULLS_ENABLED = false; // Owner must explicitly approve activation.
export const ALLOWED_TRIGGERS = Object.freeze(['manual', 'scheduled']);
export const DEFAULT_POLICY = Object.freeze({
  monthlySpendLimitUsd: 0,
  autoRetry: false,
  backgroundPolling: false,
  maxPullsPerTrigger: 1,
  notifyOn: ['completed', 'blocked', 'quota_exhausted', 'failed'],
  schedules: [] // Empty by default. Owner approval required to add entries.
});

export function decidePull({trigger, ownerApproved = false, scheduleId, approvedSchedules = [], providerFreeQuotaAvailable = false} = {}) {
  if (!ALLOWED_TRIGGERS.includes(trigger)) return {allowed:false, reason:'Unrequested background pulls are prohibited', notify:'blocked'};
  if (!ownerApproved) return {allowed:false, reason:'Owner approval required', notify:'blocked'};
  if (trigger === 'scheduled' && (!scheduleId || !approvedSchedules.includes(scheduleId))) {
    return {allowed:false, reason:'Schedule not approved', notify:'blocked'};
  }
  if (!PULLS_ENABLED) return {allowed:false, reason:'API pulls are disabled until activation approval', notify:'blocked'};
  if (!providerFreeQuotaAvailable) return {allowed:false, reason:'Verified free quota unavailable', notify:'quota_exhausted'};
  return {allowed:false, reason:'Execution adapter and hard quotas not configured', notify:'blocked'};
}

export function notificationFor(result, requestId) {
  return {requestId: String(requestId ?? '').slice(0, 80), status: result.notify || 'blocked', message: result.reason || 'Request blocked'};
}
