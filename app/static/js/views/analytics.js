import { escapeHtml } from "../api.js?v=20261128-v11";

export function renderAnalyticsPage(app) {
  const main = document.getElementById("main-content");
  if (!main) return;

  const st = app.state.status || {};
  const osBadge = (st.host_analytics && st.host_analytics.os_info) || "Host OS";
  const swBadge = (st.software && st.version) ? `${st.software} ${st.version}` : "Minecraft";

  main.innerHTML = `
    <div class="analytics-section-title-bar">
      <span class="analytics-section-heading">01. Host Hardware & Environment Diagnostics</span>
      <span class="badge" id="analytics-os-badge">${escapeHtml(osBadge)}</span>
    </div>

    <div class="grid-3" style="margin-bottom:16px;">
      <div class="card" style="padding:18px 20px;">
        <div style="margin-bottom:14px;">
          <div style="font-size:13px;font-weight:700;text-transform:uppercase;color:var(--text-primary);">Host CPU & Load Average</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">Processor thermals & workload diagnostics</div>
        </div>
        <div style="margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-muted);margin-bottom:4px;">
            <span>CORE PACKAGE TEMP</span>
            <span id="host-analytics-temp" style="font-weight:600;color:var(--text-primary);">-</span>
          </div>
          <div style="position:relative;width:100%;height:10px;background:var(--heatmap-gradient);">
            <div id="host-analytics-temp-needle" style="position:absolute;top:0;bottom:0;width:2px;background:var(--heatmap-indicator);left:0%;"></div>
          </div>
        </div>
        <div style="display:flex;justify-content:space-between;font-family:monospace;font-size:11px;padding:8px 0;border-top:1px solid var(--border-subtle);">
          <span style="color:var(--text-muted);">LOAD (1m, 5m, 15m)</span>
          <span id="host-analytics-load" style="color:var(--text-primary);font-weight:600;">-</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-family:monospace;font-size:11px;padding-top:6px;">
          <span style="color:var(--text-muted);">ACTIVE TASKS</span>
          <span id="host-analytics-tasks" style="color:var(--text-secondary);">-</span>
        </div>
      </div>

      <div class="card" style="padding:18px 20px;">
        <div style="margin-bottom:14px;">
          <div style="font-size:13px;font-weight:700;text-transform:uppercase;color:var(--text-primary);">System Memory & Swap</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">Physical RAM allocation & memory pressure</div>
        </div>
        <div class="segmented-meter-row" style="margin-bottom:10px;">
          <div class="segmented-meter-header">
            <span class="segmented-meter-label">Physical Host RAM</span>
            <div class="segmented-meter-stats" id="host-ram-stats">-</div>
          </div>
          <div class="segmented-meter-track">
            <div class="segmented-meter-fill fill-white" id="host-ram-fill" style="width: 0%;"></div>
          </div>
          <div class="segmented-meter-ruler"></div>
        </div>
        <div style="display:flex;justify-content:space-between;font-family:monospace;font-size:11px;padding:8px 0;border-top:1px solid var(--border-subtle);">
          <span style="color:var(--text-muted);">SWAP ALLOCATION</span>
          <span id="host-swap-stats" style="color:var(--text-primary);font-weight:600;">-</span>
        </div>
      </div>

      <div class="card" style="padding:18px 20px;">
        <div style="margin-bottom:14px;">
          <div style="font-size:13px;font-weight:700;text-transform:uppercase;color:var(--text-primary);">Storage I/O & Network</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">Disk wear & interface bandwidth throughput</div>
        </div>
        <div class="segmented-meter-row" style="margin-bottom:10px;">
          <div class="segmented-meter-header">
            <span class="segmented-meter-label">Primary Storage</span>
            <div class="segmented-meter-stats" id="host-disk-stats">-</div>
          </div>
          <div class="segmented-meter-track">
            <div class="segmented-meter-fill fill-green" id="host-disk-fill" style="width: 0%;"></div>
          </div>
          <div class="segmented-meter-ruler"></div>
        </div>
        <div style="display:flex;justify-content:space-between;font-family:monospace;font-size:11px;padding:6px 0;border-top:1px solid var(--border-subtle);">
          <span style="color:var(--text-muted);">DISK I/O RATE</span>
          <span id="host-disk-io" style="color:var(--text-secondary);">-</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-family:monospace;font-size:11px;padding-top:4px;">
          <span style="color:var(--text-muted);">NETWORK BANDWIDTH</span>
          <span id="host-net-io" style="color:var(--color-success);">-</span>
        </div>
      </div>
    </div>

    <div class="analytics-section-title-bar">
      <span class="analytics-section-heading">02. Minecraft Server</span>
      <span class="badge" id="analytics-server-badge">${escapeHtml(swBadge)}</span>
    </div>

    <div class="analytics-grid-2x2">
      <div class="card" style="padding:16px 18px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;margin-bottom:10px;">
          <div>
            <div style="font-size:12px;font-weight:700;text-transform:uppercase;color:var(--text-primary);">Availability Matrix (Heatmap)</div>
            <div style="font-size:10.5px;color:var(--text-muted);margin-top:2px;">Runtime state (Online, sleep, downtime)</div>
          </div>
          <div class="heatmap-legend">
            <div class="heatmap-legend-item">
              <span class="heatmap-legend-box online"></span>
              <span>Online</span>
            </div>
            <div class="heatmap-legend-item">
              <span class="heatmap-legend-box asleep"></span>
              <span>Sleep</span>
            </div>
            <div class="heatmap-legend-item">
              <span class="heatmap-legend-box down"></span>
              <span>Down</span>
            </div>
          </div>
        </div>

        <div class="heatmap-header-controls">
          <div class="heatmap-nav-cluster">
            <button class="btn btn-secondary btn-sm" id="heatmap-prev-btn" onclick="app.prevHeatmapPeriod()">&lt; Prev</button>
            <span class="heatmap-period-label" id="heatmap-period-label">Loading...</span>
            <button class="btn btn-secondary btn-sm" id="heatmap-next-btn" onclick="app.nextHeatmapPeriod()">Next &gt;</button>
          </div>
          <div class="heatmap-view-toggle">
            <button class="heatmap-view-btn ${app.state.heatmapView === 'week' ? 'active' : ''}" id="heatmap-view-week-btn" onclick="app.setHeatmapView('week')">Week</button>
            <button class="heatmap-view-btn ${app.state.heatmapView === 'month' ? 'active' : ''}" id="heatmap-view-month-btn" onclick="app.setHeatmapView('month')">Month</button>
          </div>
        </div>

        <div class="heatmap-container">
          <div class="heatmap-matrix-wrapper">
            <div class="heatmap-matrix">
              <div class="heatmap-hours-header">
                <span class="heatmap-hour-col">00</span>
                <span class="heatmap-hour-col"></span>
                <span class="heatmap-hour-col">02</span>
                <span class="heatmap-hour-col"></span>
                <span class="heatmap-hour-col">04</span>
                <span class="heatmap-hour-col"></span>
                <span class="heatmap-hour-col">06</span>
                <span class="heatmap-hour-col"></span>
                <span class="heatmap-hour-col">08</span>
                <span class="heatmap-hour-col"></span>
                <span class="heatmap-hour-col">10</span>
                <span class="heatmap-hour-col"></span>
                <span class="heatmap-hour-col">12</span>
                <span class="heatmap-hour-col"></span>
                <span class="heatmap-hour-col">14</span>
                <span class="heatmap-hour-col"></span>
                <span class="heatmap-hour-col">16</span>
                <span class="heatmap-hour-col"></span>
                <span class="heatmap-hour-col">18</span>
                <span class="heatmap-hour-col"></span>
                <span class="heatmap-hour-col">20</span>
                <span class="heatmap-hour-col"></span>
                <span class="heatmap-hour-col">22</span>
                <span class="heatmap-hour-col"></span>
              </div>
              <div id="analytics-heatmap-rows"></div>
            </div>
          </div>
          <div class="heatmap-summary-strip">
            <span id="heatmap-total-monitored">0h TOTAL</span>
            <span style="color:var(--border-high);">SLEEP: <strong style="color:var(--text-primary);" id="heatmap-sleep-summary">0h [0%]</strong></span>
            <span style="color:var(--color-success);">ONLINE: <strong style="color:var(--text-primary);" id="heatmap-active-summary">0h [0%]</strong></span>
            <span style="color:var(--color-error);">DOWN: <strong style="color:var(--text-primary);" id="heatmap-down-summary">0h [0%]</strong></span>
          </div>
        </div>
      </div>

      <div class="card" style="padding:16px 18px;">
        <div style="margin-bottom:14px;">
          <div style="font-size:12px;font-weight:700;text-transform:uppercase;color:var(--text-primary);">Idle & Efficiency (lazymc)</div>
          <div style="font-size:10.5px;color:var(--text-muted);margin-top:2px;">Standby power savings & sleep metrics</div>
        </div>
        <div class="segmented-meter-group">
          <div class="segmented-meter-row">
            <div class="segmented-meter-header">
              <span class="segmented-meter-label">Standby Sleep</span>
              <div class="segmented-meter-stats">
                <span id="meter-sleep-pct">0%</span>
                <span id="meter-sleep-time">0m</span>
              </div>
            </div>
            <div class="segmented-meter-track">
              <div class="segmented-meter-fill fill-white" id="meter-sleep-fill" style="width: 0%;"></div>
            </div>
            <div class="segmented-meter-ruler"></div>
          </div>

          <div class="segmented-meter-row">
            <div class="segmented-meter-header">
              <span class="segmented-meter-label">Active Sessions</span>
              <div class="segmented-meter-stats">
                <span id="meter-active-pct" style="color:var(--color-success);">0%</span>
                <span id="meter-active-time">0m</span>
              </div>
            </div>
            <div class="segmented-meter-track">
              <div class="segmented-meter-fill fill-green" id="meter-active-fill" style="width: 0%;"></div>
            </div>
            <div class="segmented-meter-ruler"></div>
          </div>

          <div class="segmented-meter-row">
            <div class="segmented-meter-header">
              <span class="segmented-meter-label">Server Bootstrap</span>
              <div class="segmented-meter-stats">
                <span id="meter-boot-pct" style="color:var(--color-warning);">0%</span>
                <span id="meter-boot-time">0m</span>
              </div>
            </div>
            <div class="segmented-meter-track">
              <div class="segmented-meter-fill fill-warn" id="meter-boot-fill" style="width: 0%;"></div>
            </div>
            <div class="segmented-meter-ruler"></div>
          </div>

          <div class="segmented-meter-row">
            <div class="segmented-meter-header">
              <span class="segmented-meter-label">Offline Downtime</span>
              <div class="segmented-meter-stats">
                <span id="meter-down-pct">0%</span>
                <span id="meter-down-time">0m</span>
              </div>
            </div>
            <div class="segmented-meter-track">
              <div class="segmented-meter-fill fill-crit" id="meter-down-fill" style="width: 0%;"></div>
            </div>
            <div class="segmented-meter-ruler"></div>
          </div>
        </div>
      </div>

      <div class="card" style="padding:16px 18px;">
        <div style="margin-bottom:14px;">
          <div style="font-size:12px;font-weight:700;text-transform:uppercase;color:var(--text-primary);">14-Day Incident Log</div>
          <div style="font-size:10.5px;color:var(--text-muted);margin-top:2px;">Recent availability slices & system journal</div>
        </div>
        <div class="availability-barcode-container" id="analytics-barcode-container"></div>
        <div class="barcode-axis-row">
          <span>01d</span>
          <span>03d</span>
          <span>05d</span>
          <span>07d</span>
          <span>09d</span>
          <span>11d</span>
          <span>14d</span>
        </div>
        <div class="incident-terminal" id="analytics-incident-terminal">
          <div style="color:var(--text-muted);font-size:11px;padding:8px 0;">No incidents recorded yet.</div>
        </div>
      </div>

      <div class="card" style="padding:16px 18px;">
        <div style="margin-bottom:14px;">
          <div style="font-size:12px;font-weight:700;text-transform:uppercase;color:var(--text-primary);">Engine & World Workload</div>
          <div style="font-size:10.5px;color:var(--text-muted);margin-top:2px;">Memory allocation, chunk loading & entities</div>
        </div>
        <div class="inner-bracket-box">
          <div class="segmented-meter-row">
            <div class="segmented-meter-header">
              <span class="segmented-meter-label">Heap GC Allocation</span>
              <div class="segmented-meter-stats" id="engine-heap-stats">-</div>
            </div>
            <div class="segmented-meter-track">
              <div class="segmented-meter-fill fill-white" id="engine-heap-fill" style="width: 0%;"></div>
            </div>
            <div class="segmented-meter-ruler"></div>
          </div>

          <div class="segmented-meter-row">
            <div class="segmented-meter-header">
              <span class="segmented-meter-label">Loaded Chunks</span>
              <div class="segmented-meter-stats" id="engine-chunks-stats" style="color:var(--color-success);">-</div>
            </div>
            <div class="segmented-meter-track">
              <div class="segmented-meter-fill fill-green" id="engine-chunks-fill" style="width: 0%;"></div>
            </div>
            <div class="segmented-meter-ruler"></div>
          </div>

          <div class="segmented-meter-row">
            <div class="segmented-meter-header">
              <span class="segmented-meter-label">Active Entities</span>
              <div class="segmented-meter-stats" id="engine-entities-stats" style="color:var(--color-warning);">-</div>
            </div>
            <div class="segmented-meter-track">
              <div class="segmented-meter-fill fill-warn" id="engine-entities-fill" style="width: 0%;"></div>
            </div>
            <div class="segmented-meter-ruler"></div>
          </div>
        </div>
      </div>
    </div>
  `;
  setTimeout(() => loadAnalytics(app), 0);
}

