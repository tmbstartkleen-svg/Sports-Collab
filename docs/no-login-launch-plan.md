# No-login Sports-Collab launch track

## Product decision
The owner explicitly removed login from the launch requirements. Do not introduce a sign-in screen, passkeys, Face ID, or owner session as a prerequisite to using the research workspace. The previous owner-auth work remains isolated in draft PR #3 and is **not** part of this launch branch.

## Current working capability
- Mobile-first chat interface for questions.
- Three independently prepared briefs for GPT, Gemini and Llama.
- Manual response collection and local synthesis.
- Offline calculations and local workspace saving.
- Server connectivity demo uses placeholders only; it does not provide live research.

## Launch gates (no authentication required)
1. Verify mobile navigation, editing, copying, saved-session recovery, and council synthesis on iPhone Safari.
2. Confirm no model-generated results, odds, injuries, roster data, or source citations are fabricated.
3. Confirm no API key, provider token, or database credential is embedded in browser assets or client responses.
4. Keep real provider requests and all paid operations disabled until the owner separately approves them and server-side abuse/spending controls are in place. Public unauthenticated access must not become an unlimited API proxy.
5. Verify read-only behavior: no wagers, transactions, automatic purchases, deployments, or external account mutations.
6. Test accessibility, error states, and offline behavior. Record results and obtain explicit approval before production deployment.

## Delivery plan
- **Phase A:** ship an honest $0 manual council experience with no login.
- **Phase B (approval required):** implement server-side controlled provider orchestration with budget caps and abuse prevention; do not turn on live calls by changing frontend labels.
- **Phase C:** owner-approved iPhone deployment after acceptance testing.

No production deployment, live provider activation, or Supabase schema migration is authorized by this document.
