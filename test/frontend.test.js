'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync(require('node:path').join(__dirname, '..', 'index.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/);
test('mobile frontend has syntactically valid JavaScript', () => {
  assert.ok(script, 'inline script exists');
  assert.doesNotThrow(() => new vm.Script(script[1], {filename:'index.html'}));
});
test('every referenced DOM ID exists in the HTML', () => {
  assert.ok(script);
  const ids = [...script[1].matchAll(/\$\('([A-Za-z][A-Za-z0-9]*)'\)/g)].map(m => m[1]);
  const unique = [...new Set(ids)];
  assert.ok(unique.length >= 15, 'expected interactive controls');
  for (const id of unique) {
    assert.match(html, new RegExp('\\bid="' + id + '"'), 'missing element: ' + id);
  }
});
test('provider status, research, challenge and final card actions are wired', () => {
  assert.ok(script);
  for (const id of ['refreshStatus','readiness','serverPlan','make','copy','debate','exchange','copyExchange','audit','copyDebate','copyCard']) {
    assert.ok(script[1].includes("$('"+id+"').onclick="), 'missing click handler: '+id);
  }
  assert.ok(script[1].includes("fetch('/api/council/status'"));
  assert.ok(script[1].includes("fetch('/api/council/run'"));
  assert.ok(script[1].includes("fetch('/api/council/exchange'"));
});
