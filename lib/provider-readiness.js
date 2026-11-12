// Safe server-side provider inventory. Never return secrets or attempt calls.
export const COUNCIL_PROVIDERS=Object.freeze({
 gemini:{envKey:'GEMINI_API_KEY',label:'Google Gemini'},
 openai:{envKey:'OPENAI_API_KEY',label:'OpenAI GPT'},
 llama:{envKey:'LLAMA_API_KEY',label:'Meta Llama (provider unspecified)'},
 claude:{envKey:'ANTHROPIC_API_KEY',label:'Anthropic Claude'},
 grok:{envKey:'XAI_API_KEY',label:'xAI Grok'}
});
export function providerReadiness(env={}){
 return Object.fromEntries(Object.entries(COUNCIL_PROVIDERS).map(([id,provider])=>[
 id,{label:provider.label,configured:typeof env[provider.envKey]==='string'&&env[provider.envKey].trim().length>0,requestsEnabled:false}
 ]));
}