export async function loadAnalytics(app) {
  let data;
  try {
    data = await app.api.request("/api/server/analytics");
  } catch (e) {
    try {
      data = await app.api.request("/api/analytics");
    } catch (e2) {
      data = null;
    }
  }

  if (!data) return;
  app.state.analyticsData = data;

  const osBadge = document.getElementById("analytics-os-badge");
  const swBadge = document.getElementById("analytics-server-badge");
  if (osBadge && data.os_info) osBadge.innerText = data.os_info;
  if (swBadge && data.server_label) swBadge.innerText = data.server_label;

  const host = data.host_telemetry || (app.state.status && app.state.status.host_analytics) || {};
  const tempEl = document.getElementById("host-analytics-temp");
  const tempNeedle = document.getElementById("host-analytics-temp-needle");
  if (tempEl && host.cpu_temp !== undefined) {
    tempEl.innerText = `${host.cpu_temp} °C`;
    if (tempNeedle) tempNeedle.style.left = `${Math.max(0, Math.min(100, host.cpu_temp))}%`;
  }

  const loadEl = document.getElementById("host-analytics-load");
  if (loadEl) {
    if (host.load_1m !== undefined) {
      loadEl.innerText = `${host.load_1m}, ${host.load_5m}, ${host.load_15m}`;
    } else if (host.load_average) {
      loadEl.innerText = host.load_average.join(", ");
    }
  }

  const tasksEl = document.getElementById("host-analytics-tasks");
  if (tasksEl) {
    const procs = host.active_processes || 0;
    const freq = host.cpu_frequency_ghz || 0;
    tasksEl.innerText = procs > 0 ? `${procs} procs (${freq} GHz)` : (freq > 0 ? `${freq} GHz` : "-");
  }

  const ramStats = document.getElementById("host-ram-stats");
  const ramFill = document.getElementById("host-ram-fill");
  if (ramStats && host.ram_used_gb !== undefined) {
    ramStats.innerText = `${host.ram_used_gb} GB / ${host.ram_total_gb} GB [${host.ram_percent}%]`;
    if (ramFill) ramFill.style.width = `${Math.min(100, Math.max(0, host.ram_percent || 0))}%`;
  }

  const swapStats = document.getElementById("host-swap-stats");
  if (swapStats && host.swap_total_mb !== undefined) {
    const swapPct = host.swap_total_mb > 0 ? Math.round((host.swap_used_mb / host.swap_total_mb) * 100) : 0;
    swapStats.innerText = `${host.swap_used_mb} MB / ${host.swap_total_mb} MB [${swapPct}%]`;
  }

  const diskStats = document.getElementById("host-disk-stats");
  const diskFill = document.getElementById("host-disk-fill");
  if (diskStats && host.disk_used_gb !== undefined) {
    diskStats.innerText = `${host.disk_used_gb} GB / ${host.disk_total_gb} GB [${host.disk_percent}%]`;
    if (diskFill) diskFill.style.width = `${Math.min(100, Math.max(0, host.disk_percent || 0))}%`;
  }

  const diskIoEl = document.getElementById("host-disk-io");
  const netIoEl = document.getElementById("host-net-io");
  if (diskIoEl && host.disk_read_mbps !== undefined) {
    diskIoEl.innerText = `${host.disk_read_mbps} MB/s R • ${host.disk_write_mbps} MB/s W`;
  }
  if (netIoEl && host.net_in_kbps !== undefined) {
    netIoEl.innerText = `↓ ${host.net_in_kbps} KB/s • ↑ ${host.net_out_kbps} KB/s`;
  }

  renderHeatmap(app);

  const stages = data.funnel_stages || [];
  const updateStage = (idx, prefix, fallbackPct, fallbackTime) => {
    const stage = stages[idx];
    const pct = stage ? stage.pct : (fallbackPct !== undefined ? fallbackPct : 0);
    const cnt = stage ? stage.count : (fallbackTime !== undefined ? fallbackTime : "0m");
    const pEl = document.getElementById(`${prefix}-pct`);
    const tEl = document.getElementById(`${prefix}-time`);
    const fEl = document.getElementById(`${prefix}-fill`);
    if (pEl) pEl.innerText = `${pct}%`;
    if (tEl) tEl.innerText = cnt;
    if (fEl) fEl.style.width = `${Math.min(100, Math.max(0, pct))}%`;
  };

  updateStage(0, "meter-sleep", data.sleep_pct_today, data.sleep_formatted_today);
  updateStage(1, "meter-active", data.active_pct_today, data.active_formatted_today);
  updateStage(2, "meter-boot", 0, "0m");
  updateStage(3, "meter-down", 0, "0m");

  const barcodeContainer = document.getElementById("analytics-barcode-container");
  if (barcodeContainer) {
    const history = data.uptime_history_14d || [];
    if (history.length === 0) {
      barcodeContainer.innerHTML = `<div style="color:var(--text-muted);font-size:11px;padding:6px 0;">Awaiting initial metrics samples...</div>`;
    } else {
      let slicesHtml = "";
      const totalSlices = 70;
      for (let s = 0; s < totalSlices; s++) {
        const dayIdx = Math.floor((s / totalSlices) * history.length);
        const dayItem = history[dayIdx] || { status: "down", uptime_pct: 0, label: `Day ${dayIdx + 1}` };
        let sliceCls = "";
        if (dayItem.status === "down") {
          sliceCls = "down";
        } else if (dayItem.status === "asleep") {
          sliceCls = "asleep";
        }
        slicesHtml += `<div class="barcode-slice ${sliceCls}" title="${escapeHtml(dayItem.label || dayItem.day)}: ${dayItem.uptime_pct}% uptime"></div>`;
      }
      barcodeContainer.innerHTML = slicesHtml;
    }
  }

  const term = document.getElementById("analytics-incident-terminal");
  if (term) {
    if (data.incidents_log && data.incidents_log.length) {
      term.innerHTML = data.incidents_log.map(item => `
        <div class="incident-row">
          <span class="incident-time">${escapeHtml(item.time)}</span>
          <span class="incident-tag">${escapeHtml(item.tag)}</span>
          <span class="incident-msg">${escapeHtml(item.msg)}</span>
        </div>
      `).join("");
    } else {
      term.innerHTML = `<div style="color:var(--text-muted);font-size:11px;padding:8px 0;">No state transitions or incidents logged yet.</div>`;
    }
  }

  const st = app.state.status || {};
  const stats = st.stats || {};
  const ramUsed = stats.ram_used_mb || 0;
  const ramLimit = stats.ram_limit_mb || 0;
  const ramPct = ramLimit > 0 ? Math.min(100, Math.round((ramUsed / ramLimit) * 1000) / 10) : 0;
  const heapStatsEl = document.getElementById("engine-heap-stats");
  const heapFillEl = document.getElementById("engine-heap-fill");
  if (heapStatsEl) heapStatsEl.innerText = ramLimit > 0 ? `[${ramPct}% / ${Math.round(ramUsed)} MB / ${Math.round(ramLimit)} MB MAX]` : "[0% / Standby]";
  if (heapFillEl) heapFillEl.style.width = `${ramPct}%`;

  const chunks = stats.chunks || 0;
  const chunksPct = chunks > 0 ? Math.min(100, Math.round((chunks / 200) * 10) / 10) : 0;
  const chunksStatsEl = document.getElementById("engine-chunks-stats");
  const chunksFillEl = document.getElementById("engine-chunks-fill");
  if (chunksStatsEl) chunksStatsEl.innerText = chunks > 0 ? `[${chunksPct}% / ${chunks.toLocaleString()} chunks]` : "[0 chunks]";
  if (chunksFillEl) chunksFillEl.style.width = `${chunksPct}%`;

  const entities = stats.entities || 0;
  const entitiesPct = entities > 0 ? Math.min(100, Math.round((entities / 500) * 10) / 10) : 0;
  const entitiesStatsEl = document.getElementById("engine-entities-stats");
  const entitiesFillEl = document.getElementById("engine-entities-fill");
  if (entitiesStatsEl) entitiesStatsEl.innerText = entities > 0 ? `[${entitiesPct}% / ${entities.toLocaleString()} active]` : "[0 active]";
  if (entitiesFillEl) entitiesFillEl.style.width = `${entitiesPct}%`;
}

