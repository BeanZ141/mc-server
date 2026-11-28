import { ICONS, escapeHtml, formatSeconds, renderStatusBadge, setTextIfChanged, setHtmlIfChanged } from "../api.js?v=20261128-v11";

export function updateSquareMeter(trackId, percent, statusClass = "") {
  const track = document.getElementById(trackId);
  if (!track) return;
  const totalBlocks = 24;
  const p = Math.max(0, Math.min(100, Math.round(percent || 0)));
  const filledBlocks = Math.round((p / 100) * totalBlocks);
  const meterKey = `${filledBlocks}:${statusClass}`;
  let blocks = track.querySelectorAll(".meter-block");
  if (blocks.length !== totalBlocks) {
    let html = "";
    for (let i = 0; i < totalBlocks; i++) {
      html += '<div class="meter-block"></div>';
    }
    track.innerHTML = html;
    blocks = track.querySelectorAll(".meter-block");
    track.dataset.lastMeter = "";
  }
  if (track.dataset.lastMeter === meterKey) return;
  track.dataset.lastMeter = meterKey;
  blocks.forEach((el, idx) => {
    const nextCls = idx < filledBlocks ? ("meter-block filled " + (statusClass || "")).trim() : "meter-block";
    if (el.className !== nextCls) {
      el.className = nextCls;
    }
  });
}

function buildMeterBlocksHtml() {
  return '<div class="meter-block"></div>'.repeat(24);
}

