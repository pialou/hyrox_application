#!/bin/bash
# =============================================================================
# Cloudflare Tunnel Setup Script for Hyrox App
# Run this via SSH on pialousport: ssh pialou@<IP> "bash ~/setup_cloudflare_tunnel.sh"
# Or copy to server first and run locally
# =============================================================================

set -e

CLOUDFLARED="$HOME/.local/bin/cloudflared"
TUNNEL_NAME="hyrox"
CONFIG_DIR="$HOME/.cloudflared"

echo "================================================"
echo "  Cloudflare Tunnel Setup for Hyrox"
echo "================================================"
echo ""

# 1. Check cloudflared is installed
if [ ! -x "$CLOUDFLARED" ]; then
    echo "[1/6] Installing cloudflared..."
    mkdir -p "$HOME/.local/bin"
    curl -sL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o "$CLOUDFLARED"
    chmod +x "$CLOUDFLARED"
else
    echo "[1/6] cloudflared already installed: $($CLOUDFLARED --version)"
fi

# 2. Login to Cloudflare (one-time auth)
if [ ! -f "$CONFIG_DIR/cert.pem" ]; then
    echo ""
    echo "[2/6] Authenticating with Cloudflare..."
    echo "  → A browser link will appear. Open it to authorize."
    echo "  → If on a headless server, copy the URL and open it on your phone/laptop."
    echo ""
    $CLOUDFLARED tunnel login
else
    echo "[2/6] Already authenticated with Cloudflare"
fi

# 3. Create tunnel (if not exists)
EXISTING=$($CLOUDFLARED tunnel list 2>/dev/null | grep "$TUNNEL_NAME" || true)
if [ -z "$EXISTING" ]; then
    echo ""
    echo "[3/6] Creating tunnel '$TUNNEL_NAME'..."
    $CLOUDFLARED tunnel create "$TUNNEL_NAME"
else
    echo "[3/6] Tunnel '$TUNNEL_NAME' already exists"
fi

# 4. Get tunnel UUID
TUNNEL_UUID=$($CLOUDFLARED tunnel list 2>/dev/null | grep "$TUNNEL_NAME" | awk '{print $1}')
echo "  → Tunnel UUID: $TUNNEL_UUID"

# 5. Create config
mkdir -p "$CONFIG_DIR"

echo ""
echo "[4/6] Creating tunnel config..."
echo "  Available services to expose:"
echo "    - API (port 3001) → e.g., api.yourdomain.com"
echo "    - n8n (port 5678) → e.g., n8n.yourdomain.com"
echo ""

# Check if config already exists
if [ -f "$CONFIG_DIR/config.yml" ]; then
    echo "  ⚠️  Config already exists at $CONFIG_DIR/config.yml"
    echo "  Current config:"
    cat "$CONFIG_DIR/config.yml"
    echo ""
    read -p "  Overwrite? (y/N): " OVERWRITE
    if [ "$OVERWRITE" != "y" ] && [ "$OVERWRITE" != "Y" ]; then
        echo "  Keeping existing config."
        SKIP_CONFIG=1
    fi
fi

if [ -z "$SKIP_CONFIG" ]; then
    read -p "  Enter your Cloudflare domain (e.g., lagane.fr): " CF_DOMAIN

    if [ -z "$CF_DOMAIN" ]; then
        echo "  ❌ No domain entered. Using Quick Tunnel mode (temporary URL)."
        echo "  Run: $CLOUDFLARED tunnel --url http://localhost:3001"
        exit 1
    fi

    cat > "$CONFIG_DIR/config.yml" << EOF
tunnel: $TUNNEL_UUID
credentials-file: $CONFIG_DIR/$TUNNEL_UUID.json

ingress:
  # Hyrox API
  - hostname: api.$CF_DOMAIN
    service: http://localhost:3001
  # n8n Automation
  - hostname: n8n.$CF_DOMAIN
    service: http://localhost:5678
  # Catch-all
  - service: http_status:404
EOF

    echo "  ✅ Config written to $CONFIG_DIR/config.yml"
    echo ""

    # 6. Create DNS routes
    echo "[5/6] Creating DNS routes..."
    $CLOUDFLARED tunnel route dns "$TUNNEL_NAME" "api.$CF_DOMAIN" 2>/dev/null || echo "  (api.$CF_DOMAIN may already exist)"
    $CLOUDFLARED tunnel route dns "$TUNNEL_NAME" "n8n.$CF_DOMAIN" 2>/dev/null || echo "  (n8n.$CF_DOMAIN may already exist)"
    echo "  ✅ DNS routes configured"
fi

# 7. Install systemd service
echo ""
echo "[6/6] Installing systemd service..."
mkdir -p "$HOME/.config/systemd/user"

cat > "$HOME/.config/systemd/user/cloudflared.service" << EOF
[Unit]
Description=Cloudflare Tunnel (hyrox)
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
ExecStart=$CLOUDFLARED tunnel run $TUNNEL_NAME
Restart=always
RestartSec=5
Environment=HOME=$HOME

[Install]
WantedBy=default.target
EOF

systemctl --user daemon-reload
systemctl --user enable cloudflared
systemctl --user start cloudflared

echo "  ✅ Systemd service installed and started"

# 8. Verify
echo ""
echo "================================================"
echo "  ✅ Setup Complete!"
echo "================================================"
echo ""
echo "  Tunnel: $TUNNEL_NAME ($TUNNEL_UUID)"
echo "  Config: $CONFIG_DIR/config.yml"
echo "  Service: systemctl --user status cloudflared"
echo ""
if [ -n "$CF_DOMAIN" ]; then
    echo "  URLs:"
    echo "    API: https://api.$CF_DOMAIN"
    echo "    n8n: https://n8n.$CF_DOMAIN"
fi
echo ""
echo "  Test: curl https://api.$CF_DOMAIN/api/workouts | head -100"
echo ""

systemctl --user status cloudflared --no-pager
