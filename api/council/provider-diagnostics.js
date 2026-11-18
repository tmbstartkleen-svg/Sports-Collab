'use strict';
// Authentication-only diagnostics. No generation, no keys in responses.
const { evaluateLiveAccess } = require('../../lib/live-access-policy');
const { timingSafeEqual } = require('node:crypto');
function tokenMatches(a,b) {
  if (typeof a !== 'string' || typeof b !== 'string' || b.length < 32) return false;
  const left = Buffer.from(a), right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left,right);
}
const TARGETS = Object.freeze({
  gpt: { env: 'OPENAI_API_KEY', url: 'https://api.openai.com/v1/models' },
  gemini: { env: 'GEMINI_API_KEY', url: 'https://generativelanguage.googleapis.com/v1beta/models?pageSize=1' }
});
async function checkProvider(id, fetcher = fetch) {
  const target = TARGETS[id];
  if (!target) throw new TypeError('unsupported_provider');
  const key = process.env[target.env];
  if (!key) return { provider: id, configured: false, authenticated: false, result: 'missing_credentials' };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetcher(target.url, {
      method: 'GET',
      headers: id === 'gpt' ? { Authorization: 'Bearer ' + key } : { 'x-goog-api-key': key },
      signal: controller.signal
    });
    return { provider: id, configured: true, authenticated: response.ok,
      result: response.ok ? 'authenticated' : response.status === 401 || response.status === 403
        ? 'authentication_rejected' : 'provider_unavailable' };
  } catch (_) {
    return { provider: id, configured: true, authenticated: false, result: 'network_unavailable' };
  } finally { clearTimeout(timeout); }
}
async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Allow', 'GET');
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });
  // No publicly callable credential probe. Avoid key-validity oracle and abuse.
  if (process.env.PROVIDER_DIAGNOSTICS_ENABLED !== 'true' ||
      !tokenMatches(req.headers['x-council-diagnostic-token'], process.env.COUNCIL_DIAGNOSTIC_TOKEN))
    return res.status(403).json({ error: 'diagnostics_disabled', providerCalls: 0, spendLimitUsd: 0 });
  const access = evaluateLiveAccess();
  if (access.allowed) return res.status(409).json({ error: 'diagnostics_require_offline_mode' });
  const results = await Promise.all(['gpt', 'gemini'].map(id => checkProvider(id)));
  return res.status(200).json({ results, generationCalls: 0, spendLimitUsd: 0,
    note: 'Authentication does not verify free-tier eligibility or billing status.' });
}
module.exports = handler;
module.exports.checkProvider = checkProvider;
