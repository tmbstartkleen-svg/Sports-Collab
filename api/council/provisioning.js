'use strict';
const { getProvisioningChecklist } = require('../../lib/provider-provisioning');
// Public, non-secret checklist only. Never probes credentials or provider services.
module.exports = function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Allow', 'GET');
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });
  return res.status(200).json(getProvisioningChecklist());
};
