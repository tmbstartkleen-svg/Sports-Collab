'use strict';
// A Llama model or third-party gateway is not evidence of an official Meta AI / Muse API.
// Never infer provider identity from a credential's name or value.
const OFFICIAL_MUSE_PROVIDERS = Object.freeze(['meta', 'muse']);
function assessMuseIdentity({ provider, credentialName, officialApiVerified = false } = {}) {
  const normalized = typeof provider === 'string' ? provider.trim().toLowerCase() : '';
  const approvedIdentity = OFFICIAL_MUSE_PROVIDERS.includes(normalized);
  const namedCredential = typeof credentialName === 'string' && /^(META_API_KEY|MUSE_API_KEY)$/.test(credentialName);
  const verified = approvedIdentity && namedCredential && officialApiVerified === true;
  return Object.freeze({
    provider: normalized || null,
    identityVerified: verified,
    enabled: false,
    canCall: false,
    requiresOfficialDocumentation: !verified,
    reason: verified ? 'live_ai_not_approved' : 'muse_provider_identity_unverified',
    spendLimitUsd: 0
  });
}
module.exports = { assessMuseIdentity, OFFICIAL_MUSE_PROVIDERS };
