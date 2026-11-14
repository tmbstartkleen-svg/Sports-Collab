# Sports-Collab owner passkey deployment checklist (NOT APPROVED FOR ACTIVATION)

Supabase project reference: `fsfiuekomakdwfdazyte`.
Development branch: `audit/owner-auth-fail-closed`.
No production promotion, paid resources, provider requests, or wagering.

## Before any database access
- [ ] Review `db/supabase-passkey-schema.sql` for schema, grants, and migration rollback.
- [ ] Confirm project is on a free plan and inspect usage/quota.
- [ ] Obtain explicit approval before applying SQL to Supabase.
- [ ] Create a least-privilege server database role; do not use the browser anon key or expose database credentials.
- [ ] Store the connection secret in Vercel preview environment variables, scoped to the feature branch. Never commit secrets.
- [ ] Verify TLS certificate and exact Supabase project binding.
- [ ] Confirm the `passkey_auth` schema is not exposed in the public Data API.

## Before passkey enrollment or login
- [ ] Choose a stable HTTPS custom domain and matching WebAuthn RP ID.
- [ ] Install and pin a vetted WebAuthn server verifier; verify signature, challenge, origin, RP ID hash, flags, counter and credential.
- [ ] Design independent owner bootstrap, account recovery, and credential rotation.
- [ ] Use single-use durable challenges with atomic consumption and expiry.
- [ ] Validate session cookie, CSRF, revocation, expiry, and owner authorization in end-to-end tests.
- [ ] Confirm all owner-only routes reject anonymous requests.
- [ ] Test registration and authentication on the actual iPhone.
- [ ] Obtain explicit approval for any authentication activation.

## Existing state
WebAuthn verification, owner enrollment, session issuance, and provider requests remain hard-disabled.
This checklist is documentation, not evidence of a live database connection or working Face ID.
