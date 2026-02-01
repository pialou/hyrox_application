# Hyrox Intel MCP Server

MCP Server providing AI access to PostgreSQL database and n8n workflows for the Hyrox Intel training application.

## Tools Available

### PostgreSQL Tools
| Tool | Description |
|------|-------------|
| `db_query` | Execute SELECT queries |
| `db_list_tables` | List all tables with row counts |
| `db_describe_table` | Get table schema details |
| `db_insert` | Insert new rows |
| `db_update` | Update existing rows |

### n8n Tools
| Tool | Description |
|------|-------------|
| `n8n_list_workflows` | List all workflows |
| `n8n_get_workflow` | Get workflow details |
| `n8n_execute_workflow` | Trigger workflow execution |

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your credentials
```

### 3. Build
```bash
npm run build
```

### 4. Run
```bash
npm start
```

## Deployment to Server

```bash
# From your Mac
scp -r execution/mcp-server/* pialou@100.107.228.60:~/hyrox-mcp/

# On the server
ssh pialou@100.107.228.60
cd ~/hyrox-mcp
chmod +x deploy.sh
./deploy.sh
```

## Claude Desktop Configuration

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "hyrox-intel": {
      "command": "ssh",
      "args": [
        "-o", "StrictHostKeyChecking=no",
        "pialou@100.107.228.60",
        "cd ~/hyrox-mcp && node dist/index.js"
      ],
      "env": {
        "DB_HOST": "localhost",
        "DB_PORT": "5432",
        "DB_NAME": "hyrox_app_db",
        "DB_USER": "hyrox_admin",
        "DB_PASSWORD": "hyrox_secure_pass",
        "N8N_URL": "http://localhost:5678",
        "N8N_API_KEY": "your-api-key"
      }
    }
  }
}
```
