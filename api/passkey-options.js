import {beginPasskeyAuthentication} from '../lib/passkey-ceremony.js';
export default function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Allow','POST');
  if(req.method!=='POST')return res.status(405).json({ok:false,error:'Method not allowed'});
  const result=beginPasskeyAuthentication(req);
  return res.status(result.status).json(result);
}
