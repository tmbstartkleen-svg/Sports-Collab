// Explicitly refuses session creation. Never accepts passwords or API keys.
import {issueSession} from '../lib/owner-session.js';
export default function handler(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
 res.setHeader('Allow','GET');
 if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
 return res.status(503).json(issueSession());
}
