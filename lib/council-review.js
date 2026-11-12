// Offline, deterministic comparison. Does not assess truth or call providers.
export function extractClaims(text){
 if(typeof text!=='string')return [];
 return text.split(/(?:\r?\n|[.!?]\s+)/).map(s=>s.trim()).filter(s=>s.length>=18).slice(0,80);
}
export function compareCouncilResponses(responses={}){
 const seats=['openai','gemini','llama','claude','grok'];
 const terms=/\b(?:injury|injured|questionable|out|doubtful|probable|over|under|moneyline|spread|total|odds|percent|probability)\b/i;
 const entries=seats.map(provider=>{
  const value=typeof responses[provider]==='string'?responses[provider]:'';
  const claims=extractClaims(value);
  return {provider,present:!!value.trim(),claimCount:claims.length,reviewCandidates:claims.filter(s=>terms.test(s)).slice(0,8)};
 });
 return {mode:'deterministic-text-review',generatedByAI:false,verifiedFacts:0,entries,missing:entries.filter(e=>!e.present).map(e=>e.provider),warning:'Candidate claims are unverified. Agreement between models is not evidence.'};
}
