'use strict';
// Configuration validation only. Never exposes or invokes provider credentials.
// Explicit activation is deliberately unsupported until approval and verified zero-cost controls.
const { getPublicProviderStatus } = require('./provider-registry');
function validateProviderConfiguration(env = {}) {
  const forbiddenFlags = ['ENABLE_LIVE_AI', 'ALLOW_PAID_FALLBACK', 'ENABLE_AUTO_WAGER'];
  const requestedUnsafe = forbiddenFlags.filter(name => env[name] === 'true' || env[name] === '1');
  return {
    validForOfflineMode: requestedUnsafe.length === 0,
    liveEnabled: false,
    spendLimitUsd: 0,
    providers: getPublicProviderStatus(),
    errors: requestedUnsafe.map(name => name + '_not_supported'),
    // Never serialize env values or indicate whether secret keys exist.
    requiresApproval: true
  };
}
module.exports = { validateProviderConfiguration };
