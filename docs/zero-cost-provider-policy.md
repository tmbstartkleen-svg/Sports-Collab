# Zero-cost provider activation policy

Status: **NOT ACTIVATED**. Strict external inference spending limit: USD 0.

## Provider decisions (2026-11-18)

- OpenAI GPT: disabled. An existing API key is not evidence of free API inference. No GPT generation until verified zero-cost access exists.
- Gemini: candidate only. Google offers free-tier inference for selected models, but the existing project's billing tier and model-specific quota have **not** been verified. Do not enable generation on the strength of API authentication alone.
- Meta Muse: disabled pending an official, authenticated and cost-verified provider integration. Do not substitute third-party Llama for Muse.

## Required checks before Gemini activation

1. In Google AI Studio, open Projects and verify that the **specific project associated with GEMINI_API_KEY** is labeled Free tier, without attached paid billing. Do not paste the key or billing credentials into chat.
2. In AI Studio Rate limits, verify the chosen model is offered under the project's free quota. Model availability and limits vary.
3. Configure an explicit allowlist of that free model, bounded input/output tokens, and conservative daily request ceilings. Reject all other models, all tool/grounding calls, and all paid fallbacks.
4. Fail closed on quota exhaustion, authentication errors, and ambiguous billing status. No automatic upgrade, no retries that switch models.
5. Verify the public UI labels a single Gemini model accurately. A Gemini-vs-Gemini role debate is **not** a GPT-vs-Gemini debate.
6. Keep live GPT and Muse off. No wagering.

Official sources:
- https://ai.google.dev/gemini-api/docs/billing
- https://ai.google.dev/gemini-api/docs/pricing
- https://ai.google.dev/gemini-api/docs/rate-limits
- https://help.openai.com/en/articles/8264644-what-are-the-tier-limits-for-the-openai-api
