---
name: 9router
description: Local/remote AI gateway with OpenAI-compatible REST for chat, image, TTS, embeddings, web search, web fetch, STT, vision. Single key, many providers, auto-fallback. Use when user wants unified LLM/multimodal access without provider boilerplate.
---

# 9Router

Local/remote AI gateway exposing OpenAI-compatible REST. One key, many providers, auto-fallback combos.

## Setup

```bash
export NINEROUTER_URL="http://localhost:20128"      # or VPS / tunnel URL
export NINEROUTER_KEY="sk-..."                      # from Dashboard → Keys (only if requireApiKey=true)
```

All requests: `${NINEROUTER_URL}/v1/...` with header `Authorization: Bearer ${NINEROUTER_KEY}` (omit if auth disabled).

Verify: `curl $NINEROUTER_URL/api/health` → `{"ok":true}`

## Discover Models

```bash
# Chat/LLM (default)
curl $NINEROUTER_URL/v1/models | jq '.data[].id'

# Image generation
curl $NINEROUTER_URL/v1/models/image | jq '.data[].id'

# Text-to-speech
curl $NINEROUTER_URL/v1/models/tts | jq '.data[].id'

# Speech-to-text
curl $NINEROUTER_URL/v1/models/stt | jq '.data[].id'

# Embeddings
curl $NINEROUTER_URL/v1/models/embedding | jq '.data[].id'

# Web search + fetch
curl $NINEROUTER_URL/v1/models/web | jq '.data[] | select(.kind=="webSearch" or .kind=="webFetch") | .id'

# Vision (image-to-text)
curl $NINEROUTER_URL/v1/models/image-to-text | jq '.data[].id'

# Per-model metadata (contextWindow, params, provider quirks)
curl "$NINEROUTER_URL/v1/models/info?id=openai/gpt-4o"
```

Use `data[].id` as `model` field in requests. Combos appear with `owned_by:"combo"` and auto-fallback across providers.

Response shape:
```json
{
  "object": "list",
  "data": [
    { "id": "openai/gpt-4o", "object": "model", "owned_by": "openai", "created": 1735000000 },
    { "id": "tavily/search", "object": "model", "kind": "webSearch", "owned_by": "tavily", "created": 1735000000 },
    { "id": "search-combo", "object": "model", "owned_by": "combo", "created": 1735000000 }
  ]
}
```

## Endpoints

### Chat / Code Generation

**OpenAI format** `POST $NINEROUTER_URL/v1/chat/completions`

```bash
curl -X POST $NINEROUTER_URL/v1/chat/completions \
  -H "Authorization: Bearer $NINEROUTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"openai/gpt-4o","messages":[{"role":"user","content":"Hello"}],"stream":false}'
```

**Anthropic format** `POST $NINEROUTER_URL/v1/messages`

```bash
curl -X POST $NINEROUTER_URL/v1/messages \
  -H "Authorization: Bearer $NINEROUTER_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "Content-Type: application/json" \
  -d '{"model":"cc/claude-opus-4-7","max_tokens":1024,"messages":[{"role":"user","content":"Hello"}]}'
```

Both support `stream:true` for SSE streaming.

### Image Generation

`POST $NINEROUTER_URL/v1/images/generations`

```bash
curl -X POST $NINEROUTER_URL/v1/images/generations \
  -H "Authorization: Bearer $NINEROUTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"openai/dall-e-3","prompt":"A serene landscape","n":1,"size":"1024x1024"}'
```

### Text-to-Speech

`POST $NINEROUTER_URL/v1/audio/speech`

```bash
curl -X POST $NINEROUTER_URL/v1/audio/speech \
  -H "Authorization: Bearer $NINEROUTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"openai/tts-1","input":"Hello world","voice":"alloy"}' > audio.mp3
```

### Speech-to-Text

`POST $NINEROUTER_URL/v1/audio/transcriptions`

```bash
curl -X POST $NINEROUTER_URL/v1/audio/transcriptions \
  -H "Authorization: Bearer $NINEROUTER_KEY" \
  -F "model=openai/whisper-1" \
  -F "file=@audio.mp3"
```

### Embeddings

`POST $NINEROUTER_URL/v1/embeddings`

```bash
curl -X POST $NINEROUTER_URL/v1/embeddings \
  -H "Authorization: Bearer $NINEROUTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"openai/text-embedding-3-small","input":"Hello world"}'
```

### Web Search

`POST $NINEROUTER_URL/v1/search`

```bash
curl -X POST $NINEROUTER_URL/v1/search \
  -H "Authorization: Bearer $NINEROUTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"tavily","query":"9Router open source","max_results":5}'
```

Supports: `query`, `max_results`, `search_type` (web/news/x), `country`, `language`, `time_range`, `domain_filter`, provider-specific `provider_options`.

### Web Fetch (URL → Markdown)

`POST $NINEROUTER_URL/v1/fetch`

