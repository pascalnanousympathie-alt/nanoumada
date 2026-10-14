# Nanoumada — AI providers with free tiers or usage quotas

Nanoumada lets you choose a provider and model in the chat Model Selector. Enable providers under **Settings → Providers**, select the provider/model in the chat, then enter that provider's key in the masked API Key manager. This upstream app stores keys entered there in browser cookies; use a trusted, private browser and do not publish a shared instance containing personal API keys.

## Free-first options

| Provider option | What is shown | Official quota/pricing reference |
| --- | --- | --- |
| Google | Gemini Flash models documented with free-tier input/output pricing | [Gemini API limits](https://ai.google.dev/gemini-api/docs/rate-limits) · [pricing](https://ai.google.dev/gemini-api/docs/pricing) |
| Groq | GPT-OSS 120B and 20B listed in Groq's free-plan rate-limit table | [Groq rate limits](https://console.groq.com/docs/rate-limits) |
| OpenRouter Free | Includes the `openrouter/free` auto-router plus dynamically fetched models whose published input **and** output prices are zero; priced models are excluded from the latter list | [OpenRouter pricing](https://openrouter.ai/pricing) |
| Hugging Face | Existing hosted inference integration; free accounts are currently documented with a small monthly inference credit ($0.10, subject to change) | [Hugging Face pricing](https://huggingface.co/docs/inference-providers/pricing) |
| Cerebras (optional) | Not a guaranteed no-card free option: current official pricing lists a one-time $5 promotional credit requiring a valid payment method, expiring after 30 days | [Cerebras pricing](https://www.cerebras.ai/pricing) |
| Ollama / LM Studio | Local models with no hosted inference quota; require a compatible local runtime and sufficient RAM/CPU/GPU/storage | [Ollama](https://ollama.com/) · [LM Studio](https://lmstudio.ai/) |
| OpenAILike | Configurable OpenAI-compatible endpoint for other providers that expose a compatible `/models` and chat-completions API | Check the configured provider's price/limits before using it |

Regular **OpenRouter** continues to show both free and paid models. Choose **OpenRouter Free** to see the built-in `openrouter/free` automatic free-model router plus models for which OpenRouter reports zero input and output price. OpenRouter currently advertises a 50-requests/day Free plan limit; check its pricing page because limits and availability can change. A free route does not guarantee a model will be available at every moment.

## What happens when a quota runs out?

Vendors enforce different limits: requests/minute, requests/day, tokens/minute, tokens/day, account credits, and per-model quotas. Nanoumada cannot read the remaining allowance of every vendor beforehand. When a provider returns a recognizable HTTP 429/rate-limit/quota error, the chat endpoints now return an actionable message to switch to another enabled free/quota provider, choose another model, or wait for reset. Switching does not transfer or combine quotas; each provider retains its own limits.

Keep API keys private. Google's free-tier pricing documentation says submitted content may be used to improve Google's products; review each vendor's current privacy and data-use terms before sending private source code.
