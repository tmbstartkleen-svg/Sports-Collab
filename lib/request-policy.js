// Pure, testable policy helpers. No provider calls.
export const MAX_QUESTION_CHARS = 2000;
export const MAX_BODY_BYTES = 8192;
export const REQUESTS_ENABLED = false; // hard compile-time stop until separately approved

export function validateQuestion(value) {
  if (typeof value !== 'string') return { ok: false, error: 'Question must be text' };
  const question = value.trim();
  if (!question || question.length > MAX_QUESTION_CHARS) {
    return { ok: false, error: 'Question must be 1-2000 characters' };
  }
  return { ok: true, question };
}

export function evaluateRequest({ method, contentLength }) {
  if (method !== 'POST') return { allowed: false, status: 405, error: 'Method not allowed' };
  if (!Number.isSafeInteger(contentLength) || contentLength < 0 || contentLength > MAX_BODY_BYTES) {
    return { allowed: false, status: 413, error: 'Invalid or oversized request' };
  }
  if (!REQUESTS_ENABLED) return { allowed: false, status: 503, error: 'Model requests disabled' };
  return { allowed: false, status: 503, error: 'Authentication and budget enforcement not configured' };
}
