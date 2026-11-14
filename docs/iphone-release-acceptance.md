# No-login iPhone release acceptance checklist

Status: **NOT APPROVED FOR DEPLOYMENT**. Automated CI passed at commit `3c025b266feb15e38c59bc57c6af22acc2a2813f` (Council safety tests run 43644156409). This does **not** establish that the app has been tested on a physical iPhone.

## Physical iPhone acceptance (owner or tester)
- [ ] Open a branch preview URL in Safari on iPhone; no sign-in is requested.
- [ ] Enter a question and prepare GPT, Gemini and Llama briefs.
- [ ] Copy each brief and paste a real, independently obtained reply for each seat.
- [ ] Build council review; confirm it does not claim the app verified odds, injuries, schedules or sources.
- [ ] Save research, close/reopen Safari, restore the question and all three responses.
- [ ] Clear saved research and confirm it cannot be restored from the app.
- [ ] Check small-screen layout, zoom, keyboard, focus visibility and touch targets.
- [ ] Add to Home Screen; confirm standalone launch and readable title.
- [ ] Test offline/poor connectivity; manual research controls work and server-only features fail clearly.
- [ ] Confirm no real provider calls, wagers or purchases occur.

## Security/release gates
- [x] No-login mobile contract covered by automated tests.
- [x] Council safety workflow passed on the noted commit.
- [ ] Inspect deployed browser assets and network requests for exposed API keys or tokens.
- [ ] Independently validate unauthenticated endpoint abuse controls before any live AI activation.
- [ ] Owner approves exact target deployment and any future provider usage separately.

**No login** does not authorize an unrestricted paid API proxy. Keep all live provider calls disabled. Do not merge or deploy solely because CI is green.
