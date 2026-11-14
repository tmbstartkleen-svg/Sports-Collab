import test from 'node:test';
import assert from 'node:assert/strict';
import {validateSupabaseServerConfig,SPORTS_COLLAB_SUPABASE_PROJECT_ID} from '../lib/supabase-server-config.js';
const base={SUPABASE_PROJECT_ID:SPORTS_COLLAB_SUPABASE_PROJECT_ID,SUPABASE_DATABASE_URL:'postgresql://server:placeholder@db.fsfiuekomakdwfdazyte.supabase.co:5432/postgres?sslmode=verify-full'};
test('missing config and incorrect project fail closed',()=>{
 assert.equal(validateSupabaseServerConfig().ok,false);
 assert.equal(validateSupabaseServerConfig({...base,SUPABASE_PROJECT_ID:'wrong'}).ok,false);
});
test('rejects insecure or unrelated database endpoints',()=>{
 for(const url of ['http://example.com','postgresql://user:pass@localhost:5432/postgres?sslmode=verify-full','postgresql://user:pass@db.fsfiuekomakdwfdazyte.supabase.co/postgres?sslmode=disable','postgresql://user@db.fsfiuekomakdwfdazyte.supabase.co/postgres?sslmode=verify-full']){
  assert.equal(validateSupabaseServerConfig({...base,SUPABASE_DATABASE_URL:url}).ok,false);
 }
});
test('accepts correctly shaped server-only connection configuration without connecting',()=>{
 assert.deepEqual(validateSupabaseServerConfig(base),{ok:true,projectId:SPORTS_COLLAB_SUPABASE_PROJECT_ID});
 assert.equal(validateSupabaseServerConfig({...base,SUPABASE_DATABASE_URL:'postgresql://user:pass@db.otherproject.supabase.co/postgres?sslmode=verify-full'}).ok,false);
 assert.equal(validateSupabaseServerConfig({...base,SUPABASE_DATABASE_URL:'postgresql://postgres.otherproject:pass@aws-0-us-east-1.pooler.supabase.com/postgres?sslmode=verify-full'}).ok,false);
 assert.equal(validateSupabaseServerConfig({...base,SUPABASE_DATABASE_URL:'postgresql://postgres.fsfiuekomakdwfdazyte:pass@aws-0-us-east-1.pooler.supabase.com/postgres?sslmode=verify-full'}).ok,true);
});
