import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const html=read('../index.html');
const manifest=JSON.parse(read('../manifest.webmanifest'));
const worker=read('../sw.js');
test('offline release has installable standalone shell and scope',()=>{
 assert.equal(manifest.display,'standalone');
 assert.equal(manifest.start_url,'/');
 assert.equal(manifest.scope,'/');
 assert.match(html,/manifest\.webmanifest/);
 assert.match(worker,/cache\.addAll\(\['\/'\s*,\s*'\/index\.html'\s*,\s*'\/manifest\.webmanifest'\]\)/);
});
test('service worker never intercepts API requests or mutating requests',()=>{
 assert.match(worker,/request\.method !== 'GET'/);
 assert.match(worker,/pathname\.startsWith\('\/api\/'\)/);
 assert.doesNotMatch(worker,/sync\.register|periodicSync|pushManager|fetch\(['"]https?:/i);
});
test('offline council does not claim verified live research',()=>{
 assert.match(html,/provider calls disabled/i);
 assert.match(html,/no AI calls/i);
 assert.match(html,/exportResearch/);
});
