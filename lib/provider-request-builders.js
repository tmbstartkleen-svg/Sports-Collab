// Server-only request builders. No fetch, network, or execution is performed.
// Callers must enforce authentication, explicit approval and budget before use.
export function buildProviderRequest({provider,prompt,apiKey,model,llamaHost}={}){
 if(typeof prompt!=='string'||!prompt.trim()||prompt.length>4000)throw new Error('Invalid prompt');
 if(typeof apiKey!=='string'||!apiKey.trim())throw new Error('Missing provider key');
 if(provider==='openai'){
   return {url:'https://api.openai.com/v1/responses',method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+apiKey},body:JSON.stringify({model:model||'gpt-4.1-mini',input:prompt,max_output_tokens:500})};
 }
 if(provider==='gemini'){
   const m=model||'gemini-2.5-flash';
   if(!/^[a-zA-Z0-9._-]+$/.test(m))throw new Error('Invalid model');
   return {url:'https://generativelanguage.googleapis.com/v1beta/models/'+m+':generateContent',method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':apiKey},body:JSON.stringify({contents:[{parts:[{text:prompt}]}],generationConfig:{maxOutputTokens:500}})};
 }
 if(provider==='llama'){
   // Llama is a model family, not an API host. Require an explicit approved host.
   const hosts={groq:'https://api.groq.com/openai/v1/chat/completions',together:'https://api.together.xyz/v1/chat/completions',fireworks:'https://api.fireworks.ai/inference/v1/chat/completions',openrouter:'https://openrouter.ai/api/v1/chat/completions',sambanova:'https://api.sambanova.ai/v1/chat/completions'};
   if(!Object.hasOwn(hosts,llamaHost))throw new Error('Explicit supported Llama host required');
   if(typeof model!=='string'||!model.trim()||!/^[a-zA-Z0-9._:/-]+$/.test(model))throw new Error('Explicit Llama model required');
   return {url:hosts[llamaHost],method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+apiKey},body:JSON.stringify({model,messages:[{role:'user',content:prompt}],max_tokens:500})};
 }
 throw new Error('Provider transport not configured');
}
export function redactProviderRequest(request){
 return {method:request.method,host:new URL(request.url).host,bodyBytes:request.body.length};
}
