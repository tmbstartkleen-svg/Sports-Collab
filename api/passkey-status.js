import {passkeyReadiness} from '../lib/passkey-policy.js';
export default function handler(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Allow','GET');
 if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
 return res.status(200).json(passkeyReadiness());
}
