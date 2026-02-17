#!/bin/bash

# Configuration
SERVER_USER="pialou"
SERVER_IP="100.107.228.60"
REMOTE_DIR="~/hyrox-frontend"

echo "🚀 Deploying to $SERVER_IP..."

# 1. Sync Files (Exclude huge folders)
echo "📦 Syncing files..."
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'dist' . $SERVER_USER@$SERVER_IP:$REMOTE_DIR/

# 2. Setup Env & Build on Server
echo "🔧 Building on server..."
ssh $SERVER_USER@$SERVER_IP << 'EOF'
    cd ~/hyrox-frontend
    
    # Ensure Secrets
    echo 'VITE_API_URL=http://100.107.228.60:3001' > .env
    echo 'VITE_STRAVA_CLIENT_ID=190950' >> .env
    echo 'VITE_STRAVA_CLIENT_SECRET=288e50647c8e8437e7bce30e50451dcc37acc6b0' >> .env
    echo 'VITE_STRAVA_REFRESH_TOKEN=0064db6a99ddcfdf98af250ecf7769a992e24d7e' >> .env
    
    # Install dependencies
    if [ ! -d "node_modules" ]; then
        npm install
    fi
    
    # Build
    npm run build
    
    # Start/Restart Server (Using PM2 if available, or nohup)
    if command -v pm2 &> /dev/null; then
        pm2 restart hyrox-app || pm2 serve dist 4173 --name "hyrox-app" --spa
        pm2 save
    else
        echo "⚠️ PM2 not found. Starting with nohup..."
        pkill -f 'vite preview' || true
        nohup ./node_modules/.bin/vite preview --host --port 4173 > frontend.log 2>&1 &
    fi
EOF

echo "✅ Deployment Complete!"
echo "👉 Access at: http://100.107.228.60:4173"
