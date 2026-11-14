import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const manifest=JSON.parse(readFileSync(new URL('../manifest.webmanifest',import.meta.url),'utf8'));

test('no-login mobile launch exposes the council without authentication UI',()=>{
 assert.match(html,/id="chatQuestion"/);
 for(const id of ['chatAsk','chatGpt','chatGemini','chatLlama','chatReview','chatResult','saveResearch','loadResearch','clearResearch']){
  assert.match(html,new RegExp('id="'+id+'"'));
 }
 assert.match(html,/No sign-in required/);
 assert.doesNotMatch(html,/<input[^>]+type=["']password["']/i);
 assert.match(manifest.description,/No-login/);
});

test('local research save includes all three council replies and mobile question',()=>{
 const fieldMatch=html.match(/const researchFields=\[([^\]]+)\]/);
 assert.ok(fieldMatch,'local save fields exist');
 for(const id of ['chatQuestion','chatGpt','chatGemini','chatLlama']){
  assert.ok(fieldMatch[1].includes("'"+id+"'"),id+' must be persisted');
 }
 assert.match(html,/localStorage\.setItem\(researchKey/);
 assert.match(html,/localStorage\.getItem\(researchKey/);
 assert.match(html,/localStorage\.removeItem\(researchKey/);
});

test('mobile council never describes demo responses as real provider research',()=>{
 assert.match(html,/Live AI collaboration is not connected yet/);
 assert.match(html,/No model calls/);
 assert.match(html,/No automated research has run/);
 assert.match(html,/Source claims, injuries and odds are not independently verified/);
});

test('small-screen iPhone layout has accessible focus and touch targets',()=>{
 assert.match(html,/max-width:420px/);
 assert.match(html,/min-height:44px/);
 assert.match(html,/:focus-visible/);
 assert.match(html,/font-size:16px/);
});

test('restoring saved research reopens the mobile council without contacting providers',()=>{
 assert.match(html,/if\(\$\('chatQuestion'\)\.value\.trim\(\)\)\$\('chatAsk'\)\.click\(\)/);
 assert.match(html,/chatText\('chatPromptPanel'\)\.hidden=false/);
 assert.match(html,/chatText\('chatReplies'\)\.hidden=false/);
});

test('council briefs and demo use real line breaks, not literal slash-n sequences',()=>{
 const script=html.slice(html.indexOf("chatText('chatAsk').addEventListener"));
 for(const seat of ['chatPromptGpt','chatPromptGemini','chatPromptLlama']){
  const line=script.split('\n').find(x=>x.includes("chatText('"+seat+"').textContent="));
  assert.ok(line,seat+' prompt is generated');
  assert.match(line,/\\n/,'prompt uses JavaScript newline escapes');
  assert.doesNotMatch(line,/\\\\n/,'prompt must not render literal backslash-n');
 }
 assert.match(html,/white-space:pre-wrap/,'briefs preserve line breaks');
});
