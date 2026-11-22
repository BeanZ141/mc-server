const ICONS = {
  server: `<svg class="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"><rect x="2" y="3" width="20" height="7"></rect><rect x="2" y="14" width="20" height="7"></rect><line x1="6" y1="6.5" x2="6.01" y2="6.5"></line><line x1="6" y1="17.5" x2="6.01" y2="17.5"></line></svg>`,
  properties: `<svg class="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>`,
  console: `<svg class="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>`,
  log: `<svg class="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>`,
  players: `<svg class="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
  software: `<svg class="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>`,
  mods: `<svg class="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>`,
  files: `<svg class="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`,
  worlds: `<svg class="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`,
  backups: `<svg class="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>`,
  access: `<svg class="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"><rect x="3" y="11" width="18" height="11" rx="0" ry="0"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`,
  menu: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`,
  start: `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"></polygon></svg>`,
  restart: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>`,
  stop: `<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16"></rect></svg>`,
  copy: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`,
  folder: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`,
  file: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>`,
  download: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`,
  trash: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
  edit: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`,
  plus: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
  upload: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>`,
  refresh: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>`,
  search: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`,
  logout: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>`,
  check: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>`
};

const API = {
  csrfToken: null,
  sessionToken: localStorage.getItem("mcadmin_token") || null,

  async request(url, options = {}) {
    options.headers = options.headers || {};
    options.headers["Accept"] = "application/json";
    options.credentials = "include";
    if (this.sessionToken) {
      options.headers["Authorization"] = `Bearer ${this.sessionToken}`;
    }
    if (options.body && typeof options.body === "object" && !(options.body instanceof FormData)) {
      options.headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(options.body);
    }
    if (this.csrfToken && ["POST", "PUT", "DELETE", "PATCH"].includes((options.method || "GET").toUpperCase())) {
      options.headers["X-CSRF-Token"] = this.csrfToken;
    }

    const res = await fetch(url, options);
    if (res.status === 401) {
      localStorage.removeItem("mcadmin_token");
      this.sessionToken = null;
      app.showLoginModal();
      throw new Error("Authentication required");
    }
    if (res.status === 429) {
      const data = await res.json().catch(() => ({}));
      alert(data.detail || "Too many failed attempts. Locked out.");
      throw new Error("Locked out");
    }
    if (!res.ok) {
      const errData = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(errData.detail || `Request failed: ${res.status}`);
    }
    return res.json();
  }
};

