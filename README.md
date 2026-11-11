# Sports Collab — Edge Desk

A mobile-first sports research and slip-preparation workspace, extending the original Triple AI Sports Council. Independent from ATLAS and EdgeForce. No deployment, subscription, paid model call, or wager is included in this change.

## Run for free

Use Node.js 22 or later. There are **zero npm dependencies** and no installation step.

```bash
npm test
npm start
```

Open `http://127.0.0.1:3000`. The original council remains in `index.html` and is embedded at `/council.html` in the new workspace. `npm run dev` uses review mode, where provider requests remain disabled even if credentials exist.

## Implemented

- Exact-market comparison, two complete reference books minimum, target book excluded from its benchmark, proportional margin removal and fee-adjusted estimated expected value.
- Complete two-way and three-way outcome sets. Event, league, period, threshold and settlement identities must match. New unavailable quotes supersede old available prices.
- Two-minute quote-age limit, one-hour user-supplied evidence-review limit, started-event blocking, push-rule blocking and checks for US prediction-market identity, fees and executable liquidity.
- Clearly fictional demo excluded from real cards. No seeded real sports picks.
- Separate DraftKings / Polymarket US copy-ready batches of 15, 12 or 20. Singles default. Same-game parlays require separate SGP pricing; no naive multiplication of leg probabilities.
- Browser-local prices/queue, JSON input, source detail and manual GPT / Gemini / Muse challenge rounds.
- Optional server-only Unabated adapter: discovery, sources, delayed odds, generic-link attribution, text slip generation and bounded status polling. Partial results retain actual matched/requested counts. Unknown `Polymarket` results are not renamed `Polymarket US`.
- One process-wide five-second odds scheduler, Retry-After handling, timeouts, no automatic generation resubmission, safe links, local binding, cross-origin protection and redacted upstream errors.

## What is not connected

No authenticated provider test, automatic stats/roster/injury ingestion, AI model API, calibrated sports model, simulation, historical backtest or verified native-app preload is included. Reference-market disagreement is an estimated pricing opportunity, **not evidence of a profitable strategy**. Inputs marked verified are the importer's claims; the app does not independently validate the linked evidence.

Raw provider snapshots are inspectable under Connections but are not automatically converted into eligible picks. A reviewed adapter must map current source/league/bet-type IDs, all outcome identities, exact points, per-line timestamps, settlement and US-market identity. Never substitute the board-level latest timestamp for every quote's observation time.

## Optional free feed setup

As checked November 11, 2026, the Gambly + Unabated Free API is for qualifying content partners and requires monthly deeplink traffic. It provides delayed REST odds, not streaming, Unabated Line or Unabated edge calculations. Coverage varies by operator and market. Discover actual access with your key and confirm the account's current terms. **An unlimited, permanently free personal feed is not established.**

1. Review [free eligibility and signup](https://unabated.com/odds-api/free) and your account's actual traffic requirement. Do not purchase a plan for this build.
2. Keep `UNABATED_API_KEY` and `UNABATED_PARTNER_CODE` in a private server environment. Never paste a key into this app, a chat prompt, the repository, or a screenshot.
3. Set `ENABLE_UNABATED=1` and `UNABATED_FREE_ELIGIBLE=1` only after confirming access. Supply environment values privately, then use `npm start`. A local `.env` can be loaded using Node's `--env-file` option; it is ignored by Git and **not loaded automatically** by `npm start`.
4. Discover league routes and inspect a straight/props/futures board. Confirm coverage, actual quote age and attribution in your account. Global Polymarket coverage does not establish Polymarket US coverage.
5. Inspect every matched selection and count. Returned links are labeled **native preload untested**. Successful submission does not mean every leg matched.

Generic Gambly odds links receive the partner campaign code once; generated slip links retain the provider's attribution. Never construct sportsbook private URLs from IDs. Earlier event URLs with guessed outcome parameters are intentionally not used.

The local server has no public authentication layer and is not deployment-ready. It binds to loopback. One running process must own the key's odds requests; do not run multiple schedulers with one key. Hosting needs authentication, durable key-wide scheduling, access controls, explicit deployment approval and free-plan usage controls.

## Data and validation

See [the normalized input contract](docs/input-contract.md) and [implementation notes](docs/build-status.md). Tests cover financial math, mismatched lines and draw outcomes, stale/unavailable data, demo exclusion, US-market gates, scheduler timing, attribution, failure handling, local API protection and partially matched slips.

Browser data does not sync to another device. Clear it with “Clear local data.” Council responses stay in the iframe until reload, as in the original prototype. Price and queue storage uses localStorage and contains no provider secret.

## Primary API references

- [Access tiers](https://docs.unabated.com/start/access-tiers)
- [Authentication](https://docs.unabated.com/start/authentication)
- [Request odds](https://docs.unabated.com/guides/odds)
- [Discovery](https://docs.unabated.com/guides/discovery)
- [Identities and timestamps](https://docs.unabated.com/guides/response-concepts)
- [Attribution and links](https://docs.unabated.com/guides/deep-links)
- [Slip generation](https://docs.unabated.com/guides/bet-slips)
