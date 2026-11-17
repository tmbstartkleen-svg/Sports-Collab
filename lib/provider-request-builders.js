'use strict';
// Pure request-body preparation for future provider integrations.
// No credentials, network calls, or activation logic.
const MAX_PROMPT = 4000;
const MAX_OUTPUT_TOKENS = 256;
function validatePrompt(prompt) {
  if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > MAX_PROMPT)
    throw new TypeError('invalid_prompt');
  return prompt.trim();
}
function buildOpenAIRequest(prompt, model) {
  const text = validatePrompt(prompt);
  if (typeof model !== 'string' || !/^[a-zA-Z0-9._-]{1,80}$/.test(model))
    throw new TypeError('invalid_model');
  return Object.freeze({
    model,
    input: [{ role: 'user', content: text }],
    max_output_tokens: MAX_OUTPUT_TOKENS,
    store: false
  });
}
function buildGeminiRequest(prompt) {
  const text = validatePrompt(prompt);
  return Object.freeze({
    contents: [{ role: 'user', parts: [{ text }] }],
    generationConfig: { maxOutputTokens: MAX_OUTPUT_TOKENS }
  });
}
module.exports = { MAX_PROMPT, MAX_OUTPUT_TOKENS, validatePrompt, buildOpenAIRequest, buildGeminiRequest };
