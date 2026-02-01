#!/bin/bash
# Hyrox MCP Server Deployment Script
# Run this on the pialousport server

set -e

echo "=== Hyrox MCP Server Deployment ==="

# 1. Install Node.js 20 LTS if not installed
if ! command -v node &> /dev/null; then
    echo "Installing Node.js 20 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "Node.js already installed: $(node --version)"
fi

# 2. Create MCP server directory
MCP_DIR="$HOME/hyrox-mcp"
echo "Creating MCP server directory: $MCP_DIR"
mkdir -p "$MCP_DIR/src"

# 3. Copy files (these should be transferred via scp first)
echo "Setting up MCP server files..."

# 4. Install dependencies
cd "$MCP_DIR"
if [ -f "package.json" ]; then
    echo "Installing npm dependencies..."
    npm install
    
    # 5. Build TypeScript
    echo "Building TypeScript..."
    npm run build
else
    echo "ERROR: package.json not found. Please copy the MCP server files first."
    echo "Run from your Mac:"
    echo "  scp -r execution/mcp-server/* pialou@100.107.228.60:~/hyrox-mcp/"
    exit 1
fi

# 6. Create systemd service (optional)
read -p "Create systemd service? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Creating systemd service..."
    sudo tee /etc/systemd/system/hyrox-mcp.service > /dev/null << EOF
[Unit]
Description=Hyrox MCP Server
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$MCP_DIR
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    sudo systemctl enable hyrox-mcp
    echo "Service created. Start with: sudo systemctl start hyrox-mcp"
fi

echo ""
echo "=== Deployment Complete ==="
echo ""
echo "To test the MCP server manually:"
echo "  cd $MCP_DIR"
echo "  source .env  # or set environment variables"
echo "  node dist/index.js"
echo ""
echo "Remember to:"
echo "  1. Set your n8n API key in .env"
echo "  2. Configure Claude Desktop or your MCP client"
