import {assembleOfflineCouncil} from '../lib/council-pipeline.js';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).json({ok:false,error:'Method not allowed'});
 const {question,responses}=(req.body&&typeof req.body==='object'&&!Array.isArray(req.body))?req.body:{};
 if(!responses||typeof responses!=='object'||Array.isArray(responses))return res.status(400).json({ok:false,error:'Pasted responses required'});
 for(const k of ['openai','gemini','llama'])if(typeof responses[k]!=='string'||!responses[k].trim()||responses[k].length>20000)return res.status(400).json({ok:false,error:'All three pasted responses required (max 20000 chars each)'});
 try{
  const result=await assembleOfflineCouncil({question,responses});
  return res.status(200).json({ok:true,...result});
 }catch{return res.status(400).json({ok:false,error:'Invalid council input'})}
}