```bash
curl -X POST $NINEROUTER_URL/v1/fetch \
  -H "Authorization: Bearer $NINEROUTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com","markdown":true}'
```

### Vision (Image-to-Text)

`POST $NINEROUTER_URL/v1/vision/analyze`

```bash
curl -X POST $NINEROUTER_URL/v1/vision/analyze \
  -H "Authorization: Bearer $NINEROUTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"openai/gpt-4o","image_url":"https://example.com/image.jpg","question":"What is in this image?"}'
```



## Response Shapes

### Chat (OpenAI)

```json
{
  "id": "chatcmpl-...",
  "object": "chat.completion",
  "model": "openai/gpt-4o",
  "choices": [
    {
      "index": 0,
      "message": { "role": "assistant", "content": "Hello!" },
      "finish_reason": "stop"
    }
  ],
  "usage": { "prompt_tokens": 8, "completion_tokens": 2, "total_tokens": 10 }
}
```

Streaming (`stream:true`): SSE `data: {choices:[{delta:{content:"..."}}]}\n\n` ... `data: [DONE]\n\n`

### Chat (Anthropic)

```json
{
  "id": "msg_...",
  "type": "message",
  "role": "assistant",
  "model": "cc/claude-opus-4-7",
  "content": [{ "type": "text", "text": "Hello!" }],
  "stop_reason": "end_turn",
  "usage": { "input_tokens": 8, "output_tokens": 2 }
}
```

### Image

```json
{
  "created": 1735000000,
  "data": [
    { "url": "https://..." },
    { "b64_json": "iVBOR..." }
  ]
}
```

### Embeddings

```json
{
  "object": "list",
  "data": [
    { "object": "embedding", "embedding": [0.123, -0.456, ...], "index": 0 }
  ],
  "model": "openai/text-embedding-3-small",
  "usage": { "prompt_tokens": 2, "total_tokens": 2 }
}
```

### Web Search

```json
{
  "provider": "tavily",
  "query": "9Router open source",
  "results": [
    {
      "title": "...",
      "url": "https://...",
      "snippet": "...",
      "position": 1,
      "score": 0.92
    }
  ],
  "usage": { "queries_used": 1, "search_cost_usd": 0.008 },
  "metrics": { "response_time_ms": 850 }
}
```

### Web Fetch

```json
{
  "url": "https://example.com",
  "title": "Example Domain",
  "markdown": "# Example Domain\n\nThis domain is...",
  "html": "<html>...",
  "status_code": 200,
  "headers": { "content-type": "text/html" }
}
```

## Errors

| Status | Meaning | Fix |
|---|---|---|
| 401 | Auth required or invalid key | Set/refresh `NINEROUTER_KEY` (Dashboard → Keys) |
| 400 | Invalid request | Check model exists in `/v1/models/<kind>`, validate params |
| 503 | All accounts unavailable | Wait `retry-after` header or add another provider account |
| 429 | Rate limited | Retry with exponential backoff |

## JS Client (OpenAI SDK)

```js
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: `${process.env.NINEROUTER_URL}/v1`,
  apiKey: process.env.NINEROUTER_KEY
});

// Chat
const chat = await client.chat.completions.create({
  model: "openai/gpt-4o",
  messages: [{ role: "user", content: "Hi" }]
});

// Streaming
const stream = await client.chat.completions.create({
  model: "openai/gpt-4o",
  messages: [{ role: "user", content: "Hi" }],
  stream: true
});
for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content || "");
}

// Embeddings
const emb = await client.embeddings.create({
  model: "openai/text-embedding-3-small",
  input: "Hello world"
});

// Image
const img = await client.images.generate({
  model: "openai/dall-e-3",
  prompt: "A serene landscape",
  n: 1
});
```

## Capability Skills

For in-depth docs on specific capabilities, fetch:

| Capability | URL |
|---|---|
| Chat / code-gen | https://raw.githubusercontent.com/decolua/9router/refs/heads/master/skills/9router-chat/SKILL.md |
| Image generation | https://raw.githubusercontent.com/decolua/9router/refs/heads/master/skills/9router-image/SKILL.md |
| Text-to-speech | https://raw.githubusercontent.com/decolua/9router/refs/heads/master/skills/9router-tts/SKILL.md |
| Speech-to-text | https://raw.githubusercontent.com/decolua/9router/refs/heads/master/skills/9router-stt/SKILL.md |
| Embeddings | https://raw.githubusercontent.com/decolua/9router/refs/heads/master/skills/9router-embeddings/SKILL.md |
| Web search | https://raw.githubusercontent.com/decolua/9router/refs/heads/master/skills/9router-web-search/SKILL.md |
| Web fetch | https://raw.githubusercontent.com/decolua/9router/refs/heads/master/skills/9router-web-fetch/SKILL.md |
| Vision | https://raw.githubusercontent.com/decolua/9router/refs/heads/master/skills/9router-vision/SKILL.md |
