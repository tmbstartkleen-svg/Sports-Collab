# Owner-controlled research pull policy

**Status:** policy scaffold committed; no automated notifications or live API calls are active.

- Manual research: permitted only after an authenticated owner action and explicit enablement.
- Scheduled research: permitted only for schedule IDs explicitly approved by the owner.
- All other triggers (polling, implicit page loads, retry loops, speculative refreshes) are prohibited.
- One request per approved trigger by default; no automatic retries.
- Free-only provider selection. If the provider has no verified free quota, fail closed.
- No paid API calls. Monthly spending policy: $0.
- Notifications planned: completed, blocked, quota exhausted, failed. A durable notification queue and delivery mechanism still need implementation.
- Default approved schedule list is empty. Existing ChatGPT reminders do not automatically authorize API pulls in this app.
- Never store API keys in GitHub or browser-side code.

Before enabling: authenticated owner session, persisted schedule registry, idempotency keys, durable rate-limit/quota accounting, notification delivery, and verified provider pricing. The current module deliberately rejects **all** actual pulls.
