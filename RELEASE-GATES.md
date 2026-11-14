# Sports-Collab release candidate acceptance gates

This is a release gate, not approval to merge, spend, activate providers, or deploy production.

## Release 1: usable zero-cost offline council
- [x] Exactly three council members: GPT, Gemini, Llama
- [x] Offline/manual-paste council and synthesis workflow
- [x] Automated offline test suite (123 passing at GitHub Actions run 193)
- [ ] Verify PWA installation and persistence on a real iPhone
- [ ] Verify all manual council flows with realistic NBA/NFL examples, no invented data
- [ ] Verify offline operation, data export, refresh, and recovery on iPhone
- [ ] Confirm owner approval to promote the reviewed build to production

## Release 2: connected, authenticated council (blocked; no spending approval)
- [ ] Reviewed owner bootstrap and actual credential registration
- [ ] PostgreSQL provisioned and migrations explicitly approved and executed
- [ ] End-to-end WebAuthn or another secure owner sign-in; rate limiting and CSRF protections
- [ ] Durable budget enforcement and approved provider-call controls
- [ ] Llama provider selected and endpoint validated
- [ ] GPT/Gemini/Llama integration, independent research and cross-review
- [ ] Official sports feeds, roster/injury freshness and odds provenance
- [ ] End-to-end mobile acceptance and final owner authorization

## Stop conditions
- No paid API calls; monthly spend limit stays $0
- No sportsbook wagers or automated placement
- No production merge or deployment without explicit approval
- Never label simulated or pasted inputs as live verified research
- If the $0 policy blocks live provider calls, keep manual/offline mode
