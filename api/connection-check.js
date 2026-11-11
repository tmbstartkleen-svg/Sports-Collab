// No model calls, no secret introspection, no connection activation.
import {evaluateConnection} from '../lib/connection-gate.js';
export default function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Allow','POST');
  if(req.method!=='POST')return res.status(405).json({ok:false,error:'Method not allowed'});
  const size=Number(req.headers['content-length']||0);
  if(!Number.isSafeInteger(size)||size>8192||size<0)return res.status(413).json({ok:false,error:'Invalid request size'});
  const {provider,question}=req.body && typeof req.body==='object'?req.body:{};
  const result=evaluateConnection({provider,question});
  return res.status(result.status).json(result);
}
