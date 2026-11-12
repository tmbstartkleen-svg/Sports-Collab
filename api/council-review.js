import {compareCouncilResponses} from '../lib/council-review.js';
export default function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).json({ok:false,error:'Method not allowed'});
 const b=req.body;
 if(!b||typeof b!=='object'||Array.isArray(b))return res.status(400).json({ok:false,error:'Invalid input'});
 const responses={};
 for(const k of ['openai','gemini','llama']){
  if(b[k]!==undefined&&typeof b[k]!=='string')return res.status(400).json({ok:false,error:'Invalid response type'});
  if((b[k]||'').length>20000)return res.status(413).json({ok:false,error:'Response too long'});
  responses[k]=b[k]||'';
 }
 return res.status(200).json({ok:true,...compareCouncilResponses(responses)});
}
