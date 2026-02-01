# Backend Specification - Hyrox Intel

## Infrastructure Check

### Serveur (Pialousport)
- **Host**: `100.107.228.60` (Tailscale IP)
- **User**: `pialou`
- **Docker**: Running PostgreSQL (`hyrox_db_container`) & n8n (`n8n-app`)
- **MCP Server**: Running at `~/hyrox-mcp/` (Node.js 20)

### PostgreSQL
- **Container**: `hyrox_db_container` (PostgreSQL 16)
- **Database**: `hyrox_app_db`
- **Port**: 5432 (Internal/External)
- **Credentials**: Stored in MCP `.env`

### n8n (Workflow Automation)
- **URL**: `https://pialousport.tailad5314.ts.net/home/workflows` (Web UI)
- **API**: `http://localhost:5678/api/v1` (Internal)
- **Webhook Base**: `https://pialousport.tailad5314.ts.net/webhook`

## Workflows n8n

### 1. Architect (Training Plan Generation)
- **Trigger**: Webhook POST
- **Input**: `{ "plan_id": "uuid" }`
- **Process**:
  1. Fetch plan details from DB
  2. Fetch `athlete_metrics` & `availability_slots`
  3. Generate JSON plan structure via LLM
  4. Update `training_plan` (`planned_details`, `is_structured=true`)

### 2. Strava Sync
- **Trigger**: Polling / Webhook Strava
- **Output**: Insert into `strava_sync` -> Match with `training_plan`

## Interface MCP

Le serveur MCP (`~/hyrox-mcp/`) est le pont unique pour l'IA.

**Capabilities:**
1. **DB Access**: Query tables, Insert/Update data.
2. **n8n Control**: List/Execute workflows.

**Usage:**
```bash
# Via Claude Desktop / Agent
use mcp_tool "db_query" { "sql": "SELECT..." }
use mcp_tool "n8n_execute_workflow" { "workflowId": "..." }
```

## Security
- **API Keys**: n8n API Key configured in MCP `.env`
- **Network**: Tailscale only, ports exposed via Docker
- **PostgreSQL**: Password protected, accessed via localhost by MCP
