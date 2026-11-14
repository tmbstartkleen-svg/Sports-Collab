# Owner-only passkey release gates — NOT READY

This document is an approval checklist, not authorization to activate.

## Current blocking issues
1. **Cryptographic verification**: SimpleWebAuthn is declared in package.json but has no committed lockfile or executed integration test. The provider and both verification adapters are disabled.
2. **Owner bootstrap**: No independently authenticated first-owner registration or recovery ceremony exists. Caller-provided `registrationVerified` and `bootstrapVerified` flags are NOT trusted proof; credential inserts remain hard-disabled.
3. **Database**: Supabase schema is proposed only, not migrated or connected. Review grants, indexes, revocation, and least-privilege role before explicit approval.
4. **Sessions and route protection**: Issuance and authorization remain hard-disabled; no verified login-to-session integration exists.
5. **Device and deployment validation**: No iPhone passkey enrollment/login, replay tests, origin/RP ID test, or production security review has been completed.

## Required engineering proof
- Lock dependency version and integrity with a genuine npm-generated lockfile; run an actual WebAuthn verifier test in CI.
- Bind owner identity to a trusted server-side bootstrap mechanism; never accept a client-supplied verified boolean.
- Bind challenges to owner, ceremony, origin and RP ID; atomically consume exactly once with expiry.
- Verify signatures, user verification, credential ownership, and counters; persist counter changes atomically before granting access.
- Reject revoked credentials and sessions, enforce cookie security and CSRF protections, and test unauthorized endpoints.
- Validate iPhone Face ID/passkey behavior in an isolated preview, then request owner approval for activation.

**Restrictions:** no live provider calls, wagering, paid resources, SQL execution, or production promotion without owner authorization.
