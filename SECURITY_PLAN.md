# Activation security gate

**Current mode:** read-only/manual. Gemini inference is disabled in source, not just through an environment variable.

## Implement before ANY live call
1. Owner-approved private deployment and server-only secret configuration.
2. Authenticated owner-only session (secure HttpOnly cookie), CSRF protection and explicit origin allowlist.
3. Server-side request validation, bounded request size, safe timeouts and sanitized errors.
4. Persistent per-owner rate limit and daily usage cap with fail-closed behavior; never rely solely on browser counters.
5. Verified provider model availability and free-tier quotas; request-level budget accounting and kill switch.
6. Audit logs without prompts, keys, or sensitive response contents.
7. Tests proving unauthenticated and disabled requests cannot reach a provider.
8. Separate explicit approval to enable actual model calls.

## Current controls
- The endpoint returns disabled responses and never reads or transmits a key.
- `lib/request-policy.js` includes a compile-time hard stop and bounded-input helpers for future integration.
- `npm test` exercises the pure policy functions without network calls.

**Not yet implemented:** authenticated sessions, persistent rate limiting, budget tracking, real Gemini API, real-time sports feeds. Do not treat this scaffold as production-ready.
