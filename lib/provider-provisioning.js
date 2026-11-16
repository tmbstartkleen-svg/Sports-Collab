'use strict';
// Credential readiness is intentionally assessed without reading or revealing secrets.
// Operators must rotate exposed keys and configure Vercel server-side environment values.
const PROVIDERS = Object.freeze([
  Object.freeze({ id: 'gpt', name: 'GPT', envName: 'OPENAI_API_KEY', verified: false }),
  Object.freeze({ id: 'gemini', name: 'Gemini', envName: 'GEMINI_API_KEY', verified: false }),
  Object.freeze({ id: 'muse', name: 'Muse', envName: null, verified: false }),
  Object.freeze({ id: 'sambanova', name: 'SambaNova', envName: 'SAMBANOVA_API_KEY', verified: false })
]);
function getProvisioningChecklist() {
  return {
    liveEnabled: false,
    credentialsAcceptedInChat: false,
    credentialsMustBeRotated: true,
    spendLimitUsd: 0,
    requirements: [
      'Revoke credentials shared in conversation and generate replacements',
      'Configure replacement secrets in Vercel server-side environment settings',
      'Verify provider identity, API access and zero-cost quotas independently',
      'Approve explicit activation separately; no automatic wagering'
    ],
    providers: PROVIDERS.map(({ id, name, envName, verified }) =>
      ({ id, name, envName, verified, enabled: false }))
  };
}
module.exports = { getProvisioningChecklist };
