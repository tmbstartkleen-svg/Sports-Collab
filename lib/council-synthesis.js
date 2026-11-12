// Extracts attributed passages from supplied responses; never invents consensus.
const PROVIDERS=['openai','gemini','llama'];
const MARKETS=/\b(?:moneyline|spread|total|over|under|odds|prop|assists|rebounds|points)\b/i;
const HEALTH=/\b(?:injury|injured|questionable|doubtful|probable|inactive|out|lineup|roster)\b/i;
const UNCERTAINTY=/\b(?:unknown|unconfirmed|uncertain|unavailable|verify|unverified|pending)\b/i;
function snippets(value){
 if(typeof value!=='string')return [];
 return value.split(/\r?\n/).map(x=>x.trim()).filter(x=>x.length>=15).slice(0,120);
}
export function synthesizeCouncil(responses={}){
 const evidence=[],risks=[],marketClaims=[];
 for(const provider of PROVIDERS){
  const lines=snippets(responses[provider]);
  for(const line of lines){
   const record={provider,excerpt:line.slice(0,500),verified:false};
   if(MARKETS.test(line)&&marketClaims.length<24)marketClaims.push(record);
   if(HEALTH.test(line)&&evidence.length<24)evidence.push(record);
   if(UNCERTAINTY.test(line)&&risks.length<24)risks.push(record);
  }
 }
 return {mode:'attributed-excerpt-synthesis',generatedByAI:false,marketClaims,evidenceCandidates:evidence,uncertainties:risks,verifiedFacts:0,approvedWagers:0,warning:'These are excerpts of user-pasted responses, not validated evidence. No cross-provider agreement or odds edge is certified.'};
}
