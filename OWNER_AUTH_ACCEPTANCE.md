# Owner sign-in decision and implementation contract

Recommended implementation: a managed passkey-capable identity provider with a server-verified owner allowlist. No identity provider has been selected or configured; **login is not active**.

## Acceptance criteria
1. Verify a signed identity token on the server, including issuer, audience, expiration, and signing key.
2. Compare verified subject ID to a server-side owner allowlist (not an email typed in a form).
3. Issue a short-lived, Secure, HttpOnly, SameSite=Strict session cookie. Rotate and revoke sessions server-side.
4. Require exact-origin checks and CSRF tokens on all state-changing routes.
5. Enforce owner checks before model calls, push subscriptions, scheduled pulls, or preference changes.
6. Apply server-side per-owner rate limits, bounded payloads, no automatic retries, and redacted audit logs.
7. Preserve a hard $0 budget gate and disabled provider requests until separate explicit activation.
8. Verify negative tests (expired/forged token, wrong owner, cross-origin, missing CSRF, excessive requests, revoked session).
9. Deploy preview and test iPhone Safari/PWA sign-in before changing production.

## Do not do
- Do not use localStorage flags or a UI name as proof of owner identity.
- Do not place API keys or identity secrets in browser code, GitHub, or chat.
- Do not turn on provider calls as part of login implementation.
- Do not select a paid plan or service without owner approval.

## Owner decision needed before implementing real login
Choose a free-tier provider with supported passkeys or email sign-in and provide its public project identifier through a safe configuration workflow. Configure secret keys only through Vercel's protected environment-variable interface. Free-tier availability and limits must be checked before selection.