const app = {
  state: {
    authenticated: false,
    setupRequired: false,
    activeTab: "server",
    theme: localStorage.getItem("mcadmin_theme") || "dark",
    status: null,
    idleSecondsRemaining: null,
    properties: null,
    consoleHistory: [],
    consoleHistoryIdx: -1,
    logs: [],
    logFilter: "",
    autoScrollLogs: true,
    playerSection: "ops",
    playersData: {
      ops: [],
      banned_players: [],
      banned_ips: [],
      whitelisted: [],
      offline_players: [],
      online_players: []
    },
    softwareCatalog: [],
    currentSoftware: null,
    installedMods: { managed: [], manual: [] },
    modSearchResults: [],
    modSearchLoading: false,
    modQuery: "",
    modSort: "downloads",
    modCategory: "all",
    modEnv: "all",
    currentFilePath: "",
    fileItems: [],
    fileBreadcrumbs: [],
    editingFile: null,
    worldInfo: null,
    worldFiles: [],
    diskUsage: null
  },

  sseLogSource: null,
  statusInterval: null,

  async init() {
    this.setTheme(this.state.theme);
    this.render();
    try {
      const me = await API.request("/api/auth/me");
      if (me.setup_required) {
        this.state.setupRequired = true;
        this.showSetupModal();
      } else if (!me.authenticated) {
        this.state.authenticated = false;
        this.showLoginModal();
      } else {
        this.state.authenticated = true;
        API.csrfToken = me.csrf_token;
        this.startDashboard();
      }
    } catch (e) {
      console.error("Init check failed:", e);
    }
  },

  setTheme(theme) {
    this.state.theme = theme;
    localStorage.setItem("mcadmin_theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
    document.querySelectorAll(".theme-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.theme === theme);
    });
  },

  toggleMobileSidebar() {
    const sb = document.getElementById("sidebar");
    const bd = document.getElementById("sidebar-backdrop");
    if (sb) sb.classList.toggle("mobile-open");
    if (bd) bd.classList.toggle("active");
  },

  closeMobileSidebar() {
    const sb = document.getElementById("sidebar");
    const bd = document.getElementById("sidebar-backdrop");
    if (sb) sb.classList.remove("mobile-open");
    if (bd) bd.classList.remove("active");
  },

  startDashboard() {
    this.fetchStatus();
    this.statusInterval = setInterval(() => {
      this.fetchStatus();
    }, 3000);

    setInterval(() => {
      if (this.state.status && this.state.status.state === "Online") {
        if (this.state.idleSecondsRemaining !== null && this.state.idleSecondsRemaining > 0) {
          this.state.idleSecondsRemaining--;
          this.updateIdleBadge();
        }
      }
    }, 1000);

    this.setTab("server");
  },

  async fetchStatus() {
    try {
      const data = await API.request("/api/status");
      this.state.status = data;
      if (data.idle && data.idle.remaining_seconds !== undefined) {
        this.state.idleSecondsRemaining = data.idle.remaining_seconds;
      }
      this.pulseUpdateBeacon(data.state);
      this.updateSidebarState(data);
      if (this.state.activeTab === "server") {
        this.updateServerMetrics(data);
      }
    } catch (e) {
      console.debug("Status fetch error:", e);
      this.pulseUpdateBeacon("Error");
      this.updateSidebarState({ state: "Error", players: null });
    }
  },

  pulseUpdateBeacon(state = "Online") {
    const bDot = document.getElementById("topbar-beacon-dot");
    const bText = document.getElementById("topbar-beacon-text");
    const sDot = document.getElementById("sidebar-dot");

    const isError = (state || "").toLowerCase() === "error";

    if (bText) {
      if (isError) {
        bText.innerHTML = `<span class="badge badge-error">ERROR</span>`;
      } else {
        bText.innerText = (state || "-").toUpperCase();
      }
    }

    if (bDot) {
      if (isError) {
        bDot.className = "beacon-dot down flash";
      } else {
        bDot.className = "beacon-dot " + (state === "Online" ? "" : (state === "Asleep" ? "asleep" : "down"));
        bDot.classList.remove("flash");
        void bDot.offsetWidth;
        bDot.classList.add("flash");
      }
    }

    if (sDot) {
      if (isError) {
        sDot.className = "status-indicator-dot down flash";
      } else {
        sDot.className = "status-indicator-dot " + (state === "Online" ? "" : (state === "Asleep" ? "asleep" : "down"));
        sDot.classList.remove("flash");
        void sDot.offsetWidth;
        sDot.classList.add("flash");
      }
    }
  },

  updateSidebarState(data) {
    const sText = document.getElementById("sidebar-state-text");
    const sCount = document.getElementById("sidebar-player-count");

    if (sText) {
      const st = data.state || "-";
      if (st.toLowerCase() === "error") {
        sText.innerHTML = `<span class="badge badge-error">ERROR</span>`;
      } else {
        sText.innerText = st;
      }
    }

    if (sCount) {
      if (data.players && data.players.count !== undefined) {
        sCount.innerText = `${data.players.count} / ${data.players.max !== undefined ? data.players.max : 8}`;
      } else {
        sCount.innerText = "-";
      }
    }
  },

  updateIdleBadge() {
    const idleEl = document.getElementById("topbar-idle-timer");
    const stripIdle = document.getElementById("strip-idle");
    const val = this.state.idleSecondsRemaining !== null ? this.formatSeconds(this.state.idleSecondsRemaining) : "-";
    if (idleEl) idleEl.innerText = val;
    if (stripIdle) stripIdle.innerText = val;
  },

  showConfirmModal(title, message, onConfirm, { danger = true, confirmText = "Confirm" } = {}) {
    const overlay = document.getElementById("modal-overlay");
    const body = document.getElementById("modal-body");

    body.innerHTML = `
      <div class="modal-header">
        <h3 style="font-size:14px;font-weight:700;text-transform:uppercase;">${this.escapeHtml(title)}</h3>
        <button class="btn btn-secondary btn-sm" onclick="app.closeModal()">✕</button>
      </div>
      <div style="padding:16px 20px;font-size:13px;color:var(--text-secondary);line-height:1.6;">
        ${this.escapeHtml(message)}
      </div>
      <div class="modal-footer" style="display:flex;justify-content:flex-end;gap:10px;padding:14px 20px;border-top:1px solid var(--border-subtle);">
        <button class="btn btn-secondary btn-sm" onclick="app.closeModal()">Cancel</button>
        <button class="btn ${danger ? 'btn-danger' : 'btn-primary'} btn-sm" id="confirm-modal-ok-btn">${this.escapeHtml(confirmText)}</button>
      </div>
    `;

    document.getElementById("confirm-modal-ok-btn").onclick = () => {
      this.closeModal();
      onConfirm();
    };

    overlay.style.display = "flex";
  },

  closeModal() {
    const overlay = document.getElementById("modal-overlay");
    if (overlay) overlay.style.display = "none";
  },

  async startServer() {
    try {
      const res = await API.request("/api/control/start", { method: "POST" });
      alert(res.message);
      this.fetchStatus();
    } catch (e) {
      alert(e.message);
    }
  },

  stopServer() {
    this.showConfirmModal(
      "Stop Minecraft Server",
      "Are you sure you want to stop the server? Any connected players will be disconnected.",
      async () => {
        try {
          const res = await API.request("/api/control/stop", { method: "POST", body: { force: true } });
          alert(res.message);
          this.fetchStatus();
        } catch (e) {
          alert(e.message);
        }
      },
      { danger: true, confirmText: "Stop Server" }
    );
  },

  restartServer() {
    this.showConfirmModal(
      "Restart Minecraft Server",
      "Are you sure you want to restart the server? The server container will safely stop and restart.",
      async () => {
        try {
          const res = await API.request("/api/control/restart", { method: "POST", body: { force: true } });
          alert(res.message);
          this.fetchStatus();
        } catch (e) {
          alert(e.message);
        }
      },
      { danger: true, confirmText: "Restart Server" }
    );
  },

  copyServerAddress() {
    const addr = "mc.palvi.org:26656";
    navigator.clipboard.writeText(addr).then(() => {
      const btn = document.getElementById("copy-addr-btn");
      if (btn) {
        const orig = btn.innerHTML;
        btn.innerHTML = `${ICONS.copy} Copied!`;
        setTimeout(() => btn.innerHTML = orig, 1500);
      }
    }).catch(() => {
      alert("Server address: " + addr);
    });
  },

  formatDate(dateStr) {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    } catch (e) {
      return dateStr.split("T")[0] || dateStr;
    }
  },

  updateSquareMeter(trackId, percent, statusClass = "") {
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
  },

  setTab(tab) {
    this.state.activeTab = tab;
    this.closeMobileSidebar();

    document.querySelectorAll(".sidebar-nav-item").forEach(el => {
      el.classList.toggle("active", el.dataset.tab === tab);
    });

    const titles = {
      server: "Server Overview",
      properties: "Server Properties",
      console: "Server Console",
      log: "Persistent Server Log",
      players: "Player Management",
      software: "Software Management",
      mods: "Mods & Addons (Modrinth)",
      files: "Server Files",
      worlds: "World Management",
      backups: "World Backups",
      access: "Access Control"
    };

    const titleEl = document.getElementById("topbar-view-title");
    if (titleEl) titleEl.innerText = titles[tab] || "Dashboard";

    if (tab !== "log" && this.sseLogSource) {
      this.sseLogSource.close();
      this.sseLogSource = null;
    }

    this.renderTabContent();

    if (tab === "server") this.fetchStatus();
    if (tab === "properties") this.loadProperties();
    if (tab === "console") this.initConsole();
    if (tab === "log") this.initLogs();
    if (tab === "players") this.loadPlayers();
    if (tab === "software") this.loadSoftware();
    if (tab === "mods") this.loadMods();
    if (tab === "files") this.loadFiles(this.state.currentFilePath || "");
    if (tab === "worlds") this.loadWorlds();
    if (tab === "backups") this.loadBackups();
    if (tab === "access") this.loadAccess();
  },

  renderTabContent() {
    const main = document.getElementById("main-content");
    const tab = this.state.activeTab;

    if (tab === "server") {
      main.innerHTML = `
        <div class="card" style="margin-bottom:20px;padding:24px 44px 24px 22px;">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:20px;">
            <div style="display:flex;flex-direction:column;gap:6px;">
              <span style="font-size:11px;font-weight:600;text-transform:uppercase;color:var(--text-muted);">Minecraft Direct Connect</span>
              <div style="display:flex;align-items:center;gap:12px;">
                <span class="copy-pill" id="copy-addr-btn" onclick="app.copyServerAddress()" title="Click to copy">
                  ${ICONS.copy} mc.palvi.org:26656
                </span>
                <span style="font-size:12px;color:var(--text-secondary);">Direct Port 26656</span>
              </div>
            </div>

            <div style="display:flex;align-items:center;gap:28px;flex-wrap:wrap;">
              <div>
                <span style="display:block;font-size:11px;font-weight:600;text-transform:uppercase;color:var(--text-muted);margin-bottom:4px;">Software</span>
                <span style="font-size:14px;font-weight:600;color:var(--text-primary);" id="server-software-val">-</span>
              </div>
              <div>
                <span style="display:block;font-size:11px;font-weight:600;text-transform:uppercase;color:var(--text-muted);margin-bottom:4px;">Version</span>
                <span style="font-size:14px;font-weight:600;color:var(--text-primary);" id="server-version-val">-</span>
              </div>
              <div>
                <span style="display:block;font-size:11px;font-weight:600;text-transform:uppercase;color:var(--text-muted);margin-bottom:4px;">Server State</span>
                <div style="display:flex;align-items:center;gap:6px;" id="server-state-wrapper">
                  <span style="font-size:14px;font-weight:700;text-transform:uppercase;" id="server-state-text">-</span>
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
            <span class="metric-strip-label">Status</span>
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
              <span class="progress-header-title">MEMORY ALLOCATION</span>
              <span class="badge" id="ram-header-badge">-</span>
            </div>
            
            <div class="meter-track" id="ram-meter-track">
              <div class="meter-block"></div><div class="meter-block"></div><div class="meter-block"></div><div class="meter-block"></div><div class="meter-block"></div><div class="meter-block"></div><div class="meter-block"></div><div class="meter-block"></div><div class="meter-block"></div><div class="meter-block"></div><div class="meter-block"></div><div class="meter-block"></div><div class="meter-block"></div><div class="meter-block"></div><div class="meter-block"></div><div class="meter-block"></div><div class="meter-block"></div><div class="meter-block"></div><div class="meter-block"></div><div class="meter-block"></div><div class="meter-block"></div><div class="meter-block"></div><div class="meter-block"></div><div class="meter-block"></div>
            </div>

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
                <span class="breakdown-box-label">CPU LOAD</span>
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
            <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;padding:0 0 14px 0;margin-bottom:14px;border-bottom:1px solid var(--border-subtle);">
              <span class="card-title" style="margin:0;">SERVER HARDWARE & ANALYTICS</span>
              <span class="badge" id="server-hardware-badge">HOST METRICS</span>
            </div>
            <div style="display:flex;flex-direction:column;gap:12px;">
              <div class="metric-row">
                <span class="metric-label">CPU Temperature</span>
                <span class="metric-value" id="server-analytics-temp">-</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Host Memory (RAM)</span>
                <span class="metric-value" id="server-analytics-mem">-</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Disk Storage</span>
                <span class="metric-value" id="server-analytics-disk">-</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">System Load Averages (1m, 5m, 15m)</span>
                <span class="metric-value" id="server-analytics-load">-</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Host OS & Platform</span>
                <span class="metric-value" id="server-analytics-os">-</span>
              </div>
            </div>
          </div>
        </div>

        <div class="card" style="padding:22px 24px;">
          <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;padding:0 0 14px 0;margin-bottom:12px;border-bottom:1px solid var(--border-subtle);">
            <span class="card-title" style="margin:0;">CONNECTED PLAYERS</span>
            <span class="badge" id="server-card-player-count">-</span>
          </div>
          <div id="server-online-players-list" style="min-height:70px;padding:8px 0;">
            <div style="color:var(--text-muted);font-size:12.5px;text-align:center;padding:24px 0;">No players currently connected.</div>
          </div>
        </div>
      `;
      if (this.state.status) {
        this.updateServerMetrics(this.state.status);
      }
    } else if (tab === "properties") {
      main.innerHTML = `
        <div class="card" style="max-width:800px;">
          <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <h2 style="font-size:15px;font-weight:700;text-transform:uppercase;">Server Properties</h2>
              <div style="font-size:12px;color:var(--text-secondary);margin-top:2px;">
                Directly configures mc.env and synchronizes server.properties
              </div>
            </div>
            <button class="btn btn-primary btn-sm" onclick="app.saveProperties()">${ICONS.check} Save Properties</button>
          </div>

          <div style="padding:20px 24px;display:flex;flex-direction:column;gap:18px;" id="properties-form-container">
            <div style="color:var(--text-muted);font-size:13px;">Loading properties...</div>
          </div>
        </div>
      `;
    } else if (tab === "console") {
      main.innerHTML = `
        <div class="terminal-window" style="display:flex;flex-direction:column;height:calc(100vh - 120px);background:var(--bg-canvas);border:1px solid var(--border-medium);">
          <div class="terminal-header" style="display:flex;justify-content:space-between;align-items:center;padding:10px 16px;background:var(--bg-surface);border-bottom:1px solid var(--border-medium);flex-wrap:wrap;gap:8px;">
            <div style="display:flex;align-items:center;gap:12px;">
              <span style="font-size:12px;font-weight:600;text-transform:uppercase;color:var(--text-primary);">RCON Console Terminal</span>
              <span class="badge" id="console-conn-status">Connected</span>
            </div>
            <div style="display:flex;align-items:center;gap:12px;">
              <label style="font-size:13px;color:var(--text-secondary);display:flex;align-items:center;gap:6px;cursor:pointer;">
                <input type="checkbox" id="console-autoscroll" checked onchange="app.state.autoScrollConsole = this.checked"> Auto-scroll
              </label>
              <button class="btn btn-secondary btn-sm" onclick="app.clearConsole()">Clear</button>
            </div>
          </div>

          <div class="terminal-screen" id="console-scroll-screen" style="flex:1;overflow-y:auto;display:flex;flex-direction:column;background:var(--bg-canvas);">
            <div style="flex:1;min-height:20px;"></div>
            <div id="console-output" style="padding:14px 16px;font-size:12.5px;line-height:1.6;color:var(--text-primary);display:flex;flex-direction:column;gap:3px;">
              <div style="color:var(--text-muted);">[Palvi MC Console Initialized. Type a Minecraft command below.]</div>
            </div>
          </div>

          <div class="terminal-inline-bar" style="display:flex;align-items:center;gap:10px;padding:10px 16px;background:var(--bg-surface);border-top:1px solid var(--border-medium);">
            <span style="font-size:14px;font-weight:700;color:var(--text-secondary);user-select:none;">&gt;</span>
            <input type="text" id="console-input" class="input" style="flex:1;background:transparent !important;border:none !important;box-shadow:none !important;padding:4px 0;font-size:13px;color:var(--text-primary);" placeholder="Type a Minecraft command (e.g. say hello, time set day, list)..." onkeydown="app.handleConsoleKey(event)">
            <button class="btn btn-primary btn-sm" onclick="app.sendConsoleCommand()">Execute</button>
          </div>
        </div>
      `;
    } else if (tab === "log") {
      main.innerHTML = `
        <div style="display:flex;flex-direction:column;height:calc(100vh - 120px);">
          <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:var(--bg-surface);border:1px solid var(--border-subtle);border-bottom:none;flex-wrap:wrap;gap:12px;">
            <div style="display:flex;align-items:center;gap:12px;">
              <span style="font-size:12px;font-weight:600;text-transform:uppercase;color:var(--text-primary);">latest.log Viewer</span>
              <span style="font-size:13px;color:var(--text-muted);">(Preserved across restarts and offline)</span>
            </div>
            <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
              <div style="position:relative;width:240px;">
                <input type="text" class="input" id="log-filter-input" placeholder="Filter log entries..." oninput="app.filterLogs(this.value)" style="padding-left:26px;font-size:12px;height:30px;">
                <span style="position:absolute;left:8px;top:7px;color:var(--text-muted);">${ICONS.search}</span>
              </div>
              <label style="font-size:13px;color:var(--text-secondary);display:flex;align-items:center;gap:6px;cursor:pointer;">
                <input type="checkbox" id="log-autoscroll" checked onchange="app.state.autoScrollLogs = this.checked"> Auto-scroll
              </label>
              <button class="btn btn-secondary btn-sm" onclick="app.initLogs()">${ICONS.refresh} Refresh</button>
              <a href="/api/files/download?path=logs/latest.log" target="_blank" class="btn btn-secondary btn-sm">${ICONS.download} Download</a>
            </div>
          </div>

          <div class="terminal" id="log-output" style="flex:1;overflow-y:auto;background:var(--bg-canvas);border:1px solid var(--border-medium);padding:14px 16px;font-size:12px;line-height:1.55;color:var(--text-primary);">
            <div style="color:var(--text-muted);">Loading server log...</div>
          </div>
        </div>
      `;
    } else if (tab === "players") {
      main.innerHTML = `
        <div class="subnav-tabs">
          <button class="subnav-btn active" data-sub="ops" onclick="app.setPlayerSection('ops')">OP Players</button>
          <button class="subnav-btn" data-sub="banned_players" onclick="app.setPlayerSection('banned_players')">Banned Players</button>
          <button class="subnav-btn" data-sub="banned_ips" onclick="app.setPlayerSection('banned_ips')">Banned IPs</button>
          <button class="subnav-btn" data-sub="whitelisted" onclick="app.setPlayerSection('whitelisted')">Whitelisted Players</button>
          <button class="subnav-btn" data-sub="offline" onclick="app.setPlayerSection('offline')">Offline Players</button>
        </div>

        <div id="player-section-content"></div>
      `;
    } else if (tab === "software") {
      main.innerHTML = `
        <div style="margin-bottom:20px;">
          <h2 style="font-size:15px;font-weight:700;text-transform:uppercase;">Software Selection & Management</h2>
          <div style="font-size:12.5px;color:var(--text-secondary);margin-top:4px;">
            Fabric is the existing default server software. Switching requires confirmation to prevent mod/world incompatibility.
          </div>
        </div>

        <div class="software-grid" id="software-grid-container">
          <div style="color:var(--text-muted);font-size:13px;">Loading software platforms...</div>
        </div>
      `;
    } else if (tab === "mods") {
      main.innerHTML = `
        <div class="subnav-tabs">
          <button class="subnav-btn active" id="mods-tab-installed" onclick="app.switchModsTab('installed')">Installed Mods</button>
          <button class="subnav-btn" id="mods-tab-browse" onclick="app.switchModsTab('browse')">Search & Install (Modrinth)</button>
        </div>

        <div id="mods-content-view"></div>
      `;
    } else if (tab === "files") {
      main.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:12px;">
          <div class="breadcrumbs" id="files-breadcrumbs">
            <span class="breadcrumb-item" onclick="app.loadFiles('')">root</span>
          </div>

          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-secondary btn-sm" onclick="app.promptCreateFolder()">${ICONS.plus} New Folder</button>
            <label class="btn btn-secondary btn-sm" style="cursor:pointer;margin-bottom:0;">
              ${ICONS.upload} Upload File
              <input type="file" style="display:none;" onchange="app.uploadFile(this)">
            </label>
            <button class="btn btn-secondary btn-sm" onclick="app.loadFiles(app.state.currentFilePath)">${ICONS.refresh} Refresh</button>
          </div>
        </div>

        <div id="files-browser-area">
          <div class="file-table-container">
            <table class="file-table">
              <thead>
                <tr>
                  <th style="width:45%;">Name</th>
                  <th style="width:15%;">Size</th>
                  <th style="width:20%;">Last Modified</th>
                  <th style="width:20%;text-align:right;">Actions</th>
                </tr>
              </thead>
              <tbody id="files-table-body">
                <tr><td colspan="4" style="color:var(--text-muted);text-align:center;padding:30px;">Loading files...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      `;
    } else if (tab === "worlds") {
      main.innerHTML = `
        <div class="card" style="margin-bottom:20px;padding:22px 24px;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:16px;">
            <div>
              <div style="font-size:11px;font-weight:600;text-transform:uppercase;color:var(--text-muted);margin-bottom:6px;">ACTIVE MINECRAFT WORLD</div>
              <h2 style="font-size:20px;font-weight:700;color:var(--text-primary);" id="world-name-display">-</h2>
              <div style="font-size:12.5px;color:var(--text-secondary);margin-top:4px;">
                Seed: <strong id="world-seed-display" style="color:var(--text-primary);letter-spacing:0.5px;">-</strong>
              </div>
            </div>

            <div class="btn-group">
              <a href="/api/worlds/download" class="btn btn-primary btn-sm">${ICONS.download} Download World Archive</a>
              <button class="btn btn-secondary btn-sm" onclick="app.showUploadWorldModal()">${ICONS.upload} Upload World</button>
              <button class="btn btn-danger btn-sm" onclick="app.showGenerateWorldModal()">${ICONS.plus} Generate New World</button>
            </div>
          </div>
        </div>

        <div class="grid-2">
          <div class="card">
            <div class="card-header">
              <span class="card-title">DIMENSIONS & COMPONENTS</span>
            </div>
            <div style="padding:14px 20px;display:flex;flex-direction:column;gap:12px;" id="world-dimensions-container">
              <div style="color:var(--text-muted);">Loading world details...</div>
            </div>
          </div>

          <div class="card">
            <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;">
              <span class="card-title">WORLD DIRECTORY FILES</span>
              <button class="btn btn-secondary btn-sm" onclick="app.jumpToWorldInFiles()">Open in Files</button>
            </div>
            <div style="padding:10px 14px;max-height:280px;overflow-y:auto;" id="world-files-list">
              <div style="color:var(--text-muted);font-size:12px;">Loading directory entries...</div>
            </div>
          </div>
        </div>
      `;
    } else if (tab === "backups") {
      main.innerHTML = `
        <div class="card" style="margin-bottom:20px;padding:22px 24px;">
          <h2 style="font-size:16px;font-weight:700;text-transform:uppercase;margin-bottom:8px;">AUTOMATED WORLD BACKUPS</h2>
          <p style="font-size:13px;color:var(--text-secondary);line-height:1.6;max-width:700px;">
            World backups are executed automatically every morning at <strong>04:00 AM (Asia/Kolkata)</strong>.
            Backups are compressed and stored locally in the server's dedicated storage directory with rolling retention.
          </p>
        </div>

        <div class="progress-card" style="margin-bottom:20px;">
          <div class="progress-header">
            <span class="progress-header-title">BACKUP STORAGE USAGE</span>
            <span class="progress-header-badge" id="backup-storage-badge">-</span>
          </div>
          <div class="meter-track" id="backup-meter-track">
            <div class="meter-block"></div><div class="meter-block"></div><div class="meter-block"></div><div class="meter-block"></div><div class="meter-block"></div><div class="meter-block"></div><div class="meter-block"></div><div class="meter-block"></div><div class="meter-block"></div><div class="meter-block"></div><div class="meter-block"></div><div class="meter-block"></div><div class="meter-block"></div><div class="meter-block"></div><div class="meter-block"></div><div class="meter-block"></div><div class="meter-block"></div><div class="meter-block"></div><div class="meter-block"></div><div class="meter-block"></div><div class="meter-block"></div><div class="meter-block"></div><div class="meter-block"></div><div class="meter-block"></div>
          </div>
          <div class="meter-substats">
            <div class="meter-sub-left">STORAGE USED <strong id="backup-used-text">-</strong></div>
            <div class="meter-sub-right neutral">AVAILABLE <strong id="backup-avail-text">-</strong></div>
          </div>
        </div>

        <div class="card" style="padding:22px 24px;border-left:3px solid var(--border-high);">
          <div style="font-size:13px;font-weight:600;text-transform:uppercase;margin-bottom:6px;color:var(--text-primary);">Development Status: Scheduled & Protected</div>
          <div style="font-size:12.5px;color:var(--text-secondary);line-height:1.6;">
            Interactive on-demand snapshots and 1-click restoration are scheduled for future release.
            Your current world data is safe and scheduled for daily automated backups.
          </div>
        </div>
      `;
    } else if (tab === "access") {
      main.innerHTML = `
        <div class="card" style="margin-bottom:20px;padding:22px 24px;">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;">
            <div>
              <div style="font-size:11px;font-weight:600;text-transform:uppercase;color:var(--text-muted);margin-bottom:4px;">ACTIVE ADMINISTRATOR</div>
              <h2 style="font-size:18px;font-weight:700;color:var(--text-primary);">admin</h2>
              <div style="font-size:12px;color:var(--text-secondary);margin-top:2px;">
                LAN-only Access · Argon2id Password Hashing · CSRF Token Protection
              </div>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="app.logout()">${ICONS.logout} Sign Out</button>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <span class="card-title">ACCESS PERMISSIONS MATRIX (FUTURE MULTI-USER ACCESS)</span>
          </div>
          <div style="padding:16px 20px;">
            <p style="font-size:12.5px;color:var(--text-secondary);margin-bottom:16px;">
              Multi-member permission delegation is planned for future release. Currently, the master admin account has full authorization.
            </p>

            <table class="file-table" style="opacity:0.75;">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Permission Level</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Control (Start/Stop/Restart)</td><td>Full Access</td><td><span class="badge">Active</span></td></tr>
                <tr><td>Console & Execution</td><td>Full Access</td><td><span class="badge">Active</span></td></tr>
                <tr><td>Persistent Server Logs</td><td>Full Access</td><td><span class="badge">Active</span></td></tr>
                <tr><td>Players & Whitelist</td><td>Full Access</td><td><span class="badge">Active</span></td></tr>
                <tr><td>Software Management</td><td>Full Access</td><td><span class="badge">Active</span></td></tr>
                <tr><td>Mod Manager (Modrinth)</td><td>Full Access</td><td><span class="badge">Active</span></td></tr>
                <tr><td>File Explorer & Editor</td><td>Full Access</td><td><span class="badge">Active</span></td></tr>
                <tr><td>World Management</td><td>Full Access</td><td><span class="badge">Active</span></td></tr>
              </tbody>
            </table>
          </div>
        </div>
      `;
    }
  },

  updateServerMetrics(data) {
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
    const isError = (state || "").toLowerCase() === "error";

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
                <span style="font-weight:600;font-size:13px;">${this.escapeHtml(p)}</span>
              </div>
              <span style="font-size:13px;color:var(--text-secondary);">Online</span>
            </div>
          `).join("");
        }
      }
    } else {
      if (stripPlayers) stripPlayers.innerText = "-";
    }

    if (data.stats && data.stats.ram_used_mb !== undefined) {
      const usedMb = Math.round(data.stats.ram_used_mb || 0);
      const limitMb = Math.round(data.stats.ram_limit_mb || 0);
      const pct = limitMb > 0 ? Math.min(100, Math.round((usedMb / limitMb) * 100)) : 0;
      if (stripRam) stripRam.innerText = limitMb > 0 ? `${usedMb} MB` : "-";
      this.updateSquareMeter("ram-meter-track", pct, pct > 90 ? "crit" : (pct > 75 ? "warn" : ""));
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
      const tpsVal = document.getElementById("tps-stat-val");
      if (tpsVal) tpsVal.innerText = data.stats.tps !== undefined ? `${data.stats.tps.toFixed(1)}` : "-";
      const msptVal = document.getElementById("mspt-stat-val");
      if (msptVal) msptVal.innerText = data.stats.mspt !== undefined ? `${data.stats.mspt.toFixed(1)} ms` : "-";
    } else {
      this.updateSquareMeter("ram-meter-track", 0);
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
    const memEl = document.getElementById("server-analytics-mem");
    const diskEl = document.getElementById("server-analytics-disk");
    const loadEl = document.getElementById("server-analytics-load");
    const osEl = document.getElementById("server-analytics-os");

    if (tempEl) tempEl.innerText = (host && host.cpu_temp !== null && host.cpu_temp !== undefined) ? `${host.cpu_temp} °C` : "-";
    if (memEl) memEl.innerText = (host && host.memory) ? `${host.memory.used_mb} MB / ${host.memory.total_mb} MB (${host.memory.percent}%)` : "-";
    if (diskEl) diskEl.innerText = (host && host.disk) ? `${host.disk.used_gb} GB / ${host.disk.total_gb} GB (${host.disk.percent}%)` : "-";
    if (loadEl) loadEl.innerText = (host && host.load_average) ? host.load_average.join(", ") : "-";
    if (osEl) osEl.innerText = (host && host.os_info) ? host.os_info : "-";
  },

  async loadProperties() {
    const container = document.getElementById("properties-form-container");
    if (!container) return;

    try {
      const props = await API.request("/api/settings/properties");
      this.state.properties = props;

      container.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;">
          <div class="form-group">
            <label class="form-label" style="font-size:13px;font-weight:600;text-transform:uppercase;color:var(--text-secondary);display:block;margin-bottom:6px;">
              Maximum Players (Slots)
            </label>
            <input type="number" id="prop-max-players" class="input" min="1" max="100" value="${props.max_players !== undefined ? props.max_players : 8}">
            <div style="font-size:13px;color:var(--text-muted);margin-top:4px;">Player limit (1 to 100)</div>
          </div>

          <div class="form-group">
            <label class="form-label" style="font-size:13px;font-weight:600;text-transform:uppercase;color:var(--text-secondary);display:block;margin-bottom:6px;">
              Default Gamemode
            </label>
            <select id="prop-gamemode" class="input">
              <option value="survival" ${props.gamemode === 'survival' ? 'selected' : ''}>Survival</option>
              <option value="creative" ${props.gamemode === 'creative' ? 'selected' : ''}>Creative</option>
              <option value="adventure" ${props.gamemode === 'adventure' ? 'selected' : ''}>Adventure</option>
              <option value="spectator" ${props.gamemode === 'spectator' ? 'selected' : ''}>Spectator</option>
            </select>
            <div style="font-size:13px;color:var(--text-muted);margin-top:4px;">Game mode for new players</div>
          </div>

          <div class="form-group">
            <label class="form-label" style="font-size:13px;font-weight:600;text-transform:uppercase;color:var(--text-secondary);display:block;margin-bottom:6px;">
              Difficulty
            </label>
            <select id="prop-difficulty" class="input">
              <option value="peaceful" ${props.difficulty === 'peaceful' ? 'selected' : ''}>Peaceful</option>
              <option value="easy" ${props.difficulty === 'easy' ? 'selected' : ''}>Easy</option>
              <option value="normal" ${props.difficulty === 'normal' ? 'selected' : ''}>Normal</option>
              <option value="hard" ${props.difficulty === 'hard' ? 'selected' : ''}>Hard</option>
            </select>
            <div style="font-size:13px;color:var(--text-muted);margin-top:4px;">Server combat & mob difficulty</div>
          </div>

          <div class="form-group">
            <label class="form-label" style="font-size:13px;font-weight:600;text-transform:uppercase;color:var(--text-secondary);display:block;margin-bottom:6px;">
              Spawn Protection Radius
            </label>
            <input type="number" id="prop-spawn-protection" class="input" min="0" max="1000" value="${props.spawn_protection !== undefined ? props.spawn_protection : 16}">
            <div style="font-size:13px;color:var(--text-muted);margin-top:4px;">Blocks around world spawn (0 to disable)</div>
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:12px;margin-top:10px;">
          <div class="switch-label" onclick="app.togglePropertySwitch('prop-whitelist')">
            <div>
              <div style="font-size:13px;font-weight:600;">Whitelist</div>
              <div style="font-size:13px;color:var(--text-muted);">Only allow players registered on whitelist.json to connect</div>
            </div>
            <div class="switch-toggle-box ${props.whitelist ? 'active' : ''}" id="prop-whitelist-box">
              <div class="switch-toggle-thumb"></div>
            </div>
            <input type="hidden" id="prop-whitelist" value="${props.whitelist ? 'true' : 'false'}">
          </div>

          <div class="switch-label" onclick="app.togglePropertySwitch('prop-allow-flight')">
            <div>
              <div style="font-size:13px;font-weight:600;">Allow Flight</div>
              <div style="font-size:13px;color:var(--text-muted);">Permit players to fly in survival mode</div>
            </div>
            <div class="switch-toggle-box ${props.allow_flight ? 'active' : ''}" id="prop-allow-flight-box">
              <div class="switch-toggle-thumb"></div>
            </div>
            <input type="hidden" id="prop-allow-flight" value="${props.allow_flight ? 'true' : 'false'}">
          </div>
        </div>
      `;
    } catch (e) {
      container.innerHTML = `<span class="badge badge-error">ERROR</span> <span style="margin-left:8px;color:var(--text-secondary);">${this.escapeHtml(e.message)}</span>`;
    }
  },

  togglePropertySwitch(hiddenInputId) {
    const input = document.getElementById(hiddenInputId);
    const box = document.getElementById(`${hiddenInputId}-box`);
    if (!input || !box) return;

    const current = input.value === "true";
    const next = !current;
    input.value = next ? "true" : "false";
    box.classList.toggle("active", next);
  },

  async saveProperties() {
    const maxPlayers = parseInt(document.getElementById("prop-max-players").value, 10);
    const gamemode = document.getElementById("prop-gamemode").value;
    const difficulty = document.getElementById("prop-difficulty").value;
    const spawnProt = parseInt(document.getElementById("prop-spawn-protection").value, 10);
    const whitelist = document.getElementById("prop-whitelist").value === "true";
    const allowFlight = document.getElementById("prop-allow-flight").value === "true";

    try {
      const res = await API.request("/api/settings/properties", {
        method: "POST",
        body: {
          max_players: maxPlayers,
          gamemode: gamemode,
          difficulty: difficulty,
          spawn_protection: spawnProt,
          whitelist: whitelist,
          allow_flight: allowFlight
        }
      });
      alert(res.message);
      this.loadProperties();
    } catch (e) {
      alert("Error saving properties: " + e.message);
    }
  },

  initConsole() {
    const output = document.getElementById("console-output");
    if (output && output.children.length <= 1) {
      this.sendConsoleCommandSilent("list");
    }
  },

  async sendConsoleCommand() {
    const input = document.getElementById("console-input");
    const cmd = input.value.trim();
    if (!cmd) return;

    this.state.consoleHistory.push(cmd);
    this.state.consoleHistoryIdx = this.state.consoleHistory.length;
    input.value = "";

    this.appendConsoleLine(`> ${cmd}`, "cmd");

    try {
      const res = await API.request("/api/console/execute", {
        method: "POST",
        body: { command: cmd }
      });
      if (res.output) {
        this.appendConsoleLine(res.output, res.success ? "res" : "err");
      } else {
        this.appendConsoleLine("[Command executed with no return output]", "res");
      }
    } catch (e) {
      this.appendConsoleLine(`Error executing command: ${e.message}`, "err");
    }
  },

  async sendConsoleCommandSilent(cmd) {
    try {
      const res = await API.request("/api/console/execute", {
        method: "POST",
        body: { command: cmd }
      });
      if (res.output) {
        this.appendConsoleLine(res.output, "res");
      }
    } catch (e) { }
  },

  handleConsoleKey(e) {
    if (e.key === "Enter") {
      this.sendConsoleCommand();
    } else if (e.key === "ArrowUp") {
      if (this.state.consoleHistoryIdx > 0) {
        this.state.consoleHistoryIdx--;
        e.target.value = this.state.consoleHistory[this.state.consoleHistoryIdx] || "";
      }
    } else if (e.key === "ArrowDown") {
      if (this.state.consoleHistoryIdx < this.state.consoleHistory.length - 1) {
        this.state.consoleHistoryIdx++;
        e.target.value = this.state.consoleHistory[this.state.consoleHistoryIdx] || "";
      } else {
        this.state.consoleHistoryIdx = this.state.consoleHistory.length;
        e.target.value = "";
      }
    }
  },

  appendConsoleLine(text, type = "normal") {
    const output = document.getElementById("console-output");
    if (!output) return;

    const line = document.createElement("div");
    if (type === "cmd") {
      line.style.color = "var(--text-primary)";
      line.style.fontWeight = "600";
    } else if (type === "err") {
      line.style.color = "#ef4444";
    } else {
      line.style.color = "var(--text-secondary)";
    }
    line.innerText = text;
    output.appendChild(line);

    const autoScroll = document.getElementById("console-autoscroll");
    const screen = document.getElementById("console-scroll-screen") || output;
    if (!autoScroll || autoScroll.checked) {
      screen.scrollTop = screen.scrollHeight;
    }
  },

  clearConsole() {
    const output = document.getElementById("console-output");
    if (output) output.innerHTML = `<div style="color:var(--text-muted);">[Console cleared]</div>`;
  },

  async initLogs() {
    const output = document.getElementById("log-output");
    if (!output) return;

    try {
      const res = await API.request("/api/logs/tail?lines=500");
      this.state.logs = res.lines || [];
      this.renderLogs();

      if (!this.sseLogSource) {
        this.sseLogSource = new EventSource("/api/logs/stream");
        this.sseLogSource.onmessage = (event) => {
          this.state.logs.push(event.data);
          if (this.state.logs.length > 2000) this.state.logs.shift();
          this.appendLogLine(event.data);
        };
      }
    } catch (e) {
      output.innerHTML = `<span class="badge badge-error">ERROR</span> <span style="margin-left:8px;color:var(--text-secondary);">${this.escapeHtml(e.message)}</span>`;
    }
  },

  renderLogs() {
    const output = document.getElementById("log-output");
    if (!output) return;

    const filter = this.state.logFilter.toLowerCase();
    const filtered = filter ? this.state.logs.filter(l => l.toLowerCase().includes(filter)) : this.state.logs;

    output.innerHTML = filtered.map(line => this.formatLogLine(line)).join("");

    const autoScroll = document.getElementById("log-autoscroll");
    if (!autoScroll || autoScroll.checked) {
      output.scrollTop = output.scrollHeight;
    }
  },

  appendLogLine(line) {
    const output = document.getElementById("log-output");
    if (!output) return;

    const filter = this.state.logFilter.toLowerCase();
    if (filter && !line.toLowerCase().includes(filter)) return;

    const div = document.createElement("div");
    div.innerHTML = this.formatLogLine(line);
    output.appendChild(div);

    const autoScroll = document.getElementById("log-autoscroll");
    if (!autoScroll || autoScroll.checked) {
      output.scrollTop = output.scrollHeight;
    }
  },

  filterLogs(val) {
    this.state.logFilter = val;
    this.renderLogs();
  },

  formatLogLine(line) {
    let color = "var(--text-secondary)";
    let isErr = false;
    if (line.includes("/ERROR]") || line.includes("Exception") || line.includes("Error")) {
      color = "#ef4444";
      isErr = true;
    } else if (line.includes("/WARN]")) {
      color = "#f59e0b";
    } else if (line.includes("/INFO]")) {
      color = "var(--text-primary)";
    }
    return `<div style="color:${color};font-family:var(--font-universal);white-space:pre-wrap;word-break:break-all;">${isErr ? '<span class="badge badge-error" style="margin-right:6px;font-size:9.5px;padding:1px 5px;">ERROR</span>' : ''}${this.escapeHtml(line)}</div>`;
  },

  async loadPlayers() {
    try {
      const data = await API.request("/api/players/all");
      this.state.playersData = data;
      this.renderPlayerSection();
    } catch (e) {
      console.error("Failed to load players data:", e);
    }
  },

  setPlayerSection(sec) {
    this.state.playerSection = sec;
    document.querySelectorAll(".subnav-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.sub === sec);
    });
    this.renderPlayerSection();
  },

  renderPlayerSection() {
    const container = document.getElementById("player-section-content");
    if (!container) return;

    const sec = this.state.playerSection;
    const data = this.state.playersData;

    const configs = {
      ops: {
        title: "OP Players (Operators)",
        desc: "Server operators with full permission to run administration commands.",
        placeholder: "Enter player username...",
        actionLabel: "Add OP",
        onAdd: "app.addPlayerOp()",
        list: data.ops || [],
        onRemove: "app.removePlayerOp",
        emptyText: "No operators currently configured."
      },
      banned_players: {
        title: "Banned Players",
        desc: "Players blocked from joining the server by username.",
        placeholder: "Enter username to ban...",
        actionLabel: "Ban Player",
        onAdd: "app.banPlayer()",
        list: data.banned_players || [],
        onRemove: "app.unbanPlayer",
        emptyText: "No players banned."
      },
      banned_ips: {
        title: "Banned IP Addresses",
        desc: "IP addresses permanently blocked from connecting to the server.",
        placeholder: "Enter IP address to ban...",
        actionLabel: "Ban IP",
        onAdd: "app.banIp()",
        list: data.banned_ips || [],
        onRemove: "app.unbanIp",
        emptyText: "No IP addresses banned."
      },
      whitelisted: {
        title: "Whitelisted Players",
        desc: "Players permitted to join when whitelist is enabled in server properties.",
        placeholder: "Enter username to whitelist...",
        actionLabel: "Add to Whitelist",
        onAdd: "app.addPlayerWhitelist()",
        list: data.whitelisted || [],
        onRemove: "app.removePlayerWhitelist",
        emptyText: "No players currently whitelisted."
      },
      offline: {
        title: "Offline Players",
        desc: "Players who have previously joined the server and are currently offline.",
        list: data.offline_players || [],
        emptyText: "No offline player history recorded."
      }
    };

    const cfg = configs[sec] || configs.ops;

    let formHtml = "";
    if (sec !== "offline") {
      formHtml = `
        <div style="display:flex;gap:10px;margin-bottom:18px;flex-wrap:wrap;">
          <input type="text" id="player-action-input" class="input" style="max-width:320px;" placeholder="${cfg.placeholder}">
          <button class="btn btn-primary btn-sm" onclick="${cfg.onAdd}">${ICONS.plus} ${cfg.actionLabel}</button>
        </div>
      `;
    }

    let listHtml = "";
    if (!cfg.list || cfg.list.length === 0) {
      listHtml = `<div style="color:var(--text-muted);font-size:12.5px;padding:30px 0;text-align:center;">${cfg.emptyText}</div>`;
    } else {
      listHtml = `
        <div class="file-table-container">
          <table class="file-table">
            <thead>
              <tr>
                <th>Identifier / Username</th>
                ${sec !== 'offline' ? '<th style="text-align:right;">Actions</th>' : '<th>Status</th>'}
              </tr>
            </thead>
            <tbody>
              ${cfg.list.map(item => `
                <tr>
                  <td style="font-weight:600;">${this.escapeHtml(item)}</td>
                  ${sec !== 'offline' ? `
                    <td style="text-align:right;">
                      <button class="btn btn-danger btn-sm" onclick="${cfg.onRemove}('${this.escapeHtml(item)}')">${ICONS.trash} Remove</button>
                    </td>
                  ` : `
                    <td style="color:var(--text-muted);font-size:12px;">Offline</td>
                  `}
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="card" style="padding:22px 24px;">
        <h2 style="font-size:15px;font-weight:700;text-transform:uppercase;margin-bottom:4px;">${cfg.title}</h2>
        <p style="font-size:12.5px;color:var(--text-secondary);margin-bottom:16px;">${cfg.desc}</p>
        ${formHtml}
        ${listHtml}
      </div>
    `;
  },

  async addPlayerOp() {
    const input = document.getElementById("player-action-input");
    const name = input ? input.value.trim() : "";
    if (!name) return;
    try {
      await API.request("/api/players/ops", { method: "POST", body: { player: name } });
      input.value = "";
      this.loadPlayers();
    } catch (e) {
      alert(e.message);
    }
  },

  async removePlayerOp(name) {
    this.showConfirmModal("De-op Player", `Remove operator privileges from ${name}?`, async () => {
      try {
        await API.request(`/api/players/ops/${encodeURIComponent(name)}`, { method: "DELETE" });
        this.loadPlayers();
      } catch (e) {
        alert(e.message);
      }
    });
  },

  async banPlayer() {
    const input = document.getElementById("player-action-input");
    const name = input ? input.value.trim() : "";
    if (!name) return;
    try {
      await API.request("/api/players/ban", { method: "POST", body: { player: name } });
      input.value = "";
      this.loadPlayers();
    } catch (e) {
      alert(e.message);
    }
  },

  async unbanPlayer(name) {
    this.showConfirmModal("Unban Player", `Pardon and unban ${name}?`, async () => {
      try {
        await API.request("/api/players/unban", { method: "POST", body: { player: name } });
        this.loadPlayers();
      } catch (e) {
        alert(e.message);
      }
    });
  },

  async banIp() {
    const input = document.getElementById("player-action-input");
    const ip = input ? input.value.trim() : "";
    if (!ip) return;
    try {
      await API.request("/api/players/ban-ip", { method: "POST", body: { ip: ip } });
      input.value = "";
      this.loadPlayers();
    } catch (e) {
      alert(e.message);
    }
  },

  async unbanIp(ip) {
    this.showConfirmModal("Unban IP", `Unban IP address ${ip}?`, async () => {
      try {
        await API.request("/api/players/unban-ip", { method: "POST", body: { ip: ip } });
        this.loadPlayers();
      } catch (e) {
        alert(e.message);
      }
    });
  },

  async addPlayerWhitelist() {
    const input = document.getElementById("player-action-input");
    const name = input ? input.value.trim() : "";
    if (!name) return;
    try {
      await API.request("/api/players/whitelist", { method: "POST", body: { player: name } });
      input.value = "";
      this.loadPlayers();
    } catch (e) {
      alert(e.message);
    }
  },

  async removePlayerWhitelist(name) {
    this.showConfirmModal("Remove Whitelist", `Remove ${name} from whitelist?`, async () => {
      try {
        await API.request(`/api/players/whitelist/${encodeURIComponent(name)}`, { method: "DELETE" });
        this.loadPlayers();
      } catch (e) {
        alert(e.message);
      }
    });
  },

  async loadSoftware() {
    const container = document.getElementById("software-grid-container");
    if (!container) return;

    try {
      const data = await API.request("/api/software");
      this.state.currentSoftware = data.current;
      this.state.softwareCatalog = data.available;

      container.innerHTML = data.available.map(sw => {
        const isCurrent = sw.id === data.current.type;
        return `
          <div class="software-card ${isCurrent ? 'active' : ''}">
            <div>
              <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">
                <h3 style="font-size:15px;font-weight:700;">${this.escapeHtml(sw.name)}</h3>
                <span class="software-badge ${isCurrent ? 'active' : ''}">
                  ${isCurrent ? 'Active · ' + (data.current.version || '-') : (sw.supports_mods ? 'Modded' : 'Vanilla')}
                </span>
              </div>
              <p style="font-size:12.5px;color:var(--text-secondary);line-height:1.55;margin-bottom:14px;">
                ${this.escapeHtml(sw.description)}
              </p>
            </div>

            <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--border-subtle);padding-top:12px;margin-top:12px;">
              <span style="font-size:13px;color:var(--text-muted);">
                ${sw.supports_mods ? 'Supports Mods' : (sw.supports_plugins ? 'Supports Plugins' : 'Standard')}
              </span>
              ${isCurrent ? `
                <button class="btn btn-secondary btn-sm" disabled>Current Software</button>
              ` : `
                <button class="btn btn-secondary btn-sm" onclick="app.requestSwitchSoftware('${sw.id}', '${this.escapeHtml(sw.name)}')">Switch to ${this.escapeHtml(sw.name)}</button>
              `}
            </div>
          </div>
        `;
      }).join("");
    } catch (e) {
      container.innerHTML = `<span class="badge badge-error">ERROR</span> <span style="margin-left:8px;color:var(--text-secondary);">${this.escapeHtml(e.message)}</span>`;
    }
  },

  requestSwitchSoftware(swId, swName) {
    this.showConfirmModal(
      `Switch to ${swName}`,
      `WARNING: Fabric is the default and current server software. Switching to ${swName} will disable installed Fabric mods and may require world backup. Confirm to proceed.`,
      async () => {
        try {
          const res = await API.request("/api/software/switch", {
            method: "POST",
            body: { software_id: swId, confirm: true }
          });
          alert(res.message);
          this.loadSoftware();
        } catch (e) {
          alert(e.message);
        }
      },
      { danger: true, confirmText: `Switch Software` }
    );
  },

  async loadMods() {
    this.switchModsTab("installed");
  },

  switchModsTab(tab) {
    const btnInstalled = document.getElementById("mods-tab-installed");
    const btnBrowse = document.getElementById("mods-tab-browse");
    const view = document.getElementById("mods-content-view");
    if (!view) return;

    if (btnInstalled) btnInstalled.classList.toggle("active", tab === "installed");
    if (btnBrowse) btnBrowse.classList.toggle("active", tab === "browse");

    if (tab === "installed") {
      this.renderInstalledMods();
    } else {
      this.renderBrowseMods();
    }
  },

  async renderInstalledMods() {
    const view = document.getElementById("mods-content-view");
    if (!view) return;

    view.innerHTML = `<div style="color:var(--text-muted);font-size:13px;padding:20px 0;">Loading installed mods...</div>`;

    try {
      const data = await API.request("/api/mods/installed");
      this.state.installedMods = data;

      let managedHtml = "";
      if (!data.managed || data.managed.length === 0) {
        managedHtml = `<div style="color:var(--text-muted);font-size:12.5px;padding:14px 0;">No managed Modrinth mods installed.</div>`;
      } else {
        managedHtml = `
          <div class="file-table-container" style="margin-bottom:24px;">
            <table class="file-table">
              <thead>
                <tr>
                  <th>Mod Title / Slug</th>
                  <th>Source</th>
                  <th>Compatibility</th>
                  <th style="text-align:right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${data.managed.map(m => `
                  <tr>
                    <td>
                      <div style="font-weight:600;">${this.escapeHtml(m.title || m.slug)}</div>
                      <div style="font-size:11px;color:var(--text-muted);">${this.escapeHtml(m.slug)}</div>
                    </td>
                    <td><span class="badge">Modrinth</span></td>
                    <td><span class="badge" style="color:#22c55e;">Fabric 26.3</span></td>
                    <td style="text-align:right;">
                      <button class="btn btn-danger btn-sm" onclick="app.removeMod('${this.escapeHtml(m.slug)}')">${ICONS.trash} Remove</button>
                    </td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        `;
      }

      view.innerHTML = `
        <div class="card" style="padding:22px 24px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px;">
            <div>
              <h2 style="font-size:15px;font-weight:700;text-transform:uppercase;">Installed Fabric 26.3 Mods</h2>
              <div style="font-size:12px;color:var(--text-secondary);">Managed automatically via MODRINTH_PROJECTS in mc.env</div>
            </div>
            <button class="btn btn-primary btn-sm" onclick="app.switchModsTab('browse')">${ICONS.plus} Install New Mod</button>
          </div>
          ${managedHtml}
        </div>
      `;
    } catch (e) {
      view.innerHTML = `<span class="badge badge-error">ERROR</span> <span style="margin-left:8px;color:var(--text-secondary);">${this.escapeHtml(e.message)}</span>`;
    }
  },

  renderBrowseMods() {
    const view = document.getElementById("mods-content-view");
    if (!view) return;

    view.innerHTML = `
      <div class="card" style="padding:22px 24px;margin-bottom:20px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:16px;">
          <div>
            <h2 style="font-size:15px;font-weight:700;text-transform:uppercase;">Browse Modrinth Repository</h2>
            <div style="font-size:12px;color:var(--text-secondary);margin-top:2px;">
              Direct Modrinth API catalog · Fabric 26.3 verified
            </div>
          </div>

          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <label style="font-size:12px;color:var(--text-muted);font-weight:600;text-transform:uppercase;">Sort:</label>
            <select id="mod-sort-select" class="input" style="width:auto;padding:5px 10px;font-size:12px;" onchange="app.changeModSort(this.value)">
              <option value="downloads" ${this.state.modSort === 'downloads' ? 'selected' : ''}>Most Downloaded</option>
              <option value="follows" ${this.state.modSort === 'follows' ? 'selected' : ''}>Most Followed</option>
              <option value="updated" ${this.state.modSort === 'updated' ? 'selected' : ''}>Recently Updated</option>
              <option value="newest" ${this.state.modSort === 'newest' ? 'selected' : ''}>Newest</option>
              <option value="relevance" ${this.state.modSort === 'relevance' ? 'selected' : ''}>Relevance</option>
            </select>
          </div>
        </div>

        <div style="display:flex;gap:10px;margin-bottom:16px;">
          <input type="text" id="mod-search-input" class="input" style="flex:1;" placeholder="Search mods (e.g. lithium, ferrite-core, sodium)..." value="${this.escapeHtml(this.state.modQuery || '')}" onkeydown="if(event.key==='Enter') app.searchMods(this.value)">
          <button class="btn btn-primary" onclick="app.searchMods(document.getElementById('mod-search-input').value)">${ICONS.search} Search</button>
        </div>

        <div style="display:flex;flex-direction:column;gap:12px;border-top:1px solid var(--border-subtle);padding-top:14px;">
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
            <span style="font-size:11px;font-weight:600;text-transform:uppercase;color:var(--text-muted);min-width:90px;">Environment:</span>
            <div style="display:flex;gap:6px;flex-wrap:wrap;" id="mod-env-filters">
              <button class="keycap ${this.state.modEnv === 'all' ? 'active' : ''}" onclick="app.changeModEnv('all')">All</button>
              <button class="keycap ${this.state.modEnv === 'client' ? 'active' : ''}" onclick="app.changeModEnv('client')">Client</button>
              <button class="keycap ${this.state.modEnv === 'server' ? 'active' : ''}" onclick="app.changeModEnv('server')">Server</button>
            </div>
          </div>

          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
            <span style="font-size:11px;font-weight:600;text-transform:uppercase;color:var(--text-muted);min-width:90px;">Categories:</span>
            <div style="display:flex;gap:6px;flex-wrap:wrap;" id="mod-cat-filters">
              <button class="keycap ${this.state.modCategory === 'all' ? 'active' : ''}" onclick="app.changeModCategory('all')">All</button>
              <button class="keycap ${this.state.modCategory === 'optimization' ? 'active' : ''}" onclick="app.changeModCategory('optimization')">Optimization</button>
              <button class="keycap ${this.state.modCategory === 'utility' ? 'active' : ''}" onclick="app.changeModCategory('utility')">Utility</button>
              <button class="keycap ${this.state.modCategory === 'decoration' ? 'active' : ''}" onclick="app.changeModCategory('decoration')">Decoration</button>
              <button class="keycap ${this.state.modCategory === 'technology' ? 'active' : ''}" onclick="app.changeModCategory('technology')">Technology</button>
              <button class="keycap ${this.state.modCategory === 'adventure' ? 'active' : ''}" onclick="app.changeModCategory('adventure')">Adventure</button>
              <button class="keycap ${this.state.modCategory === 'magic' ? 'active' : ''}" onclick="app.changeModCategory('magic')">Magic</button>
              <button class="keycap ${this.state.modCategory === 'storage' ? 'active' : ''}" onclick="app.changeModCategory('storage')">Storage</button>
            </div>
          </div>
        </div>
      </div>

      <div id="mod-search-results-area">
        <div style="display:flex;flex-direction:column;gap:10px;padding:30px 0;align-items:center;">
          <div class="loading-skeleton" style="width:200px;height:14px;"></div>
          <span style="color:var(--text-muted);font-size:12px;">Connecting to Modrinth catalog...</span>
        </div>
      </div>
    `;

    this.executeModSearch();
  },

  changeModEnv(env) {
    this.state.modEnv = env;
    document.querySelectorAll("#mod-env-filters .keycap").forEach(k => {
      k.classList.toggle("active", k.innerText.toLowerCase() === env.toLowerCase());
    });
    this.executeModSearch();
  },

  changeModCategory(cat) {
    this.state.modCategory = cat;
    document.querySelectorAll("#mod-cat-filters .keycap").forEach(k => {
      k.classList.toggle("active", k.innerText.toLowerCase() === cat.toLowerCase());
    });
    this.executeModSearch();
  },

  changeModSort(val) {
    this.state.modSort = val;
    this.executeModSearch();
  },

  searchMods(query) {
    this.state.modQuery = (query || "").trim();
    this.executeModSearch();
  },

  async executeModSearch() {
    const area = document.getElementById("mod-search-results-area");
    if (!area) return;

    area.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:10px;padding:30px 0;align-items:center;">
        <div class="loading-skeleton" style="width:240px;height:16px;"></div>
        <span style="color:var(--text-muted);font-size:12px;">Querying Modrinth...</span>
      </div>
    `;

    const q = encodeURIComponent(this.state.modQuery || "");
    const sort = encodeURIComponent(this.state.modSort || "downloads");
    const cat = this.state.modCategory && this.state.modCategory !== "all" ? `&category=${encodeURIComponent(this.state.modCategory)}` : "";
    const env = this.state.modEnv && this.state.modEnv !== "all" ? `&environment=${encodeURIComponent(this.state.modEnv)}` : "";

    try {
      const res = await API.request(`/api/mods/search?q=${q}&sort=${sort}${cat}${env}&limit=20`);
      this.state.modSearchResults = res.hits || [];

      if (!res.hits || res.hits.length === 0) {
        area.innerHTML = `<div style="color:var(--text-muted);font-size:12.5px;text-align:center;padding:40px 0;">No mods found on Modrinth for the selected filters.</div>`;
        return;
      }

      area.innerHTML = `
        <div class="software-grid">
          ${res.hits.map(h => `
            <div class="software-card">
              <div>
                <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:10px;">
                  ${h.icon_url ? `<img src="${h.icon_url}" style="width:52px;height:52px;object-fit:contain;flex-shrink:0;" alt="">` : `<div style="width:52px;height:52px;background:var(--bg-surface-elevated);border:1px solid var(--border-subtle);display:flex;align-items:center;justify-content:center;flex-shrink:0;">${ICONS.mods}</div>`}
                  <div style="flex:1;min-width:0;">
                    <h3 style="font-size:14px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:2px;">${this.escapeHtml(h.title)}</h3>
                    <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">by ${this.escapeHtml(h.author)}</div>
                    <div style="display:flex;align-items:center;gap:10px;font-size:11px;color:var(--text-secondary);">
                      <span>${(h.downloads || 0).toLocaleString()} dl</span>
                      <span>·</span>
                      <span>Updated ${app.formatDate(h.date_modified)}</span>
                    </div>
                  </div>
                </div>

                <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;">
                  <span class="badge" style="font-size:10px;padding:2px 6px;">Client: ${h.client_side || 'optional'}</span>
                  <span class="badge" style="font-size:10px;padding:2px 6px;">Server: ${h.server_side || 'optional'}</span>
                </div>

                <p style="font-size:12px;color:var(--text-secondary);line-height:1.5;margin-bottom:12px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;min-height:54px;">
                  ${this.escapeHtml(h.description)}
                </p>
              </div>

              <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--border-subtle);padding-top:10px;">
                <span class="badge" style="color:#22c55e;">Fabric 26.3</span>
                <button class="btn btn-primary btn-sm" onclick="app.installMod('${this.escapeHtml(h.slug)}')">${ICONS.plus} Install</button>
              </div>
            </div>
          `).join("")}
        </div>
      `;
    } catch (e) {
      if (area) area.innerHTML = `<span class="badge badge-error">ERROR</span> <span style="margin-left:8px;color:var(--text-secondary);">${this.escapeHtml(e.message)}</span>`;
    }
  },

  installMod(slug) {
    this.showConfirmModal(
      `Install ${slug}`,
      `Install mod '${slug}' from Modrinth? This will add it to mc.env and recreate the server container.`,
      async () => {
        try {
          const res = await API.request("/api/mods/add", { method: "POST", body: { slug: slug } });
          alert(res.message);
          this.switchModsTab("installed");
        } catch (e) {
          alert(e.message);
        }
      },
      { danger: false, confirmText: "Install Mod" }
    );
  },

  removeMod(slug) {
    this.showConfirmModal(
      `Remove ${slug}`,
      `Remove mod '${slug}' from server? The mod will be removed from mc.env and deleted from mods folder.`,
      async () => {
        try {
          const res = await API.request("/api/mods/remove", { method: "POST", body: { slug: slug } });
          alert(res.message);
          this.renderInstalledMods();
        } catch (e) {
          alert(e.message);
        }
      },
      { danger: true, confirmText: "Remove Mod" }
    );
  },

  async loadFiles(relPath = "") {
    this.state.currentFilePath = relPath;
    const body = document.getElementById("files-table-body");
    const bc = document.getElementById("files-breadcrumbs");

    if (body) body.innerHTML = `<tr><td colspan="4" style="color:var(--text-muted);text-align:center;padding:30px;">Loading files...</td></tr>`;

    try {
      const data = await API.request(`/api/files/list?path=${encodeURIComponent(relPath)}`);
      this.state.fileItems = data.items || [];
      this.state.fileBreadcrumbs = data.breadcrumbs || [];

      if (bc) {
        bc.innerHTML = data.breadcrumbs.map((b, idx) => {
          const isLast = idx === data.breadcrumbs.length - 1;
          if (isLast) {
            return `<span class="breadcrumb-current">${this.escapeHtml(b.name)}</span>`;
          } else {
            return `
              <span class="breadcrumb-item" onclick="app.loadFiles('${this.escapeHtml(b.path)}')">${this.escapeHtml(b.name)}</span>
              <span class="breadcrumb-separator">/</span>
            `;
          }
        }).join("");
      }

      if (body) {
        if (!data.items || data.items.length === 0) {
          body.innerHTML = `<tr><td colspan="4" style="color:var(--text-muted);text-align:center;padding:30px;">This directory is empty.</td></tr>`;
          return;
        }

        body.innerHTML = data.items.map(item => {
          const isDir = item.type === "directory";
          return `
            <tr>
              <td>
                <div class="file-name-cell" onclick="${isDir ? `app.loadFiles('${this.escapeHtml(item.path)}')` : (item.editable ? `app.openFileEditor('${this.escapeHtml(item.path)}')` : '')}">
                  <span style="opacity:0.8;">${isDir ? ICONS.folder : ICONS.file}</span>
                  <span style="font-weight:${isDir ? '600' : '400'};">${this.escapeHtml(item.name)}</span>
                </div>
              </td>
              <td style="color:var(--text-secondary);font-size:12px;">${item.size_formatted}</td>
              <td style="color:var(--text-muted);font-size:13px;">${item.modified}</td>
              <td style="text-align:right;">
                <div style="display:inline-flex;gap:6px;">
                  ${item.editable ? `
                    <button class="btn btn-secondary btn-sm" onclick="app.openFileEditor('${this.escapeHtml(item.path)}')">${ICONS.edit} Edit</button>
                  ` : ''}
                  <a href="/api/files/download?path=${encodeURIComponent(item.path)}" target="_blank" class="btn btn-secondary btn-sm" title="Download">${ICONS.download}</a>
                  <button class="btn btn-danger btn-sm" onclick="app.deleteFileItem('${this.escapeHtml(item.path)}', '${this.escapeHtml(item.name)}', ${isDir})" title="Delete">${ICONS.trash}</button>
                </div>
              </td>
            </tr>
          `;
        }).join("");
      }
    } catch (e) {
      if (body) body.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:30px;"><span class="badge badge-error">ERROR</span> <span style="margin-left:8px;color:var(--text-secondary);">${this.escapeHtml(e.message)}</span></td></tr>`;
    }
  },

  async openFileEditor(path) {
    const area = document.getElementById("files-browser-area");
    if (!area) return;

    try {
      const fileData = await API.request(`/api/files/read?path=${encodeURIComponent(path)}`);
      this.state.editingFile = fileData;

      area.innerHTML = `
        <div class="editor-container">
          <div class="editor-header">
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="font-size:13px;font-weight:600;color:var(--text-primary);">${this.escapeHtml(fileData.name)}</span>
              <span style="font-size:11px;color:var(--text-muted);">(${fileData.size_formatted})</span>
            </div>
            <div style="display:flex;gap:8px;">
              <button class="btn btn-secondary btn-sm" onclick="app.loadFiles(app.state.currentFilePath)">Cancel</button>
              <button class="btn btn-primary btn-sm" onclick="app.saveFileContent('${this.escapeHtml(path)}')">${ICONS.check} Save File</button>
            </div>
          </div>
          <textarea id="file-editor-content" class="editor-textarea" spellcheck="false">${this.escapeHtml(fileData.content)}</textarea>
        </div>
      `;
    } catch (e) {
      alert("Error opening file: " + e.message);
    }
  },

  async saveFileContent(path) {
    const textarea = document.getElementById("file-editor-content");
    if (!textarea) return;

    try {
      const res = await API.request("/api/files/write", {
        method: "POST",
        body: { path: path, content: textarea.value }
      });
      alert(res.message);
      this.loadFiles(this.state.currentFilePath);
    } catch (e) {
      alert("Save failed: " + e.message);
    }
  },

  deleteFileItem(path, name, isDir) {
    this.showConfirmModal(
      `Delete ${isDir ? 'Folder' : 'File'}`,
      `Are you sure you want to permanently delete '${name}'? This action cannot be undone.`,
      async () => {
        try {
          const res = await API.request(`/api/files/delete`, {
            method: "DELETE",
            body: { path: path, confirm: true }
          });
          alert(res.message);
          this.loadFiles(this.state.currentFilePath);
        } catch (e) {
          alert(e.message);
        }
      },
      { danger: true, confirmText: `Delete ${name}` }
    );
  },

  promptCreateFolder() {
    const name = prompt("Enter folder name:");
    if (!name) return;
    API.request("/api/files/create-folder", {
      method: "POST",
      body: { path: this.state.currentFilePath, name: name }
    }).then(res => {
      alert(res.message);
      this.loadFiles(this.state.currentFilePath);
    }).catch(e => alert(e.message));
  },

  async uploadFile(input) {
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    const formData = new FormData();
    formData.append("file", file);

    const url = `/api/files/upload?path=${encodeURIComponent(this.state.currentFilePath)}`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "X-CSRF-Token": API.csrfToken
        },
        body: formData,
        credentials: "include"
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Upload failed");
      alert(data.message);
      this.loadFiles(this.state.currentFilePath);
    } catch (e) {
      alert("Upload error: " + e.message);
    }
  },

  async loadWorlds() {
    try {
      const info = await API.request("/api/worlds/info");
      this.state.worldInfo = info;

      const nameDisplay = document.getElementById("world-name-display");
      const seedDisplay = document.getElementById("world-seed-display");
      if (nameDisplay) nameDisplay.innerText = info.world_name || "-";
      if (seedDisplay) seedDisplay.innerText = info.seed ? info.seed : "-";

      const dimContainer = document.getElementById("world-dimensions-container");
      if (dimContainer) {
        dimContainer.innerHTML = `
          <div class="metric-row"><span class="metric-label">Total World Disk Size</span><span class="metric-value">${info.size_formatted || '-'}</span></div>
          <div class="metric-row"><span class="metric-label">level.dat Structure</span><span class="metric-value">${info.has_level_dat ? '<span class="badge" style="color:#22c55e;">Valid</span>' : '<span class="badge badge-error">MISSING</span>'}</span></div>
          <div class="metric-row"><span class="metric-label">Overworld Region</span><span class="metric-value">${info.has_overworld ? 'Present (region/)' : 'None'}</span></div>
          <div class="metric-row"><span class="metric-label">The Nether (DIM-1)</span><span class="metric-value">${info.has_nether ? 'Present' : 'Not generated'}</span></div>
          <div class="metric-row"><span class="metric-label">The End (DIM1)</span><span class="metric-value">${info.has_end ? 'Present' : 'Not generated'}</span></div>
          <div class="metric-row"><span class="metric-label">Datapacks Installed</span><span class="metric-value">${info.datapacks && info.datapacks.length ? info.datapacks.join(', ') : 'None'}</span></div>
          <div class="metric-row"><span class="metric-label">Player Profile Data</span><span class="metric-value">${info.player_records !== undefined ? info.player_records : '-'} saved records</span></div>
        `;
      }

      const filesRes = await API.request("/api/worlds/files");
      const filesList = document.getElementById("world-files-list");
      if (filesList) {
        if (!filesRes.files || filesRes.files.length === 0) {
          filesList.innerHTML = `<div style="color:var(--text-muted);font-size:12px;padding:20px 0;text-align:center;">No files found in world directory.</div>`;
        } else {
          filesList.innerHTML = filesRes.files.map(f => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;border-bottom:1px solid var(--border-subtle);font-size:12.5px;">
              <div style="display:flex;align-items:center;gap:8px;">
                <span>${f.type === 'directory' ? ICONS.folder : ICONS.file}</span>
                <span style="font-weight:600;">${this.escapeHtml(f.name)}</span>
              </div>
              <span style="color:var(--text-muted);font-size:13px;">${f.size_formatted}</span>
            </div>
          `).join("");
        }
      }
    } catch (e) {
      console.error("Worlds load error:", e);
    }
  },

  jumpToWorldInFiles() {
    const worldName = this.state.worldInfo ? this.state.worldInfo.world_name : "";
    this.setTab("files");
    setTimeout(() => this.loadFiles(worldName), 100);
  },

  showUploadWorldModal() {
    const overlay = document.getElementById("modal-overlay");
    const body = document.getElementById("modal-body");

    body.innerHTML = `
      <div class="modal-header">
        <h3 style="font-size:14px;font-weight:700;text-transform:uppercase;">Upload & Import World Archive</h3>
        <button class="btn btn-secondary btn-sm" onclick="app.closeModal()">✕</button>
      </div>
      <div style="padding:18px 20px;">
        <p style="font-size:12.5px;color:var(--text-secondary);line-height:1.6;margin-bottom:16px;">
          Upload a <strong>.zip</strong> world archive. The archive will be validated to ensure <code>level.dat</code> is present and extracted to the server.
        </p>
        <input type="file" id="upload-world-file-input" accept=".zip" class="input" style="width:100%;">
      </div>
      <div class="modal-footer" style="display:flex;justify-content:flex-end;gap:10px;padding:14px 20px;border-top:1px solid var(--border-subtle);">
        <button class="btn btn-secondary btn-sm" onclick="app.closeModal()">Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="app.executeWorldUpload()">${ICONS.upload} Upload & Apply</button>
      </div>
    `;

    overlay.style.display = "flex";
  },

  async executeWorldUpload() {
    const input = document.getElementById("upload-world-file-input");
    if (!input || !input.files || input.files.length === 0) {
      alert("Please select a .zip file to upload.");
      return;
    }

    const file = input.files[0];
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/worlds/upload", {
        method: "POST",
        headers: { "X-CSRF-Token": API.csrfToken },
        body: formData,
        credentials: "include"
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Upload failed");
      this.closeModal();
      alert(data.message);
      this.loadWorlds();
    } catch (e) {
      alert("Error importing world: " + e.message);
    }
  },

  showGenerateWorldModal() {
    const overlay = document.getElementById("modal-overlay");
    const body = document.getElementById("modal-body");

    body.innerHTML = `
      <div class="modal-header">
        <h3 style="font-size:14px;font-weight:700;text-transform:uppercase;">Generate New World</h3>
        <button class="btn btn-secondary btn-sm" onclick="app.closeModal()">✕</button>
      </div>
      <div style="padding:18px 20px;display:flex;flex-direction:column;gap:14px;">
        <p style="font-size:12.5px;color:var(--text-secondary);line-height:1.5;">
          Configuring a new world updates the LEVEL setting in mc.env. The existing world folder will remain preserved on disk.
        </p>
        <div>
          <label style="font-size:11px;font-weight:600;text-transform:uppercase;color:var(--text-secondary);display:block;margin-bottom:4px;">New World Name</label>
          <input type="text" id="gen-world-name" class="input" placeholder="e.g. SurvivalWorld2">
        </div>
        <div>
          <label style="font-size:11px;font-weight:600;text-transform:uppercase;color:var(--text-secondary);display:block;margin-bottom:4px;">World Seed (Optional)</label>
          <input type="text" id="gen-world-seed" class="input" placeholder="Leave blank for random seed">
        </div>
      </div>
      <div class="modal-footer" style="display:flex;justify-content:flex-end;gap:10px;padding:14px 20px;border-top:1px solid var(--border-subtle);">
        <button class="btn btn-secondary btn-sm" onclick="app.closeModal()">Cancel</button>
        <button class="btn btn-danger btn-sm" onclick="app.executeWorldGenerate()">${ICONS.plus} Generate World</button>
      </div>
    `;

    overlay.style.display = "flex";
  },

  async executeWorldGenerate() {
    const nameInput = document.getElementById("gen-world-name");
    const seedInput = document.getElementById("gen-world-seed");
    const name = nameInput ? nameInput.value.trim() : "";
    const seed = seedInput ? seedInput.value.trim() : "";

    if (!name) {
      alert("Please provide a world name.");
      return;
    }

    try {
      const res = await API.request("/api/worlds/generate", {
        method: "POST",
        body: {
          world_name: name,
          seed: seed,
          confirm: true
        }
      });
      this.closeModal();
      alert(res.message);
      this.loadWorlds();
    } catch (e) {
      alert("Failed to configure world: " + e.message);
    }
  },

  async loadBackups() {
    try {
      const disk = await API.request("/api/backups/disk-usage");
      this.state.diskUsage = disk;

      const fill = document.getElementById("backup-meter-fill");
      const badge = document.getElementById("backup-storage-badge");
      const usedText = document.getElementById("backup-used-text");
      const availText = document.getElementById("backup-avail-text");

      if (disk && disk.total_bytes) {
        const bpct = Math.round(disk.percent_used || 0);
        this.updateSquareMeter("backup-meter-track", bpct, bpct > 90 ? "crit" : (bpct > 80 ? "warn" : ""));
        if (fill) fill.style.width = `${bpct}%`;
        if (badge) badge.innerText = `${disk.percent_used || 0}% IN USE`;
        if (usedText) usedText.innerText = `${(disk.used_bytes / (1024 * 1024 * 1024)).toFixed(1)} GB (${disk.percent_used}%)`;
        if (availText) availText.innerText = `${(disk.free_bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
      } else {
        this.updateSquareMeter("backup-meter-track", 0);
        if (fill) fill.style.width = "0%";
        if (badge) badge.innerText = "-";
        if (usedText) usedText.innerText = "-";
        if (availText) availText.innerText = "-";
      }
    } catch (e) {
      console.debug("Disk usage fetch error:", e);
    }
  },

  loadAccess() { },

  showLoginModal() {
    const overlay = document.getElementById("modal-overlay");
    const body = document.getElementById("modal-body");

    body.innerHTML = `
      <div class="modal-header">
        <h3 style="font-size:14px;font-weight:700;text-transform:uppercase;">Sign In - Palvi Admin</h3>
      </div>
      <div style="padding:20px;display:flex;flex-direction:column;gap:14px;">
        <div>
          <label style="font-size:11px;font-weight:600;text-transform:uppercase;color:var(--text-secondary);display:block;margin-bottom:6px;">Password</label>
          <input type="password" id="login-pass-input" class="input" placeholder="Enter admin password..." onkeydown="if(event.key==='Enter') app.login()">
        </div>
      </div>
      <div class="modal-footer" style="display:flex;justify-content:flex-end;gap:10px;padding:14px 20px;border-top:1px solid var(--border-subtle);">
        <button class="btn btn-primary btn-sm" onclick="app.login()">Sign In</button>
      </div>
    `;

    overlay.style.display = "flex";
    setTimeout(() => {
      const inp = document.getElementById("login-pass-input");
      if (inp) inp.focus();
    }, 100);
  },

  showSetupModal() {
    const overlay = document.getElementById("modal-overlay");
    const body = document.getElementById("modal-body");

    body.innerHTML = `
      <div class="modal-header">
        <h3 style="font-size:14px;font-weight:700;text-transform:uppercase;">Initial Admin Setup</h3>
      </div>
      <div style="padding:20px;display:flex;flex-direction:column;gap:14px;">
        <p style="font-size:12.5px;color:var(--text-secondary);line-height:1.5;">
          Set up the administrator password for mcadmin.palvi.org. This password is hashed with Argon2id.
        </p>
        <div>
          <label style="font-size:11px;font-weight:600;text-transform:uppercase;color:var(--text-secondary);display:block;margin-bottom:6px;">Create Password</label>
          <input type="password" id="setup-pass-input" class="input" placeholder="Create strong admin password...">
        </div>
      </div>
      <div class="modal-footer" style="display:flex;justify-content:flex-end;gap:10px;padding:14px 20px;border-top:1px solid var(--border-subtle);">
        <button class="btn btn-primary btn-sm" onclick="app.setupPassword()">Save Password</button>
      </div>
    `;

    overlay.style.display = "flex";
  },

  async login() {
    const input = document.getElementById("login-pass-input");
    const pass = input ? input.value : "";
    if (!pass) return;

    try {
      const res = await API.request("/api/auth/login", {
        method: "POST",
        body: { password: pass }
      });
      API.csrfToken = res.csrf_token;
      API.sessionToken = res.session_token || null;
      if (res.session_token) {
        localStorage.setItem("mcadmin_token", res.session_token);
      }
      this.closeModal();
      this.state.authenticated = true;
      this.startDashboard();
    } catch (e) {
      alert("Sign in failed: " + e.message);
    }
  },

  async setupPassword() {
    const input = document.getElementById("setup-pass-input");
    const pass = input ? input.value : "";
    if (!pass) return;

    try {
      const res = await API.request("/api/auth/setup", {
        method: "POST",
        body: { password: pass }
      });
      API.csrfToken = res.csrf_token;
      API.sessionToken = res.session_token || null;
      if (res.session_token) {
        localStorage.setItem("mcadmin_token", res.session_token);
      }
      this.closeModal();
      this.state.authenticated = true;
      this.startDashboard();
    } catch (e) {
      alert("Setup failed: " + e.message);
    }
  },

  async logout() {
    try {
      await API.request("/api/auth/logout", { method: "POST" });
    } catch (e) { }
    localStorage.removeItem("mcadmin_token");
    location.reload();
  },

  render() {
    const root = document.getElementById("app-root");
    root.innerHTML = `
      <div id="sidebar-backdrop" onclick="app.closeMobileSidebar()"></div>

      <aside id="sidebar">
        <div id="sidebar-top">
          <div class="sidebar-brand">
            <div class="brand-icon">MC</div>
            <div class="brand-info">
              <span class="brand-name">PalviServer</span>
              <span class="brand-sub">mcadmin.palvi.org</span>
            </div>
          </div>

          <div class="sidebar-status-pill">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:11px;font-weight:600;text-transform:uppercase;" id="sidebar-state-text">-</span>
            </div>
            <span style="font-size:11px;color:var(--text-muted);" id="sidebar-player-count">-</span>
          </div>

          <button class="sidebar-nav-item active" data-tab="server" onclick="app.setTab('server')">
            ${ICONS.server}
            <span>Server</span>
          </button>
          <button class="sidebar-nav-item" data-tab="properties" onclick="app.setTab('properties')">
            ${ICONS.properties}
            <span>Server Properties</span>
          </button>
          <button class="sidebar-nav-item" data-tab="console" onclick="app.setTab('console')">
            ${ICONS.console}
            <span>Console</span>
          </button>
          <button class="sidebar-nav-item" data-tab="log" onclick="app.setTab('log')">
            ${ICONS.log}
            <span>Log</span>
          </button>
          <button class="sidebar-nav-item" data-tab="players" onclick="app.setTab('players')">
            ${ICONS.players}
            <span>Players</span>
          </button>
          <button class="sidebar-nav-item" data-tab="software" onclick="app.setTab('software')">
            ${ICONS.software}
            <span>Software</span>
          </button>
          <button class="sidebar-nav-item" data-tab="mods" onclick="app.setTab('mods')">
            ${ICONS.mods}
            <span>Mods</span>
          </button>
          <button class="sidebar-nav-item" data-tab="files" onclick="app.setTab('files')">
            ${ICONS.files}
            <span>Files</span>
          </button>
          <button class="sidebar-nav-item" data-tab="worlds" onclick="app.setTab('worlds')">
            ${ICONS.worlds}
            <span>Worlds</span>
          </button>
          <button class="sidebar-nav-item" data-tab="backups" onclick="app.setTab('backups')">
            ${ICONS.backups}
            <span>Backups</span>
          </button>
          <button class="sidebar-nav-item" data-tab="access" onclick="app.setTab('access')">
            ${ICONS.access}
            <span>Access</span>
          </button>
        </div>

        <div id="sidebar-footer">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:12px;color:var(--text-secondary);font-weight:500;">admin</span>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="app.logout()">${ICONS.logout} Sign Out</button>
        </div>
      </aside>

      <div id="content-area">
        <header id="topbar">
          <div style="display:flex;align-items:center;gap:12px;">
            <button id="sidebar-toggle-btn" onclick="app.toggleMobileSidebar()">${ICONS.menu}</button>
            <div class="topbar-title" id="topbar-view-title">Server Overview</div>
          </div>

          <div class="topbar-actions">
            <div class="theme-switch-group">
              <button class="theme-btn ${this.state.theme === 'dark' ? 'active' : ''}" data-theme="dark" onclick="app.setTheme('dark')">Dark</button>
              <button class="theme-btn ${this.state.theme === 'medium-dark' ? 'active' : ''}" data-theme="medium-dark" onclick="app.setTheme('medium-dark')">Mid</button>
              <button class="theme-btn ${this.state.theme === 'light' ? 'active' : ''}" data-theme="light" onclick="app.setTheme('light')">Light</button>
            </div>

            <div class="live-beacon">
              <span id="topbar-beacon-text">CHECKING</span>
            </div>
            <div style="font-size:12px;color:var(--text-secondary);margin-right:8px;">
              Standby: <span id="topbar-idle-timer" style="color:var(--text-primary);font-weight:600;">-</span>
            </div>
          </div>
        </header>

        <main id="main-content"></main>
      </div>

      <div id="modal-overlay" class="modal-overlay" style="display:none;">
        <div id="modal-body" class="modal-content"></div>
      </div>
    `;
  },

  escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  },

  formatSeconds(sec) {
    if (sec === null || sec === undefined) return "-";
    if (sec <= 0) return "Standby";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }
};

window.addEventListener("DOMContentLoaded", () => {
  app.init();
});
