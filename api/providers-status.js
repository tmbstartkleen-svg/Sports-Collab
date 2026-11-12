import {providerReadiness} from '../lib/provider-readiness.js';
export default function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET')return res.status(405).json({ok:false,error:'Method not allowed'});
 return res.status(200).json({ok:true,providers:providerReadiness(process.env),providerRequestsEnabled:false,monthlySpendLimitUsd:0});
}
