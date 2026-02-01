# MCP Server Directive

## Goal
Document le serveur MCP qui permet à l'IA d'accéder à PostgreSQL et n8n pour Hyrox Intel.

## When to Use
- Quand l'IA a besoin d'accéder à la base de données
- Quand l'IA doit déclencher des workflows n8n
- Pour la gestion des plans d'entraînement

## Infrastructure

### Serveur MCP
- **Location**: `pialousport:~/hyrox-mcp/`
- **Transport**: stdio via SSH
- **Code source**: `execution/mcp-server/`

### Connexion
```bash
ssh pialou@100.107.228.60 "cd ~/hyrox-mcp && node dist/index.js"
```

## Tools Disponibles

### PostgreSQL

| Tool | Description | Read-Only |
|------|-------------|-----------|
| `db_query` | Exécuter une requête SELECT | ✅ |
| `db_list_tables` | Lister les tables avec row counts | ✅ |
| `db_describe_table` | Schéma d'une table | ✅ |
| `db_insert` | Insérer des données | ❌ |
| `db_update` | Modifier des données | ❌ |

### n8n

| Tool | Description |
|------|-------------|
| `n8n_list_workflows` | Lister les workflows |
| `n8n_get_workflow` | Détails d'un workflow |
| `n8n_execute_workflow` | Exécuter un workflow |

## Exemples d'Utilisation

### Lister les plans d'entraînement
```
db_query: {
  "sql": "SELECT id, title, status, is_structured FROM training_plan ORDER BY created_at DESC LIMIT 10"
}
```

### Décrire la table training_plan
```
db_describe_table: { "table": "training_plan" }
```

### Déclencher le workflow Architect
```
n8n_execute_workflow: {
  "workflowId": "architect-workflow-id",
  "data": {
    "plan_id": "uuid",
    "title": "Plan Title",
    "description": "User description"
  }
}
```

## Déploiement

### Depuis ce Mac
```bash
# 1. Copier les fichiers
scp -r execution/mcp-server/* pialou@100.107.228.60:~/hyrox-mcp/

# 2. Sur le serveur (installer Node.js si nécessaire)
ssh pialou@100.107.228.60
sudo curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Build
cd ~/hyrox-mcp
npm install
npm run build
```

## Claude Desktop Config

Ajouter dans `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "hyrox-intel": {
      "command": "ssh",
      "args": [
        "-o", "StrictHostKeyChecking=no",
        "pialou@100.107.228.60",
        "cd ~/hyrox-mcp && DB_HOST=localhost DB_PASSWORD=hyrox_secure_pass node dist/index.js"
      ]
    }
  }
}
```

## Sécurité

- SELECT queries uniquement pour `db_query`
- INSERT/UPDATE séparés avec tools dédiés
- Pas de DELETE tool (safety)
- Variables d'environnement pour credentials

## Edge Cases

| Scenario | Handling |
|----------|----------|
| Connection refused | Vérifier que Docker PostgreSQL tourne |
| n8n API error | Vérifier l'API key dans .env |
| SSH timeout | Vérifier Tailscale connection |

## Learnings & Notes
- 2026-01-29: Serveur MCP créé avec 8 tools