export function setHeatmapView(app, view) {
  app.state.heatmapView = view;
  if (view === "week") {
    app.state.heatmapWeekIdx = 0;
  } else {
    app.state.heatmapMonthIdx = 0;
  }
  const weekBtn = document.getElementById("heatmap-view-week-btn");
  const monthBtn = document.getElementById("heatmap-view-month-btn");
  if (weekBtn) weekBtn.classList.toggle("active", view === "week");
  if (monthBtn) monthBtn.classList.toggle("active", view === "month");
  renderHeatmap(app);
}

export function prevHeatmapPeriod(app) {
  if (app.state.heatmapView === "week") {
    const allWeeks = getAllHeatmapWeeks(app);
    if (app.state.heatmapWeekIdx < allWeeks.length - 1) {
      app.state.heatmapWeekIdx++;
      renderHeatmap(app);
    }
  } else {
    const months = (app.state.analyticsData && app.state.analyticsData.heatmap_months) || [];
    if (app.state.heatmapMonthIdx < months.length - 1) {
      app.state.heatmapMonthIdx++;
      renderHeatmap(app);
    }
  }
}

export function nextHeatmapPeriod(app) {
  if (app.state.heatmapView === "week") {
    if (app.state.heatmapWeekIdx > 0) {
      app.state.heatmapWeekIdx--;
      renderHeatmap(app);
    }
  } else {
    if (app.state.heatmapMonthIdx > 0) {
      app.state.heatmapMonthIdx--;
      renderHeatmap(app);
    }
  }
}

