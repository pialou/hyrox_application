# OpenClaw Integration Directive

> **Last Updated**: 2026-02-08  
> **Server Version**: 2026.2.1  
> **Status**: ✅ Running on `pialousport`

## Overview

OpenClaw is a self-hosted AI assistant framework that runs a local gateway for multi-agent orchestration. It connects LLMs (like Gemini) with software connectors called "skills" to automate tasks.

---

## Current Server Configuration

### Instance Details
| Property | Value |
|----------|-------|
| **Host** | `pialousport` (100.107.228.60) |
| **Version** | 2026.2.1 (update available: 2026.2.6-3) |
| **Gateway Port** | 18789 (local mode) |
| **Primary Model** | `google-gemini-cli/gemini-3-flash-preview` |

### Enabled Channels
- ✅ **WhatsApp** (DM Policy: pairing)
- ✅ **Telegram** (Bot token configured)
- ✅ **Discord** (Group policy: allowlist)

### Model Fallbacks
```
1. github-copilot/claude-opus-4.5
2. github-copilot/claude-sonnet-4.5
3. github-copilot/gemini-3-pro-preview
4. github-copilot/gpt-5.2-codex
```

### Config File Location
```
~/.openclaw/openclaw.json
```

---

## Skills

### Locations (Precedence Order)
1. **Bundled**: Shipped with OpenClaw install
2. **Managed/Local**: `~/.openclaw/skills/` (shared across agents)
3. **Workspace**: `<workspace>/skills/` (per-agent)

> **Current Status**: No custom skills installed yet (`~/.openclaw/skills/` is empty)

### Skill Format: `SKILL.md`

```markdown
---
name: skill-name
description: Short description shown in UI/model
user-invocable: true
---

## Instructions
Your skill instructions here...

## Context
- Any relevant context for the AI
```

### Frontmatter Options
| Field | Default | Description |
|-------|---------|-------------|
| `name` | required | Skill identifier |
| `description` | required | Shown in UI and model prompt |
| `user-invocable` | `true` | Expose as `/skill-name` slash command |
| `disable-model-invocation` | `false` | Exclude from model prompt |
| `homepage` | optional | URL shown in macOS Skills UI |

### Installing Skills
```bash
# From ClawHub
npx clawhub@latest install <skill-slug>

# Update all skills
clawhub update --all
```

---

## Gateway API

### WebSocket Connection
The Gateway uses WebSocket on port 18789 with a JSON-RPC-style protocol.

#### Connection Handshake
```json
// Client sends:
{
  "type": "req",
  "id": "uuid",
  "method": "connect",
  "params": {
    "minProtocol": 1,
    "maxProtocol": 1,
    "client": {
      "id": "hyrox-app",
      "displayName": "Hyrox Coach",
      "version": "1.0.0",
      "platform": "web",
      "mode": "chat"
    },
    "auth": { "token": "YOUR_TOKEN" }
  }
}

// Server responds:
{
  "type": "res",
  "id": "uuid",
  "ok": true,
  "payload": { /* hello-ok with snapshot */ }
}
```

### Key Methods
| Method | Description |
|--------|-------------|
| `health` | Full health snapshot |
| `status` | Short summary |
| `send` | Send message via active channel |
| `agent` | Run an agent turn (streams events) |
| `node.list` | List paired/connected nodes |
| `node.invoke` | Invoke command on a node |

### Agent Request
```json
{
  "type": "req",
  "id": "uuid",
  "method": "agent",
  "params": {
    "message": "Create a recovery session for today",
    "sessionKey": "main"
  }
}
```

### Events (Streamed)
| Event | Description |
|-------|-------------|
| `agent` | Streamed tool/output events from agent run |
| `presence` | Presence updates |
| `tick` | Periodic keepalive |
| `shutdown` | Gateway is exiting |

### Error Codes
| Code | Meaning |
|------|---------|
| `NOT_LINKED` | WhatsApp not authenticated |
| `AGENT_TIMEOUT` | Agent didn't respond in time |
| `INVALID_REQUEST` | Schema/param validation failed |
| `UNAVAILABLE` | Gateway shutting down |

---

## Remote Access

### Via Tailscale (Recommended)
The gateway binds to `127.0.0.1:18789`. Access via Tailscale:
```
ws://100.107.228.60:18789
```

### Via SSH Tunnel
```bash
ssh -N -L 18789:127.0.0.1:18789 pialou@100.107.228.60
# Then connect to ws://127.0.0.1:18789
```

### Via Tailscale Funnel (Public)
```bash
tailscale funnel --bg 18789
# Creates: https://pialousport.ts.net/
```

---

## Planned Skills for Hyrox

### 1. `the-architect`
**Purpose**: Generate training plans based on fatigue and goals.

```markdown
---
name: the-architect
description: Generate personalized Hyrox training plans
user-invocable: true
---

## Instructions
You are "The Architect", an expert Hyrox coach.

When invoked:
1. Fetch recent Strava activities (last 7 days)
2. Analyze fatigue (suffer_score, volume, intensity)
3. Check planned sessions in training_plan table
4. Generate a balanced session plan
5. Save to PostgreSQL via MCP or API

## Athlete Context
- Name: Louis
- Goal: Hyrox competition prep
- Current focus: High endurance, moderate strength
```

### 2. `session-manager`
**Purpose**: CRUD operations for training sessions.

### 3. `strava-analyst`
**Purpose**: Analyze Strava data and provide insights.

---

## CLI Commands

```bash
# Check status
ssh pialou@100.107.228.60 "openclaw status"

# View logs
ssh pialou@100.107.228.60 "openclaw logs --follow"

# Restart gateway
ssh pialou@100.107.228.60 "openclaw gateway restart"

# Update OpenClaw
ssh pialou@100.107.228.60 "openclaw update"

# Health check (JSON)
ssh pialou@100.107.228.60 "openclaw health --json"
```

---

## Troubleshooting

### Gateway Not Responding
```bash
openclaw status
openclaw logs
systemctl --user status openclaw-gateway
```

### Skill Not Loading
1. Check `SKILL.md` frontmatter syntax
2. Verify skill folder in `~/.openclaw/skills/`
3. Restart gateway: `openclaw gateway restart`

---

## References
- [Official Docs](https://docs.openclaw.ai)
- [Skills Documentation](https://docs.openclaw.ai/skills)
- [Gateway Protocol](https://docs.openclaw.ai/gateway)
- [ClawHub (Skills Marketplace)](https://clawhub.com)
