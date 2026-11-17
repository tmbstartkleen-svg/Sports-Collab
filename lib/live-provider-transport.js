'use strict';
// Live calls remain impossible until independent access policy permits them.
const { assertLiveAccess } = require('./live-access-policy');
const { validatePrompt, buildOpenAIRequest, buildGeminiRequest } = require('./provider-request-builders');
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
function parseResponse(id, data) {
  const text = id === 'gpt'
    ? (data.output || []).flatMap(x => x.content || []).filter(x => x.type === 'output_text').map(x => x.text).join('\n')
    : (data.candidates || []).flatMap(x => x.content?.parts || []).map(x => x.text || '').join('\n');
  if (!text.trim()) throw new Error('provider_empty_response');
  return text.trim().slice(0, 12000);
}
async function generateProviderResponse(id, prompt) {
  if (!Object.hasOwn(PROVIDERS, id)) throw new TypeError('unsupported_provider');
  const input = validatePrompt(prompt);
  // Must precede all credential reads, network requests and request construction.
  assertLiveAccess();
  const key = process.env[PROVIDERS[id].credential];
  const model = id === 'gpt' ? process.env.OPENAI_MODEL : process.env.GEMINI_MODEL;
  if (!key || !model || !/^[a-zA-Z0-9._-]{1,80}$/.test(model)) throw new Error('provider_not_configured');
  const url = id === 'gpt' ? PROVIDERS.gpt.endpoint :
    PROVIDERS.gemini.endpoint + '/' + encodeURIComponent(model) + ':generateContent';
  const body = id === 'gpt' ? buildOpenAIRequest(input, model) : buildGeminiRequest(input);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: id === 'gpt'
        ? { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' }
        : { 'x-goog-api-key': key, 'Content-Type': 'application/json' },
      body: JSON.stringify(body), signal: controller.signal
    });
    if (!response.ok) throw new Error('provider_request_failed_' + response.status);
    return parseResponse(id, await response.json());
  } finally {
    clearTimeout(timeout);
  }
}
module.exports = { PROVIDERS, getTransportReadiness, generateProviderResponse, parseResponse };
