// Offline-only audit checklist. No external research, verification, or model calls.
const SEATS=['openai','gemini','llama'];
const URL=/https?:\/\/[^\s<>"']+/g;
const DATE=/\b20\d{2}[-/]\d{1,2}[-/]\d{1,2}\b/;
export function auditCouncilEvidence(responses={}){
 const seats=SEATS.map(provider=>{
  const text=typeof responses[provider]==='string'?responses[provider]:'';
  const urls=[...new Set((text.match(URL)||[]).map(x=>x.replace(/[),.;]+$/,'')))].slice(0,20);
  return {provider,responsePresent:!!text.trim(),sourceUrls:urls,datedEvidenceMentioned:DATE.test(text),sourcesVerified:false};
 });
 const gaps=[];
 for(const seat of seats){
  if(!seat.responsePresent)gaps.push(seat.provider+': response missing');
  if(!seat.sourceUrls.length)gaps.push(seat.provider+': no source URL supplied');
  if(!seat.datedEvidenceMentioned)gaps.push(seat.provider+': no explicit YYYY-MM-DD evidence date found');
 }
 return {mode:'offline-evidence-inventory',verifiedSources:0,liveProviderCalls:false,seats,gaps,warning:'URLs and dates are extracted from pasted text only; their validity and factual claims have not been checked.'};
}
