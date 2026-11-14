# Gemini connection preparation (NO live requests)

## Current state
- GitHub branch: `feature/gemini-secure-scaffold`
- `api/gemini.js` is a **disabled** server-only endpoint, returning HTTP 503.
- No Gemini API calls, token consumption, billing, or Vercel deployment are performed.
- `GEMINI_API_KEY` is not in source code, client JavaScript, or this repository.

## Owner checklist (iPhone)
1. Confirm Google AI Studio project shows **Free tier** and billing is **not enabled**.
2. Keep the API key inside Google AI Studio for now. Never paste it into ChatGPT, a GitHub issue, commit, or browser-side HTML.
3. Review the GitHub branch and approve any subsequent deployment separately.
4. If later approving a Vercel project, use Vercel Project Settings > Environment Variables to add `GEMINI_API_KEY` as a sensitive server-side variable. Never prefix it with `NEXT_PUBLIC_` or `VITE_`.
5. Confirm the actual available Gemini model and free-tier quotas from Google before enabling calls. Free tier does **not** guarantee zero cost for every model or operation.

## Required before activation
- Explicit owner approval for deployment, key configuration, and API usage.
- Server-side authentication and session controls; origin/CSRF protections.
- Input-size validation, per-user rate limiting, timeouts, quotas, and kill switch.
- Verified provider endpoint/model, quota and cost limits, and safe error handling.
- No client-side secret access and no logging of credentials.
- Sports-data evidence sources must be independently verified. Model agreement is not evidence.

## Smoke test (only after separately authorized deployment)
A GET to `/api/gemini` should return HTTP 503 with `enabled: false`.
POST should return HTTP 405. There is intentionally no AI inference route.
