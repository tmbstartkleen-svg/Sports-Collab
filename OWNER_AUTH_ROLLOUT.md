# Owner authentication rollout (not active)

Current app is a public read-only prototype. No login or session issuance is active.

Implemented offline helpers: cryptographically random opaque tokens, hashed-token verification, strict secure cookies, 15-minute session design, and tests. The endpoint intentionally returns 503.

Before activation:
- Choose an identity provider or passkey flow with server-side identity verification.
- Set up server-side session storage and revoke/expiry handling.
- Require CSRF and exact-origin checks for mutations.
- Enforce owner authorization for every provider request and push subscription.
- Add request quotas, $0 default budget guard, and auditing without secrets.
- Perform integration tests and security review.
- Obtain explicit owner approval before enabling live AI or paid services.

Do not mistake an owner label in the UI or a browser localStorage value for authentication.
