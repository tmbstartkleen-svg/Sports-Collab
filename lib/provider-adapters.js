'use strict';
// Provider adapter interface and deterministic local stubs. NO outbound API calls.
// Actual provider adapters require separate approval, authentication and free-tier verification.
const { assertLiveAccess } = require('./live-access-policy');
const PROVIDER_IDS = Object.freeze(['gpt', 'gemini', 'muse']);
function createDisabledAdapter(id) {
  if (!PROVIDER_IDS.includes(id)) throw new TypeError('unsupported_provider');
  return Object.freeze({
    id,
    enabled: false,
    async generate() {
      assertLiveAccess();
      throw new Error('unreachable');
    }
  });
}
function getAdapters() {
  return Object.fromEntries(PROVIDER_IDS.map(id => [id, createDisabledAdapter(id)]));
}
module.exports = { PROVIDER_IDS, createDisabledAdapter, getAdapters };