export function renderServerTab() {
  return `
    <div class="card" style="margin-bottom:16px;padding:22px 28px;">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:20px;">
        <div style="display:flex;align-items:center;gap:24px;flex-wrap:wrap;">
          <div>
            <span style="font-size:11px;font-weight:600;text-transform:uppercase;color:var(--text-muted);display:block;margin-bottom:6px;">Server Address</span>
            <span class="copy-pill" id="copy-addr-btn" onclick="app.copyServerAddress()" title="Click to copy">
              ${ICONS.copy} mc.palvi.org:26656
            </span>
          </div>
          <div style="border-left:1px solid var(--border-subtle);padding-left:24px;">
            <span style="font-size:11px;font-weight:600;text-transform:uppercase;color:var(--text-muted);display:block;margin-bottom:6px;">Software & Version</span>
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:13.5px;font-weight:600;color:var(--text-primary);" id="server-software-val">-</span>
              <span class="badge" id="server-version-val">-</span>
            </div>
          </div>
          <div style="border-left:1px solid var(--border-subtle);padding-left:24px;">
            <span style="font-size:11px;font-weight:600;text-transform:uppercase;color:var(--text-muted);display:block;margin-bottom:6px;">Status</span>
            <div style="display:flex;align-items:center;gap:8px;" id="server-state-wrapper">
              <span style="font-size:13px;font-weight:700;text-transform:uppercase;" id="server-state-text">-</span>
            </div>
          </div>
        </div>

        <div class="btn-group">
          <button class="btn btn-primary btn-sm" onclick="app.startServer()">${ICONS.start} Start</button>
          <button class="btn btn-secondary btn-sm" onclick="app.restartServer()">${ICONS.restart} Restart</button>
          <button class="btn btn-danger btn-sm" onclick="app.stopServer()">${ICONS.stop} Stop</button>
        </div>
      </div>
    </div>

    <div class="metric-strip" style="margin-bottom:16px;">
      <div class="metric-strip-card">
        <span class="metric-strip-label">Server State</span>
        <span class="metric-strip-value" id="strip-status">-</span>
      </div>
      <div class="metric-strip-card">
        <span class="metric-strip-label">Online Players</span>
        <span class="metric-strip-value" id="strip-players">-</span>
      </div>
      <div class="metric-strip-card">
        <span class="metric-strip-label">Memory Allocated</span>
        <span class="metric-strip-value" id="strip-ram">-</span>
      </div>
      <div class="metric-strip-card">
        <span class="metric-strip-label">Standby Idle Timer</span>
        <span class="metric-strip-value" id="strip-idle">-</span>
      </div>
    </div>

    <div class="grid-2" style="margin-bottom:16px;">
      <div class="card" style="padding:22px 24px;">
        <div class="progress-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <span class="progress-header-title">MINECRAFT HEAP ALLOCATION</span>
          <span class="badge" id="ram-header-badge">-</span>
        </div>

        <div class="meter-track" id="ram-meter-track">
          ${buildMeterBlocksHtml()}
        </div>
        <div class="segmented-meter-ruler2"></div>

        <div class="meter-substats" style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:18px;">
          <div style="font-size:11px;color:var(--text-secondary);text-transform:uppercase;">
            USED <strong id="ram-used-strong" style="color:var(--text-primary);margin-left:4px;">-</strong>
          </div>
          <div style="font-size:11px;color:var(--text-secondary);text-transform:uppercase;">
            AVAILABLE <strong id="ram-avail-strong" style="color:var(--text-primary);margin-left:4px;">-</strong>
          </div>
        </div>

        <div class="breakdown-grid">
          <div class="breakdown-box">
            <span class="breakdown-box-label">ALLOCATED</span>
            <span class="breakdown-box-val" id="ram-box-alloc">-</span>
          </div>
          <div class="breakdown-box">
            <span class="breakdown-box-label">CONTAINER CPU</span>
            <span class="breakdown-box-val" id="cpu-stat-val">-</span>
          </div>
          <div class="breakdown-box">
            <span class="breakdown-box-label">TICK RATE</span>
            <span class="breakdown-box-val" id="tps-stat-val">-</span>
          </div>
          <div class="breakdown-box">
            <span class="breakdown-box-label">DURATION</span>
            <span class="breakdown-box-val" id="mspt-stat-val">-</span>
          </div>
        </div>
      </div>

      <div class="card" style="padding:22px 24px;">
        <div class="progress-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0px;">
          <span class="progress-header-title">HOST DISK STORAGE</span>
          <span class="badge" id="disk-header-badge">-</span>
        </div>

        <div class="meter-track" id="disk-meter-track">
          ${buildMeterBlocksHtml()}
        </div>
        <div class="segmented-meter-ruler2"></div>

        <div class="meter-substats" style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:16px;">
          <div style="font-size:11px;color:var(--text-secondary);text-transform:uppercase;">
            USED <strong id="disk-used-strong" style="color:var(--text-primary);margin-left:4px;">-</strong>
          </div>
          <div style="font-size:11px;color:var(--text-secondary);text-transform:uppercase;">
            FREE <strong id="disk-free-strong" style="color:var(--text-primary);margin-left:4px;">-</strong>
          </div>
        </div>

        <div class="progress-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0px;">
          <span class="progress-header-title">HOST SYSTEM RAM</span>
          <span class="badge" id="host-ram-header-badge">-</span>
        </div>

        <div class="meter-track" id="host-ram-meter-track">
          ${buildMeterBlocksHtml()}
        </div>
        <div class="segmented-meter-ruler2"></div>

        <div class="meter-substats" style="display:flex;justify-content:space-between;align-items:baseline;">
          <div style="font-size:11px;color:var(--text-secondary);text-transform:uppercase;">
            USED <strong id="host-ram-used-strong" style="color:var(--text-primary);margin-left:4px;">-</strong>
          </div>
          <div style="font-size:11px;color:var(--text-secondary);text-transform:uppercase;">
            FREE <strong id="host-ram-free-strong" style="color:var(--text-primary);margin-left:4px;">-</strong>
          </div>
        </div>
      </div>
    </div>

    <div class="card" style="padding:22px 24px;margin-bottom:16px;">
      <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;padding:0 0 14px 0;margin-bottom:16px;border-bottom:1px solid var(--border-subtle);flex-wrap:wrap;gap:10px;">
        <div>
          <span class="card-title" style="margin:0;">MEDIA STACK CONTROLLER (MC-WATCH)</span>
          <div style="font-size:12px;color:var(--text-secondary);margin-top:4px;">
            Stops Jellyfin &amp; media downloads while Minecraft is awake to reserve RAM, and restarts them after the grace timer once MC sleeps.
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          <span id="media-watch-state-badge">-</span>
          <button class="btn btn-primary btn-sm" id="start-media-now-btn" onclick="app.startMediaNow()">${ICONS.start} Start Media Now</button>
          <button class="btn btn-secondary btn-sm" onclick="app.loadMediaStatus(true)">${ICONS.refresh} Refresh</button>
        </div>
      </div>

      <div class="metric-strip" style="margin-bottom:16px;">
        <div class="metric-strip-card">
          <span class="metric-strip-label">Watched MC State</span>
          <span class="metric-strip-value" id="media-watch-mc" style="font-size:14px;">-</span>
        </div>
        <div class="metric-strip-card">
          <span class="metric-strip-label">Media Restart Timer</span>
          <span class="metric-strip-value" id="media-watch-countdown" style="font-size:14px;">-</span>
        </div>
        <div class="metric-strip-card">
          <span class="metric-strip-label">Grace Delay (Seconds)</span>
          <div style="display:flex;align-items:center;gap:8px;margin-top:4px;">
            <input type="number" id="media-grace-input" class="input" min="60" max="3600" value="300" style="width:92px;padding:4px 8px;font-size:12.5px;">
            <button class="btn btn-secondary btn-sm" id="media-grace-btn" onclick="app.setMediaGrace()">Set Grace</button>
          </div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:10px;" id="media-containers-grid">
        <div style="color:var(--text-muted);font-size:12px;">Click Refresh or wait for initial sync...</div>
      </div>
    </div>

    <div class="card" style="padding:22px 24px;">
      <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;padding:0 0 4px 0;">
        <span class="card-title" style="margin:0;">SYSTEM TELEMETRY & WORKLOAD MONITOR</span>
        <span class="badge-online badge-dot-only" id="telemetry-health-badge" title="Live Telemetry Indicator" aria-label="Live Telemetry"></span>
      </div>

      <div style="display:flex;flex-direction:column;gap:0px;">
        <div class="metric-row">
          <span class="metric-label">CPU Core Temperature</span>
          <div class="temp-metric-container">
            <div class="temp-heatmap-bar" id="cpu-temp-bar">
              <div class="temp-heatmap-needle" id="cpu-temp-needle" style="left:48.5%;"></div>
            </div>
            <span class="metric-value" id="server-analytics-temp">48.5 °C</span>
          </div>
        </div>
        <div class="metric-row">
          <span class="metric-label">System Load Averages (1m, 5m, 15m)</span>
          <span class="metric-value" id="server-analytics-load">-</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Media Stack Standby (mc-watch)</span>
          <span class="metric-value" id="server-media-status">-</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Auto-Sleep Proxy (lazymc)</span>
          <span class="metric-value" id="server-lazymc-status">Active (Port 26656 &bull; 300s sleep timer)</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Host Operating System & Kernel</span>
          <span class="metric-value" id="server-analytics-os">-</span>
        </div>
      </div>
    </div>
  `;
}

