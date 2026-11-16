'use strict';
// Safe offline configuration checks. Never disclose secret values or key presence.
const { getPublicProviderStatus } = require('./provider-registry');
const BLOCKED_FLAGS = Object.freeze(['ENABLE_LIVE_AI', 'ALLOW_PAID_FALLBACK', 'ENABLE_AUTO_WAGER']);
const SECRET_NAMES = Object.freeze([
  'GEMINI_API_KEY', 'OPENAI_API_KEY', 'SAMBANOVA_API_KEY',
  'SUPABASE_URL', 'SUPABASE_ANON_KEY'
]);
function validateProviderConfiguration(env = {}) {
  const requestedUnsafe = BLOCKED_FLAGS.filter(name =>
    ['true', '1', 'yes', 'on'].includes(String(env[name] || '').toLowerCase()));
  return {
    validForOfflineMode: requestedUnsafe.length === 0,
    liveEnabled: false,
    spendLimitUsd: 0,
    providers: getPublicProviderStatus(),
    errors: requestedUnsafe.map(name => name + '_not_supported'),
    requiresApproval: true
  };
}
function getEnvironmentVariableNames() {
  return [...SECRET_NAMES];
}
module.exports = { validateProviderConfiguration, getEnvironmentVariableNames };
