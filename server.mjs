import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {UnabatedClient,ProviderError} from './lib/unabated.mjs';
import {safeLink} from './lib/edge.mjs';

export function createApp({client,preview=false}={}){
  client??=new UnabatedClient({key:process.env.UNABATED_API_KEY,partnerCode:process.env.UNABATED_PARTNER_CODE,enabled:!preview&&process.env.ENABLE_UNABATED==='1',eligible:process.env.UNABATED_FREE_ELIGIBLE==='1'});
  const requests=new Map();
  const files={'/':['public/index.html','text/html'],'/index.html':['public/index.html','text/html'],'/app.mjs':['public/app.mjs','text/javascript'],'/style.css':['public/style.css','text/css'],'/council.html':['public/council.html','text/html'],'/lib/edge.mjs':['lib/edge.mjs','text/javascript']};
  return http.createServer(async(req,res)=>{
    res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Cache-Control','no-store');
    res.setHeader('Content-Security-Policy',"default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'; frame-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'self'");
    const json=(status,body)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(body));};
    try{
      const url=new URL(req.url,'http://localhost');
      if(url.pathname.startsWith('/api/')){
        if(req.method!=='GET'&&req.method!=='POST')return json(405,{error:'Method not allowed.'});
        const host=req.headers.host??'';
        if(!preview&&!/^(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/.test(host))return json(403,{error:'Use the local server address.'});
        if(req.headers.origin && new URL(req.headers.origin).host!==host)return json(403,{error:'Cross-origin requests are not allowed.'});
        if(url.pathname==='/api/health'&&req.method==='GET')return json(200,{mode:preview?'preview':'local',providerConfigured:!preview&&client.configured,spendingEnabled:false,wageringEnabled:false,aiCallsEnabled:false,delayedFeed:true});
        if(preview)return json(503,{error:'Live requests are disabled in the review preview.'});
        if(url.pathname==='/api/discovery'&&req.method==='GET')return json(200,await client.lookup('/league'));
        if(url.pathname==='/api/sources'&&req.method==='GET')return json(200,await client.sources(url.searchParams.get('league')??'',url.searchParams.get('marketType')??'straight'));
        if(url.pathname==='/api/odds'&&req.method==='GET')return json(200,await client.odds(url.searchParams.get('league')??'',url.searchParams.get('marketType')??'straight'));
        if(url.pathname==='/api/slips'&&req.method==='POST'){
          if(!String(req.headers['content-type']).startsWith('application/json'))return json(415,{error:'JSON required.'});
          let bytes=0;const chunks=[];
          for await (const chunk of req){bytes+=chunk.length;if(bytes>65536)return json(413,{error:'Request too large.'});chunks.push(chunk);}
          let body;try{body=JSON.parse(Buffer.concat(chunks));}catch{return json(400,{error:'Invalid JSON.'});}
          if(requests.size>=100)return json(429,{error:'Session request limit reached. Restart locally to clear the session.'});
          const result=await client.generate(body.text,body.book);
          requests.set(result.requestId,{book:body.book,startedAt:Date.now(),lastPoll:0});
          return json(202,result);
        }
        const match=url.pathname.match(/^\/api\/slips\/([0-9a-f-]{36})$/i);
        if(match&&req.method==='GET'){
          const record=requests.get(match[1]);if(!record)return json(404,{error:'Request not found in this local session.'});
          if(Date.now()-record.startedAt>120000)return json(408,{error:'Polling deadline reached. Do not automatically resubmit this slip.'});
          if(Date.now()-record.lastPoll<2000)return json(429,{error:'Wait two seconds between status requests.'});
          record.lastPoll=Date.now();
          const result=await client.slipStatus(match[1]);
          const status=String(result.status).toLowerCase();
          if(!['processing','pending','complete','error'].includes(status))throw new ProviderError('Unknown slip processing status.');
          // Unknown/global Polymarket records are never mislabeled as US markets.
          const betSlips=(result.betSlips??[]).filter(s=>s.book===record.book).map(s=>({book:s.book,overallOdds:s.overallOdds,legsMatched:s.legsMatched,legsRequested:s.legsRequested,deepLink:safeLink(s.deepLink),betslipBets:s.betslipBets,linkStatus:'Returned by provider; native app preload untested'}));
          return json(200,{requestId:match[1],status:result.status,betSlips});
        }
        return json(404,{error:'Unknown API route.'});
      }
      if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);return res.end();}
      const entry=files[url.pathname];if(!entry){res.writeHead(404);return res.end('Not found');}
      const bytes=await readFile(new URL(entry[0],import.meta.url));
      res.writeHead(200,{'Content-Type':entry[1]+'; charset=utf-8'});res.end(req.method==='HEAD'?undefined:bytes);
    }catch(error){
      if(error instanceof ProviderError){if(error.retryAfter!==null)res.setHeader('Retry-After',String(error.retryAfter));return json(error.status,{error:error.message});}
      return json(500,{error:'Request failed. Check local configuration; no credentials were returned.'});
    }
  });
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
  const preview=process.argv.includes('--preview');
  const portFlag=process.argv.indexOf('--port');
  const port=Number(portFlag>=0?process.argv[portFlag+1]:(process.env.PORT??3000));
  createApp({preview}).listen(port,'127.0.0.1',()=>console.log(`Sports Collab review: http://127.0.0.1:${port} (${preview?'provider requests disabled':'local mode'})`));
}
