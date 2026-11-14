// Read-only completion checklist. Never changes launch gates or enables providers.
export const COMPLETION_STAGES=Object.freeze([
 {id:'owner-security',label:'Owner bootstrap, verified passkeys, durable sessions',required:['ownerAuthentication','passkeyAuthentication']},
 {id:'provider-execution',label:'Authenticated, approved three-provider execution with durable quota',required:['providerConnections','durableSpendingControls']},
 {id:'research-validation',label:'Source-verified sports research and evidence-aware council',required:['verifiedSportsResearch']},
 {id:'mobile-launch',label:'iPhone acceptance and explicit production approval',required:['mobileAcceptanceVerified','productionApproved']}
]);
export function completionReadiness(gates={}){
 const stages=COMPLETION_STAGES.map(stage=>({id:stage.id,label:stage.label,complete:stage.required.every(key=>gates[key]===true),missing:stage.required.filter(key=>gates[key]!==true)}));
 return {launchReady:stages.every(s=>s.complete),remaining:stages.filter(s=>!s.complete).length,stages};
}
