// Request validation for future council adapters. No network operations here.
export const PROVIDER_IDS=Object.freeze(['openai','gemini','llama','claude']);
export const MAX_PROMPT_CHARS=4000;
export function validateCouncilPrompt(body){
 if(!body||typeof body!=='object'||Array.isArray(body))return {ok:false,error:'JSON object required'};
 const {provider,prompt}=body;
 if(!PROVIDER_IDS.includes(provider))return {ok:false,error:'Unknown provider'};
 if(typeof prompt!=='string'||!prompt.trim()||prompt.length>MAX_PROMPT_CHARS)return {ok:false,error:'Prompt must contain 1 to 4000 characters'};
 return {ok:true,provider,prompt:prompt.trim()};
}
export function councilRequestGate(){
 return {ok:false,status:503,error:'Live council requests require owner authentication, cost controls and explicit approval'};
}