export function getAllHeatmapWeeks(app) {
  const data = app.state.analyticsData;
  if (!data || !data.heatmap_months || !data.heatmap_months.length) {
    return data && data.heatmap_7d_24h && data.heatmap_7d_24h.length ? [{ label: "WEEK: CURRENT", days: data.heatmap_7d_24h }] : [];
  }
  const chronMonths = [...data.heatmap_months].reverse();
  const allDays = [];
  chronMonths.forEach(m => {
    allDays.push(...m.days);
  });
  const weeks = [];
  let currentWeek = [];
  for (let i = 0; i < allDays.length; i++) {
    const d = allDays[i];
    if (d.day === "Mon" && currentWeek.length > 0) {
      if (currentWeek.length === 7) {
        const start = currentWeek[0];
        const end = currentWeek[6];
        weeks.push({
          label: `WEEK: ${start.date.toUpperCase()} – ${end.date.toUpperCase()}`,
          days: currentWeek
        });
      }
      currentWeek = [];
    }
    currentWeek.push(d);
  }
  if (currentWeek.length === 7) {
    const start = currentWeek[0];
    const end = currentWeek[6];
    weeks.push({
      label: `WEEK: ${start.date.toUpperCase()} – ${end.date.toUpperCase()}`,
      days: currentWeek
    });
  }
  return weeks.reverse();
}

