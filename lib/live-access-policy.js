'use strict';
// Policy for future live council integration. This module never grants access.
const PROVIDER_NAMES = Object.freeze(['GPT', 'Gemini', 'Muse']);
function evaluateLiveAccess() {
  return Object.freeze({
    allowed: false,
    reason: 'live_ai_not_approved',
    spendLimitUsd: 0,
    providerCallsAllowed: 0,
    providers: PROVIDER_NAMES.map(name => ({ name, enabled: false }))
  });
}
function assertLiveAccess() {
  const decision = evaluateLiveAccess();
  if (!decision.allowed) {
    const error = new Error(decision.reason);
    error.code = 'LIVE_AI_DISABLED';
    throw error;
  }
  return decision;
}
module.exports = { evaluateLiveAccess, assertLiveAccess };
