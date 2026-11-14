// Read-only, server-controlled bootstrap key source. No activation or enrollment.
// Call with a server-owned configuration object, never a request body.
import {inspectOwnerBootstrapKeyConfig} from './owner-bootstrap-key-config.js';
export const OWNER_BOOTSTRAP_CONFIG_SOURCE_ENABLED=false;
export function loadTrustedBootstrapKey({serverConfig}={}){
 if(!OWNER_BOOTSTRAP_CONFIG_SOURCE_ENABLED)
  return {ok:false,reason:'Trusted bootstrap key source disabled'};
 if(!serverConfig||typeof serverConfig!=='object'||Array.isArray(serverConfig))
  return {ok:false,reason:'Server bootstrap configuration missing'};
 if(!Object.prototype.hasOwnProperty.call(serverConfig,'OWNER_BOOTSTRAP_PUBLIC_KEY')||
    !Object.prototype.hasOwnProperty.call(serverConfig,'OWNER_BOOTSTRAP_PUBLIC_KEY_SHA256'))
  return {ok:false,reason:'Pinned bootstrap configuration missing'};
 return inspectOwnerBootstrapKeyConfig({
  configuredPublicKey:serverConfig.OWNER_BOOTSTRAP_PUBLIC_KEY,
  expectedFingerprint:serverConfig.OWNER_BOOTSTRAP_PUBLIC_KEY_SHA256
 });
}
