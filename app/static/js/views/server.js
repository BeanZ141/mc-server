import { ICONS, escapeHtml, formatSeconds } from "../api.js";

export function updateSquareMeter(trackId, percent, statusClass = "") {
  const track = document.getElementById(trackId);
  if (!track) return;
  const totalBlocks = 24;
  const p = Math.max(0, Math.min(100, Math.round(percent || 0)));
  const filledBlocks = Math.round((p / 100) * totalBlocks);
  let blocks = track.querySelectorAll(".meter-block");
  if (blocks.length !== totalBlocks) {
    let html = "";
    for (let i = 0; i < totalBlocks; i++) {
      html += '<div class="meter-block"></div>';
    }
    track.innerHTML = html;
    blocks = track.querySelectorAll(".meter-block");
  }
  blocks.forEach((el, idx) => {
    if (idx < filledBlocks) {
      el.className = ("meter-block filled " + (statusClass || "")).trim();
    } else {
      el.className = "meter-block";
    }
  });
}

function buildMeterBlocksHtml() {
  return '<div class="meter-block"></div>'.repeat(24);
}

export function renderServerTab() {
  return `
    <div class="card" style="margin-bottom:20px;padding:22px 28px;">
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

    <div class="metric-strip" style="margin-bottom:20px;">
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

    <div class="grid-2" style="margin-bottom:20px;">
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
        <div class="progress-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
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

        <div class="progress-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
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

    <div class="card" style="padding:22px 24px;">
      <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;padding:0 0 14px 0;margin-bottom:18px;border-bottom:1px solid var(--border-subtle);">
        <span class="card-title" style="margin:0;">SYSTEM TELEMETRY & WORKLOAD MONITOR</span>
        <span class="badge" id="telemetry-health-badge">LIVE METRICS</span>
      </div>

      <div style="display:flex;flex-direction:column;gap:12px;">
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

export function updateServerMetrics(data) {
  const swVal = document.getElementById("server-software-val");
  const verVal = document.getElementById("server-version-val");
  if (swVal) swVal.innerText = data.software ? `${data.software}` : "-";
  if (verVal) verVal.innerText = data.version ? `${data.version}` : "-";

  const sDot = document.getElementById("server-state-dot");
  const sText = document.getElementById("server-state-text");
  const stripStatus = document.getElementById("strip-status");
  const stripPlayers = document.getElementById("strip-players");
  const stripRam = document.getElementById("strip-ram");

  const state = data.state || "-";
  const isError = state.toLowerCase() === "error";

  if (sDot) sDot.className = "status-indicator-dot " + (state === "Online" ? "" : (state === "Asleep" ? "asleep" : "down"));
  if (sText) {
    if (isError) {
      sText.innerHTML = `<span class="badge badge-error">ERROR</span>`;
    } else {
      sText.innerText = state;
    }
  }
  if (stripStatus) {
    if (isError) {
      stripStatus.innerHTML = `<span class="badge badge-error">ERROR</span>`;
    } else {
      stripStatus.innerText = state;
    }
  }

  if (data.players && data.players.count !== undefined) {
    const pCount = `${data.players.count} / ${data.players.max !== undefined ? data.players.max : 8}`;
    if (stripPlayers) stripPlayers.innerText = pCount;
    const cardCount = document.getElementById("server-card-player-count");
    if (cardCount) cardCount.innerText = pCount;

    const pList = document.getElementById("server-online-players-list");
    if (pList) {
      if (!data.players.players || data.players.players.length === 0) {
        pList.innerHTML = `<div style="color:var(--text-muted);font-size:12.5px;text-align:center;padding:30px 0;">No players currently connected.</div>`;
      } else {
        pList.innerHTML = data.players.players.map(p => `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:var(--bg-surface-elevated);border:1px solid var(--border-subtle);margin-bottom:6px;">
            <div style="display:flex;align-items:center;gap:10px;">
              <span class="status-indicator-dot"></span>
              <span style="font-weight:600;font-size:13px;">${escapeHtml(p)}</span>
            </div>
            <span style="font-size:13px;color:var(--text-secondary);">Online</span>
          </div>
        `).join("");
      }
    }
  } else {
    if (stripPlayers) stripPlayers.innerText = "-";
  }

  const perf = data.performance || {};
  if (data.stats && data.stats.ram_used_mb !== undefined) {
    const usedMb = Math.round(data.stats.ram_used_mb || 0);
    const limitMb = Math.round(data.stats.ram_limit_mb || 0);
    const pct = limitMb > 0 ? Math.min(100, Math.round((usedMb / limitMb) * 100)) : 0;
    if (stripRam) stripRam.innerText = limitMb > 0 ? `${usedMb} MB` : "-";
    updateSquareMeter("ram-meter-track", pct, pct > 90 ? "crit" : (pct > 75 ? "warn" : ""));
    const ramBadge = document.getElementById("ram-header-badge");
    if (ramBadge) ramBadge.innerText = limitMb > 0 ? `${limitMb} MB MAX` : "-";
    const usedStrong = document.getElementById("ram-used-strong");
    if (usedStrong) usedStrong.innerText = limitMb > 0 ? `${usedMb} MB (${pct}%)` : "-";
    const availStrong = document.getElementById("ram-avail-strong");
    if (availStrong) availStrong.innerText = limitMb > 0 ? `${Math.max(0, limitMb - usedMb)} MB` : "-";
    const boxAlloc = document.getElementById("ram-box-alloc");
    if (boxAlloc) boxAlloc.innerText = limitMb > 0 ? `${(limitMb / 1024).toFixed(1)} GB` : "-";
    const cpuVal = document.getElementById("cpu-stat-val");
    if (cpuVal) cpuVal.innerText = data.stats.cpu_percent !== undefined ? `${data.stats.cpu_percent.toFixed(1)}%` : "-";
    const tpsRaw = data.stats.tps !== undefined ? data.stats.tps : perf.tps;
    const msptRaw = data.stats.mspt !== undefined ? data.stats.mspt : perf.mspt;
    const tpsVal = document.getElementById("tps-stat-val");
    if (tpsVal) tpsVal.innerText = tpsRaw !== undefined ? `${Number(tpsRaw).toFixed(1)}` : "-";
    const msptVal = document.getElementById("mspt-stat-val");
    if (msptVal) msptVal.innerText = msptRaw !== undefined ? `${Number(msptRaw).toFixed(1)} ms` : "-";
  } else {
    updateSquareMeter("ram-meter-track", 0);
    const ramBadge = document.getElementById("ram-header-badge");
    if (ramBadge) ramBadge.innerText = data.env && data.env.MEMORY ? `${data.env.MEMORY} MAX` : "-";
    const boxAlloc = document.getElementById("ram-box-alloc");
    if (boxAlloc) boxAlloc.innerText = data.env && data.env.MEMORY ? `${data.env.MEMORY}` : "-";
    const usedStrong = document.getElementById("ram-used-strong");
    if (usedStrong) usedStrong.innerText = "-";
    const availStrong = document.getElementById("ram-avail-strong");
    if (availStrong) availStrong.innerText = "-";
    const cpuVal = document.getElementById("cpu-stat-val");
    if (cpuVal) cpuVal.innerText = "-";
    const tpsVal = document.getElementById("tps-stat-val");
    if (tpsVal) tpsVal.innerText = "-";
    const msptVal = document.getElementById("mspt-stat-val");
    if (msptVal) msptVal.innerText = "-";
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
  if (tempEl) tempEl.innerText = `${rawTemp} °C`;
  if (tempNeedle) {
    const pct = Math.max(0, Math.min(100, rawTemp));
    tempNeedle.style.left = `${pct}%`;
    tempNeedle.style.display = "block";
  }
  if (tempBar) tempBar.style.opacity = "1";
  if (loadEl) loadEl.innerText = (host && host.load_average) ? host.load_average.join(", ") : "-";
  if (osEl) osEl.innerText = (host && host.os_info) ? host.os_info : "-";

  if (mediaEl) {
    const isOnline = state.toLowerCase() === "online";
    if (isOnline) {
      mediaEl.innerHTML = `<span class="badge" style="color:var(--color-warning);">Paused (mc-watch standby)</span>`;
    } else {
      mediaEl.innerHTML = `<span class="badge" style="color:var(--color-success);">Running (Active)</span>`;
    }
  }

  if (lazymcEl) {
    const isRunning = data.lazymc_running !== false;
    lazymcEl.innerText = isRunning ? "Active (Port 26656 • 300s sleep timer)" : "Offline";
  }

  const hBadge = document.getElementById("telemetry-health-badge");
  if (hBadge) {
    hBadge.style.opacity = "0.6";
    setTimeout(() => { if (hBadge) hBadge.style.opacity = "1"; }, 300);
  }

  const stripIdle = document.getElementById("strip-idle");
  if (stripIdle && data.uptime_seconds !== undefined && (!data.idle || !data.idle.is_idle)) {
    stripIdle.innerText = formatSeconds(data.uptime_seconds);
  }

  if (host && host.disk) {
    const diskBadge = document.getElementById("disk-header-badge");
    if (diskBadge) diskBadge.innerText = `${host.disk.total_gb} GB TOTAL`;
    const diskUsed = document.getElementById("disk-used-strong");
    if (diskUsed) diskUsed.innerText = `${host.disk.used_gb} GB (${host.disk.percent}%)`;
    const diskFree = document.getElementById("disk-free-strong");
    if (diskFree) diskFree.innerText = `${host.disk.free_gb} GB`;
    updateSquareMeter("disk-meter-track", host.disk.percent, host.disk.percent > 90 ? "crit" : (host.disk.percent > 75 ? "warn" : ""));
  } else {
    const diskBadge = document.getElementById("disk-header-badge");
    if (diskBadge) diskBadge.innerText = "-";
    const diskUsed = document.getElementById("disk-used-strong");
    if (diskUsed) diskUsed.innerText = "-";
    const diskFree = document.getElementById("disk-free-strong");
    if (diskFree) diskFree.innerText = "-";
    updateSquareMeter("disk-meter-track", 0);
  }

  if (host && host.memory) {
    const hostRamBadge = document.getElementById("host-ram-header-badge");
    if (hostRamBadge) hostRamBadge.innerText = `${(host.memory.total_mb / 1024).toFixed(1)} GB TOTAL`;
    const hostRamUsed = document.getElementById("host-ram-used-strong");
    if (hostRamUsed) hostRamUsed.innerText = `${(host.memory.used_mb / 1024).toFixed(1)} GB (${host.memory.percent}%)`;
    const hostRamFree = document.getElementById("host-ram-free-strong");
    if (hostRamFree) hostRamFree.innerText = `${(host.memory.free_mb / 1024).toFixed(1)} GB`;
    updateSquareMeter("host-ram-meter-track", host.memory.percent, host.memory.percent > 90 ? "crit" : (host.memory.percent > 75 ? "warn" : ""));
  } else {
    const hostRamBadge = document.getElementById("host-ram-header-badge");
    if (hostRamBadge) hostRamBadge.innerText = "-";
    const hostRamUsed = document.getElementById("host-ram-used-strong");
    if (hostRamUsed) hostRamUsed.innerText = "-";
    const hostRamFree = document.getElementById("host-ram-free-strong");
    if (hostRamFree) hostRamFree.innerText = "-";
    updateSquareMeter("host-ram-meter-track", 0);
  }
}
