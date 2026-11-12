// All paid/provider requests require an atomic, durable quota reservation.
// No in-memory counters: serverless functions run on multiple instances.
export const DEFAULT_MONTHLY_LIMIT_USD=0;
export function validateQuotaConfiguration({monthlyLimitUsd=0,ownerApproved=false,store}={}){
 if(!ownerApproved)return {ok:false,error:'Owner has not approved usage'};
 if(!Number.isFinite(monthlyLimitUsd)||monthlyLimitUsd<=0)return {ok:false,error:'Monthly spend limit is zero'};
 if(!store||typeof store.reserveAtomic!=='function')return {ok:false,error:'Durable atomic quota store is required'};
 return {ok:true};
}
export async function reserveProviderBudget({monthlyLimitUsd=0,ownerApproved=false,store,requestId,estimatedUsd}={}){
 const gate=validateQuotaConfiguration({monthlyLimitUsd,ownerApproved,store});
 if(!gate.ok)return gate;
 if(typeof requestId!=='string'||!requestId||!Number.isFinite(estimatedUsd)||estimatedUsd<=0)
   return {ok:false,error:'Invalid reservation request'};
 try{
   const result=await store.reserveAtomic({requestId,estimatedUsd,monthlyLimitUsd});
   if(!result||result.reserved!==true)return {ok:false,error:'Quota reservation rejected'};
   return {ok:true,requestId};
 }catch{return {ok:false,error:'Quota store unavailable'}}
}
