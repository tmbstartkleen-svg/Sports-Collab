'use strict';
const { validateQuestion } = require('../../lib/council-engine');
const { evaluateLiveAccess } = require('../../lib/live-access-policy');
const { runTwoModelCouncil } = require('../../lib/two-model-council');
// Explicit future endpoint. Disabled policy prevents any live model request.
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Allow', 'POST');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body) ||
      !validateQuestion(req.body.question)) {
    return res.status(400).json({ error: 'invalid_question', maxCharacters: 4000 });
  }
  const access = evaluateLiveAccess();
  if (!access.allowed) return res.status(503).json({
    error: 'live_ai_disabled', reason: access.reason,
    providersCalled: 0, spendLimitUsd: access.spendLimitUsd
  });
  try {
    const result = await runTwoModelCouncil(req.body.question);
    return res.status(200).json(result);
  } catch (_) {
    return res.status(503).json({ error: 'council_unavailable' });
  }
};
