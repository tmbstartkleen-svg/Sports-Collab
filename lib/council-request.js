// Request validation for future council adapters. No network operations here.
export const PROVIDER_IDS=Object.freeze(['openai','gemini','llama']);
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

/**
 * Deterministic, offline council handoff. Every seat sees the shared conversation,
 * including prior model replies and the director's latest question.
 * This builds prompts only: it never invokes an AI provider.
 */
export function buildCouncilHandoff({question,history=[],recipient}={}){
 if(!PROVIDER_IDS.includes(recipient))return {ok:false,error:'Unknown recipient'};
 if(typeof question!=='string'||!question.trim()||question.length>MAX_PROMPT_CHARS)return {ok:false,error:'Invalid question'};
 if(!Array.isArray(history)||history.length>24)return {ok:false,error:'Invalid conversation history'};
 const roles={openai:'Lead analyst: evaluate markets, odds and estimated edges',gemini:'Evidence auditor: verify rosters, injuries, schedules and sources',llama:'Critical reviewer: challenge reasoning, correlation and unsupported claims'};
 const transcript=[];
 for(const turn of history){
  if(!turn||!['director',...PROVIDER_IDS].includes(turn.speaker)||typeof turn.text!=='string'||!turn.text.trim()||turn.text.length>6000)return {ok:false,error:'Invalid conversation turn'};
  transcript.push(turn.speaker.toUpperCase()+': '+turn.text.trim());
 }
 const prompt=['You are '+recipient.toUpperCase()+' in a three-model sports research council.',roles[recipient],'The other AIs are independent reviewers, not authorities. Challenge their conclusions when warranted.','Do not invent odds, injuries, sources or probabilities. Clearly flag unverified claims.','DIRECTOR QUESTION: '+question.trim(),'SHARED COUNCIL CONVERSATION:',transcript.length?transcript.join('\n\n'):'No responses yet.','Reply to the director and other council members. Identify agreements, disagreements, evidence gaps, and next checks.'].join('\n\n');
 if(prompt.length>4000)return {ok:false,error:'Shared council transcript exceeds provider prompt limit; shorten responses before continuing',recipient,requiredChars:prompt.length,maxChars:4000};
 return {ok:true,recipient,prompt,turnsSeen:transcript.length,liveCalls:false};
}

/**
 * Bounded council exchange planner. It makes no API calls and cannot spend money.
 * Provider outputs must be supplied by a separate, explicitly authorized transport.
 */
export const COUNCIL_SEQUENCE=Object.freeze(['openai','gemini','llama','openai']);
export function nextCouncilTurn({question,responses=[]}={}){
 if(!Array.isArray(responses)||responses.length>COUNCIL_SEQUENCE.length)return {ok:false,error:'Invalid council responses'};
 const history=[];
 for(let i=0;i<responses.length;i++){
  const response=responses[i];
  if(typeof response!=='string'||!response.trim()||response.length>6000)return {ok:false,error:'Invalid model response'};
  history.push({speaker:COUNCIL_SEQUENCE[i],text:response});
 }
 if(responses.length===COUNCIL_SEQUENCE.length)return {ok:true,complete:true,history,liveCalls:false};
 const recipient=COUNCIL_SEQUENCE[responses.length];
 const handoff=buildCouncilHandoff({question,history,recipient});
 if(!handoff.ok)return handoff;
 return {...handoff,complete:false,round:responses.length+1,totalRounds:COUNCIL_SEQUENCE.length,requiresVerifiedFreeProvider:true};
}

/**
 * Fail-closed live-call eligibility. This does not itself prove provider billing
 * settings; a trusted server operator must independently verify those settings.
 */
export function checkFreeProviderEligibility({provider,serverVerifiedFree=false,billingDisabled=false,authenticated=false,requestsRemaining=0,requestBudget=0}={}){
 if(!PROVIDER_IDS.includes(provider))return {ok:false,reason:'unknown_provider'};
 if(!serverVerifiedFree||!billingDisabled)return {ok:false,reason:'free_billing_not_verified'};
 if(!authenticated)return {ok:false,reason:'unauthorized'};
 if(!Number.isSafeInteger(requestsRemaining)||requestsRemaining<=0)return {ok:false,reason:'free_quota_exhausted'};
 if(!Number.isSafeInteger(requestBudget)||requestBudget<=0)return {ok:false,reason:'request_budget_exhausted'};
 return {ok:true,provider,remainingAfterCall:Math.min(requestsRemaining,requestBudget)-1};
}

export function planVerifiedCouncilStep({question,responses=[],serverPolicy}={}){
 const step=nextCouncilTurn({question,responses});
 if(!step.ok||step.complete)return step;
 if(!serverPolicy||typeof serverPolicy!=='object')return {ok:false,error:'Trusted server policy required'};
 const allowed=checkFreeProviderEligibility({...serverPolicy,provider:step.recipient});
 if(!allowed.ok)return {ok:false,error:'Provider blocked: '+allowed.reason,recipient:step.recipient};
 return {...step,authorization:'eligible_for_server_reservation',remainingAfterCall:allowed.remainingAfterCall};
}
