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

test('document ends at its closing HTML tag with no leaked script source', () => {
  assert.match(html, /<\/script><\/body><\/html>\s*$/);
  assert.equal((html.match(/<\/html>/g) || []).length, 1);
  assert.equal((html.match(/<script>/g) || []).length, 1);
  assert.equal((html.match(/<\/script>/g) || []).length, 1);
});

test('Muse remains available in manual council while GPT and Gemini are prioritized for future live orchestration', () => {
  assert.match(html, /<label for="m">Muse<\/label>/);
  assert.match(html, /<textarea id="m"><\/textarea>/);
  assert.match(html, /<option value="Muse">Muse<\/option>/);
  assert.match(html, /responses:\{GPT:\$\('o'\)\.value,Gemini:\$\('g'\)\.value,Muse:\$\('m'\)\.value\}/);
});

test('live council button is wired to safe disabled-response handling without removing Muse', () => {
  assert.match(html, /<button id="runLive">Run GPT \+ Gemini council<\/button>/);
  assert.match(html, /<p id="liveResult"[^>]*><\/p>/);
  assert.ok(script[1].includes("$('runLive').onclick="));
  assert.ok(script[1].includes("fetch('/api/council/live'"));
  assert.ok(script[1].includes("result.error==='live_ai_disabled'"));
  assert.ok(script[1].includes("result.research.gpt"));
  assert.ok(script[1].includes("result.research.gemini"));
  assert.match(html, /<label for="m">Muse<\/label>/);
});
