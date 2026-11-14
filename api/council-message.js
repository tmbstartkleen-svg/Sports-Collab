import {validateCouncilPrompt,councilRequestGate} from '../lib/council-request.js';
export default function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).json({ok:false,error:'Method not allowed'});
 const validation=validateCouncilPrompt(req.body);
 if(!validation.ok)return res.status(400).json(validation);
 const blocked=councilRequestGate();
 return res.status(blocked.status).json(blocked);
}
