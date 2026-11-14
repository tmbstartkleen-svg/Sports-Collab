import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const script=html.match(/<script>([\\s\\S]*?)<\\/script>/)?.[1];
test('all three chat research briefs and copy buttons are present',()=>{
 for(const id of ['chatPromptPanel','chatPromptGpt','chatPromptGemini','chatPromptLlama','copyChatGpt','copyChatGemini','copyChatLlama'])assert.ok(html.includes('id="'+id+'"'),id);
 for(const phrase of ['GPT · Analyst','Gemini · Evidence auditor','Llama · Critical reviewer','Cite dated sources'])assert.ok(html.includes(phrase),phrase);
});
test('research briefs remain offline and do not trigger model transport',()=>{
 assert.match(html,/Live calls are disabled/);
 assert.match(html,/Paste it into the corresponding assistant/);
 assert.match(html,/navigator\\.clipboard\\.writeText/);
 assert.doesNotThrow(()=>new vm.Script(script));
});