function formatWatchCountdown(ws) {
  if (!ws) return "-";
  if (ws.media === "running") return "Running";
  if (ws.media_start_at) {
    const targetMs = Date.parse(ws.media_start_at);
    if (!Number.isNaN(targetMs)) {
      const rem = Math.max(0, Math.ceil((targetMs - Date.now()) / 1000));
      return rem > 0 ? formatSeconds(rem) : "Starting...";
    }
  }
  return ws.mc === "running" ? "Paused (MC Active)" : "Waiting";
}

function renderWatchStateWidgets(ws, containers = null) {
  if (ws) {
    const stateBadge = document.getElementById("media-watch-state-badge");
    const mcEl = document.getElementById("media-watch-mc");
    const cdEl = document.getElementById("media-watch-countdown");
    const graceInput = document.getElementById("media-grace-input");
    const mStatus = ws.media === "running" ? renderStatusBadge("online", "Media Running") : renderStatusBadge("asleep", "Media Stopped");
    setHtmlIfChanged(stateBadge, mStatus);
    setHtmlIfChanged(mcEl, renderStatusBadge(ws.mc === "running" ? "online" : "asleep", ws.mc === "running" ? "running" : "stopped"));
    setTextIfChanged(cdEl, formatWatchCountdown(ws));
    if (graceInput && ws.grace !== undefined && (!document.activeElement || document.activeElement.id !== "media-grace-input")) {
      const graceStr = String(ws.grace);
      if (graceInput.value !== graceStr) graceInput.value = graceStr;
    }
  }
  if (Array.isArray(containers)) {
    const grid = document.getElementById("media-containers-grid");
    if (grid) {
      if (containers.length === 0) {
        setHtmlIfChanged(grid, `<div style="color:var(--text-muted);font-size:12px;">No media containers detected.</div>`);
      } else {
        const cardsHtml = containers.map(c => {
          const isUp = Boolean(c.running || (c.status && String(c.status).toLowerCase().includes("up")));
          const badge = renderStatusBadge(isUp ? "online" : "offline", isUp ? "Up" : "Exited");
          return `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:var(--bg-surface-elevated);border:1px solid var(--border-subtle);">
              <span style="font-size:12.5px;font-weight:600;color:var(--text-primary);">${escapeHtml(c.name)}</span>
              ${badge}
            </div>
          `;
        }).join("");
        setHtmlIfChanged(grid, cardsHtml);
      }
    }
  }
}

