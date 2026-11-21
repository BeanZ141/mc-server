
# mcadmin.palvi.org: Minecraft admin panel design

Nov 21, 2026 · @Harsh

Build a LAN-only web panel at `https://mcadmin.palvi.org` to run the one Minecraft server on palviserver: start and stop it, edit its settings, add and remove mods, and watch its health. It must work with the existing lazymc + itzg + mc-watch setup, not replace it. The framework, language and UI library are the coding agent's choice.

## Goal, scope and owner decisions

| Decision | Value |
| --- | --- |
| Servers managed | One: the existing `mc` container (Fabric, Minecraft 26.3, world `BabaSquadWorld`) |
| Users | One admin (the owner). No roles, no friend accounts |
| Reach | LAN only, through Nginx Proxy Manager with the `LAN only` access list, plus the panel's own login |
| Manual start | Every start, manual or join-woken, sleeps after 5 minutes with no players, set once in lazymc (was about 60 s) |
| Media stack | Keeps stopping while Minecraft runs and restarting after the grace period. The panel shows this and can change the grace period. It does not take over the job from `mc-watch` |
| Server settings | Kept as itzg environment variables, never by editing `server.properties` directly |
| Online mode | Stays `false` (owner requirement). The panel must not offer to change it without a warning |

**Out of scope:** more than one server, public access, Bedrock, a file manager for arbitrary paths, hosting for other games, a user or role system.

**Reference doc:** `claude/minecraft-fabric-server-guide.md` in the palvi.org Project holds the full current compose file, scripts and history. Read it before starting.

## Current system

The panel sits on top of a working setup. Break none of it.

| Part | Where | What the panel must know |
| --- | --- | --- |
| Host | `palviserver`, Ubuntu Server, i3-3240 (2 cores, 4 threads), 12 GB RAM, one HDD for OS, Docker and `/programming` | Keep the panel light: about 100 MB RAM, no polling of `mc` while it is asleep |
| Stack | `/opt/stacks/minecraft/compose.yaml` | Services `lazymc` and `mc` on network `minecraft-network` (172.30.0.0/24, lazymc .2, mc .3) |
| `lazymc` | `ghcr.io/joesturge/lazymc-docker-proxy`, host port 26656 to 25565 | Starts `mc` when a player joins and stops it after idle. Configured by labels on `mc` (`lazymc.*`). Reads `/programming/minecraft` read-only |
| `mc` | `itzg/minecraft-server`, `restart: "no"`, data at `/programming/minecraft` (container `/data`) | itzg rewrites `server.properties` from environment variables on every start. Mods listed in `MODRINTH_PROJECTS` download from Modrinth at each start. RCON is on, password in `/data/.rcon-cli.env` |
| `mc-watch` | `/usr/local/bin/mc-watch`, systemd `mc-watch.service` | Listens to Docker events for `mc`. On `start` runs `media-stop`. On `die` waits `GRACE` seconds (default 300) then runs `media-start`. Logs with tag `mc-watch` |
| Media scripts | `/usr/local/bin/media-stop`, `media-start` | Stop or start jellyseerr, jellyfin, sonarr, radarr, bazarr, prowlarr, flaresolverr, qbittorrent |
| Logs | `/programming/minecraft/logs/latest.log` | Survives container recreation. `docker logs mc` does not |

**Known traps:**

- **`Created` state.** After `mc` is recreated it sits in `Created`, and lazymc then never starts it: joins are held and kicked. Every recreate must end with this exact sequence: `docker compose up --no-start mc`, `docker start mc`, wait 5 s, `docker stop mc`, `docker restart lazymc`. This start fires `mc-watch` once (media stops, then restarts after the grace period). That is expected.
- **Never `docker compose up -d` in the stack folder.** It starts `mc` directly. Use `up -d lazymc` or the sequence above.
- **Wake time is about 46 s** from container start to `Done`. lazymc holds a joining player only 25 s, so the first join after sleep gets a kick message. The panel should show "starting" for that whole window.
- **Noisium has no 26.3 build.** A mod with no build for 26.3 makes itzg exit at start with "No files are available". The panel must check compatibility before adding a mod, and show that error clearly if it happens.
- **Chunky and pause-when-empty.** The server pauses ticking when empty, which freezes Chunky pregeneration.

## Architecture

Three new parts: the panel container, a Docker socket proxy, and a small root-owned helper for the actions that need `docker compose` or files outside the panel's mounts.

text
Browser (home LAN)
   | https://mcadmin.palvi.org
   v
NPM proxy host (LAN only list, *.palvi.org cert)
   | http 172.17.0.1:<panel port>
   v
