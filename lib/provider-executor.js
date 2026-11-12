import {buildProviderRequest} from './provider-request-builders.js';
import {normalizeProviderResponse,normalizeProviderFailure} from './provider-response.js';
// Transport is intentionally unreachable from public routes until owner auth,
// provider approval and a server-enforced quota are independently implemented.
export async function executeProvider({provider,prompt,apiKey,model,authorization,fetchImpl}={}){
 if(!authorization||authorization.ownerVerified!==true||authorization.explicitProviderApproval!==true||authorization.enforcedBudgetAvailable!==true){
   return {ok:false,status:503,error:'Owner authentication, explicit approval and enforced budget required'};
 }
 // Hard shutdown independent of caller flags; must be deliberately reviewed.
 const TRANSPORT_ENABLED=false;
 if(!TRANSPORT_ENABLED)return {ok:false,status:503,error:'Provider transport disabled'};
 const request=buildProviderRequest({provider,prompt,apiKey,model});
 const response=await fetchImpl(request.url,{method:request.method,headers:request.headers,body:request.body,signal:AbortSignal.timeout(10000)});
 if(!response.ok)return {...normalizeProviderFailure(response.status),status:response.status};
 return normalizeProviderResponse(provider,await response.json());
}
