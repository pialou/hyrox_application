# Cloudflare Tunnel Directive

> **Last Updated**: 2026-02-16
> **Status**: ✅ Active
> **Domain**: pialou.eu

## Overview

Cloudflare Tunnel expose les services du serveur `pialousport` via HTTPS standard, contournant les restrictions des portails captifs WiFi (WireGuard/Tailscale bloqué).

---

## Configuration

| Property | Value |
|----------|-------|
| **Tunnel Name** | `hyrox` |
| **Tunnel UUID** | `574c4ff9-1519-4a1a-aa5f-9a238868f80d` |
| **Domain** | `pialou.eu` |
| **Cloudflared** | v2026.2.0 (`~/.local/bin/cloudflared`) |
| **Config** | `~/.cloudflared/config.yml` |
| **Credentials** | `~/.cloudflared/574c4ff9-...json` |
| **Systemd** | `cloudflared.service` (user) |

### Routes

| Hostname | Service | Status |
|----------|---------|--------|
| `api.pialou.eu` | `http://localhost:3001` (Hyrox API) | ✅ |
| `n8n.pialou.eu` | `http://localhost:5678` (n8n) | ✅ |
| `ssh.pialou.eu` | `ssh://localhost:22` (SSH) | ✅ |
| `ha.pialou.eu` | `http://localhost:8123` (Home Assistant) | ✅ |

---

## URLs

```
API:  https://api.pialou.eu
n8n:  https://n8n.pialou.eu
SSH:  ssh ssh.pialou.eu  (via ProxyCommand)
HA:   https://ha.pialou.eu
```

---

## SSH via Cloudflare

Requires `cloudflared` on the Mac (`brew install cloudflared`) and an SSH config entry:

```ssh-config
# ~/.ssh/config
Host ssh.pialou.eu
    HostName ssh.pialou.eu
    User pialou
    ProxyCommand /opt/homebrew/bin/cloudflared access ssh --hostname %h
```

Usage: `ssh ssh.pialou.eu`

---

## Home Assistant

HA runs in Docker on port 8123. The config at `/home/pialou/homeassistant/config/configuration.yaml` includes trusted proxy settings for Cloudflare:

```yaml
http:
  use_x_forwarded_for: true
  trusted_proxies:
    - 172.16.0.0/12
    - 127.0.0.1
    - ::1
```

---

## Management

```bash
# Status
systemctl --user status cloudflared

# Restart
systemctl --user restart cloudflared

# Logs
journalctl --user -u cloudflared -f --no-pager

# List tunnels
~/.local/bin/cloudflared tunnel list

# Test API
curl https://api.pialou.eu/api/workouts | head -50
```

---

## Architecture

```
[Browser/App] → HTTPS/443 → [Cloudflare Edge] → Tunnel → [pialousport:3001] API
                                                        → [pialousport:5678] n8n
                                                        → [pialousport:22]   SSH
                                                        → [pialousport:8123] HA
```

## Troubleshooting

### Tunnel ne démarre pas
```bash
~/.local/bin/cloudflared tunnel run hyrox  # manual test
cat ~/.cloudflared/config.yml              # check config
```

### DNS ne résout pas
```bash
dig api.pialou.eu CNAME +short
```

### Ajouter un nouveau service
1. Ajouter dans `~/.cloudflared/config.yml` sous `ingress:`
2. `~/.local/bin/cloudflared tunnel route dns hyrox nouveau.pialou.eu`
3. `systemctl --user restart cloudflared`
