'use strict';
// Safe provider configuration inventory. No network access and no secrets returned.
// Muse is a UI label, not a verified API provider. No provider is enabled.
const REGISTRY = Object.freeze([
  Object.freeze({ id: 'gpt', label: 'GPT', configured: false, verifiedFreeTier: false }),
  Object.freeze({ id: 'gemini', label: 'Gemini', configured: false, verifiedFreeTier: false }),
  Object.freeze({ id: 'muse', label: 'Muse', configured: false, verifiedFreeTier: false })
]);
function getPublicProviderStatus() {
  return REGISTRY.map(({ id, label }) => ({
    id, name: label, available: false, authenticated: false,
    liveEnabled: false, freeTierVerified: false
  }));
}
module.exports = { getPublicProviderStatus };
