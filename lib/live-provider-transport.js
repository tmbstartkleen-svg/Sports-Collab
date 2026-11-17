'use strict';
// Future live provider transport. This module cannot make requests until the
// independent live-access policy explicitly permits them.
const { assertLiveAccess } = require('./live-access-policy');
const { validatePrompt } = require('./provider-request-builders');
const PROVIDERS = Object.freeze({
  gpt: Object.freeze({ credential: 'OPENAI_API_KEY', endpoint: 'https://api.openai.com/v1/responses' }),
  gemini: Object.freeze({ credential: 'GEMINI_API_KEY', endpoint: 'https://generativelanguage.googleapis.com/v1beta/models' })
});
function getTransportReadiness(id) {
  if (!Object.hasOwn(PROVIDERS, id)) throw new TypeError('unsupported_provider');
  return Object.freeze({ provider: id, configured: false, authenticated: false,
    enabled: false, requestsAllowed: 0, spendLimitUsd: 0,
    reason: 'live_ai_not_approved' });
}
async function generateProviderResponse(id, prompt) {
  if (!Object.hasOwn(PROVIDERS, id)) throw new TypeError('unsupported_provider');
  validatePrompt(prompt);
  // This gate must execute before reading credentials, constructing requests,
  // or touching the network. It currently always rejects.
  assertLiveAccess();
  throw new Error('provider_transport_not_implemented');
}
module.exports = { PROVIDERS, getTransportReadiness, generateProviderResponse };
