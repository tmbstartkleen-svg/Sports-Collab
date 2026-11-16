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
 assert.match(html,/Build a council review or run a simulation before copying/);
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

test('council step planner fails closed until trusted server policy is verified',async()=>{
 const {planVerifiedCouncilStep}=await import('../lib/council-request.js');
 const question='Evaluate a hypothetical game';
 assert.equal(planVerifiedCouncilStep({question}).ok,false);
 const policy={serverVerifiedFree:true,billingDisabled:true,authenticated:true,requestsRemaining:4,requestBudget:4};
 assert.equal(planVerifiedCouncilStep({question,serverPolicy:{...policy,billingDisabled:false}}).ok,false);
 const first=planVerifiedCouncilStep({question,serverPolicy:policy});
 assert.equal(first.ok,true);
 assert.equal(first.recipient,'openai');
 assert.equal(first.authorization,'eligible_for_server_reservation');
 const second=planVerifiedCouncilStep({question,responses:['First response'],serverPolicy:policy});
 assert.equal(second.recipient,'gemini');
 assert.match(second.prompt,/OPENAI: First response/);
 assert.equal(planVerifiedCouncilStep({question,responses:['a','b','c','d']}).complete,true);
});

test('offline council integration shares prior turns without network requests',async()=>{
 const {simulateCouncilExchange}=await import('../lib/provider-executor.js');
 const seen=[];
 const result=await simulateCouncilExchange({question:'Evaluate a hypothetical game',mockResponder:async({recipient,prompt,round})=>{
  seen.push({recipient,prompt,round});
  return 'Mock response '+round;
 }});
 assert.equal(result.ok,true);
 assert.equal(result.simulated,true);
 assert.equal(result.liveCalls,false);
 assert.deepEqual(seen.map(x=>x.recipient),['openai','gemini','llama','openai']);
 assert.match(seen[1].prompt,/OPENAI: Mock response 1/);
 assert.match(seen[2].prompt,/GEMINI: Mock response 2/);
 assert.match(seen[3].prompt,/LLAMA: Mock response 3/);
 assert.equal(result.history.length,4);
});

test('long council replies are abbreviated transparently before the next model',async()=>{
 const {nextCouncilTurn}=await import('../lib/council-request.js');
 const question='Assess a hypothetical game';
 const result=nextCouncilTurn({question,responses:['A'.repeat(5000),'B'.repeat(5000),'C'.repeat(5000)]});
 assert.equal(result.ok,true);
 assert.equal(result.recipient,'openai');
 assert.equal(result.abbreviated,true);
 assert.ok(result.prompt.length<=4000);
 assert.match(result.prompt,/CONTENT OMITTED/);
 assert.match(result.warning,/omitted content/);
});

test('offline council endpoint plans next AI handoff without provider calls',async()=>{
 const {default:handler}=await import('../api/council-demo.js');
 const invoke=body=>{
  let status=200,payload;
  const res={setHeader(){},status(code){status=code;return this},json(value){payload=value;return this}};
  handler({method:'POST',body},res);
  return {status,payload};
 };
 const first=invoke({question:'Analyze a hypothetical matchup',responses:[]});
 assert.equal(first.status,200);
 assert.equal(first.payload.recipient,'openai');
 assert.equal(first.payload.generatedByAI,false);
 assert.equal(first.payload.providerRequestsEnabled,false);
 const second=invoke({question:'Analyze a hypothetical matchup',responses:['Initial analysis']});
 assert.equal(second.payload.recipient,'gemini');
 assert.match(second.payload.prompt,/OPENAI: Initial analysis/);
 assert.equal(invoke({question:'Test',responses:['']}).status,400);
});

test('public offline endpoint rejects oversized payloads without invoking providers',async()=>{
 const {default:handler}=await import('../api/council-demo.js');
 const invoke=body=>{
  let status=200,payload;
  const res={setHeader(){},status(code){status=code;return this},json(value){payload=value;return this}};
  handler({method:'POST',body},res);
  return {status,payload};
 };
 assert.equal(invoke({question:'Q'.repeat(4001),responses:[]}).status,413);
 assert.equal(invoke({question:'Q',responses:['A'.repeat(6001)]}).status,413);
 assert.equal(invoke({question:'Q',responses:Array(5).fill('valid')}).status,413);
 assert.equal(invoke({question:'Q',responses:'not an array'}).status,413);
 assert.equal(invoke(null).status,400);
});

test('provider testing transport refuses oversized output without retry',async()=>{
 const {sendProviderRequestForTesting}=await import('../lib/provider-executor.js');
 const result=await sendProviderRequestForTesting({
  provider:'llama',prompt:'Analyze test matchup',apiKey:'test-only-key',model:'test-model',llamaHost:'groq',
  httpClient:async()=>({ok:true,status:200,json:async()=>({choices:[{message:{content:'X'.repeat(6001)}}]})})
 });
 assert.equal(result.ok,false);
 assert.equal(result.retryAutomatically,false);
 assert.match(result.error,/exceeds council limit/);
});

