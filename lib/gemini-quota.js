'use strict';
// Atomic reservation of four calls before a debate. No in-memory fallback.
// Requires a dedicated Upstash-compatible Redis REST endpoint and token.
const DAILY_CAP = 480;
const MINUTE_CAP = 8;
const CALLS_PER_DEBATE = 4;
const SCRIPT = [
  'local d = tonumber(redis.call("GET", KEYS[1]) or "0")',
  'local m = tonumber(redis.call("GET", KEYS[2]) or "0")',
  'if d + tonumber(ARGV[1]) > tonumber(ARGV[2]) then return 0 end',
  'if m + tonumber(ARGV[1]) > tonumber(ARGV[3]) then return 0 end',
  'redis.call("INCRBY", KEYS[1], ARGV[1])',
  'redis.call("EXPIRE", KEYS[1], 172800)',
  'redis.call("INCRBY", KEYS[2], ARGV[1])',
  'redis.call("EXPIRE", KEYS[2], 120)',
  'return 1'
].join('\n');
function quotaConfigured() {
  return Boolean(process.env.GEMINI_QUOTA_REDIS_REST_URL && process.env.GEMINI_QUOTA_REDIS_REST_TOKEN);
}
async function reserveDebateQuota(fetcher = fetch, now = new Date()) {
  if (!quotaConfigured()) throw new Error('durable_quota_not_configured');
  const endpoint = process.env.GEMINI_QUOTA_REDIS_REST_URL;
  if (!/^https:\/\//.test(endpoint)) throw new Error('invalid_quota_endpoint');
  const keys = [
    'sports-collab:gemini:day:' + now.toISOString().slice(0, 10),
    'sports-collab:gemini:minute:' + now.toISOString().slice(0, 16)
  ];
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetcher(endpoint.replace(/\/$/, '') + '/eval', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + process.env.GEMINI_QUOTA_REDIS_REST_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([SCRIPT, 2, ...keys, CALLS_PER_DEBATE, DAILY_CAP, MINUTE_CAP]),
      signal: controller.signal
    });
    if (!response.ok) throw new Error('quota_store_unavailable');
    const data = await response.json();
    if (data.error || data.result !== 1) throw new Error('quota_exhausted_or_unavailable');
    return true;
  } finally { clearTimeout(timeout); }
}
module.exports = { DAILY_CAP, MINUTE_CAP, CALLS_PER_DEBATE, quotaConfigured, reserveDebateQuota };
