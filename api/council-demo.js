import {validateCouncilPrompt,nextCouncilTurn} from '../lib/council-request.js';
import {simulateCouncilExchange} from '../lib/provider-executor.js';
// Public, offline-only council preview. Never accesses secrets or provider networks.
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 res.setHeader('X-Content-Type-Options','nosniff');
 res.setHeader('X-Council-Mode','offline-only');
 if(req.method!=='POST')return res.status(405).json({ok:false,error:'Method not allowed'});
 const b=req.body;
 if(b&&typeof b==='object'&&!Array.isArray(b)&&b.mode==='offline-auto-demo'){
  res.setHeader('X-Council-Mode','simulation-only');
  if(typeof b.question!=='string'||b.question.length>4000||!b.question.trim()||Object.keys(b).some(k=>!['mode','question'].includes(k)))
   return res.status(400).json({ok:false,error:'Invalid offline demo request'});
  const result=await simulateCouncilExchange({
   question:b.question,
   mockResponder:async({recipient,round})=>'SIMULATED '+recipient.toUpperCase()+' stage '+round+'. No AI provider was contacted; no sports claims have been verified.'
  });
  return res.status(result.ok?200:400).json({...result,mode:'offline-auto-demo',generatedByAI:false,providerRequestsEnabled:false,monthlySpendLimitUsd:0});
 }
 if(b&&typeof b==='object'&&!Array.isArray(b)&&Object.hasOwn(b,'question')){
  const responses=b.responses===undefined?[]:b.responses;
  if(typeof b.question!=='string'||b.question.length>4000||!Array.isArray(responses)||responses.length>4||responses.some(v=>typeof v!=='string'||v.length>6000))return res.status(413).json({ok:false,error:'Council request exceeds allowed limits'});
  const result=nextCouncilTurn({question:b.question,responses});
  if(!result.ok)return res.status(400).json(result);
  return res.status(200).json({...result,mode:'offline-handoff',generatedByAI:false,providerRequestsEnabled:false,monthlySpendLimitUsd:0});
 }
 const validation=validateCouncilPrompt(b);
 if(!validation.ok)return res.status(400).json(validation);
 return res.status(200).json({ok:true,mode:'offline-demo',provider:validation.provider,generatedByAI:false,response:'Demo only: '+validation.provider.toUpperCase()+' request received. Live AI responses are disabled. Verify roster, injuries, odds, and timestamps before making any sports decision.',providerRequestsEnabled:false,monthlySpendLimitUsd:0});
}
