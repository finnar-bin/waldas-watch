# Waldi Todo

## Recent Changes

- Waldi now lives in the bottom navigation and opens a draggable bottom sheet instead of a floating button.
- Assistant replies render as concise Markdown, so bold text and short lists read like insight cards instead of raw chat markup.
- Chat history is now in-memory only for the active session. We removed IndexedDB persistence to avoid stale context leaking back in after reopen.
- Rolling context is trimmed aggressively to the last 2 user turns so older assistant replies do not poison the next answer.
- The main prompt now handles scope, follow-ups, and unrelated prompts directly, including Taglish and mixed-language follow-ups.
- Rate limiting is active for Waldi requests, and the UI disables repeat sends while a request is in flight.

## Open Work

- Add privacy-safe Edge Function logging for latency, rate-limit hits, OpenAI failures, and generic error categories without storing raw user prompts or transaction details.
- Add a token budget guard for rolling context and summaries so long local threads cannot send too much history to the LLM in a single request.
- Consider pruning old `ai_rate_limits` rows after they age out so the table does not grow indefinitely from expired one-minute windows.
- Add focused tests for Waldi storage, rolling context payloads, starter insights, and rate-limit handling to catch regressions in the assistant flow.
- Revisit virtualizing the assistant thread once the chat history gets large enough to justify the complexity.
