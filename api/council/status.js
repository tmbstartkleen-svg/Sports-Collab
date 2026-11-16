// Fail-closed status endpoint. No provider requests or secrets are exposed.
module.exports = function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Allow', 'GET');
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });
  return res.status(200).json({
    liveEnabled: false,
    providers: ['GPT', 'Gemini', 'Muse'].map(name => ({ name, available: false })),
    spendLimitUsd: 0,
    mode: 'offline_manual_only'
  });
};
