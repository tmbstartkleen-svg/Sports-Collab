'use strict';
const { getPublicProviderStatus } = require('../../lib/provider-registry');
module.exports = function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Allow', 'GET');
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });
  return res.status(200).json({
    liveEnabled: false,
    providers: getPublicProviderStatus(),
    spendLimitUsd: 0,
    mode: 'offline_manual_only'
  });
};
