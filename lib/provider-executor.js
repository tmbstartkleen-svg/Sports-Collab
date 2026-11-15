import {buildProviderRequest} from './provider-request-builders.js';
import {normalizeProviderResponse,normalizeProviderFailure} from './provider-response.js';
// Internal transport: only callable through an injected HTTP client; never exported by public API.
// The production executor below remains hard-disabled until owner auth + atomic quota.
export async function sendProviderRequestForTesting({provider,prompt,apiKey,model,llamaHost,httpClient}={}){
 if(typeof httpClient!=='function')return {ok:false,error:'HTTP client required',retryAutomatically:false};
 let request;
 try{request=buildProviderRequest({provider,prompt,apiKey,model,llamaHost})}
 catch{return {ok:false,error:'Invalid provider request',retryAutomatically:false}}
 try{
   const response=await httpClient(request.url,{method:request.method,headers:request.headers,body:request.body,signal:AbortSignal.timeout(10000)});
   if(!response||typeof response.ok!=='boolean')return {ok:false,error:'Invalid provider response',retryAutomatically:false};
   if(!response.ok)return {...normalizeProviderFailure(response.status),status:response.status};
   const payload=await response.json();
   const normalized=normalizeProviderResponse(provider,payload);
   if(normalized.ok&&typeof normalized.text==='string'&&normalized.text.length>6000)
     return {ok:false,error:'Provider response exceeds council limit',retryAutomatically:false};
   return normalized;
 }catch{return {ok:false,error:'Provider request unavailable',retryAutomatically:false}}
}
export async function executeProvider({authorization}={}){
 if(!authorization||authorization.ownerVerified!==true||authorization.explicitProviderApproval!==true||authorization.enforcedBudgetAvailable!==true)
   return {ok:false,status:503,error:'Owner authentication, explicit approval and enforced budget required'};
 // This remains deliberately disabled, including when forged approval flags are passed.
 return {ok:false,status:503,error:'Provider transport disabled'};
}

/**
 * Offline integration harness: walks all four council turns with a supplied
 * mock responder. No API keys or HTTP transport are used.
 */
export async function simulateCouncilExchange({question,mockResponder,signal}={}){
 const {nextCouncilTurn}=await import('./council-request.js');
 if(typeof mockResponder!=='function')return {ok:false,error:'Mock responder required'};
 const responses=[];
 for(let i=0;i<4;i++){
  if(signal?.aborted)return {ok:false,error:'Council exchange cancelled',round:i+1,responses,liveCalls:false};
  const step=nextCouncilTurn({question,responses});
  if(!step.ok)return {...step,responses,liveCalls:false};
  let answer;
  try{answer=await mockResponder({recipient:step.recipient,prompt:step.prompt,round:step.round})}
  catch{return {ok:false,error:'Mock responder failed',round:i+1,responses,liveCalls:false}};
  if(typeof answer!=='string'||!answer.trim()||answer.length>6000)return {ok:false,error:'Invalid simulated response',round:i+1,responses,liveCalls:false};
  if(signal?.aborted)return {ok:false,error:'Council exchange cancelled',round:i+1,responses,liveCalls:false};
  responses.push(answer);
 }
 return {ok:true,simulated:true,liveCalls:false,responses,history:nextCouncilTurn({question,responses}).history};
}
