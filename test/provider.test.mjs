import test from 'node:test';
import assert from 'node:assert/strict';
import {UnabatedClient} from '../lib/unabated.mjs';
import {createApp} from '../server.mjs';
const configured={key:'test-secret-never-return',partnerCode:'test-partner',enabled:true,eligible:true};
test('default config performs no provider calls',async()=>{
  let count=0;const c=new UnabatedClient({fetchImpl:()=>{count++;}});
  await assert.rejects(c.odds('nba','straight'),/disabled/);assert.equal(count,0);
});
test('concurrent odds requests share a five-second scheduler, including Retry-After',async()=>{
  let clock=10000;const times=[];
  const c=new UnabatedClient({...configured,now:()=>clock,sleep:async ms=>{clock+=ms;},fetchImpl:async()=>{times.push(clock);return Response.json({success:true,data:{odds:{}}});}});
  await Promise.all([c.odds('nba','straight'),c.odds('nfl','props'),c.odds('nhl','straight')]);
  assert.deepEqual(times,[10000,15000,20000]);
  let first=true;
  c.fetchImpl=async()=>{times.push(clock);if(first){first=false;return new Response('not echoed',{status:429,headers:{'Retry-After':'12'}});}return Response.json({success:true,data:{odds:{}}});};
  await assert.rejects(c.odds('nba','straight'),/429/);await c.odds('nba','straight');
  assert.equal(times.at(-1)-times.at(-2),12000);
});
test('provider failures redact upstream bodies and validate success envelope',async()=>{
  const c=new UnabatedClient({...configured,fetchImpl:async()=>new Response('test-secret-never-return',{status:401})});
  await assert.rejects(c.lookup('/league'),e=>!e.message.includes(configured.key)&&e.message.includes('rejected'));
  c.fetchImpl=async()=>Response.json({success:false,messages:[configured.key]});await assert.rejects(c.lookup('/league'),e=>!e.message.includes(configured.key));
});
test('generic odds links receive attribution once; alternate point links retain their own path',async()=>{
  const c=new UnabatedClient({...configured,fetchImpl:async()=>Response.json({success:true,data:{odds:{line:{deepLink:'https://gambly.com/deeplink/odds/book/main/3.5',alternateLines:[{deepLink:'https://gambly.com/deeplink/odds/book/main/4.5'}]}}}})});
  const data=await c.odds('nba','straight');assert.match(data.data.odds.line.deepLink,/3.5\?utm_campaign=test-partner$/);assert.match(data.data.odds.line.alternateLines[0].deepLink,/4.5\?utm_campaign=test-partner$/);
  assert.equal(new URL(c.attributedLink(c.attributedLink('https://gambly.com/deeplink/test'))).searchParams.getAll('utm_campaign').length,1);
});
test('slip generation uses documented text content and returned request ID',async()=>{
  const calls=[];const id='00000000-0000-4000-8000-000000000001';
  const c=new UnabatedClient({...configured,fetchImpl:async(url,opts)=>{calls.push({url,opts});return Response.json(url.endsWith('/generate')?{status:'pending',requestId:id}:{status:'Complete',betSlips:[]});}});
  assert.equal((await c.generate('Exact selections','DraftKings')).requestId,id);
  assert.equal(JSON.parse(calls[0].opts.body).content.text,'DraftKings only. Exact selections');
  await c.slipStatus(id);assert.ok(calls[1].url.endsWith(id));
  await assert.rejects(c.generate('x','Polymarket'),/supported book/);
});
async function withServer(options,fn){const server=createApp(options);await new Promise(r=>server.listen(0,'127.0.0.1',r));try{await fn(`http://127.0.0.1:${server.address().port}`);}finally{server.closeAllConnections();await new Promise(r=>server.close(r));}}
test('review preview never calls even a configured provider and never returns secrets',async()=>{
  let called=false;const client={configured:true,lookup:()=>{called=true;}};
  await withServer({client,preview:true},async base=>{
    const health=await (await fetch(base+'/api/health')).json();assert.equal(health.providerConfigured,false);assert.equal(health.wageringEnabled,false);assert.equal(health.spendingEnabled,false);
    assert.equal((await fetch(base+'/api/discovery')).status,503);assert.equal(called,false);
    assert.equal((await fetch(base+'/.env')).status,404);
    assert.equal((await fetch(base+'/lib/unabated.mjs')).status,404);
    assert.equal((await fetch(base+'/')).status,200);
  });
});
test('local API rejects cross-origin POSTs and unknown-session polling',async()=>{
  await withServer({},async base=>{
    assert.equal((await fetch(base+'/api/slips',{method:'POST',headers:{Origin:'https://attacker.test','Content-Type':'application/json'},body:'{}'})).status,403);
    assert.equal((await fetch(base+'/api/slips/00000000-0000-4000-8000-000000000001')).status,404);
  });
});
test('partially matched slips retain counts; unsupported global Polymarket is filtered',async()=>{
  const id='00000000-0000-4000-8000-000000000001';
  const client={configured:true,generate:async()=>({status:'pending',requestId:id}),slipStatus:async()=>({status:'Complete',betSlips:[{book:'DraftKings',legsRequested:3,legsMatched:2,deepLink:'https://gambly.com/deeplink/test',betslipBets:[]},{book:'Polymarket',legsRequested:3,legsMatched:3}]})};
  await withServer({client},async base=>{
    const submitted=await fetch(base+'/api/slips',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({book:'DraftKings',text:'test'})});assert.equal(submitted.status,202);
    const result=await (await fetch(base+'/api/slips/'+id)).json();assert.equal(result.betSlips.length,1);assert.equal(result.betSlips[0].legsMatched,2);assert.match(result.betSlips[0].linkStatus,/untested/);
  });
});
