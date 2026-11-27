# mcadmin.palvi.org - Minecraft Admin Panel

Lightweight LAN-only web management panel for the Minecraft server stack on **palviserver** (`BabaSquadWorld`, Fabric 26.3, `itzg/minecraft-server` + `lazymc` + `mc-watch`).

---

## Architecture

```
Browser (Home LAN)
       │ https://mcadmin.palvi.org
       ▼
NPM Proxy Host (LAN only access list, *.palvi.org SSL cert, WebSocket on)
       │ http://172.17.0.1:3555
       ▼
mc-panel Container (non-root UID 1000, ~50 MB RAM)
       ├── Docker API via tecnativa/docker-socket-proxy (CONTAINERS=1, POST=1, EXEC=0)
       ├── RCON (mc:25575 on minecraft-network)
       ├── Server files (/opt/containers/minecraft: logs/latest.log, mods/, world)
       ├── Settings (/opt/stacks/minecraft/mc.env)
       ├── State (/run/mc-watch/state.json)
       └── Privileged Helper via Unix Domain Socket (/run/mc-admin-helper/helper.sock)
               └── mc-admin-helper (root-owned, fixed named actions only)
```

---

## Directory Structure

```
palvi-mc-server/
├── compose.yaml                  # Updated Minecraft stack (uses mc.env & sleep_after=300)
├── mc.env                        # itzg environment variables (Settings source of truth)
├── compose.panel.yaml            # Panel & Docker Socket Proxy stack (/opt/stacks/mc-panel/compose.yaml)
├── Dockerfile                    # Container definition (python:3.12-slim, non-root)
├── requirements.txt              # FastAPI, uvicorn, argon2-cffi, httpx, etc.
├── DESIGN.md                     # Architectural design & acceptance specification
├── README.md                     # Deployment & operations guide
├── helper/
│   ├── mc-admin-helper           # Root-owned privileged helper script
│   ├── mc-admin-helper.socket    # Systemd socket-activation unit
│   ├── mc-admin-helper@.service  # Systemd service unit (StandardInput=socket)
│   └── install.sh                # Helper installer script
├── mc-watch/
│   ├── mc-watch                  # Updated daemon script writing /run/mc-watch/state.json
│   └── mc-watch.service          # Systemd unit with Environment="GRACE=300"
├── app/                          # Panel backend and UI
│   ├── main.py                   # FastAPI application entrypoint
│   ├── config.py                 # Configuration and environment bindings
│   ├── database.py               # SQLite storage (admin auth, sessions, audit log)
│   ├── auth.py                   # Argon2 password hashing, session tokens, 15-min lockout
│   ├── docker_client.py          # Async HTTP client to docker-socket-proxy
│   ├── rcon_client.py            # Async Minecraft RCON client
│   ├── helper_client.py          # Async client to helper.sock
│   ├── modrinth.py               # Modrinth v2 API client (Fabric 26.3 compatibility filter)
│   ├── settings_manager.py       # itzg settings parser, diff generator, and backup manager
│   ├── watcher.py                # Idle stop watcher (300s) & scheduled backup runner (04:00)
│   ├── api/                      # REST API endpoints
│   └── static/                   # Modern responsive dark web UI (HTML/CSS/Vanilla JS)
└── tests/
    └── test_core.py              # Automated unit tests
```

---

## Deployment on palviserver

### 1. Update Existing Minecraft Stack
On `palviserver`:
```bash
cd /opt/stacks/minecraft
# 1. Place the new mc.env file
cp /path/to/palvi-mc-server/mc.env ./mc.env

# 2. Update compose.yaml to reference mc.env and include lazymc.time.sleep_after=300
cp /path/to/palvi-mc-server/compose.yaml ./compose.yaml
```

### 2. Install Root Privileged Helper
The helper manages `recreate-mc`, `set-grace`, `start-media`, `backup`, and `restore` securely without exposing the raw Docker socket to the panel.
```bash
cd /path/to/palvi-mc-server/helper
sudo ./install.sh
```
Verify the socket is listening:
```bash
sudo systemctl status mc-admin-helper.socket
ls -l /run/mc-admin-helper/helper.sock
```

