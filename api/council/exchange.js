'use strict';
const { prepareCouncilExchange } = require('../../lib/council-exchange');
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Allow', 'POST');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body) || body.mode !== 'manual') {
    return res.status(400).json({ error: 'manual_mode_required' });
  }
  try {
    const result = prepareCouncilExchange({ question: body.question, responses: body.responses, round: body.round });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ error: 'invalid_exchange_request' });
  }
};
