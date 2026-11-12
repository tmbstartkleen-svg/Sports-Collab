import {compareCouncilResponses} from './council-review.js';
const PROVIDERS=['openai','gemini','llama','claude','grok'];
export function buildCouncilPrompts(question){
 if(typeof question!=='string'||!question.trim()||question.length>4000)throw Error('Invalid question');
 const common='Question: '+question.trim()+'\nUse dated source URLs. Do not invent rosters, odds, injuries or simulations. Explicitly mark unknowns.\n';
 return {
  openai:common+'Role: Market analyst. Evaluate moneylines, spreads, totals and player props, distinguish prices from estimated probabilities.',
  gemini:common+'Role: Evidence auditor. Independently check roster, injuries, lineups, schedule, source freshness and contradictions.',
  llama:common+'Role: Adversarial reviewer. Challenge model assumptions, correlation, uncertainty, selection bias and unsupported edges.',
  claude:common+'Role: Independent synthesis and risk auditor. Examine competing claims, evidence quality, confidence calibration, and unresolved disagreements. Do not assert consensus without support.',
  grok:common+'Role: Contrarian news and market reviewer. Check claims for stale narratives and demand verifiable current sources; do not imply live news access.'
 };
}
export async function runCouncilOffline({question,responses,respond}={}){
 const prompts=buildCouncilPrompts(question);
 if(typeof respond!=='function')throw Error('Injected responder required');
 const results={};
 for(const provider of PROVIDERS){
  const supplied=responses?.[provider];
  if(typeof supplied==='string'&&supplied.trim()){results[provider]=supplied.slice(0,20000);continue}
  const value=await respond(provider,prompts[provider]);
  results[provider]=typeof value==='string'?value.slice(0,20000):'';
 }
 return {mode:'offline-injected',liveProviderCalls:false,prompts,responses:results,review:compareCouncilResponses(results),approvedBetSlip:false};
}
