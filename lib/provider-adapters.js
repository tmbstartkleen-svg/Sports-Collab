// Provider request descriptors; deliberately transport-free and inert.
// Never expose API keys in browser responses or log them.
export const PROVIDER_ENDPOINTS=Object.freeze({
 gemini:{host:'generativelanguage.googleapis.com',method:'POST',requires:'GEMINI_API_KEY'},
 openai:{host:'api.openai.com',method:'POST',requires:'OPENAI_API_KEY'},
 llama:{host:null,method:'POST',requires:'LLAMA_API_KEY'}
});
export function describeAdapter(provider){
 const info=PROVIDER_ENDPOINTS[provider];
 if(!info)return {ok:false,error:'Unsupported provider'};
 return {ok:true,provider,configuredBy:info.requires,endpointConfigured:!!info.host,liveCallsEnabled:false};
}
export function requireApprovedExecution({ownerVerified=false,usageBudgetApproved=false,providerEnabled=false}={}){
 if(!ownerVerified||!usageBudgetApproved||!providerEnabled)
   return {ok:false,status:503,error:'Provider execution disabled pending owner authentication and explicit budget approval'};
 return {ok:false,status:503,error:'Provider transport not installed'};
}
