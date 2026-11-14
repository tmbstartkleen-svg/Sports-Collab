// Pure server-side readiness check; never opens connections or enables authentication.
export const SPORTS_COLLAB_SUPABASE_PROJECT_ID='fsfiuekomakdwfdazyte';
export function validateSupabaseServerConfig(env={}){
  const ref=env.SUPABASE_PROJECT_ID;
  const connection=env.SUPABASE_DATABASE_URL;
  if(ref!==SPORTS_COLLAB_SUPABASE_PROJECT_ID)return {ok:false,reason:'Unexpected Supabase project'};
  if(typeof connection!=='string'||!connection)return {ok:false,reason:'Database connection not configured'};
  let url;
  try{url=new URL(connection)}catch{return {ok:false,reason:'Invalid database URL'}}
  if(!['postgres:','postgresql:'].includes(url.protocol))return {ok:false,reason:'PostgreSQL required'};
  if(!url.hostname||!url.username||!url.password)return {ok:false,reason:'Incomplete database URL'};
  if(url.searchParams.get('sslmode')!=='verify-full')return {ok:false,reason:'Verified TLS required'};
  if(!url.hostname.endsWith('.supabase.com')&&!url.hostname.endsWith('.supabase.co'))return {ok:false,reason:'Unrecognized database hostname'};
  // Direct connections use db.<ref>.supabase.co; pooler connections
  // identify the tenant in the username (postgres.<ref>).
  const directHost=url.hostname===`db.${ref}.supabase.co`;
  const poolerHost=/^[a-z0-9-]+\.pooler\.supabase\.com$/.test(url.hostname);
  const poolerUser=url.username===`postgres.${ref}`;
  if(!directHost&&!(poolerHost&&poolerUser))return {ok:false,reason:'Database does not match configured project'};
  return {ok:true,projectId:ref};
}
