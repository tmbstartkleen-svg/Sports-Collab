# Sports-Collab first-owner bootstrap runbook — NOT AUTHORIZED

This is a proposed manual owner-verification ceremony, not a live enrollment workflow.

## Proposed free, offline-first approach
1. **Owner chooses a trusted administrator** who can verify ownership independently of the app. The administrator must confirm the GitHub repository ownership and the intended owner account through an established, separate channel; an email address or a self-asserted account name is insufficient.
2. **Administrator creates an Ed25519 signing key offline** using a trusted machine. The private key stays outside GitHub, Vercel, browser storage and the application. Never paste private keys into chat.
3. **Pin the corresponding public key** and its SHA-256 SPKI fingerprint in server-only configuration after a second-channel verification. The app must reject a key submitted by the enrollment requester.
4. **Issue a single-use 256-bit nonce** after independent identity verification, bound to the intended owner and five-minute expiry; persist only its hash in the private database.
5. **Sign a narrowly scoped bootstrap payload** containing exact owner ID, purpose `sports-collab-owner-passkey-bootstrap`, issuance time, expiry and issued nonce. A trusted administrator signs only after checking identity and nonce details.
6. **Redeem atomically and verify**: the server checks pinned signing key, signature, owner, purpose, time window and nonce. A failed attempt must not enable registration; replay must fail.
7. **Enroll the first iPhone passkey** only through a reviewed, owner-scoped WebAuthn registration ceremony with user verification, trusted origin/RP ID, and a single-use registration challenge. Store the credential only after cryptographic verification.
8. **Recover or rotate**: lost-device recovery requires the independent administrator process again, with a separate approval and audit trail; revoke compromised credentials and sessions. Do not silently enroll a replacement.
9. **Review and approve** the Supabase migration, least-privilege server role, preview configuration and iPhone tests before any activation or production promotion.

## Current blockers
- No administrator identity or trusted independent verification channel has been approved.
- No signing key has been provisioned or pinned.
- The nonce table and passkey tables have not been migrated.
- Owner enrollment, bootstrap authorization, identity ceremony and login are hard-disabled.
- No actual iPhone enrollment, recovery or protected-session test has occurred.

## Release rule
No paid services, provider calls, SQL execution, live enrollment, wagering or deployment without explicit owner authorization. This runbook is not approval to perform any of those actions.
