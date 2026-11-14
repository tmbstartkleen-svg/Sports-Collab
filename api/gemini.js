// Read-only Gemini server-side integration scaffold.
// Deliberately does not import an SDK, call a model, or spend API credits.
// Before enabling: add authentication, CSRF/origin controls, rate limits,
// request validation, logging redaction, explicit budget policy, and user approval.
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Allow', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'GET, OPTIONS');
    return res.status(204).end();
  }
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed', enabled: false });
  }
  // Do not expose whether secrets are configured or return any credential.
  return res.status(503).json({
    enabled: false,
    mode: 'read-only-scaffold',
    message: 'Gemini requests are disabled pending owner approval and safeguards.'
  });
}
