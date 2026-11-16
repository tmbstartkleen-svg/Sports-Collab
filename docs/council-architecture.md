# Sports-Collab: Secure Three-Model Council Contract (design only)

Status: NOT CONNECTED. This document defines the implementation boundary; it does not enable API requests.

## Goal
GPT, Gemini, and a third provider (currently labelled Muse in the prototype) exchange evidence and objections through a server-controlled orchestrator. Never claim the providers communicate directly: the server passes bounded, attributed messages between them.

## Stages
1. Intake: user submits one question; server creates a random council run ID and validates size.
2. Independent research: request one answer per enabled provider; capture source URLs, timestamps, assumptions, and uncertainties. If any provider is disabled or unavailable, show UNAVAILABLE, not fabricated output.
3. Cross-examination: each enabled provider receives compact attributed summaries of other providers' answers; max one challenge round initially.
4. Evidence audit: deterministic checks for citations, market timestamp, injuries/rosters, odds, and disagreement; a mention is not proof.
5. Synthesis: generate a final evidence matrix, explicit unresolved conflicts, and conditional recommendations. No automatic bets.

## Hard safeguards (fail closed)
- Default ENABLE_LIVE_AI=false. Backend rejects all live calls unless explicitly enabled after user approval.
- Default MAX_SPEND_USD=0. No paid fallback or paid gateway routing. Free-tier eligibility and zero-cost enforcement must be verified independently for each provider before enabling it. A zero-dollar configuration flag by itself does not guarantee free usage.
- API keys only in server environment variables; never browser code, logs, source control, or response payloads.
- Require authenticated user session before any enabled live route; CSRF/origin checks and per-user rate limits.
- Reject unexpected model/provider IDs; explicit allowlist and timeouts; limit tokens, request sizes, rounds, concurrency and total calls per run.
- Never accept model-suggested URLs as instructions to fetch arbitrary resources (SSRF prevention). Treat model responses as untrusted text.
- No automatic wager placement, purchase, deployment, or background polling.
- Persist no sensitive research payload by default; redact credentials from logs.
- Show provider failures and partial runs transparently. Do not synthesize fake provider output.

## Proposed API (not yet implemented)
POST /api/council/run with {question} -> {runId, status, providers, stages, evidence, conflicts}
GET /api/council/status -> {liveEnabled:false, providers:[{name,available:false}], spendLimitUsd:0}

## Acceptance tests before activation
- With live AI disabled, no network calls to providers occur.
- Without credentials, request fails safely and clearly.
- A missing provider does not silently substitute another.
- Round count is bounded and every model statement is attributed.
- Unverified sports data is labelled unverified; stale odds are not represented as current.
- Spending remains zero and billing cannot activate silently.

## Release gate
Do not enable live AI until the user separately approves provider selection, credentials, free-tier verification, and deployment.