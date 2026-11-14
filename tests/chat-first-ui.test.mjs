import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
test('chat-first identity and three explicit council seats',()=>{
 assert.match(html,/<title>Sports-Collab \| Three-AI Council<\/title>/);
 assert.match(html,/<h1>Sports-Collab<\/h1>/);
 for(const label of ['GPT <small>Analyst','Gemini <small>Evidence','Llama <small>Challenge'])assert.ok(html.includes(label));
 assert.ok(html.indexOf('id="chatQuestion"')<html.indexOf('Advanced research tools and settings'));
});
test('chat-first controls never imply autonomous AI research',()=>{
 assert.match(html,/>Prepare council question<\/button>/);
 assert.match(html,/Live AI collaboration is not connected yet/);
 assert.match(html,/No automated research has run/);
 assert.match(html,/All three actual model responses are required/);
 assert.match(html,/Source claims, injuries and odds are not independently verified/);
});
