import {requireOwner} from '../lib/owner-guard.js';

// Reserved owner-only API endpoint. It cannot perform model requests or
// wagering; authorization remains disabled until real sessions exist.
export default requireOwner(function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  res.setHeader('Allow','POST');
  if(req.method!=='POST')return res.status(405).json({ok:false,error:'Method not allowed'});
  return res.status(503).json({ok:false,error:'Council execution disabled',providerRequestsEnabled:false});
});
