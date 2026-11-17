'use strict';
const { assessMuseIdentity } = require('../../lib/muse-identity');
// Public, non-secret provider identity state. No environment variable values are read.
module.exports = function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Allow', 'GET');
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });
  const muse = assessMuseIdentity();
  return res.status(200).json({
    name: 'Muse', identityVerified: muse.identityVerified,
    enabled: muse.enabled, canCall: muse.canCall,
    reason: muse.reason, acceptedCredentialNames: ['META_API_KEY', 'MUSE_API_KEY'],
    existingLlamaCredentialIsNotProof: true, spendLimitUsd: 0
  });
};
