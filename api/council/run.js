'use strict';
const { buildCouncilPlan, validateQuestion, normalizeResponses } = require('../../lib/council-engine');

// Manual-only research orchestration. No API credentials or provider calls.
module.exports = function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Allow', 'POST');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body) ||
      !validateQuestion(body.question)) {
    return res.status(400).json({ error: 'invalid_question', maxCharacters: 4000 });
  }
  // Explicit manual mode required to prevent clients mistaking this for a live model call.
  if (body.mode !== 'manual') {
    return res.status(503).json({
      error: 'live_ai_disabled',
      message: 'Use mode=manual with pasted model responses. Live provider calls are disabled.',
      providersCalled: 0, spendLimitUsd: 0
    });
  }
  try {
    const plan = buildCouncilPlan(body.question, normalizeResponses(body.responses));
    return res.status(200).json(plan);
  } catch (_) {
    return res.status(400).json({ error: 'invalid_request' });
  }
};
