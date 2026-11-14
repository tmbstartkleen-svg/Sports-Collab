import {validateCouncilPrompt} from '../lib/council-request.js';
// Zero-cost demonstration only: no AI calls, predictions, or invented evidence.
export default function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).json({ok:false,error:'Method not allowed'});
 const validation=validateCouncilPrompt(req.body);
 if(!validation.ok)return res.status(400).json(validation);
 return res.status(200).json({
   ok:true,mode:'offline-demo',provider:validation.provider,generatedByAI:false,
   response:'Demo only: '+validation.provider.toUpperCase()+' request received. Live AI responses are disabled. Verify roster, injuries, odds, and timestamps before making any sports decision.',
   providerRequestsEnabled:false,monthlySpendLimitUsd:0
 });
}
