import test from 'node:test';
import assert from 'node:assert/strict';
import {scan,demoRows,decimalOdds,buildSlips,safeLink} from '../lib/edge.mjs';
const now=Date.parse('2026-11-11T12:00:00Z');
const real=()=>demoRows(now).map(r=>({...r,isDemo:false}));
test('American odds and no-vig estimate produce the expected value',()=>{
  assert.equal(decimalOdds(125),2.25);assert.equal(decimalOdds(-200),1.5);
  for(const x of [null,'125',0,50,NaN,Infinity])assert.throws(()=>decimalOdds(x));
  const [row]=scan(real(),{now});
  const a=(115/215)/(115/215+105/205),b=(120/220)/(120/220+0.5);
  assert.ok(Math.abs(row.probability-(a+b)/2)<1e-12);
  assert.ok(Math.abs(row.ev-((a+b)/2*2.25-1))<1e-12);
  assert.equal(row.eligible,true);assert.deepEqual(row.referenceBooks,['Reference A','Reference B']);
});
test('different lines, event identities, periods and settlements cannot join',()=>{
  for(const [field,value] of [['line',3.5],['period','first-half'],['settlement','regulation-only'],['eventId','different-event'],['marketId','other-market']]){
    const rows=real().map(r=>r.book==='Reference A'?{...r,[field]:value}:r);
    const [row]=scan(rows,{now});assert.equal(row.probability,null);assert.equal(row.eligible,false);
  }
});
test('one-sided or duplicate references never count as two complete books',()=>{
  const rows=real().filter(r=>!(r.book==='Reference B'&&r.outcome==='Demo Wolves'));
  rows.push({...rows.find(r=>r.book==='Reference A'),id:'duplicate'});
  const [row]=scan(rows,{now});assert.equal(row.referenceBooks.length,1);assert.equal(row.probability,null);
});
test('draw markets require all three outcomes at every reference book',()=>{
  const rows=real().map(r=>({...r,kind:'three-way',outcomes:[...r.outcomes,'Draw']}));
  assert.equal(scan(rows,{now})[0].eligible,false);
  for(const book of ['DraftKings','Reference A','Reference B'])rows.push({...rows.find(r=>r.book===book),id:book+'-draw',outcome:'Draw',selection:'Draw',odds:300});
  const result=scan(rows,{now});assert.ok(result.every(r=>r.referenceBooks.length===2));
  assert.ok(Math.abs(result.reduce((sum,r)=>sum+r.probability,0)-1)<1e-12);
});
test('stale, started, missing evidence, push-capable, and disabled markets are blocked',()=>{
  const changes=[{observedAt:new Date(now-121000).toISOString()},{startsAt:new Date(now-1000).toISOString()},{verified:false},{evidenceUrl:''},{evidenceUrl:'javascript:alert(1)'},{evidenceCheckedAt:new Date(now-3600001).toISOString()},{noPush:false},{available:false}];
  for(const change of changes){const rows=real().map(r=>(change.startsAt||r.book==='DraftKings')?{...r,...change}:r);assert.equal(scan(rows,{now})[0].eligible,false);}
});
test('a newer unavailable quote supersedes an old available quote',()=>{
  const rows=real();const old=rows[0];rows.push({...old,id:'latest-disabled',observedAt:new Date(now+1000).toISOString(),available:false});
  const row=scan(rows,{now}).find(r=>r.outcome===old.outcome);assert.equal(row.available,false);assert.equal(row.eligible,false);
});
test('US prediction markets require verified fee, identity, and executable liquidity',()=>{
  const rows=real().map(r=>r.book==='DraftKings'?{...r,book:'Polymarket US'}:r);
  assert.equal(scan(rows,{now})[0].eligible,false);
  for(const r of rows.filter(r=>r.book==='Polymarket US'))Object.assign(r,{usMarketVerified:true,feesVerified:true,liquidityVerified:true,feePerDollar:0.03});
  const [r]=scan(rows,{now});assert.equal(r.eligible,true);assert.ok(Math.abs(r.ev-(r.probability*2.25-1-0.03))<1e-12);
  const global=rows.map(r=>r.book==='Polymarket US'?{...r,book:'Polymarket'}:r);assert.equal(scan(global,{now}).length,0);
});
test('invalid rows fail atomically rather than fabricating freshness or odds',()=>{
  for(const change of [{line:undefined},{odds:null},{observedAt:new Date(now+6000).toISOString()},{outcomes:['one']},{modelProbability:null},{feePerDollar:NaN}]){
    const rows=real();Object.assign(rows[0],change);assert.throws(()=>scan(rows,{now}));
  }
});
test('demo prices can be explored but cannot become real slips',()=>{
  const rows=scan(demoRows(now),{now});assert.equal(rows[0].eligible,true);assert.deepEqual(buildSlips(rows),[]);
});
test('slips preserve exact selection text and odds, dedupe and keep destinations separate',()=>{
  const [row]=scan(real(),{now});
  const groups=buildSlips([row,row,{...row,book:'Polymarket US'}]);assert.equal(groups.length,2);assert.equal(groups[0].rows.length,1);
  assert.match(groups[0].text,/Demo Hawks moneyline \| \+125/);assert.match(groups[0].text,/full-game/);assert.match(groups[0].text,/SINGLES/);
});
test('same-game parlay correlation blocks naive combination',()=>{
  const [row]=scan(real(),{now});assert.throws(()=>buildSlips([row,{...row,outcome:'other',marketId:'prop'}],{mode:'parlay'}),/SGP/);
});
test('unsafe and fabricated host links are rejected',()=>{
  for(const link of ['javascript:alert(1)','https://gambly.com.evil.test/a','http://gambly.com/a','https://user:pass@gambly.com/a','https://gambly.com:9999/a','https://sportsbook.draftkings.com/event/foo?outcomes=1+2'])assert.equal(safeLink(link),null);
  assert.equal(safeLink('https://sportsbook.draftkings.com/social/post/abc?slipAdd'),'https://sportsbook.draftkings.com/social/post/abc?slipAdd');
});