export function renderHeatmap(app) {
  const data = app.state.analyticsData;
  if (!data) return;

  let currentDays = [];
  let periodLabel = "NO DATA RECORDED";
  let canPrev = false;
  let canNext = false;
  const isMonthView = app.state.heatmapView === "month";

  if (!isMonthView) {
    const weeks = getAllHeatmapWeeks(app);
    const idx = Math.max(0, Math.min(weeks.length - 1, app.state.heatmapWeekIdx));
    if (weeks[idx]) {
      currentDays = weeks[idx].days;
      periodLabel = weeks[idx].label;
      canPrev = idx < weeks.length - 1;
      canNext = idx > 0;
    }
  } else {
    const months = data.heatmap_months || [];
    const idx = Math.max(0, Math.min(months.length - 1, app.state.heatmapMonthIdx));
    if (months[idx]) {
      const selMonth = months[idx];
      periodLabel = `MONTH: ${selMonth.month.toUpperCase()} [${selMonth.days_count} DAYS]`;
      canPrev = idx < months.length - 1;
      canNext = idx > 0;

      const daysNames = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
      const monthDays = selMonth.days || [];
      currentDays = daysNames.map(dName => {
        const matchingDays = monthDays.filter(md => md.day.toUpperCase() === dName);
        const hours = [];
        for (let h = 0; h < 24; h++) {
          let onlineCount = 0;
          let downCount = 0;
          let totalPlayers = 0;
          matchingDays.forEach(md => {
            const cell = md.hours && md.hours[h];
            if (cell) {
              if (cell.s === "online") {
                onlineCount++;
                totalPlayers += (cell.p || 0);
              } else if (cell.s === "down") {
                downCount++;
              }
            }
          });
          let status = "asleep";
          let avgP = 0;
          if (downCount > 0 && downCount >= matchingDays.length / 2) {
            status = "down";
          } else if (onlineCount >= matchingDays.length / 2 && onlineCount > 0) {
            status = "online";
            avgP = Math.round(totalPlayers / Math.max(1, onlineCount));
          }
          hours.push({
            h: h,
            s: status,
            p: avgP,
            activeOccurrences: onlineCount,
            totalOccurrences: matchingDays.length,
            monthName: selMonth.short_month || selMonth.month
          });
        }
        return { day: dName, date: "", hours: hours };
      });
    }
  }

  const labelEl = document.getElementById("heatmap-period-label");
  if (labelEl) labelEl.textContent = periodLabel;

  const prevBtn = document.getElementById("heatmap-prev-btn");
  const nextBtn = document.getElementById("heatmap-next-btn");
  if (prevBtn) prevBtn.disabled = !canPrev;
  if (nextBtn) nextBtn.disabled = !canNext;

  const heatmapRows = document.getElementById("analytics-heatmap-rows");
  if (heatmapRows) {
    if (!currentDays.length) {
      heatmapRows.innerHTML = `<div style="color:var(--text-muted);font-size:11px;padding:18px 0;text-align:center;">No availability metrics collected yet.</div>`;
    } else {
      heatmapRows.innerHTML = currentDays.map(dayItem => {
        const cells = dayItem.hours.map(cell => {
          let tier = "";
          if (cell.s === "online") {
            tier = cell.p >= 6 ? "tier-3" : (cell.p >= 3 ? "tier-2" : "tier-1");
          }
          let tooltip = "";
          if (isMonthView) {
            tooltip = `${dayItem.day} [${cell.monthName || "MONTH"}] ${cell.h}:00 — ${cell.s.toUpperCase()} [${cell.activeOccurrences}/${cell.totalOccurrences} ACTIVE • AVG ${cell.p} PLAYERS]`;
          } else {
            const dateStr = dayItem.date ? ` [${dayItem.date}]` : "";
            tooltip = `${dayItem.day}${dateStr} ${cell.h}:00 — ${cell.s.toUpperCase()} [${cell.p} PLAYERS]`;
          }
          return `<div class="heatmap-cell ${cell.s} ${tier}" title="${escapeHtml(tooltip)}"></div>`;
        }).join("");

        const dayDisplay = isMonthView ? dayItem.day : `${dayItem.day} ${dayItem.date.split(" ")[1] || ""}`;
        return `
          <div class="heatmap-row">
            <span class="heatmap-day-label">${escapeHtml(dayDisplay)}</span>
            <div class="heatmap-cells-row">${cells}</div>
          </div>
        `;
      }).join("");
    }
  }

  let totalHours = 0;
  let sleepHours = 0;
  let activeHours = 0;
  let downHours = 0;

  if (isMonthView) {
    const months = data.heatmap_months || [];
    const idx = Math.max(0, Math.min(months.length - 1, app.state.heatmapMonthIdx));
    const selMonth = months[idx];
    if (selMonth && selMonth.days) {
      selMonth.days.forEach(d => {
        d.hours.forEach(h => {
          totalHours++;
          if (h.s === "asleep") sleepHours++;
          else if (h.s === "online") activeHours++;
          else if (h.s === "down") downHours++;
        });
      });
    }
  } else {
    currentDays.forEach(d => {
      d.hours.forEach(h => {
        totalHours++;
        if (h.s === "asleep") sleepHours++;
        else if (h.s === "online") activeHours++;
        else if (h.s === "down") downHours++;
      });
    });
  }

  const sleepPct = totalHours ? Math.round((sleepHours / totalHours) * 1000) / 10 : 0;
  const activePct = totalHours ? Math.round((activeHours / totalHours) * 1000) / 10 : 0;
  const downPct = totalHours ? Math.round((downHours / totalHours) * 1000) / 10 : 0;

  const totalMonEl = document.getElementById("heatmap-total-monitored");
  const sSum = document.getElementById("heatmap-sleep-summary");
  const aSum = document.getElementById("heatmap-active-summary");
  const dSum = document.getElementById("heatmap-down-summary");

  if (totalMonEl) totalMonEl.textContent = `${totalHours}h TOTAL MONITORED`;
  if (sSum) sSum.textContent = `${sleepHours}h [${sleepPct}%]`;
  if (aSum) aSum.textContent = `${activeHours}h [${activePct}%]`;
  if (dSum) dSum.textContent = `${downHours}h [${downPct}%]`;
}
