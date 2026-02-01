# Internet Exposure - Cloudflare Tunnel Setup

## Quick Setup (Recommended)

### Option 1: Cloudflare Tunnel (Free, Persistent)

**Install cloudflared on pialousport:**
```bash
ssh pialou@100.107.228.60
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
```

**Create tunnel:**
```bash
cloudflared tunnel create hyrox-api
# Note the tunnel ID
```

**Configure tunnel:**
```bash
# Create config file
cat > ~/.cloudflared/config.yml << EOF
tunnel: <TUNNEL_ID>
credentials-file: /home/pialou/.cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: api.yourdomain.com
    service: http://localhost:3001
  - service: http_status:404
EOF
```

**Route DNS:**
```bash
cloudflared tunnel route dns hyrox-api api.yourdomain.com
```

**Run tunnel:**
```bash
cloudflared tunnel run hyrox-api

# Or as service:
sudo cloudflared service install
sudo systemctl start cloudflared
sudo systemctl enable cloudflared
```

**Update frontend:**
```bash
# roxapp-web/.env
VITE_API_URL=https://api.yourdomain.com
```

---

### Option 2: ngrok (Quick Test)

**On pialousport:**
```bash
# Install ngrok
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update && sudo apt install ngrok

# Auth (get token from ngrok.com)
ngrok config add-authtoken <YOUR_TOKEN>

# Expose API
ngrok http 3001
```

**Output:**
```
Forwarding  https://abc123.ngrok.io -> http://localhost:3001
```

**Update frontend:**
```bash
VITE_API_URL=https://abc123.ngrok.io
```

---

### Option 3: Reverse Proxy (If you have domain + Nginx)

**Nginx config:**
```nginx
server {
    listen 443 ssl;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods 'GET, POST, OPTIONS';
        add_header Access-Control-Allow-Headers 'Content-Type';
    }
}
```

---

## Testing

**Test from any device:**
```bash
curl https://api.yourdomain.com/health
curl https://api.yourdomain.com/api/workouts | jq '.[0] | .title'
```

**Frontend test:**
```bash
cd roxapp-web
npm run dev
# Open http://localhost:5173
# Check Network tab → should hit your public API URL
```

---

## Security (Production)

### Update CORS in server.js:
```javascript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://yourdomain.com',
    'https://roxapp.vercel.app'
  ]
}));
```

### Add API authentication:
```javascript
const apiKeyMiddleware = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

app.use('/api', apiKeyMiddleware);
```

### Rate limiting:
```bash
npm install express-rate-limit
```

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

---

## Deployment Checklist

- [ ] Choose exposure method (Cloudflare Tunnel recommended)
- [ ] Configure tunnel/ngrok/nginx
- [ ] Test public URL from external network
- [ ] Update `VITE_API_URL` in frontend .env
- [ ] Add CORS whitelist
- [ ] Implement rate limiting
- [ ] (Optional) Add API key authentication
- [ ] Monitor logs for errors
- [ ] Deploy frontend to Vercel/Netlify with production API_URL
