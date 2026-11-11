// No public self-registration: otherwise anyone could enroll as owner.
export default function handler(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('Allow','POST');
 if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
 return res.status(503).json({ok:false,error:'Owner passkey enrollment disabled until verified bootstrap and credential storage are configured'});
}
