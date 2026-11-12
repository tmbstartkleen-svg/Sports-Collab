import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
test('mobile inline script parses as JavaScript',()=>{
 assert.ok(script,'inline script must exist');
 assert.doesNotThrow(()=>new vm.Script(script,{filename:'index.html:inline'}));
});
test('all direct DOM id lookups have matching elements',()=>{
 const ids=[...script.matchAll(/\$\('([a-zA-Z][\w-]*)'\)/g)].map(m=>m[1]);
 const missing=[...new Set(ids)].filter(id=>!new RegExp('\\bid=["\\\']'+id+'["\\\']').test(html));
 assert.deepEqual(missing,[]);
});
test('council remains read-only and shows clear disclaimers',()=>{
 assert.match(html,/provider calls disabled/i);
 assert.match(html,/no AI calls/i);
 assert.match(html,/id="reviewCouncil"/);
 assert.match(html,/id="exportResearch"/);
});
