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
/**
 * Fail-closed preflight for a future server-side provider executor.
 * This is only a policy check: it never reserves quota or makes HTTP calls.
 * A trusted server must reserve quota atomically and verify provider billing
 * restrictions before enabling any production transport.
 */
export function preflightProviderExecution({authorization,policy,provider}={}){
 if(!authorization||authorization.ownerVerified!==true||authorization.explicitProviderApproval!==true)
  return {ok:false,reason:'owner_approval_required'};
 if(!policy||policy.serverVerifiedFree!==true||policy.billingDisabled!==true)
  return {ok:false,reason:'free_billing_not_verified'};
 if(policy.authenticated!==true)
  return {ok:false,reason:'unauthorized'};
 if(!['openai','gemini','llama'].includes(provider))
  return {ok:false,reason:'unknown_provider'};
 if(!Number.isSafeInteger(policy.requestsRemaining)||policy.requestsRemaining<=0)
  return {ok:false,reason:'free_quota_exhausted'};
 if(!Number.isSafeInteger(policy.requestBudget)||policy.requestBudget<=0)
  return {ok:false,reason:'request_budget_exhausted'};
 return {ok:true,provider,requiresAtomicReservation:true,transportEnabled:false};
}
/**
 * Prepare one council step without contacting a provider. The reservation
 * callback must be supplied by a trusted server backed by an atomic quota
 * store; a client-supplied policy object is not proof of free access.
 * Even a successful reservation cannot enable the disabled transport.
 */
export async function reserveCouncilStepForTesting({question,responses=[],authorization,policy,reserveQuota}={}){
 const {nextCouncilTurn}=await import('./council-request.js');
 const step=nextCouncilTurn({question,responses});
 if(!step.ok||step.complete)return step;
 const gate=preflightProviderExecution({authorization,policy,provider:step.recipient});
 if(!gate.ok)return {ok:false,error:'Provider blocked: '+gate.reason,liveCalls:false};
 if(typeof reserveQuota!=='function')return {ok:false,error:'Atomic quota reservation required',liveCalls:false};
 let reservation;
 try{reservation=await reserveQuota({provider:step.recipient,round:step.round});}
 catch{return {ok:false,error:'Quota reservation failed',liveCalls:false};}
 if(!reservation||reservation.reserved!==true||typeof reservation.id!=='string'||!reservation.id.trim()||reservation.provider!==step.recipient||reservation.round!==step.round)
  return {ok:false,error:'Quota reservation denied',liveCalls:false};
 return {...step,reservationId:reservation.id,transportEnabled:false,liveCalls:false};
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
export async function simulateCouncilExchange({question,mockResponder,signal,onStageComplete}={}){
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
  if(typeof onStageComplete==='function'){
   try{await onStageComplete({round:i+1,recipient:step.recipient,response:answer,completed:responses.length,total:4});}
   catch{return {ok:false,error:'Council progress callback failed',round:i+1,responses,liveCalls:false};}
   if(signal?.aborted)return {ok:false,error:'Council exchange cancelled',round:i+1,responses,liveCalls:false};
  }
 }
 return {ok:true,simulated:true,liveCalls:false,responses,history:nextCouncilTurn({question,responses}).history};
}
