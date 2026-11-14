// Read-only security readiness inventory; no activation or secret disclosure.
import {REQUIRED_CONTROLS} from './passkey-activation.js';
export function inspectOwnerSecurity({controls={},ownerApproved=false}={}){
 const details=REQUIRED_CONTROLS.map(id=>({id,verified:controls[id]===true}));
 const missing=details.filter(item=>!item.verified).map(item=>item.id);
 return {implementedControls:details.filter(x=>x.verified).length,totalControls:details.length,missing,ownerApproved:ownerApproved===true,activationAllowed:false,reason:'Public passkey authentication is disabled until independently reviewed and explicitly approved'};
}
