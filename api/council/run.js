// Deliberately no live AI requests: explicit approval and server auth are required.
module.exports = function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Allow', 'POST');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  const body = req.body;
  if (!body || typeof body !== 'object' || typeof body.question !== 'string' ||
      !body.question.trim() || body.question.length > 4000) {
    return res.status(400).json({ error: 'invalid_question', maxCharacters: 4000 });
  }
  return res.status(503).json({
    error: 'live_ai_disabled',
    message: 'Live AI council is not enabled. Continue with the manual research workflow.',
    liveEnabled: false,
    spendLimitUsd: 0,
    providersCalled: 0
  });
};