mc-panel container  ---- login, UI, API, idle watcher, scheduler
   |-- Docker API via docker-socket-proxy (read + start/stop/restart only)
   |       -> containers mc, lazymc, media containers (status only)
   |-- RCON  mc:25575 on minecraft-network
   |       -> list, tick query, spark tps, console, whitelist, op
   |-- files /programming/minecraft (rw)
   |       -> logs/latest.log, mods/, world, backups staging
   |-- files /opt/stacks/minecraft/mc.env (rw)   -> settings source of truth
   |-- files /run/mc-watch/state.json (ro)       -> media state, grace countdown
   |-- HTTPS api.modrinth.com                    -> mod search and compatibility
   `-- helper: mc-admin-helper (root, fixed actions only)
           -> recreate-mc (the safe sequence), set-grace, backup, restore


**Settings source of truth.** Move the `environment:` block of `mc` out of `compose.yaml` into `/opt/stacks/minecraft/mc.env` and reference it with `env_file:`. The panel edits only that file. A change takes effect through `recreate-mc`. Keep `compose.yaml` otherwise as it is, labels included.

**Helper.** A root-owned script (for example `/usr/local/bin/mc-admin-helper`) that accepts only named actions, with no free-form arguments passed to a shell. The panel calls it through a channel the agent chooses: a systemd socket-activated unit, `sudo` with a single allowed command from a host-side service, or similar. Do not mount the raw Docker socket into the panel to avoid writing the helper.

**mc-watch state file.** Extend `mc-watch` to write a small JSON file on every change, for example `{"mc":"running","media":"stopped","media_start_at":"2026-11-21T18:05:00+05:30","grace":300}`, to `/run/mc-watch/state.json`. The panel reads it. `mc-watch` keeps its job and its current behaviour.

**Process model.** One container, one process, plus an in-process scheduler for idle stop and backups. Persist panel data (login hash, schedules, backup index) in a small file or SQLite under `/opt/containers/mc-panel/`.

## Features and behaviour

Build in this order. Each phase ships on its own.

### Phase 1: control and status

- **Status card** with one of: `Asleep` (mc exited, lazymc up), `Starting` (mc running, no `Done (` line yet in `latest.log`), `Online` (RCON answers), `Stopping`, `Error` (mc exited with a non-zero code, or lazymc down). Show uptime, players online with names, MSPT, CPU and RAM of `mc` from the Docker API.
- **Start.** `docker start mc`. Do not call `media-stop`: `mc-watch` does that on the start event.
- **Idle sleep after 5 minutes.** Every start, manual or join-woken, sleeps after 5 minutes with no players. This is one lazymc setting (owner decision). Fallback only if testing shows lazymc does not sleep a server it did not start, or its sleep time cannot be set (see last section): the panel runs its own idle watcher for all starts: while `mc` is running, poll `list` over RCON every 30 s, and after 5 minutes at 0 players run `docker stop mc`. The timeout is a setting (default 300 s). Show the countdown on the status card.
- **Stop.** `save-all flush` over RCON, then `docker stop mc` (grace period 60 s is already set). Confirm first if players are online, and list their names.
- **Restart** = stop, then start.
- **Keep awake toggle** is not wanted. Do not build it.
- **Live log** of `logs/latest.log`, tail plus follow, with a filter box. Last 500 lines on open.
- **Console** to send one RCON command and show the reply. Keep a short history in the browser only.
- **Media stack card** from the `mc-watch` state file: media running or stopped, the time media will restart, and the grace value. Per media container show Up or Exited from the Docker API. Buttons: change grace (through the helper, which edits the service's `GRACE` and restarts `mc-watch`), and "start media now" (helper runs `media-start`, cancelling the pending timer).

### Phase 2: settings

- A form for the common itzg variables, grouped: World (`LEVEL`, `SEED` shown read-only after the world exists, `DIFFICULTY`, `MODE`, `PVP`, `HARDCORE`), Players (`MAX_PLAYERS`, `ENABLE_WHITELIST`, `ONLINE_MODE` with a warning), Performance (`VIEW_DISTANCE`, `SIMULATION_DISTANCE`, `MEMORY` capped at 4G), Text (`MOTD`).
- An advanced view shows the whole `mc.env` with validation, for variables the form does not cover.
- **Apply** shows a diff, writes `mc.env` with a timestamped backup next to it, and calls the helper's `recreate-mc`. If players are online, ask first. After apply, show the result of the safe sequence step by step.
- Settings that itzg does not take from the environment are out of scope for now.

### Phase 3: addons

- Search Modrinth (`api.modrinth.com/v2`) filtered to loader `fabric`, game version from `VERSION` in `mc.env` (26.3), project type mod. Show name, icon, downloads, server and client side support.
- Before adding, confirm a version exists for 26.3 + Fabric. If none, disable the button and say why.
- Warn when a mod is marked client-required: friends use vanilla clients and could not join.
- **Add** = append the slug to `MODRINTH_PROJECTS` in `mc.env`, then `recreate-mc`. **Remove** = drop the slug, recreate, and make sure the old jar is gone from `mods/` (see last section).
- Installed list: slug, version file present in `mods/`, and any manual jars in `mods/` that are not in `MODRINTH_PROJECTS` (shown as "manual", removable).
- Current list: `fabric-api, lithium, ferrite-core, krypton, spark, chunky`.

### Phase 4: backups and players

- **Backup now** and a daily schedule (default 04:00 Asia/Kolkata), keeping the last 7. Destination on a different disk: `/mnt/media/backups/minecraft/`. While running: `save-off`, `save-all flush`, archive the world folder, `save-on`. If `mc` is asleep, archive directly.
- **Restore** from a list, only while `mc` is stopped. Take a safety backup first.
- Whitelist, op, kick and ban through RCON, with the online player list as a picker.
- A disk usage line: world size, backups size, free space on `/programming` and `/mnt/media`.

### Phase 5: optional

- Chunky controls (dimension, radius, start, pause, progress), with a note that it needs a player online or pause-when-empty off.
- Auth-mod setup once a 26.3 build exists.

## Integrations with the stack

| App | Change | Detail |
| --- | --- | --- |
| Nginx Proxy Manager (`https://nginx.palvi.org`) | New proxy host `mcadmin.palvi.org` | Scheme `http`, forward host `172.17.0.1`, the panel's host port, the existing `*.palvi.org` wildcard certificate, Force SSL and HTTP/2 on, HSTS off (house rule), access list `LAN only`. Turn on WebSocket support if the live log or console uses it |
| Pi-hole | Local DNS record `192.168.0.136 mcadmin.palvi.org` | Add it to the hosts string in `/opt/stacks/pihole/.env` (back the file up first as `.env.bak-<date>`), then `cd /opt/stacks/pihole && docker compose up -d`. Check: `dig @192.168.0.136 mcadmin.palvi.org +short` prints `192.168.0.136` |
| Cloudflare and DDNS | None | No public record. Do not add the name to `/opt/ddns/update.sh` |
| ONT and Tenda | None | No port forward |
| Homarr (`https://home.palvi.org`) | New tile "Minecraft admin" linking to `https://mcadmin.palvi.org` | Owner adds it in the Homarr UI. No integration needed |
| Uptime Kuma (`palvi-astro-kuma-1`, port 3001) | Optional HTTP monitor on the panel's `/healthz` | Do not monitor `mc` itself: it is asleep most of the time and would show as down |
| `mc-watch` | Add the state file write | The only change to its behaviour. Keep the event logic, logging and `GRACE` default as they are |
| `media-stop`, `media-start` | None | Called only by `mc-watch` and the helper's "start media now" action |
| lazymc | Sleep time 300 s | Set the lazymc sleep time to 300 s with a label on mc (label name to confirm, last section). Any label change needs `recreate-mc` |
| Public site brief | Add one row to its Services page, home-network list | `mcadmin.palvi.org`, "Minecraft admin panel". Tell the owner so the other agent can add it |
| `~/homelab` repo and `sync.sh` | Add the panel source, its compose file, `mc.env` (it holds no secrets), the helper, the `mc-watch` change and the README | Panel data under `/opt/containers/mc-panel/` holds the login hash: put it in the secrets archive, not the repo |

New stack layout:

- `/opt/stacks/mc-panel/compose.yaml`: the panel and `docker-socket-proxy`, on `minecraft-network` (so RCON reaches `mc:25575`) and on a private network shared with the socket proxy.
- `/opt/containers/mc-panel/`: panel data.
- Host port: any free port above 3000, checked with `ss -tlnp | grep <port>` (healthy: no output). Bind it to the LAN interface or `0.0.0.0` so NPM reaches it through `172.17.0.1`.

## Security

LAN-only is not a boundary on its own: guests on the home Wi-Fi are on the same LAN. The panel controls a server and, through Docker, the host, so treat it as an admin tool.

- **Login required** on every page and API route. One admin account, password hashed with argon2 or bcrypt, set on first run from an environment variable or a setup page that locks after use. Session cookie `HttpOnly`, `Secure`, `SameSite=Strict`. Lock out for 15 minutes after 5 failed logins.
- **CSRF protection** on every state-changing request.
- **No raw Docker socket in the panel.** Use `tecnativa/docker-socket-proxy` with only `CONTAINERS=1` and `POST=1` scoped to start, stop and restart, everything else (exec, images, volumes, networks, build) off. Check the proxy's options against its current docs.
- **Helper takes named actions only:** `recreate-mc`, `set-grace <seconds>` (integer 60 to 3600), `start-media`, `backup`, `restore <backup id>` (an id from the panel's list, never a path). It validates its input and logs every call with `logger -t mc-admin-helper`.
- **File writes are limited** to `mc.env`, `/programming/minecraft/mods/` and the backup folder. Reject path traversal in any filename.
- **`mc.env` validation:** only known variable names in the form view, values checked by type and range. The advanced view must still reject lines that are not `NAME=value`.
- **RCON** stays inside `minecraft-network`. Do not publish 25575 on the host. Read the password from `/data/.rcon-cli.env` at runtime; never show it in the UI or logs.
- **Panel container** runs as a non-root user, with a read-only root filesystem where the framework allows, and `no-new-privileges`.
- **Secrets** (admin password hash, session key) live in `/opt/containers/mc-panel/`, mode 600, outside the repo.
- **Audit log** of every action (who, what, when, result) in the panel's data, shown on a page.

## Acceptance checks and points to test first

### Test before building phase 1

These are unverified. Their results decide parts of the design.

1. **Does lazymc sleep a server it did not start?** With `mc` asleep, run `docker start mc`, wait for `Done (` in `latest.log`, join nobody, watch `docker logs -f lazymc` for 3 minutes. If lazymc stops `mc` after its idle time, rely on it. If not, build the panel's own idle watcher (Phase 1).
2. **lazymc sleep-time label.** lazymc's own setting is `time.sleep_after` (default 60 s). Whether lazymc-docker-proxy exposes it as a label (likely `lazymc.time.sleep_after`) is not confirmed. Check its README. The 5-minute decision depends on it: if no label exists, mount a lazymc config file, or fall back to the panel's idle watcher for all starts.
3. **Old jars on mod removal.** Check whether itzg deletes jars no longer in `MODRINTH_PROJECTS` (an option like `REMOVE_OLD_MODS` is believed to exist). If not, the panel deletes them.
4. **`env_file` move.** After moving the environment block to `mc.env`, run `recreate-mc` and confirm `docker exec mc env | grep -E 'VERSION|ONLINE_MODE'` shows `VERSION=26.3` and `ONLINE_MODE=false`, and the world still loads.

### Acceptance

| Check | How | Expected |
| --- | --- | --- |
| LAN only | From mobile data, open `https://mcadmin.palvi.org` | Does not resolve or is refused |
| Login | Open the panel on home Wi-Fi without a session | Login page. All API routes return 401 |
| Status asleep | `mc` exited | Card shows Asleep, no RCON calls in the panel log |
| Start | Click Start | Starting, then Online within about 60 s. `journalctl -t mc-watch -n 5` shows `media-stop`. Media containers Exited |
| Idle sleep | Start, nobody joins | `mc` stops 5 minutes (plus or minus 30 s) after Online. Media containers Up again about 300 s later |
| Join wake still works | Join from a client while asleep | Kick message, rejoin about 20 s later works, as before. After the last player leaves, mc stops about 5 minutes later and media is back about 300 s after that |
| Stop with players | Click Stop while someone is online | Confirm dialog lists names. World saved (`Saved the game` in log) |
| Settings apply | Change `VIEW_DISTANCE` 16 to 12 | Diff shown, `mc.env` backup written, `recreate-mc` runs, `mc` ends Exited, lazymc healthy, next join works, `server.properties` shows `view-distance=12` |
| Mod add | Add a mod with a 26.3 Fabric build | Slug in `MODRINTH_PROJECTS`, jar in `mods/` after next start, server reaches `Done` |
| Mod blocked | Search for Noisium | Add button disabled with "no 26.3 Fabric build" |
| Mod remove | Remove the mod | Slug gone, jar gone after next start |
| Grace change | Set grace to 120 | `systemctl show mc-watch -p Environment` shows `GRACE=120`, and the state file shows 120 |
| Backup | Backup now while Online | Archive in `/mnt/media/backups/minecraft/`, `save-on` restored, players unaffected |
| Restore | Restore while stopped | Safety backup taken first, world replaced, server starts |
| Socket proxy | From inside the panel container, try an exec through the proxy | Refused (403) |
| Resources | `docker stats --no-stream mc-panel` idle | under 150 MB RAM, CPU near 0% |

### Open questions for the owner

- Idle sleep decided: every start sleeps after 5 minutes idle, through one lazymc setting. Media restarts about 10 minutes after the last player leaves.
- Backup schedule decided: once a day at 04:00 IST. How many to keep is still open (default 7).