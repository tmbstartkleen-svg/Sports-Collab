'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { quotaConfigured, reserveDebateQuota, DAILY_CAP, MINUTE_CAP } = require('../lib/gemini-quota');
test('shared quota fails closed without Redis credentials', async () => {
  const url = process.env.GEMINI_QUOTA_REDIS_REST_URL;
  const token = process.env.GEMINI_QUOTA_REDIS_REST_TOKEN;
  try {
    delete process.env.GEMINI_QUOTA_REDIS_REST_URL;
    delete process.env.GEMINI_QUOTA_REDIS_REST_TOKEN;
    assert.equal(quotaConfigured(), false);
    let called = false;
    await assert.rejects(reserveDebateQuota(async () => { called = true; }), /durable_quota_not_configured/);
    assert.equal(called, false);
  } finally {
    if (url === undefined) delete process.env.GEMINI_QUOTA_REDIS_REST_URL;
    else process.env.GEMINI_QUOTA_REDIS_REST_URL = url;
    if (token === undefined) delete process.env.GEMINI_QUOTA_REDIS_REST_TOKEN;
    else process.env.GEMINI_QUOTA_REDIS_REST_TOKEN = token;
  }
});
test('atomic reservation enforces conservative day and minute limits', async () => {
  const oldUrl = process.env.GEMINI_QUOTA_REDIS_REST_URL;
  const oldToken = process.env.GEMINI_QUOTA_REDIS_REST_TOKEN;
  try {
    process.env.GEMINI_QUOTA_REDIS_REST_URL = 'https://quota.example.test';
    process.env.GEMINI_QUOTA_REDIS_REST_TOKEN = 'dummy';
    let body;
    const fetcher = async (url, options) => {
      assert.equal(url, 'https://quota.example.test/eval');
      body = JSON.parse(options.body);
      return { ok: true, json: async () => ({ result: 1 }) };
    };
    assert.equal(await reserveDebateQuota(fetcher, new Date('2026-11-18T12:34:00Z')), true);
    assert.equal(body[1], 2);
    assert.equal(body[4], 4);
    assert.equal(body[5], DAILY_CAP);
    assert.equal(body[6], MINUTE_CAP);
    await assert.rejects(reserveDebateQuota(async () => ({ ok: true, json: async () => ({ result: 0 }) })), /quota_exhausted/);
  } finally {
    if (oldUrl === undefined) delete process.env.GEMINI_QUOTA_REDIS_REST_URL;
    else process.env.GEMINI_QUOTA_REDIS_REST_URL = oldUrl;
    if (oldToken === undefined) delete process.env.GEMINI_QUOTA_REDIS_REST_TOKEN;
    else process.env.GEMINI_QUOTA_REDIS_REST_TOKEN = oldToken;
  }
});
