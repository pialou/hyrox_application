# API Usage Directive - Hyrox Intel

## Goal
Documentation de l'API HTTP pour la communication entre Roxapp (frontend) et le backend (PostgreSQL + n8n).

## Infrastructure

### API Server
- **Host**: `pialousport` (100.107.228.60)
- **Port**: 3001
- **Base URL**: `http://100.107.228.60:3001`
- **Technology**: Node.js + Express + PostgreSQL
- **Location**: `~/hyrox-api/` sur pialousport

### Accessibility
- **Tailscale**: ✅ Accessible via IP 100.107.228.60 sur le réseau Tailscale
- **Internet**: ⚠️ Pas encore exposé publiquement (prévu: Cloudflare Tunnel ou ngrok)

---

## Endpoints

### Health Check
```http
GET /health
```
**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-29T20:00:00.000Z"
}
```

---

### Workouts

#### Liste des séances
```http
GET /api/workouts?date={YYYY-MM-DD}&status={status}
```

**Query Parameters:**
- `date` (optional): Filter by session date (YYYY-MM-DD)
- `status` (optional): Filter by status (`planned`, `completed`, `missed`)

**Response:**
```json
[
  {
    "id": "uuid",
    "title": "Simu Hyrox: The Engine",
    "category": "Hyrox",
    "session_date": "2026-01-30T08:00:00Z",
    "status": "planned",
    "planned_details": {
      "sections": [...]
    },
    "duration_minutes": 75
  }
]
```

#### Séance unique
```http
GET /api/workouts/:id
```

**Response:** Single workout object (same structure as above)

#### Compléter une séance
```http
POST /api/workouts/:id/complete
Content-Type: application/json

{
  "executedDetails": {
    "completedAt": "2026-01-29T21:00:00Z",
    "actualDuration": 1185,
    "sections": [...]
  },
  "rpe": 8,
  "durationMinutes": 70,
  "athleteComments": "Felt strong today"
}
```

**Response:** Updated workout object with `status: "completed"`

---

### n8n Workflows

#### Déclencher un workflow
```http
POST /api/n8n/trigger/:workflowId
Content-Type: application/json

{
  "plan_id": "uuid",
  "title": "Plan Title",
  "description": "User prompt"
}
```

**Example - Architect workflow:**
```bash
curl -X POST http://100.107.228.60:3001/api/n8n/trigger/architect-workflow-id \
  -H "Content-Type: application/json" \
  -d '{"plan_id": "uuid", "title": "Plan personnalisé"}'
```

---

### Athlete Metrics
```http
GET /api/athlete/metrics
```

**Response:**
```json
{
  "id": "uuid",
  "weight_kg": 75.5,
  "resting_hr": 52,
  "max_hr": 192,
  "vo2_max": 58.2,
  "current_prs": {
    "5km": "20:00",
    "deadlift": 140
  },
  "training_zones": {
    "z2_hr": [130, 145]
  }
}
```

---

### Strava Activities
```http
GET /api/strava/activities
```

**Response:**
```json
[
  {
    "activity_id": 123456789,
    "name": "Morning Run",
    "start_date": "2026-01-29T07:00:00Z",
    "type": "Run",
    "distance": 5000.0,
    "moving_time": 1200,
    "suffer_score": 45
  }
]
```

---

## Frontend Integration

### Service (`src/services/api.ts`)

```typescript
import { apiService } from '@/services/api';

// Fetch workouts
const workouts = await apiService.getWorkouts({ 
  status: 'planned' 
});

// Complete workout
await apiService.completeWorkout(workoutId, {
  executedDetails: { /* ... */ },
  rpe: 8,
  durationMinutes: 70
});

// Trigger n8n workflow
await apiService.triggerWorkflow('architect-id', {
  plan_id: planId
});
```

### Environment Variables
**File:** `roxapp-web/.env`

```bash
VITE_API_URL=http://100.107.228.60:3001
```

**Production (Internet accessible):**
```bash
VITE_API_URL=https://api.yourdom

ain.com
```

---

## Deployment

### Option 1: Tailscale Only (Current)
API accessible uniquement sur le réseau Tailscale (100.107.228.60:3001)

### Option 2: Internet Public (Recommended)

#### A. Cloudflare Tunnel
```bash
# Sur pialousport
cloudflared tunnel create hyrox-api
cloudflared tunnel route dns hyrox-api api.hyrox.yourdomain.com
cloudflared tunnel run --url http://localhost:3001 hyrox-api
```

#### B. ngrok (Dev/Testing)
```bash
# Sur pialousport
ngrok http 3001
# URL: https://random-id.ngrok.io
```

#### C. Reverse Proxy avec Nginx
Si tu as déjà un domaine + Nginx sur pialousport:
```nginx
location /api/ {
  proxy_pass http://localhost:3001/api/;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
}
```

---

## Security Considerations

### Current (Development)
- ✅ PostgreSQL credentials in `.env`
- ✅ n8n API key secured
- ❌ No CORS restrictions (allow all origins)
- ❌ No rate limiting
- ❌ No authentication on API endpoints

### Production (TODO)
- [ ] Add CORS whitelist for Roxapp domain
- [ ] Implement API key auth for sensitive endpoints
- [ ] Add rate limiting (express-rate-limit)
- [ ] HTTPS only (via Cloudflare/nginx)
- [ ] Input validation and sanitization

---

## Troubleshooting

### API not responding
```bash
# Check if running
ssh pialou@100.107.228.60 "ps aux | grep 'node server.js'"

# Check logs
ssh pialou@100.107.228.60 "cat ~/hyrox-api/api.log"

# Restart
ssh pialou@100.107.228.60 "cd ~/hyrox-api && pkill -f 'node server.js' && nohup node server.js > api.log 2>&1 &"
```

### Database connection issues
```bash
# Test PostgreSQL
ssh pialou@100.107.228.60 "docker ps | grep hyrox_db"

# Test connection from API server
ssh pialou@100.107.228.60 "psql -h localhost -U pialou -d hyrox_app_db -c 'SELECT COUNT(*) FROM training_plan;'"
```

### CORS errors from frontend
Add origin to server.js:
```javascript
app.use(cors({
  origin: ['http://localhost:5173', 'https://yourapp.com']
}));
```

---

## Development Workflow

### 1. Local Frontend Development
```bash
cd roxapp-web
npm run dev
# Frontend: http://localhost:5173
# API: http://100.107.228.60:3001 (via Tailscale)
```

### 2. Update API
```bash
# Edit api-server/server.js locally
# Deploy to server
scp -r api-server/* pialou@100.107.228.60:~/hyrox-api/
ssh pialou@100.107.228.60 "cd ~/hyrox-api && pkill -f 'node server.js' && nohup node server.js > api.log 2>&1 &"
```

### 3. Database Migrations
Use MCP tools or direct SQL:
```bash
ssh pialou@100.107.228.60
docker exec -it hyrox_db_container psql -U pialou -d hyrox_app_db
```

---

## Edge Cases

| Scenario | Handling |
|----------|----------|
| API offline | Frontend uses cached data from IndexedDB |
| Slow network | Show loading states, timeout after 10s |
| 404 workout not found | Display "Séance introuvable" message |
| PostgreSQL down | API returns 500, frontend shows error banner |
| n8n workflow failure | Log error, notify user via UI |

---

## Roadmap

- [ ] Expose API via Cloudflare Tunnel for internet access
- [ ] Add authentication (JWT or API keys)
- [ ] Implement IndexedDB caching in frontend
- [ ] Add WebSocket support for real-time updates
- [ ] Create admin dashboard for API monitoring
- [ ] Set up automated backups for PostgreSQL data
