# Provider authentication diagnostic runbook

This diagnostic checks credential acceptance only. It does not run GPT or Gemini inference and **does not verify a free tier**.

## Preconditions

1. Rotate any credentials previously pasted into chat and update Vercel project secrets directly.
2. Create a unique random administrator token of at least 32 characters. Never put it in GitHub or browser JavaScript.
3. In Vercel project environment variables set `COUNCIL_DIAGNOSTIC_TOKEN` to that token and `PROVIDER_DIAGNOSTICS_ENABLED=true` in the desired environment. Redeploy to apply changes.
4. Keep the live council policy disabled. Do not enable any model generation.
5. Run from a trusted terminal, not the public webpage:

```sh
read -r -s -p 'Diagnostic token: ' DIAGNOSTIC_TOKEN
printf '\n'
curl --fail-with-body --silent --show-error \
  -H "x-council-diagnostic-token: $DIAGNOSTIC_TOKEN" \
  https://sports-collab.vercel.app/api/council/provider-diagnostics
unset DIAGNOSTIC_TOKEN
```

Expected JSON contains `results` for `gpt` and `gemini`, with `authenticated` true or false. Do not paste secrets or raw request headers into chat. This endpoint returns no credential values.

## Immediately after the check

Set `PROVIDER_DIAGNOSTICS_ENABLED=false` (or delete it) and redeploy. Verify unauthenticated GET returns HTTP 403. Do not leave credential probes exposed to repeated authenticated requests.

## Important limitations

- HTTP 200 from a model-list endpoint verifies credential acceptance only; it does not prove model availability, quota, free-tier eligibility, or zero billing.
- The current code checks GPT via OpenAI and Gemini via Google. Muse remains in the UI, not authenticated by this diagnostic.
- No wagering is implemented or permitted by this procedure.
- If account-level free-tier status cannot be independently verified, do not enable live inference.