test('offline council endpoint never accepts GET or exposes live transport',async()=>{
 const {default:handler}=await import('../api/council-demo.js');
 let status=200,payload;
 const res={setHeader(){},status(code){status=code;return this},json(value){payload=value;return this}};
 handler({method:'GET',body:{question:'Test'}},res);
 assert.equal(status,405);
 assert.equal(payload.ok,false);
 status=200;
 handler({method:'POST',body:{question:'Test',responses:[]}},res);
 assert.equal(status,200);
 assert.equal(payload.providerRequestsEnabled,false);
 assert.equal(payload.monthlySpendLimitUsd,0);
 assert.equal(payload.generatedByAI,false);
});

test('provider normalizer never silently truncates evidence',async()=>{
 const {normalizeProviderResponse}=await import('../lib/provider-response.js');
 const normal=normalizeProviderResponse('llama',{choices:[{message:{content:'Verified mock text'}}]});
 assert.equal(normal.ok,true);
 assert.equal(normal.truncated,false);
 const excessive=normalizeProviderResponse('llama',{choices:[{message:{content:'E'.repeat(6001)}}]});
 assert.equal(excessive.ok,false);
 assert.equal(excessive.retryAutomatically,false);
 assert.match(excessive.error,/exceeds council limit/);
});

test('offline auto-demo executes four simulated stages without provider transport',async()=>{
 const {default:handler}=await import('../api/council-demo.js');
 let status=0,payload;
 const res={setHeader(){},status(code){status=code;return this},json(body){payload=body;return this}};
 await handler({method:'POST',body:{mode:'offline-auto-demo',question:'Review basketball matchup'}},res);
 assert.equal(status,200);
 assert.equal(payload.ok,true);
 assert.equal(payload.mode,'offline-auto-demo');
 assert.equal(payload.generatedByAI,false);
 assert.equal(payload.providerRequestsEnabled,false);
 assert.equal(payload.liveCalls,false);
 assert.equal(payload.monthlySpendLimitUsd,0);
 assert.equal(payload.responses.length,4);
 assert.ok(payload.responses.every(reply=>reply.includes('SIMULATED')));
});

test('mobile offline demo prevents overlapping requests',()=>{
 assert.match(html,/id="chatAutoDemo"/);
 assert.match(html,/if\(demoButton\.disabled\)return/);
 assert.match(html,/demoButton\.disabled=true/);
 assert.match(html,/finally\{clearTimeout\(timeout\);demoButton\.disabled=false;\}/);
 assert.match(html,/mode:'offline-auto-demo'/);
});

test('mobile offline demo cancels stalled requests and clears timeout',()=>{
 assert.match(html,/setTimeout\(\(\)=>controller\.abort\(\),10000\)/);
 assert.match(html,/signal:controller\.signal/);
 assert.match(html,/clearTimeout\(timeout\);demoButton\.disabled=false/);
});

test('mobile simulation discards results if director changes the question',()=>{
 assert.match(html,/chatText\('chatQuestion'\)\.value\.trim\(\)!==question/);
 assert.match(html,/Previous simulation discarded/);
});

test('copy report accepts offline simulations without dropping simulation label',()=>{
 assert.match(html,/report\.includes\('LOCAL COUNCIL REVIEW'\)/);
 assert.match(html,/report\.includes\('SIMULATED COUNCIL'\)/);
 assert.match(html,/navigator\.clipboard\.writeText\(report\)/);
});

test('offline council API requires JSON when content type is supplied',async()=>{
 const {default:handler}=await import('../api/council-demo.js');
 const run=async(method,headers)=>{
  let status=0,payload;const h={};
  const res={setHeader(k,v){h[k]=v},status(code){status=code;return this},json(body){payload=body;return this}};
  await handler({method,headers,body:{mode:'offline-auto-demo',question:'Review matchup'}},res);
  return {status,payload,h};
 };
 const rejected=await run('POST',{'content-type':'text/plain'});
 assert.equal(rejected.status,415);
 assert.equal(rejected.h['X-Council-Mode'],'offline-only');
 const accepted=await run('POST',{'content-type':'application/json; charset=utf-8'});
 assert.equal(accepted.status,200);
 const method=await run('GET',{});
 assert.equal(method.status,405);
 assert.equal(method.h.Allow,'POST');
});

test('offline council API rejects oversized declared request bodies',async()=>{
 const {default:handler}=await import('../api/council-demo.js');
 const run=async(length)=>{
  let status=0,payload;
  const res={setHeader(){},status(code){status=code;return this},json(body){payload=body;return this}};
  await handler({method:'POST',headers:{'content-type':'application/json','content-length':length},body:{mode:'offline-auto-demo',question:'Review matchup'}},res);
  return {status,payload};
 };
 assert.equal((await run('30001')).status,413);
 assert.equal((await run('-1')).status,413);
 assert.equal((await run('invalid')).status,413);
 assert.equal((await run('100')).status,200);
});

test('offline council enforces actual UTF-8 body size even with misleading length',async()=>{
 const {default:handler}=await import('../api/council-demo.js');
 const run=async(body)=>{
  let status=0;const res={setHeader(){},status(code){status=code;return this},json(){return this}};
  await handler({method:'POST',headers:{'content-type':'application/json','content-length':'1'},body},res);
  return status;
 };
 assert.equal(await run({question:'a'.repeat(31000)}),413);
 assert.equal(await run({question:'\u{1F680}'.repeat(8000)}),413);
 assert.equal(await run({mode:'offline-auto-demo',question:'Review matchup'}),200);
});
