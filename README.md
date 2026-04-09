# Windsurf API

OpenAI-compatible API proxy for [Windsurf](https://windsurf.com) (formerly Codeium). Run Windsurf's AI models headlessly on a Linux server and expose them through standard OpenAI API endpoints.

## Features

- **OpenAI-compatible API** - Drop-in replacement for `/v1/chat/completions` and `/v1/models`
- **59 models** - Claude, GPT, Gemini, DeepSeek, Grok, Qwen, Kimi, and Windsurf SWE
- **Multi-account pool** - Round-robin load balancing across multiple Windsurf accounts
- **Admin dashboard** - Web UI for account management, proxy config, log viewer, and stats
- **Streaming support** - Full SSE streaming compatible with OpenAI's format
- **Auto error handling** - Distinguishes model-level errors from account-level errors
- **Zero dependencies** - Pure Node.js, no npm packages required

## Quick Start

### Prerequisites

- Node.js >= 20
- Windsurf Language Server binary (`language_server_linux_x64`)
- A Windsurf account (free or paid)

### Setup

```bash
git clone https://github.com/dwgx/WindsurfAPI.git
cd WindsurfAPI

# Place the language server binary
mkdir -p /opt/windsurf
cp language_server_linux_x64 /opt/windsurf/
chmod +x /opt/windsurf/language_server_linux_x64

# Configure (optional)
cp .env.example .env

# Start
node src/index.js
```

The server starts on `http://0.0.0.0:3003` by default.

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3003` | HTTP server port |
| `API_KEY` | _(none)_ | API key for `/v1/*` endpoints (optional) |
| `DEFAULT_MODEL` | `claude-4.5-sonnet-thinking` | Default model when none specified |
| `MAX_TOKENS` | `8192` | Default max tokens |
| `LOG_LEVEL` | `info` | Log level: `debug`, `info`, `warn`, `error` |
| `LS_BINARY_PATH` | `/opt/windsurf/language_server_linux_x64` | Language server binary path |
| `LS_PORT` | `42100` | Language server gRPC port |
| `DASHBOARD_PASSWORD` | _(none)_ | Dashboard password (optional) |

## API Endpoints

### Chat Completions

```bash
curl http://localhost:3003/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [{"role": "user", "content": "Hello!"}],
    "stream": false
  }'
```

### List Models

```bash
curl http://localhost:3003/v1/models
```

### Add Account

```bash
# By token
curl -X POST http://localhost:3003/auth/login \
  -H "Content-Type: application/json" \
  -d '{"token": "your-windsurf-token"}'

# By API key
curl -X POST http://localhost:3003/auth/login \
  -H "Content-Type: application/json" \
  -d '{"api_key": "sk-ws-..."}'

# Batch add
curl -X POST http://localhost:3003/auth/login \
  -H "Content-Type: application/json" \
  -d '{"accounts": [{"token": "token1"}, {"token": "token2"}]}'
```

### Account Management

```bash
# List accounts
curl http://localhost:3003/auth/accounts

# Remove account
curl -X DELETE http://localhost:3003/auth/accounts/{id}

# Health check
curl http://localhost:3003/health
```

## Supported Models

<details>
<summary><b>Claude (Anthropic)</b> - 18 models</summary>

| Model | Provider | Tier |
|---|---|---|
| claude-3.5-sonnet | Anthropic | Free |
| claude-3.7-sonnet | Anthropic | Free |
| claude-3.7-sonnet-thinking | Anthropic | Free |
| claude-4-sonnet | Anthropic | Pro |
| claude-4-sonnet-thinking | Anthropic | Pro |
| claude-4-opus | Anthropic | Pro |
| claude-4-opus-thinking | Anthropic | Pro |
| claude-4.1-opus | Anthropic | Pro |
| claude-4.1-opus-thinking | Anthropic | Pro |
| claude-4.5-sonnet | Anthropic | Pro |
| claude-4.5-sonnet-thinking | Anthropic | Pro |
| claude-4.5-haiku | Anthropic | Pro |
| claude-4.5-opus | Anthropic | Pro |
| claude-4.5-opus-thinking | Anthropic | Pro |
| claude-sonnet-4.6 | Anthropic | Pro |
| claude-sonnet-4.6-thinking | Anthropic | Pro |
| claude-opus-4.6 | Anthropic | Pro |
| claude-opus-4.6-thinking | Anthropic | Pro |

</details>

<details>
<summary><b>GPT (OpenAI)</b> - 16 models</summary>

| Model | Provider | Tier |
|---|---|---|
| gpt-4o | OpenAI | Pro |
| gpt-4o-mini | OpenAI | Free |
| gpt-4.1 / mini / nano | OpenAI | Pro |
| gpt-5 / 5-mini | OpenAI | Pro |
| gpt-5.2 (low/medium/high) | OpenAI | Pro |
| gpt-5.4 (low/medium/high/xhigh) | OpenAI | Pro |
| gpt-5.3-codex | OpenAI | Pro |

</details>

<details>
<summary><b>Gemini (Google)</b> - 6 models</summary>

| Model | Provider | Tier |
|---|---|---|
| gemini-2.5-pro | Google | Pro |
| gemini-2.5-flash | Google | Free |
| gemini-3.0-pro / flash | Google | Pro |
| gemini-3.1-pro (low/high) | Google | Pro |

</details>

<details>
<summary><b>Other</b> - 19 models</summary>

| Model | Provider |
|---|---|
| o3 / o3-mini / o3-high / o3-pro / o4-mini | OpenAI |
| deepseek-v3 / r1 | DeepSeek |
| grok-3 / grok-3-mini / grok-code-fast-1 | xAI |
| qwen-3 / qwen-3-coder | Alibaba |
| kimi-k2 / kimi-k2.5 | Moonshot |
| swe-1.5 / swe-1.5-thinking / swe-1.6-fast | Windsurf |
| arena-fast / arena-smart | Windsurf |

</details>

## Dashboard

Access the admin dashboard at `http://your-server:3003/dashboard`.

**Panels:**
- **Overview** - Server uptime, account pool status, language server health, request success rate
- **Accounts** - Add/remove/disable accounts, edit labels, reset error counters
- **Proxy Config** - Global and per-account HTTP/SOCKS5 proxy settings
- **Log Viewer** - Real-time log streaming via SSE with level filtering
- **Request Stats** - Per-model and per-account metrics, latency tracking, hourly charts
- **Ban Detection** - Monitor error patterns and account health

Set `DASHBOARD_PASSWORD` to protect the dashboard.

## Architecture

```
Client (OpenAI SDK)
    |
    v
WindsurfAPI (Node.js HTTP server, port 3003)
    |
    v
Language Server (gRPC, port 42100)
    |
    v
Windsurf/Codeium Backend (server.self-serve.windsurf.com)
```

- **No npm dependencies** - Uses only Node.js built-in modules
- **gRPC via HTTP/2** - Direct communication with the language server binary
- **Account pool** - Round-robin selection with automatic error tracking and disabling
- **Persistent state** - Accounts saved to `accounts.json`, stats to `stats.json`

## Deployment

### PM2 (Recommended)

```bash
pm2 start src/index.js --name windsurf-api
pm2 save
pm2 startup
```

### Restart Procedure

```bash
pm2 stop windsurf-api
pm2 delete windsurf-api
fuser -k 3003/tcp 2>/dev/null
pm2 start src/index.js --name windsurf-api
```

## License

MIT
