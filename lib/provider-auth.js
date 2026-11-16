'use strict';
// Offline provider authentication boundary. Deliberately does not inspect keys or make requests.
// Credential verification must be added only after replacement keys and free-tier controls are approved.
const { evaluateLiveAccess } = require('./live-access-policy');
const { PROVIDER_IDS } = require('./provider-adapters');
function getAuthenticationReadiness(providerId) {
  if (!PROVIDER_IDS.includes(providerId)) throw new TypeError('unsupported_provider');
  const access = evaluateLiveAccess();
  return Object.freeze({
    providerId,
    authenticated: false,
    verified: false,
    canConnect: false,
    reason: access.reason,
    providerCallsAllowed: 0,
    spendLimitUsd: 0
  });
}
async function authenticateProvider(providerId) {
  const readiness = getAuthenticationReadiness(providerId);
  const error = new Error(readiness.reason);
  error.code = 'PROVIDER_AUTH_DISABLED';
  throw error;
}
module.exports = { getAuthenticationReadiness, authenticateProvider };