export async function loadMediaStatus(app, force = false) {
  const now = Date.now();
  if (!force && app.state.mediaContainers && app.state.mediaContainers.length > 0 && now - (app.state.lastMediaFetchAt || 0) < 15000) {
    renderWatchStateWidgets(app.state.watchState, app.state.mediaContainers);
    return;
  }
  try {
    const res = await app.api.request("/api/media/status");
    app.state.watchState = res.watch_state || app.state.watchState;
    app.state.mediaContainers = res.containers || [];
    app.state.lastMediaFetchAt = Date.now();
    renderWatchStateWidgets(app.state.watchState, app.state.mediaContainers);
  } catch (e) {
    const grid = document.getElementById("media-containers-grid");
    if (grid) setHtmlIfChanged(grid, `<span class="badge badge-error">ERROR</span> <span style="font-size:12px;color:var(--text-secondary);">${escapeHtml(e.message)}</span>`);
  }
}

export async function setMediaGrace(app) {
  const input = document.getElementById("media-grace-input");
  const btn = document.getElementById("media-grace-btn");
  const val = parseInt(input ? input.value : "300", 10);
  if (Number.isNaN(val) || val < 60 || val > 3600) {
    alert("Grace period must be between 60 and 3600 seconds.");
    return;
  }
  if (btn) btn.disabled = true;
  try {
    const res = await app.api.request("/api/media/set-grace", {
      method: "POST",
      body: { grace: val }
    });
    if (app.state.watchState) app.state.watchState.grace = res.grace;
    await loadMediaStatus(app, true);
    alert(`Grace delay updated to ${res.grace}s.`);
  } catch (e) {
    alert("Failed to update grace period: " + e.message);
  } finally {
    if (btn) btn.disabled = false;
  }
}

export function startMediaNow(app) {
  app.showConfirmModal(
    "Start Media Stack Now",
    "This will immediately start Jellyfin and the media stack containers even if grace period or Minecraft rules normally keep them stopped.",
    async () => {
      const btn = document.getElementById("start-media-now-btn");
      if (btn) btn.disabled = true;
      try {
        await app.api.request("/api/media/start-now", { method: "POST" });
        await loadMediaStatus(app, true);
        app.fetchStatus();
      } catch (e) {
        alert("Failed to start media stack: " + e.message);
      } finally {
        if (btn) btn.disabled = false;
      }
    },
    { danger: false, confirmText: "Start Media Now" }
  );
}

