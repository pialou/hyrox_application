# Hyrox API Server

HTTP REST API pour Roxapp - Accès aux données PostgreSQL et n8n workflows.

## Setup

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Run locally
node server.js

# Run in production (on pialousport)
pm2 start server.js --name hyrox-api
```

## Endpoints

### Workouts
- `GET /api/workouts` - Liste des séances (query params: date, status)
- `GET /api/workouts/:id` - Détails d'une séance
- `POST /api/workouts/:id/complete` - Marquer séance comme complétée

### n8n
- `POST /api/n8n/trigger/:workflowId` - Déclencher un workflow

### Athlete
- `GET /api/athlete/metrics` - Métriques athlète

### Strava
- `GET /api/strava/activities` - Activités Strava

## Deployment

### Option 1: Sur pialousport (Tailscale + Internet)
```bash
# Copy to server
scp -r api-server pialou@100.107.228.60:~/hyrox-api

# SSH into server
ssh pialou@100.107.228.60

# Install dependencies
cd ~/hyrox-api
npm install

# Install PM2
npm install -g pm2

# Start API
pm2 start server.js --name hyrox-api
pm2 save
pm2 startup
```

### Option 2: Expose via ngrok/Cloudflare Tunnel
Pour rendre l'API accessible depuis internet sans domaine :

```bash
# Install Cloudflare Tunnel
cloudflared tunnel create hyrox-api
cloudflared tunnel route dns hyrox-api api.hyrox.yourdomain.com

# Run tunnel
cloudflared tunnel --url http://localhost:3001 run hyrox-api
```

## Security

- Add CORS whitelist for production
- Implement API key auth for sensitive endpoints
- Rate limiting (express-rate-limit)