### 3. Update `mc-watch` with State JSON Export
```bash
sudo cp /path/to/palvi-mc-server/mc-watch/mc-watch /usr/local/bin/mc-watch
sudo chmod +x /usr/local/bin/mc-watch
sudo systemctl restart mc-watch
```
Verify state generation:
```bash
cat /run/mc-watch/state.json
```
Output:
```json
{
  "mc": "stopped",
  "media": "running",
  "media_start_at": null,
  "grace": 300
}
```

### 4. Deploy Panel Stack
```bash
sudo mkdir -p /opt/stacks/mc-panel /opt/containers/mc-panel /mnt/media/backups/minecraft
sudo chown -R 1000:1000 /opt/containers/mc-panel

# Copy panel compose configuration
sudo cp /path/to/palvi-mc-server/compose.panel.yaml /opt/stacks/mc-panel/compose.yaml

# Build & launch container
cd /path/to/palvi-mc-server
sudo docker compose -f /opt/stacks/mc-panel/compose.yaml build
sudo docker compose -f /opt/stacks/mc-panel/compose.yaml up -d
```

Check health:
```bash
curl http://127.0.0.1:3555/healthz
# Expected: HTTP 200 (GET; HEAD returns 405)
```

### 5. Nginx Proxy Manager (NPM)
1. Open NPM (`https://nginx.palvi.org`)
2. Create New Proxy Host:
   - **Domain Names**: `mcadmin.palvi.org`
   - **Scheme**: `http`
   - **Forward Host / IP**: `172.17.0.1`
   - **Forward Port**: `3555`
   - **Access List**: `LAN only`
   - **SSL**: `*.palvi.org` Wildcard Certificate
   - **Force SSL**: Enabled
   - **HTTP/2 Support**: Enabled
   - **HSTS**: Disabled (house rule)
   - **WebSockets Support**: Enabled (for live logs & console)

### 6. Pi-hole Local DNS
Add local record so LAN clients resolve `mcadmin.palvi.org` to `192.168.0.136`:
```bash
cd /opt/stacks/pihole
cp .env .env.bak-$(date +%Y%m%d)
# Add mcadmin.palvi.org to custom hosts list
docker compose up -d
dig @192.168.0.136 mcadmin.palvi.org +short
# Output: 192.168.0.136
```

---

## Security Implementation

- **Strict Access Control**: Restricted to home LAN via NPM's `LAN only` access list.
- **Single Admin Account**: Initial password prompt locks permanently upon setup. Passwords hashed using **Argon2** (with PBKDF2-SHA256 fallback).
- **Brute-Force Lockout**: 5 failed login attempts lock out the client IP for 15 minutes.
- **CSRF Protection**: Tokens verified on all mutating HTTP requests (`POST`, `PUT`, `DELETE`).
- **Scoped Docker API Proxy**: `tecnativa/docker-socket-proxy` restricted to `CONTAINERS=1`, `POST=1` (start/stop/restart). Container `EXEC=0`, image/volume/network manipulation blocked.
- **Privileged Helper**: Root-owned script accepts only 5 strictly validated actions (`recreate-mc`, `set-grace`, `start-media`, `backup`, `restore`). Traversal paths and free-form shell inputs are rejected.
- **Non-Root Container**: Container runs under `UID:GID 1000:1000` with `no-new-privileges: true`.

---

## Testing & Acceptance Checks

Run unit tests:
```bash
python -m unittest tests/test_core.py
```

### Key Acceptance Scenarios:
| Scenario | Verification | Expected Result |
| --- | --- | --- |
| **Status Card** | Open dashboard when server asleep | Displays `Asleep`, zero RCON polling, RAM ~50MB |
| **Start Server** | Click `Start` | Status changes to `Starting` then `Online`; `mc-watch` stops media |
| **Idle Timeout** | Start server, no players join | Server automatically stops after 300s (5 min); media restarts after grace |
| **Online Mode Safety** | Check settings form | Warning displayed; `ONLINE_MODE=false` preserved |
| **Recreate-mc Sequence** | Apply settings or mod change | Runs `up --no-start mc` -> `start mc` -> wait 5s -> `stop mc` -> `restart lazymc` |
| **Mod Compatibility** | Search for `noisium` | Add button disabled: "No build available for Fabric 26.3" |
| **Backups** | Click `Backup Now` | Non-blocking backup created in `/mnt/media/backups/minecraft/` |
