# Owner-only passkey release gates — NOT READY

This document is an approval checklist, not authorization to activate.

## Current blocking issues
1. **Cryptographic verification**: SimpleWebAuthn v13.3.3 is locked and a genuine locally signed P-256 assertion passes offline CI, including wrong-origin, wrong-RP, wrong-challenge, UV and counter-replay rejection. Owner-scoped challenge consumption and counter-update integration are rehearsed against an in-memory SQL emulator. The live verifier adapters and owner transaction remain hard-disabled; no authenticated session is issued.
2. **Owner bootstrap**: Proposed Ed25519 signed-proof validation, pinned public-key checks, one-time nonce redemption and an authorization coordinator exist only behind hard-disabled gates. No independently provisioned owner signing key, nonce issuance, first-owner registration or recovery ceremony exists. Caller-provided `registrationVerified` and `bootstrapVerified` flags are NOT trusted proof; credential inserts remain hard-disabled.
3. **Database**: Supabase schema, including private bootstrap nonce storage, is proposed only, not migrated or connected. Review grants, indexes, revocation, and least-privilege role before explicit approval.
4. **Sessions and route protection**: Issuance and authorization remain hard-disabled; no verified login-to-session integration exists.
5. **Device and deployment validation**: No iPhone passkey enrollment/login, replay tests, origin/RP ID test, or production security review has been completed.

## Required engineering proof
- **Done offline:** lock dependency version and integrity with a genuine npm-generated lockfile; run an actual WebAuthn verifier test in CI. **Still required:** exercise the hard-disabled production transaction in a controlled test without exposing a route, and validate real database atomicity after approval.
- Bind owner identity to a trusted server-side bootstrap mechanism; never accept a client-supplied verified boolean.
- Bind challenges to owner, ceremony, origin and RP ID; atomically consume exactly once with expiry.
- Verify signatures, user verification, credential ownership, and counters; persist counter changes atomically before granting access.
- Reject revoked credentials and sessions, enforce cookie security and CSRF protections, and test unauthorized endpoints.
- Validate iPhone Face ID/passkey behavior in an isolated preview, then request owner approval for activation.

**Restrictions:** no live provider calls, wagering, paid resources, SQL execution, or production promotion without owner authorization.

## Bootstrap trust and recovery decisions required before activation
- Identify the independent channel used to establish first-owner identity. An API request, email address claim, client-supplied boolean, or self-signed key is insufficient.
- Provision and pin the Ed25519 verification key through a trusted administrative process; keep the private signing key outside application/browser access. Document authorized key rotation and emergency revocation.
- Issue unpredictable, owner-scoped, short-lived bootstrap nonces server-side; store hashes only and redeem atomically once. Never treat a valid signature alone as replay protection.
- Require a separate, owner-approved recovery path for a lost iPhone or passkey. Recovery must not silently grant a new passkey to an unverified requester.
- Obtain owner approval for the bootstrap channel, key custody, recovery policy, and any SQL execution before removing any activation gate.
