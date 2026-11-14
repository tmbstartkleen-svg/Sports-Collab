// Explicitly fail closed until owner auth, budget enforcement, and provider approvals exist.
import {authorizeOwner} from './auth-policy.js';
import {validateQuestion} from './request-policy.js';
export const CONNECTIONS_ENABLED = false;
export const MONTHLY_SPEND_CAP_USD = 0;
export const PROVIDERS = Object.freeze(['gemini','gpt','llama']);
export function evaluateConnection({provider,question,auth}={}) {
  if (!PROVIDERS.includes(provider)) return {ok:false,status:400,error:'Unsupported provider'};
  const validated=validateQuestion(question);
  if (!validated.ok) return {ok:false,status:400,error:validated.error};
  if (!CONNECTIONS_ENABLED || MONTHLY_SPEND_CAP_USD===0) return {ok:false,status:503,error:'Connections disabled by owner spending policy'};
  const access=authorizeOwner(auth);
  if (!access.ok) return {ok:false,status:access.status,error:access.error};
  return {ok:false,status:503,error:'Provider budget and rate limiting not configured'};
}
