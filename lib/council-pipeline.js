// Deterministic three-seat council pipeline. No network access or provider calls.
import {runCouncilOffline} from './council-orchestrator.js';
import {synthesizeCouncil} from './council-synthesis.js';
import {auditCouncilEvidence} from './council-evidence-audit.js';
export async function assembleOfflineCouncil({question,responses}={}){
 if(!responses||typeof responses!=='object'||Array.isArray(responses))throw Error('Three responses required');
 for(const seat of ['openai','gemini','llama']){
  if(typeof responses[seat]!=='string'||!responses[seat].trim()||responses[seat].length>20000)throw Error('Missing or oversized response: '+seat);
 }
 const result=await runCouncilOffline({question,responses,respond:async()=>{throw Error('Provider calls disabled')}});
 return {...result,synthesis:synthesizeCouncil(result.responses),evidenceAudit:auditCouncilEvidence(result.responses)};
}
