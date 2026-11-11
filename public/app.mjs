import {scan,demoRows,buildSlips,selectionKey,safeLink} from '/lib/edge.mjs';
const $=id=>document.getElementById(id);
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
let raw=[],results=[],queue=new Set(),storageAvailable=true,toastTimer,pollTimer;
const storageKey='sports-collab-edge-desk-v1';
function notify(message){$('toast').textContent=message;$('toast').style.display='block';clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').style.display='none',6000);}
function persist(){try{localStorage.setItem(storageKey,JSON.stringify({raw,queue:[...queue]}));}catch{storageAvailable=false;$('saveState').textContent='Local saving unavailable. Export your card before closing.';}}
async function copy(text){try{await navigator.clipboard.writeText(text);notify('Copied. Recheck lines and prices before placing.');}catch{notify('Copy is unavailable here. Select and copy the displayed text.');}}
function download(name,data){const url=URL.createObjectURL(new Blob([data],{type:'application/json'}));const a=el('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function pct(value){return value===null?'—':`${(value*100).toFixed(1)}%`;}
function odds(value){return `${value>0?'+':''}${value}`;}
function displayError(error){notify(error.message||'Unable to complete this request.');}
function rerender(){
  try{results=scan(raw);}catch(error){results=[];notify(error.message);}
  const currentKeys=new Set(results.filter(r=>r.eligible&&!r.isDemo).map(selectionKey));
  queue=new Set([...queue].filter(k=>currentKeys.has(k)));
  const demo=raw.length>0&&raw.every(r=>r.isDemo===true);
  $('provenance').replaceChildren(el('span','',demo?'◈':'○'),el('p','',demo?'DEMO DATA — Fictional teams and prices. This demonstrates the calculation; it cannot enter a real card.':raw.length?'IMPORTED SNAPSHOT — Source and verification claims are supplied by you. Two-minute price freshness and one-hour evidence review limits apply.':'Waiting for verified prices. Import a normalized price snapshot or explore the demo. Nothing here is a live pick.'));
  $('edgeCount').textContent=results.filter(r=>r.eligible).length;
  $('reviewCount').textContent=results.filter(r=>!r.eligible).length;
  $('bookCount').textContent=new Set(results.flatMap(r=>r.referenceBooks)).size;
  $('queueCount').textContent=queue.size;
  const filter=$('bookFilter').value;
  const shown=results.filter(r=>filter==='All play books'||r.book===filter);
  $('empty').hidden=shown.length>0;
  $('boardRows').replaceChildren();
  for(const row of shown){
    const card=el('article','market-row');
    const identity=el('div','identity');identity.append(el('h3','',`${row.selection} · ${row.market}`),el('small','',`${row.league} / ${row.event}`),el('small','',`${row.book} · ${row.period} · ${row.isDemo?'DEMO':new Date(row.observedAt).toLocaleTimeString()}`));
    const price=el('div');price.append(el('small','','PRICE'),el('div','odds',odds(row.odds)));
    const estimate=el('div');estimate.append(el('small','','MARKET ESTIMATE'),el('strong','',pct(row.probability)),el('small','',`${row.referenceBooks.length} reference books`));
    const value=el('div');value.append(el('small','','EST. VALUE'),el('strong',row.ev>0?'positive':'negative',row.ev===null?'—':`${row.ev>0?'+':''}${pct(row.ev)}`));
    const action=el('div','action');const add=el('button','button secondary',row.isDemo?'Demo only':queue.has(selectionKey(row))?'Remove':row.eligible?'Add to card':'Needs review');
    add.disabled=row.isDemo||!row.eligible;add.onclick=()=>{const k=selectionKey(row);queue.has(k)?queue.delete(k):queue.add(k);persist();rerender();};action.append(add);
    const details=el('details');details.append(el('summary','',row.reasons.length?`${row.reasons.length} review flags`:'View evidence & calculation'));
    details.append(el('p','',row.reasons.length?row.reasons.join(' · '):'Passes the imported evidence checks. Market consensus remains an estimate.'));
    details.append(el('p','',`Reference books: ${row.referenceBooks.join(', ')||'None complete'}. Implied probability: ${pct(row.implied)}. Settlement: ${row.settlement}. Estimated value = market estimate × decimal payout − 1 − entered fee per dollar risked.`));
    if(row.modelProbability!==undefined)details.append(el('p','',`User-supplied model estimate: ${pct(row.modelProbability)}. Not computed or calibrated by this app.`));
    try{const source=new URL(row.evidenceUrl);if(source.protocol==='https:'){const a=el('a','','Review supplied evidence ↗');a.href=source.href;a.target='_blank';a.rel='noreferrer';details.append(a);}}catch{}
    if(row.deepLink&&!row.isDemo){const a=el('a','',' Inspect supplied slip link (preload untested) ↗');a.href=row.deepLink;a.target='_blank';a.rel='noreferrer';details.append(a);}
    card.append(identity,price,estimate,value,action,details);$('boardRows').append(card);
  }
  renderQueue();
}
function selectedRows(){return results.filter(r=>queue.has(selectionKey(r))&&r.eligible&&!r.isDemo);}
function renderQueue(){
  $('queueRows').replaceChildren();
  const selected=selectedRows();$('queueHint').textContent=selected.length?`${selected.length} current selection${selected.length===1?'':'s'} · stakes entered manually`:'Add selections from the edge board.';
  for(const row of selected){const item=el('div','queue-item');const text=el('div','',`${row.selection} · ${row.market} · ${odds(row.odds)}`);text.append(el('span','',`${row.book} / ${row.event}`));const remove=el('button','text-button','Remove');remove.onclick=()=>{queue.delete(selectionKey(row));persist();rerender();};item.append(text,remove);$('queueRows').append(item);}
  // Rebuilding is required after a selection or freshness change.
  $('slipOutput').replaceChildren();
}
document.querySelectorAll('[data-tab]').forEach(button=>button.onclick=()=>{
  document.querySelectorAll('.tab').forEach(s=>s.hidden=s.id!==button.dataset.tab);
  document.querySelectorAll('[data-tab]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-current',b===button?'page':'false');});
  window.scrollTo({top:0,behavior:'smooth'});
});
$('demo').onclick=()=>{raw=demoRows();queue.clear();persist();rerender();};
$('bookFilter').onchange=rerender;
$('downloadExample').onclick=()=>download('edge-desk-demo-input.json',JSON.stringify(demoRows(),null,2));
$('importFile').onchange=async event=>{
  const file=event.target.files[0];if(!file)return;
  try{if(file.size>3_000_000)throw new Error('Use a JSON file smaller than 3 MB.');const next=JSON.parse(await file.text());scan(next);raw=next;queue.clear();persist();rerender();notify('Imported. Verification claims are user supplied; review the flags.');}catch(error){displayError(error);}event.target.value='';
};
$('clearQueue').onclick=()=>{queue.clear();persist();rerender();};
$('reset').onclick=()=>{raw=[];queue.clear();try{localStorage.removeItem(storageKey);}catch{}rerender();notify('Local prices and queue cleared.');};
$('buildSlips').onclick=()=>{
  try{
    results=scan(raw);const groups=buildSlips(selectedRows(),{batchSize:Number($('batchSize').value),mode:$('slipType').value});
    if(!groups.length)throw new Error('Add current, non-demo selections passing the evidence checks.');
    $('slipOutput').replaceChildren();
    for(const [i,group] of groups.entries()){
      const wrapper=el('div');wrapper.append(el('h3','',`${group.book} · Batch ${i+1}`),el('pre','',group.text));const button=el('button','button secondary','Copy batch');button.onclick=()=>copy(group.text);wrapper.append(button);$('slipOutput').append(wrapper);
    }
  }catch(error){displayError(error);}
};
async function api(path,options={}){const response=await fetch(path,options);let body;try{body=await response.json();}catch{throw new Error('Start the local Node server to use connections.');}if(!response.ok)throw new Error(body.error||'Provider unavailable.');return body;}
async function health(){try{const h=await api('/api/health');$('feedState').textContent=h.providerConfigured?'Configured · not verified':'No live feed';$('providerStatus').textContent=h.providerConfigured?'Server credentials configured. Test discovery and a current board before claiming coverage.':'Provider requests are disabled. Free access and a server-side secret must be configured before a live test. No key belongs in this page or chat.';}catch{$('providerStatus').textContent='This preview is offline. Start the local Node server for provider configuration.';}}
$('discover').onclick=async()=>{try{$('providerOutput').textContent='Loading discovery…';const data=await api('/api/discovery');$('providerOutput').textContent=JSON.stringify(data,null,2);}catch(error){$('providerOutput').textContent=error.message;}};
$('fetchOdds').onclick=async()=>{const button=$('fetchOdds');button.disabled=true;try{$('providerOutput').textContent='Requesting delayed board…';const params=new URLSearchParams({league:$('league').value.trim(),marketType:$('marketType').value});const data=await api('/api/odds?'+params);$('providerOutput').textContent=JSON.stringify(data,null,2);}catch(error){$('providerOutput').textContent=error.message;}finally{button.disabled=false;}};
$('matchSlip').onclick=async()=>{
  clearTimeout(pollTimer);const button=$('matchSlip');button.disabled=true;const output=$('matchedOutput');output.replaceChildren(el('p','','Requesting a match…'));
  try{
    const submitted=await api('/api/slips',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:$('linkText').value,book:$('linkBook').value})});
    const deadline=Date.now()+60000;
    const poll=async()=>{
      try{
        const result=await api('/api/slips/'+encodeURIComponent(submitted.requestId));const status=String(result.status).toLowerCase();
        if(status==='error')throw new Error('Provider could not match the slip. No wager was placed.');
        if(status!=='complete'){
          if(Date.now()>=deadline)throw new Error(`Still processing. Retain request ID ${submitted.requestId}; do not automatically resubmit.`);
          if(!['processing','pending'].includes(status))throw new Error('Unknown provider status.');
          output.replaceChildren(el('p','',`Processing request ${submitted.requestId}…`));pollTimer=setTimeout(poll,2200);return;
        }
        output.replaceChildren();
        if(!result.betSlips?.length)output.append(el('p','','No exact supported-book result returned. Polymarket is not assumed to mean Polymarket US.'));
        for(const slip of result.betSlips??[]){
          output.append(el('p','',`${slip.book}: ${slip.legsMatched??'unknown'} matched / ${slip.legsRequested??'unknown'} requested. Verify every selection.`));
          output.append(el('pre','',JSON.stringify(slip.betslipBets??[],null,2)));
          const url=safeLink(slip.deepLink);
          if(url){const a=el('a','','Open returned slip · native preload untested ↗');a.href=url;a.target='_blank';a.rel='noreferrer';output.append(a);}
        }
        button.disabled=false;
      }catch(error){output.replaceChildren(el('p','',error.message));button.disabled=false;}
    };
    pollTimer=setTimeout(poll,2200);
  }catch(error){output.replaceChildren(el('p','',error.message));button.disabled=false;}
};
try{const stored=JSON.parse(localStorage.getItem(storageKey)||'null');if(stored){scan(stored.raw);raw=stored.raw;queue=new Set(Array.isArray(stored.queue)?stored.queue:[]);}}catch{storageAvailable=false;}
if(!storageAvailable)$('saveState').textContent='Saved data unavailable. Export your card before closing.';
rerender();health();setInterval(()=>{if(raw.length)rerender();},30000);
