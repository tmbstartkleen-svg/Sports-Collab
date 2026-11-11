// No fake client-side authentication or challenge verification.
export default function handler(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('Allow','POST');
 if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
 return res.status(503).json({ok:false,error:'Passkey login disabled until WebAuthn verification and session storage are configured'});
}
