-- Sports-Collab passkey storage. REVIEW ONLY; not applied to Supabase.
-- Apply only in the dedicated Sports-Collab Supabase project after approval.
-- All tables are private to the passkey_auth schema (not exposed via PostgREST).
create schema if not exists passkey_auth;
revoke all on schema passkey_auth from public, anon, authenticated;

create table if not exists passkey_auth.credentials (
  credential_id text primary key,
  owner_id text not null,
  public_key bytea not null,
  sign_count bigint not null default 0 check (sign_count >= 0),
  transports text[] not null default '{}',
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

create table if not exists passkey_auth.challenges (
  challenge_hash text primary key,
  owner_id text not null,
  ceremony text not null check (ceremony in ('registration','authentication')),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists passkey_challenge_expiry on passkey_auth.challenges (expires_at);

-- Pre-issued bootstrap nonces are owner-scoped and can be redeemed once.
-- Never insert raw nonces: store only SHA-256 hashes generated server-side.
create table if not exists passkey_auth.bootstrap_nonces (
  nonce_hash text primary key check (nonce_hash ~ '^[0-9a-f]{64}
  token_hash text primary key,
  owner_id text not null,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists passkey_session_expiry on passkey_auth.sessions (expires_at);

-- Prevent anonymous or ordinary signed-in clients from accessing tables.
revoke all on all tables in schema passkey_auth from public, anon, authenticated;
-- Application server should use a narrowly scoped PostgreSQL role,
-- not an exposed service-role key in the browser.
),
  owner_id text not null,
  expires_at timestamptz not null,
  redeemed_at timestamptz,
  created_at timestamptz not null default now(),
  check (expires_at > created_at)
);
create index if not exists passkey_bootstrap_nonce_expiry
  on passkey_auth.bootstrap_nonces (expires_at);

create table if not exists passkey_auth.sessions (
  token_hash text primary key,
  owner_id text not null,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists passkey_session_expiry on passkey_auth.sessions (expires_at);

-- Prevent anonymous or ordinary signed-in clients from accessing tables.
revoke all on all tables in schema passkey_auth from public, anon, authenticated;
-- Application server should use a narrowly scoped PostgreSQL role,
-- not an exposed service-role key in the browser.