export function updateServerMetrics(data, app = null) {
  const swVal = document.getElementById("server-software-val");
  const verVal = document.getElementById("server-version-val");
  setTextIfChanged(swVal, data.software ? `${data.software}` : "-");
  setTextIfChanged(verVal, data.version ? `${data.version}` : "-");

  const sDot = document.getElementById("server-state-dot");
  const sText = document.getElementById("server-state-text");
  const stripStatus = document.getElementById("strip-status");
  const stripPlayers = document.getElementById("strip-players");
  const stripRam = document.getElementById("strip-ram");

  const state = data.state || "-";
  const isError = state.toLowerCase() === "error";

  if (sDot) {
    const nextDotCls = "status-indicator-dot " + (state === "Online" ? "" : (state === "Asleep" ? "asleep" : "down"));
    if (sDot.className !== nextDotCls) sDot.className = nextDotCls;
  }
  const badgeHtml = renderStatusBadge(state);
  setHtmlIfChanged(sText, badgeHtml);
  setHtmlIfChanged(stripStatus, badgeHtml);

  if (data.players && data.players.count !== undefined) {
    const pCount = `${data.players.count} / ${data.players.max !== undefined ? data.players.max : 8}`;
    setTextIfChanged(stripPlayers, pCount);
    setTextIfChanged(document.getElementById("server-card-player-count"), pCount);

    const pList = document.getElementById("server-online-players-list");
    if (pList) {
      if (!data.players.players || data.players.players.length === 0) {
        setHtmlIfChanged(pList, `<div style="color:var(--text-muted);font-size:12.5px;text-align:center;padding:30px 0;">No players currently connected.</div>`);
      } else {
        setHtmlIfChanged(pList, data.players.players.map(p => `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:var(--bg-surface-elevated);border:1px solid var(--border-subtle);margin-bottom:6px;">
            <div style="display:flex;align-items:center;gap:10px;">
              <span class="status-indicator-dot"></span>
              <span style="font-weight:600;font-size:13px;">${escapeHtml(p)}</span>
            </div>
            ${renderStatusBadge("Online")}
          </div>
        `).join(""));
      }
    }
  } else {
    setTextIfChanged(stripPlayers, "-");
  }

  const perf = data.performance || {};
  if (data.stats && data.stats.ram_used_mb !== undefined) {
    const usedMb = Math.round(data.stats.ram_used_mb || 0);
    const limitMb = Math.round(data.stats.ram_limit_mb || 0);
    const pct = limitMb > 0 ? Math.min(100, Math.round((usedMb / limitMb) * 100)) : 0;
    setTextIfChanged(stripRam, limitMb > 0 ? `${usedMb} MB` : "-");
    updateSquareMeter("ram-meter-track", pct, pct > 90 ? "crit" : (pct > 75 ? "warn" : ""));
    setTextIfChanged(document.getElementById("ram-header-badge"), limitMb > 0 ? `${limitMb} MB MAX` : "-");
    setTextIfChanged(document.getElementById("ram-used-strong"), limitMb > 0 ? `${usedMb} MB (${pct}%)` : "-");
    setTextIfChanged(document.getElementById("ram-avail-strong"), limitMb > 0 ? `${Math.max(0, limitMb - usedMb)} MB` : "-");
    setTextIfChanged(document.getElementById("ram-box-alloc"), limitMb > 0 ? `${(limitMb / 1024).toFixed(1)} GB` : "-");
    setTextIfChanged(document.getElementById("cpu-stat-val"), data.stats.cpu_percent !== undefined ? `${data.stats.cpu_percent.toFixed(1)}%` : "-");
    const tpsRaw = data.stats.tps !== undefined ? data.stats.tps : perf.tps;
    const msptRaw = data.stats.mspt !== undefined ? data.stats.mspt : perf.mspt;
    setTextIfChanged(document.getElementById("tps-stat-val"), tpsRaw !== undefined ? `${Number(tpsRaw).toFixed(1)}` : "-");
    setTextIfChanged(document.getElementById("mspt-stat-val"), msptRaw !== undefined ? `${Number(msptRaw).toFixed(1)} ms` : "-");
  } else {
    updateSquareMeter("ram-meter-track", 0);
    setTextIfChanged(document.getElementById("ram-header-badge"), data.env && data.env.MEMORY ? `${data.env.MEMORY} MAX` : "-");
    setTextIfChanged(document.getElementById("ram-box-alloc"), data.env && data.env.MEMORY ? `${data.env.MEMORY}` : "-");
    setTextIfChanged(document.getElementById("ram-used-strong"), "-");
    setTextIfChanged(document.getElementById("ram-avail-strong"), "-");
    setTextIfChanged(document.getElementById("cpu-stat-val"), "-");
    setTextIfChanged(document.getElementById("tps-stat-val"), "-");
    setTextIfChanged(document.getElementById("mspt-stat-val"), "-");
  }

  const host = data.host_analytics;
  const tempEl = document.getElementById("server-analytics-temp");
  const loadEl = document.getElementById("server-analytics-load");
  const osEl = document.getElementById("server-analytics-os");
  const mediaEl = document.getElementById("server-media-status");
  const lazymcEl = document.getElementById("server-lazymc-status");

  const tempNeedle = document.getElementById("cpu-temp-needle");
  const tempBar = document.getElementById("cpu-temp-bar");
  const rawTemp = (host && host.cpu_temp !== null && host.cpu_temp !== undefined && !isNaN(Number(host.cpu_temp)))
    ? Number(host.cpu_temp)
    : 48.5;
  setTextIfChanged(tempEl, `${rawTemp} °C`);
  if (tempNeedle) {
    const pct = Math.max(0, Math.min(100, rawTemp));
    const nextLeft = `${pct}%`;
    if (tempNeedle.style.left !== nextLeft) tempNeedle.style.left = nextLeft;
    if (tempNeedle.style.display !== "block") tempNeedle.style.display = "block";
  }
  if (tempBar && tempBar.style.opacity !== "1") tempBar.style.opacity = "1";
  setTextIfChanged(loadEl, (host && host.load_average) ? host.load_average.join(", ") : "-");
  setTextIfChanged(osEl, (host && host.os_info) ? host.os_info : "-");

  const watchState = data.watch_state || (app && app.state.watchState);
  if (mediaEl) {
    const isMediaRunning = watchState ? watchState.media === "running" : state.toLowerCase() !== "online";
    const mediaHtml = isMediaRunning
      ? renderStatusBadge("online", "Running (Active)")
      : renderStatusBadge("asleep", "Paused (mc-watch standby)");
    setHtmlIfChanged(mediaEl, mediaHtml);
  }
  renderWatchStateWidgets(watchState, app ? app.state.mediaContainers : null);

  if (lazymcEl) {
    const isRunning = data.lazymc_running !== false;
    const lazyHtml = isRunning
      ? `${renderStatusBadge("online", "Online")} <span style="margin-left:6px;color:var(--text-secondary);font-size:12px;">(Port 26656 • 300s sleep timer)</span>`
      : renderStatusBadge("offline", "Offline");
    setHtmlIfChanged(lazymcEl, lazyHtml);
  }

  const hBadge = document.getElementById("telemetry-health-badge");
  if (hBadge) {
    const targetCls = isError ? "badge-error badge-dot-only" : "badge-asleep badge-dot-only";
    if (hBadge.className !== targetCls) hBadge.className = targetCls;
  }

  const stripIdle = document.getElementById("strip-idle");
  if (stripIdle && data.uptime_seconds !== undefined && (!data.idle || !data.idle.is_idle)) {
    setTextIfChanged(stripIdle, formatSeconds(data.uptime_seconds));
  }

  if (host && host.disk) {
    setTextIfChanged(document.getElementById("disk-header-badge"), `${host.disk.total_gb} GB TOTAL`);
    setTextIfChanged(document.getElementById("disk-used-strong"), `${host.disk.used_gb} GB (${host.disk.percent}%)`);
    setTextIfChanged(document.getElementById("disk-free-strong"), `${host.disk.free_gb} GB`);
    updateSquareMeter("disk-meter-track", host.disk.percent, host.disk.percent > 90 ? "crit" : (host.disk.percent > 75 ? "warn" : ""));
  } else {
    setTextIfChanged(document.getElementById("disk-header-badge"), "-");
    setTextIfChanged(document.getElementById("disk-used-strong"), "-");
    setTextIfChanged(document.getElementById("disk-free-strong"), "-");
    updateSquareMeter("disk-meter-track", 0);
  }

  if (host && host.memory) {
    setTextIfChanged(document.getElementById("host-ram-header-badge"), `${(host.memory.total_mb / 1024).toFixed(1)} GB TOTAL`);
    setTextIfChanged(document.getElementById("host-ram-used-strong"), `${(host.memory.used_mb / 1024).toFixed(1)} GB (${host.memory.percent}%)`);
    setTextIfChanged(document.getElementById("host-ram-free-strong"), `${(host.memory.free_mb / 1024).toFixed(1)} GB`);
    updateSquareMeter("host-ram-meter-track", host.memory.percent, host.memory.percent > 90 ? "crit" : (host.memory.percent > 75 ? "warn" : ""));
  } else {
    setTextIfChanged(document.getElementById("host-ram-header-badge"), "-");
    setTextIfChanged(document.getElementById("host-ram-used-strong"), "-");
    setTextIfChanged(document.getElementById("host-ram-free-strong"), "-");
    updateSquareMeter("host-ram-meter-track", 0);
  }
}
