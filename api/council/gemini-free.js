'use strict';
const { validateQuestion } = require('../../lib/council-engine');
const { readiness, runGeminiFreeDebate } = require('../../lib/gemini-free-debate');
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Allow', 'POST');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  if (!req.body || !validateQuestion(req.body.question))
    return res.status(400).json({ error: 'invalid_question' });
  if (!readiness().enabled) return res.status(503).json({
    error: 'free_model_verification_required', providerCalls: 0, spendLimitUsd: 0 });
  try { return res.status(200).json(await runGeminiFreeDebate(req.body.question)); }
  catch (_) { return res.status(503).json({ error: 'gemini_free_debate_unavailable',
    note: 'No paid fallback; free quota or provider may be unavailable.' }); }
};