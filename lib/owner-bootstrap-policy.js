// Non-operational WebAuthn owner bootstrap policy. Never trusts browser
// owner identifiers or permits public self-enrollment.
export const OWNER_BOOTSTRAP_ENABLED=false;
export function evaluateOwnerBootstrap({serverApproved=false,verifiedIdentity=false,existingOwnerCount,credentialCount}={}){
 if(!OWNER_BOOTSTRAP_ENABLED)return {ok:false,reason:'Owner bootstrap disabled pending explicit launch approval'};
 if(serverApproved!==true||verifiedIdentity!==true)return {ok:false,reason:'Verified owner approval required'};
 if(!Number.isSafeInteger(existingOwnerCount)||existingOwnerCount!==0)return {ok:false,reason:'Owner already exists or count unavailable'};
 if(!Number.isSafeInteger(credentialCount)||credentialCount!==0)return {ok:false,reason:'Credentials already exist or count unavailable'};
 return {ok:false,reason:'Enrollment requires reviewed WebAuthn registration implementation'};
}
export const OWNER_BOOTSTRAP_SCHEMA_SQL=`
CREATE TABLE IF NOT EXISTS council_owner_bootstrap (
 owner_id TEXT PRIMARY KEY,
 initialized_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 disabled_at TIMESTAMPTZ
);
`;
