import {buildProviderRequest} from './provider-request-builders.js';
import {normalizeProviderResponse,normalizeProviderFailure} from './provider-response.js';
// Internal transport: only callable through an injected HTTP client; never exported by public API.
// The production executor below remains hard-disabled until owner auth + atomic quota.
export async function sendProviderRequestForTesting({provider,prompt,apiKey,model,llamaHost,httpClient}={}){
 if(typeof httpClient!=='function')return {ok:false,error:'HTTP client required'};
 let request;
 try{request=buildProviderRequest({provider,prompt,apiKey,model,llamaHost})}
 catch{return {ok:false,error:'Invalid provider request'}}
 try{
   const response=await httpClient(request.url,{method:request.method,headers:request.headers,body:request.body});
   if(!response||typeof response.ok!=='boolean')return {ok:false,error:'Invalid provider response'};
   if(!response.ok)return {...normalizeProviderFailure(response.status),status:response.status};
   const payload=await response.json();
   return normalizeProviderResponse(provider,payload);
 }catch{return {ok:false,error:'Provider request unavailable',retryAutomatically:false}}
}
export async function executeProvider({authorization}={}){
 if(!authorization||authorization.ownerVerified!==true||authorization.explicitProviderApproval!==true||authorization.enforcedBudgetAvailable!==true)
   return {ok:false,status:503,error:'Owner authentication, explicit approval and enforced budget required'};
 // This remains deliberately disabled, including when forged approval flags are passed.
 return {ok:false,status:503,error:'Provider transport disabled'};
}
