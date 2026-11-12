// Safe server-side provider inventory. Never return secrets or attempt calls.
export const COUNCIL_PROVIDERS=Object.freeze({
 gemini:{envKey:'GEMINI_API_KEY',label:'Google Gemini'},
 openai:{envKey:'OPENAI_API_KEY',label:'OpenAI GPT'},
 llama:{envKey:'LLAMA_API_KEY',label:'Meta Llama'}
});
export const LLAMA_PROVIDER_OPTIONS=Object.freeze(['groq','together','fireworks','openrouter','meta']);
export function providerReadiness(env={}){
 return Object.fromEntries(Object.entries(COUNCIL_PROVIDERS).map(([id,provider])=>{
  const configured=typeof env[provider.envKey]==='string'&&env[provider.envKey].trim().length>0;
  const llamaHost=id==='llama'?String(env.LLAMA_PROVIDER||'').toLowerCase().trim():null;
  const endpointConfigured=id==='llama'?LLAMA_PROVIDER_OPTIONS.includes(llamaHost):true;
  return [id,{label:provider.label,configured,endpointConfigured,readyForActivation:configured&&endpointConfigured,requestsEnabled:false}];
 }));
}
