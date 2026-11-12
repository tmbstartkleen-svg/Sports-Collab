import {buildCouncilPrompts,runCouncilOffline} from '../lib/council-orchestrator.js';
import {synthesizeCouncil} from '../lib/council-synthesis.js';
import {validateQuotaConfiguration} from '../lib/usage-quota.js';
import {executeProvider} from '../lib/provider-executor.js';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET')return res.status(405).json({ok:false,error:'Method not allowed'});
 const checks={};
 try{
  const prompts=buildCouncilPrompts('Integration health check');
  checks.threeDistinctPrompts=new Set(Object.values(prompts)).size===3;
  const council=await runCouncilOffline({question:'Integration health check',respond:async(provider)=>provider+' unverified odds and injury evidence'});
  checks.offlineCouncil=council.review.entries.length===3&&council.liveProviderCalls===false;
  checks.synthesisSafe=synthesizeCouncil(council.responses).verifiedFacts===0;
  checks.zeroSpendEnforced=validateQuotaConfiguration({monthlyLimitUsd:0,ownerApproved:true}).ok===false;
  checks.liveTransportDisabled=(await executeProvider({authorization:{ownerVerified:true,explicitProviderApproval:true,enforcedBudgetAvailable:true}})).ok===false;
 }catch{checks.internalError=true}
 const ok=Object.values(checks).every(v=>v===true);
 return res.status(ok?200:503).json({ok,checks,mode:'offline-integration-health',providerCallsMade:0,monthlySpendLimitUsd:0});
}
