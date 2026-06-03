# Waldi Todo

- Add privacy-safe Edge Function logging for latency, rate-limit hits, OpenAI failures, and generic error categories without storing raw user prompts or transaction details.
- Add a token budget guard for rolling context and summaries so long local threads cannot send too much history to the LLM in a single request.
- Consider pruning old `ai_rate_limits` rows after they age out so the table does not grow indefinitely from expired one-minute windows.
- Add focused tests for Waldi storage, rolling context payloads, starter insights, and rate-limit handling to catch regressions in the assistant flow.
