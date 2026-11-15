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
  const line=script.match(new RegExp("chatText\\('"+seat+"'\\)\\.textContent=([^;]+);"))?.[1];
  assert.ok(line,seat+' prompt is generated');
  assert.match(line,/\\n/,'prompt uses JavaScript newline escapes');
  assert.doesNotMatch(line,/\\\\n/,'prompt must not render literal backslash-n');
 }
 assert.match(html,/white-space:pre-wrap/,'briefs preserve line breaks');
});

test('editing the research question invalidates the previous council report',()=>{
 assert.match(html,/chatText\('chatQuestion'\)\.addEventListener\('input'/);
 assert.match(html,/Question changed\. Build a new council review/);
});

test('editing any model response invalidates a previously generated council report',()=>{
 assert.match(html,/for\(const seat of \['chatGpt','chatGemini','chatLlama'\]\)/);
 assert.match(html,/A council response changed\. Rebuild the review before copying/);
 assert.match(html,/Build a complete council review before copying/);
});

test('a new research question clears previous AI replies before review',()=>{
 assert.match(html,/for\(const seat of \['chatGpt','chatGemini','chatLlama'\]\)chatText\(seat\)\.value=''/);
 assert.match(html,/New question prepared\. Obtain three fresh model responses before reviewing/);
});

test('council planner shares each prior response and stops after four stages',async()=>{
 const {nextCouncilTurn,COUNCIL_SEQUENCE}=await import('../lib/council-request.js');
 assert.deepEqual(COUNCIL_SEQUENCE,['openai','gemini','llama','openai']);
 const question='Assess a hypothetical matchup';
 const first=nextCouncilTurn({question});
 assert.equal(first.recipient,'openai');
 const second=nextCouncilTurn({question,responses:['Initial analysis']});
 assert.equal(second.recipient,'gemini');
 assert.match(second.prompt,/OPENAI: Initial analysis/);
 const third=nextCouncilTurn({question,responses:['Initial analysis','Evidence review']});
 assert.equal(third.recipient,'llama');
 assert.match(third.prompt,/GEMINI: Evidence review/);
 const fourth=nextCouncilTurn({question,responses:['Initial analysis','Evidence review','Critical challenge']});
 assert.equal(fourth.recipient,'openai');
 assert.match(fourth.prompt,/LLAMA: Critical challenge/);
 assert.equal(nextCouncilTurn({question,responses:['a','b','c','d']}).complete,true);
});
test('future live-call gate denies unverified billing, unauthorized use and exhausted quotas',async()=>{
 const {checkFreeProviderEligibility}=await import('../lib/council-request.js');
 const base={provider:'gemini',serverVerifiedFree:true,billingDisabled:true,authenticated:true,requestsRemaining:2,requestBudget:2};
 assert.equal(checkFreeProviderEligibility({...base,billingDisabled:false}).ok,false);
 assert.equal(checkFreeProviderEligibility({...base,authenticated:false}).ok,false);
 assert.equal(checkFreeProviderEligibility({...base,requestsRemaining:0}).ok,false);
 assert.equal(checkFreeProviderEligibility({...base,requestBudget:0}).ok,false);
 assert.equal(checkFreeProviderEligibility(base).remainingAfterCall,1);
});

test('mobile council exposes final synthesis brief and copies it',()=>{
 assert.match(html,/id="chatPromptFinalGpt"/);
 assert.match(html,/id="copyChatFinalGpt"/);
 assert.match(html,/\['copyChatFinalGpt','chatPromptFinalGpt'\]/);
 assert.match(html,/LLAMA CRITICAL REVIEW:/);
 assert.match(html,/chatText\('chatLlama'\)\.addEventListener\('input',refreshCouncilHandoffs\)/);
});
