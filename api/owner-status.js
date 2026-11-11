// Publicly safe status endpoint. Does not expose secrets or sessions.
export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Allow', 'GET');
  if (req.method !== 'GET') return res.status(405).json({error:'Method not allowed'});
  return res.status(200).json({
    app: 'Triple AI Sports Council',
    mode: 'manual-read-only',
    ownerAuthenticationEnabled: false,
    providerRequestsEnabled: false,
    wageringEnabled: false
  });
}
