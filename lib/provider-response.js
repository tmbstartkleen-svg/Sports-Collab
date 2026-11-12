// Server-side normalization for future provider responses; no network calls.
export function normalizeProviderResponse(provider,payload){
 if(!payload||typeof payload!=='object')return {ok:false,error:'Invalid provider response'};
 let text='';
 if(provider==='openai'){
   text=Array.isArray(payload.output)?payload.output.flatMap(x=>Array.isArray(x.content)?x.content:[]).filter(x=>x.type==='output_text').map(x=>x.text||'').join('\n'):'';
 }else if(provider==='gemini'){
   text=Array.isArray(payload.candidates)?payload.candidates.flatMap(x=>x.content?.parts||[]).map(x=>typeof x.text==='string'?x.text:'').join('\n'):'';
 }else return {ok:false,error:'Unsupported provider'};
 if(!text.trim())return {ok:false,error:'Provider returned no text'};
 return {ok:true,provider,text:text.trim().slice(0,12000),truncated:text.trim().length>12000};
}
export function normalizeProviderFailure(status){
 if(status===429)return {ok:false,error:'Provider rate limit reached',retryAutomatically:false};
 if(status===401||status===403)return {ok:false,error:'Provider authorization failed',retryAutomatically:false};
 return {ok:false,error:'Provider request failed',retryAutomatically:false};
}
