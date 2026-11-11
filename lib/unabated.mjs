const BASE='https://data.unabated.com';
export class ProviderError extends Error {
  constructor(message,status=502,retryAfter=null){super(message);this.status=status;this.retryAfter=retryAfter;}
}
export class UnabatedClient {
  constructor({key,partnerCode,enabled=false,eligible=false,fetchImpl=fetch,now=Date.now,sleep=ms=>new Promise(r=>setTimeout(r,ms)),minInterval=5000}={}){
    Object.assign(this,{key,partnerCode,enabled,eligible,fetchImpl,now,sleep,minInterval});
    this.queue=Promise.resolve();this.nextAt=0;this.cache=new Map();
  }
  get configured(){return Boolean(this.key&&this.partnerCode&&this.enabled&&this.eligible);}
  async request(path,{method='GET',body,odds=false}={}){
    if(!this.configured)throw new ProviderError('Provider disabled. Confirm free eligibility and configure server secrets first.',503);
    const run=async()=>{
      if(odds){await this.sleep(Math.max(0,this.nextAt-this.now()));this.nextAt=this.now()+this.minInterval;}
      const response=await this.fetchImpl(BASE+path,{method,headers:{'X-Api-Key':this.key,Accept:'application/json',...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(20000)}).catch(()=>{throw new ProviderError('Provider connection failed.');});
      if(!response.ok){
        const raw=response.headers.get('retry-after');
        const seconds=raw ? (/^\d+$/.test(raw)?Number(raw):Math.max(0,Math.ceil((Date.parse(raw)-this.now())/1000))) : null;
        const retry=Number.isFinite(seconds)?seconds:null;
        if(response.status===429||response.status===503)this.nextAt=Math.max(this.nextAt,this.now()+(retry??5)*1000);
        // Do not echo upstream response bodies, which may contain credentials.
        throw new ProviderError(response.status===401?'Provider key rejected.':response.status===403?'Unavailable for this API tier.':`Provider HTTP ${response.status}.`,response.status===401||response.status===403?502:response.status,retry);
      }
      let data;try{data=await response.json();}catch{throw new ProviderError('Provider returned invalid JSON.');}
      if(data.success===false)throw new ProviderError('Provider reported an unsuccessful request.');
      return data;
    };
    // Every odds request in this one-process server shares a scheduler.
    if(odds){const pending=this.queue.then(run,run);this.queue=pending.catch(()=>{});return pending;}
    return run();
  }
  async lookup(path){
    const cached=this.cache.get(path);
    if(cached&&this.now()-cached.at<3600000)return cached.data;
    const data=await this.request(path);
    if(data.success!==true||data.data===undefined)throw new ProviderError('Unexpected discovery response.');
    this.cache.set(path,{at:this.now(),data});return data;
  }
  async odds(league,marketType){
    if(!/^[a-z0-9-]{1,40}$/.test(league)||!['straight','props','futures'].includes(marketType))throw new ProviderError('Invalid league or market type.',400);
    // Caller must discover route names first; no hard-coded provider ID list.
    const result=await this.request(`/market/${league}/${marketType}/odds`,{odds:true});
    if(result.success!==true||!result.data?.odds)throw new ProviderError('Unexpected odds envelope.');
    const attach=(value)=>{
      if(Array.isArray(value))return value.map(attach);
      if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>{
        if(k==='deepLink'&&typeof v==='string'){
          try{return [k,this.attributedLink(v)];}catch{return [k,v];}
        }
        return [k,attach(v)];
      }));
      return value;
    };
    return {data:attach(result.data),notice:'Free delayed snapshot. LastUpdated is not the freshness of every line. Review identities, line timestamps, and settlement rules before analysis.'};
  }
  async sources(league,marketType){
    if(!/^[a-z0-9-]{1,40}$/.test(league)||!['straight','props','futures'].includes(marketType))throw new ProviderError('Invalid league or market type.',400);
    return this.lookup(`/market/${league}/${marketType}/sources`);
  }
  async generate(text,book){
    if(!['DraftKings','Polymarket US'].includes(book)||typeof text!=='string'||!text.trim()||text.length>12000)throw new ProviderError('Provide a supported book and 1–12,000 characters.',400);
    const result=await this.request('/api/v1/bet/generate',{method:'POST',body:{type:'text',generateMobileLinks:true,content:{text:`${book} only. ${text}`}}});
    if(String(result.status).toLowerCase()==='error'||!/^[0-9a-f-]{36}$/i.test(result.requestId??''))throw new ProviderError('Provider did not accept slip generation.');
    return {requestId:result.requestId,status:result.status};
  }
  async slipStatus(id){
    if(!/^[0-9a-f-]{36}$/i.test(id))throw new ProviderError('Invalid request ID.',400);
    return this.request(`/api/v1/bet/status/${id}`);
  }
  attributedLink(value){
    const url=new URL(value);
    if(url.protocol!=='https:'||!['www.gambly.com','gambly.com'].includes(url.hostname)||url.username||url.password||url.port)throw new ProviderError('Unrecognized provider link.');
    url.searchParams.set('utm_campaign',this.partnerCode);
    return url.href;
  }
}
