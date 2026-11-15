import {validateCouncilPrompt,nextCouncilTurn} from '../lib/council-request.js';
// Public, offline-only council preview. Never accesses secrets or provider networks.
export default function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).json({ok:false,error:'Method not allowed'});
 const b=req.body;
 if(b&&Object.hasOwn(b,'question')){
  const responses=b.responses===undefined?[]:b.responses;
  const result=nextCouncilTurn({question:b.question,responses});
  if(!result.ok)return res.status(400).json(result);
  return res.status(200).json({...result,mode:'offline-handoff',generatedByAI:false,providerRequestsEnabled:false,monthlySpendLimitUsd:0});
 }
 const validation=validateCouncilPrompt(b);
 if(!validation.ok)return res.status(400).json(validation);
 return res.status(200).json({ok:true,mode:'offline-demo',provider:validation.provider,generatedByAI:false,response:'Demo only: '+validation.provider.toUpperCase()+' request received. Live AI responses are disabled. Verify roster, injuries, odds, and timestamps before making any sports decision.',providerRequestsEnabled:false,monthlySpendLimitUsd:0});
}
