// Market consensus is a price estimate, never a calibrated simulation probability.
export const PLAY_BOOKS = ['DraftKings', 'Polymarket US'];
const present = v => v !== undefined && v !== null && String(v).trim() !== '';
export function decimalOdds(american) {
  if (typeof american !== 'number' || !Number.isFinite(american) || Math.abs(american) < 100) throw new Error('American odds must be numeric and at least +100 or at most -100.');
  return american > 0 ? 1 + american / 100 : 1 + 100 / -american;
}
export function safeLink(value) {
  try {
    const u = new URL(value);
    const hosts = ['gambly.com', 'www.gambly.com', 'sportsbook.draftkings.com', 'polymarket.us', 'www.polymarket.us'];
    if (u.protocol !== 'https:' || !hosts.includes(u.hostname) || u.username || u.password || u.port) return null;
    if (u.hostname==='sportsbook.draftkings.com' && (!u.pathname.startsWith('/social/post/') || u.searchParams.has('outcomes'))) return null;
    return u.href;
  } catch { return null; }
}
export function selectionKey(r) {
  return JSON.stringify([r.league, r.eventId, r.marketId, r.period, r.line, r.settlement, r.outcome]);
}
function groupKey(r) { return JSON.stringify([r.league,r.eventId,r.marketId,r.period,r.line,r.settlement]); }
export function validateRows(input, now = Date.now()) {
  if (!Array.isArray(input) || input.length > 10000) throw new Error('Import a JSON array with at most 10,000 prices.');
  const rows = input.map((r,i) => {
    if (!r || typeof r !== 'object' || Array.isArray(r)) throw new Error(`Row ${i+1}: expected an object.`);
    for (const key of ['id','league','eventId','event','marketId','market','selection','period','settlement','outcome','book','observedAt','startsAt']) {
      if (typeof r[key] !== 'string' || !r[key].trim() || r[key].length > 500) throw new Error(`Row ${i+1}: missing or invalid ${key}.`);
    }
    if (!(r.line === null || (typeof r.line === 'number' && Number.isFinite(r.line)))) throw new Error(`Row ${i+1}: line must be a number or null.`);
    if (!['binary','three-way'].includes(r.kind)) throw new Error(`Row ${i+1}: binary or three-way market kind required.`);
    if (!Array.isArray(r.outcomes) || r.outcomes.length !== (r.kind === 'binary' ? 2 : 3) || new Set(r.outcomes).size !== r.outcomes.length || !r.outcomes.every(x=>typeof x==='string'&&x.length>0) || !r.outcomes.includes(r.outcome)) throw new Error(`Row ${i+1}: complete outcome set required.`);
    decimalOdds(r.odds);
    for (const k of ['observedAt','startsAt']) if (!Number.isFinite(Date.parse(r[k]))) throw new Error(`Row ${i+1}: invalid ${k}.`);
    if (Date.parse(r.observedAt) > now + 5000) throw new Error(`Row ${i+1}: future price timestamp.`);
    if (r.feePerDollar !== undefined && (typeof r.feePerDollar !== 'number' || !Number.isFinite(r.feePerDollar) || r.feePerDollar < 0)) throw new Error(`Row ${i+1}: invalid fee.`);
    if (r.modelProbability !== undefined && (typeof r.modelProbability !== 'number' || !Number.isFinite(r.modelProbability) || r.modelProbability <= 0 || r.modelProbability >= 1)) throw new Error(`Row ${i+1}: modelProbability must be between 0 and 1.`);
    return {...r, deepLink:safeLink(r.deepLink), isDemo:r.isDemo===true};
  });
  if (new Set(rows.map(r=>r.id)).size !== rows.length) throw new Error('Every row needs a unique id.');
  // The same declared market must have the same complete outcomes and event time.
  const contracts = new Map();
  for (const r of rows) {
    const contract = JSON.stringify([r.kind,[...r.outcomes].sort(),r.startsAt,r.isDemo]);
    const key = groupKey(r);
    if (contracts.has(key) && contracts.get(key) !== contract) throw new Error('Conflicting market outcome sets, event times, or demo provenance.');
    contracts.set(key,contract);
  }
  return rows;
}
export function scan(input, {now=Date.now(), maxAgeMs=120000, minReferenceBooks=2, minEV=0.02}={}) {
  const rows = validateRows(input,now);
  const latest = new Map();
  for (const r of rows) {
    const key = r.book+'|'+selectionKey(r);
    const old = latest.get(key);
    if (!old || Date.parse(r.observedAt) > Date.parse(old.observedAt)) latest.set(key,r);
    else if (Date.parse(r.observedAt) === Date.parse(old.observedAt) && r.odds !== old.odds) throw new Error('Conflicting prices at the same timestamp.');
  }
  const current = [...latest.values()];
  const usable = r => r.available===true && now-Date.parse(r.observedAt)<=maxAgeMs && Date.parse(r.startsAt)>now && r.noPush===true;
  return current.filter(r=>PLAY_BOOKS.includes(r.book)).map(r=>{
    const reasons=[];
    if (r.available!==true) reasons.push('Market unavailable');
    if (now-Date.parse(r.observedAt)>maxAgeMs) reasons.push('Price older than two minutes');
    if (Date.parse(r.startsAt)<=now) reasons.push('Started event; delayed feed unsuitable');
    if (r.noPush!==true) reasons.push('Push/void rules not modeled');
    if (r.verified!==true) reasons.push('Roster and market evidence not verified');
    let sourceValid=false;
    try{const u=new URL(r.evidenceUrl);sourceValid=u.protocol==='https:'&&!u.username&&!u.password;}catch{}
    if (!sourceValid || !present(r.evidenceCheckedAt) || !Number.isFinite(Date.parse(r.evidenceCheckedAt))) reasons.push('Missing evidence source/time');
    else if (Date.parse(r.evidenceCheckedAt)>now+5000 || now-Date.parse(r.evidenceCheckedAt)>3600000) reasons.push('Evidence needs a fresh review');
    if (r.book==='Polymarket US' && (r.usMarketVerified!==true || r.feesVerified!==true || r.liquidityVerified!==true || typeof r.feePerDollar!=='number')) reasons.push('US market, fees, and executable liquidity require verification');
    const peers=current.filter(p=>p.book!==r.book && groupKey(p)===groupKey(r) && usable(p));
    const byBook=new Map();
    for (const p of peers) { if(!byBook.has(p.book))byBook.set(p.book,[]);byBook.get(p.book).push(p); }
    const estimates=[];
    for(const [book,prices] of byBook){
      if(r.outcomes.some(o=>!prices.some(p=>p.outcome===o)))continue;
      const implied=prices.map(p=>({outcome:p.outcome,p:1/decimalOdds(p.odds)}));
      const total=implied.reduce((s,p)=>s+p.p,0);
      // Missing a draw or mixing lines cannot silently become a two-way board.
      const own=implied.find(p=>p.outcome===r.outcome);
      if(own && total>0)estimates.push({book,p:own.p/total});
    }
    if(estimates.length<minReferenceBooks)reasons.push('Need two complete reference books at this exact market/line');
    const probability=estimates.length>=minReferenceBooks ? estimates.reduce((s,x)=>s+x.p,0)/estimates.length : null;
    const decimal=decimalOdds(r.odds);
    const fee=r.feePerDollar??0;
    const ev=probability===null?null:probability*decimal-1-fee;
    if(ev!==null&&ev<minEV)reasons.push('Below 2% estimated value');
    return {...r,decimal,probability,ev,implied:1/decimal,referenceBooks:estimates.map(x=>x.book),reasons,eligible:reasons.length===0};
  }).sort((a,b)=>(b.ev??-Infinity)-(a.ev??-Infinity));
}
export function buildSlips(rows, {batchSize=15, mode='singles'}={}) {
  if(!Number.isInteger(batchSize)||batchSize<1||batchSize>20)throw new Error('Choose 1–20 selections per batch.');
  if(!['singles','parlay'].includes(mode))throw new Error('Unknown slip type.');
  const groups=[];
  for(const book of PLAY_BOOKS){
    const seen=new Set();
    const candidates=rows.filter(r=>r.book===book && r.eligible && !r.isDemo).filter(r=>{const key=selectionKey(r);if(seen.has(key))return false;seen.add(key);return true;});
    if(mode==='parlay'){
      const events=candidates.map(r=>r.eventId);
      if(new Set(events).size!==events.length)throw new Error('Same-game selections need a separately priced SGP; correlation is unresolved.');
    }
    for(let i=0;i<candidates.length;i+=batchSize){
      const batch=candidates.slice(i,i+batchSize);
      groups.push({book,rows:batch,text:[`${book} — ${mode==='singles'?'SINGLES (each selection separately)':'PARLAY (price and correlation require review)'}`,...batch.map(r=>`${r.league} | ${r.event} | ${r.period} | ${r.market} | ${r.selection} | ${r.odds>0?'+':''}${r.odds}`),'Stake: enter manually. Recheck exact line and odds before placing.'].join('\n')});
    }
  }
  return groups;
}
export function demoRows(now=Date.now()) {
  const rows=[];
  for(const [book,prices] of [['DraftKings',[125,-145]],['Reference A',[-115,-105]],['Reference B',[-120,100]]]){
    for(let i=0;i<2;i++)rows.push({id:`demo-${book}-${i}`,league:'DEMO',eventId:'demo-event',event:'Demo Hawks @ Demo Wolves',marketId:'demo-ml',market:'Moneyline',selection:['Demo Hawks moneyline','Demo Wolves moneyline'][i],period:'full-game',settlement:'includes-overtime',kind:'binary',outcomes:['Demo Hawks','Demo Wolves'],outcome:['Demo Hawks','Demo Wolves'][i],line:null,book,odds:prices[i],observedAt:new Date(now).toISOString(),startsAt:new Date(now+86400000).toISOString(),available:true,noPush:true,verified:true,evidenceUrl:'https://example.com/demo-only',evidenceCheckedAt:new Date(now).toISOString(),isDemo:true});
  }
  return rows;
}
