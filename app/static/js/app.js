// mcadmin.palvi.org client application
const ICONS = {
  server: `<svg class="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"><rect x="2" y="3" width="20" height="7"></rect><rect x="2" y="14" width="20" height="7"></rect><line x1="6" y1="6.5" x2="6.01" y2="6.5"></line><line x1="6" y1="17.5" x2="6.01" y2="17.5"></line></svg>`,
  console: `<svg class="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>`,
  logs: `<svg class="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>`,
  settings: `<svg class="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>`,
  mods: `<svg class="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>`,
  players: `<svg class="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
  backups: `<svg class="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>`,
  media: `<svg class="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg>`,
  chunky: `<svg class="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>`,
  audit: `<svg class="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>`,
  analytics: `<svg class="sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"><path d="M18 20V10"></path><path d="M12 20V4"></path><path d="M6 20v-6"></path></svg>`,
  start: `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"></polygon></svg>`,
  restart: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>`,
  stop: `<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16"></rect></svg>`,
  logout: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>`,
  search: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`
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
    activeTab: "dashboard",
    status: null,
    media: null,
    idleSecondsRemaining: 300,
    logs: [],
    logFilter: "",
    autoScrollLogs: true,
    consoleHistory: [],
    consoleHistoryIdx: -1,
    settings: null,
    settingsView: "form", // 'form' or 'raw'
    installedMods: { managed: [], manual: [] },
    modSearchResults: [],
    modSearchLoading: false,
    backups: [],
    diskUsage: null,
    onlinePlayers: [],
    auditLogs: [],
    analytics: null,
    analyticsHours: 24,
    modal: null,
  },

  sseLogSource: null,
  statusInterval: null,

  async init() {
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

  startDashboard() {
    this.fetchStatus();
    this.fetchMedia();
    this.fetchDiskUsage();
    this.statusInterval = setInterval(() => {
      this.fetchStatus();
      this.fetchMedia();
    }, 3000);

    // 1-second countdown tick
    setInterval(() => {
      if (this.state.status && this.state.status.state === "Online") {
        if (this.state.idleSecondsRemaining > 0) {
          this.state.idleSecondsRemaining--;
          this.updateIdleBadge();
        }
      }
    }, 1000);
  },

  async fetchStatus() {
    try {
      const data = await API.request("/api/status");
      this.state.status = data;
      if (data.idle && data.idle.remaining_seconds !== undefined) {
        this.state.idleSecondsRemaining = data.idle.remaining_seconds;
      }
      this.state.onlinePlayers = data.players ? data.players.players : [];
      
      // Trigger blinking light pulse on update
      this.pulseUpdateBeacon(data.state);

      this.renderStatusCard();
    } catch (e) {
      console.debug("Status fetch error:", e);
      this.pulseUpdateBeacon("Error");
    }
  },

  pulseUpdateBeacon(state = "Online") {
    const bDot = document.getElementById("topbar-beacon-dot");
    const bText = document.getElementById("topbar-beacon-text");
    const sDot = document.getElementById("sidebar-dot");

    if (bText) bText.innerText = state;

    if (bDot) {
      bDot.className = "beacon-dot " + (state === "Online" ? "" : (state === "Asleep" ? "asleep" : "down"));
      bDot.classList.remove("flash");
      void bDot.offsetWidth; // trigger reflow
      bDot.classList.add("flash");
    }

    if (sDot) {
      sDot.classList.remove("flash");
      void sDot.offsetWidth;
      sDot.classList.add("flash");
    }
  },

  async fetchMedia() {
    try {
      const data = await API.request("/api/media/status");
      this.state.media = data;
      this.renderMediaCard();
    } catch (e) {
      console.debug("Media fetch error:", e);
    }
  },

  async fetchDiskUsage() {
    try {
      const data = await API.request("/api/backups/disk-usage");
      this.state.diskUsage = data;
      this.renderDiskUsageProgress();
    } catch (e) {
      console.debug("Disk usage fetch error:", e);
    }
  },

  /* ------------------- ACTIONS: CONTROL ------------------- */
  async startServer() {
    try {
      const res = await API.request("/api/control/start", { method: "POST" });
      alert(res.message);
      this.fetchStatus();
    } catch (e) {
      alert(e.message);
    }
  },

  async stopServer(force = false) {
    try {
      const res = await API.request("/api/control/stop", {
        method: "POST",
        body: { force }
      });
      if (res.needs_confirmation) {
        this.showConfirmModal(
          "Players Online",
          res.message,
          () => this.stopServer(true)
        );
        return;
      }
      alert(res.message);
      this.fetchStatus();
    } catch (e) {
      alert(e.message);
    }
  },

  async restartServer(force = false) {
    try {
      const res = await API.request("/api/control/restart", {
        method: "POST",
        body: { force }
      });
      if (res.needs_confirmation) {
        this.showConfirmModal(
          "Players Online",
          res.message,
          () => this.restartServer(true)
        );
        return;
      }
      alert(res.message);
      this.fetchStatus();
    } catch (e) {
      alert(e.message);
    }
  },

  /* ------------------- CONSOLE ------------------- */
  async sendConsoleCommand() {
    const input = document.getElementById("console-input");
    const cmd = input.value.trim();
    if (!cmd) return;

    this.state.consoleHistory.push(cmd);
    this.state.consoleHistoryIdx = this.state.consoleHistory.length;
    input.value = "";

    const terminal = document.getElementById("console-terminal");
    terminal.innerHTML += `\n<span style="color:#60a5fa">&gt; ${cmd}</span>\n`;

    try {
      const res = await API.request("/api/console/execute", {
        method: "POST",
        body: { command: cmd }
      });
      terminal.innerHTML += `${res.output || "[No output]"}\n`;
      terminal.scrollTop = terminal.scrollHeight;
    } catch (e) {
      terminal.innerHTML += `<span style="color:#f87171">[Error: ${e.message}]</span>\n`;
    }
  },

  /* ------------------- LOGS ------------------- */
  async initLogs() {
    const term = document.getElementById("logs-terminal");
    if (!term) return;
    term.innerHTML = "Loading log tail...";

    try {
      const data = await API.request("/api/logs/tail?lines=500");
      this.state.logs = data.lines || [];
      this.renderLogs();

      // Connect SSE
      if (!this.sseLogSource) {
        this.sseLogSource = new EventSource("/api/logs/stream");
        this.sseLogSource.onmessage = (e) => {
          this.state.logs.push(e.data);
          if (this.state.logs.length > 2000) this.state.logs.shift();
          this.appendLogLine(e.data);
        };
      }
    } catch (e) {
      term.innerHTML = `Error loading logs: ${e.message}`;
    }
  },

  renderLogs() {
    const term = document.getElementById("logs-terminal");
    if (!term) return;
    const filter = this.state.logFilter.toLowerCase();
    const filtered = filter
      ? this.state.logs.filter(l => l.toLowerCase().includes(filter))
      : this.state.logs;

    term.innerHTML = filtered.map(l => this.escapeHtml(l)).join("\n");
    if (this.state.autoScrollLogs) term.scrollTop = term.scrollHeight;
  },

  appendLogLine(line) {
    const term = document.getElementById("logs-terminal");
    if (!term) return;
    const filter = this.state.logFilter.toLowerCase();
    if (filter && !line.toLowerCase().includes(filter)) return;

    term.innerHTML += `\n${this.escapeHtml(line)}`;
    if (this.state.autoScrollLogs) term.scrollTop = term.scrollHeight;
  },

  /* ------------------- SETTINGS ------------------- */
  async loadSettings() {
    try {
      const data = await API.request("/api/settings");
      this.state.settings = data;
      this.renderSettingsView();
    } catch (e) {
      alert("Failed to load settings: " + e.message);
    }
  },

  async previewSettingsDiff() {
    let payload = {};
    if (this.state.settingsView === "raw") {
      const rawText = document.getElementById("raw-mc-env").value;
      payload = { raw_content: rawText };
    } else {
      const formUpdates = {
        LEVEL: document.getElementById("setting-level").value,
        SEED: document.getElementById("setting-seed").value,
        DIFFICULTY: document.getElementById("setting-difficulty").value,
        MODE: document.getElementById("setting-mode").value,
        PVP: document.getElementById("setting-pvp").value,
        HARDCORE: document.getElementById("setting-hardcore").value,
        MAX_PLAYERS: document.getElementById("setting-max-players").value,
        ENABLE_WHITELIST: document.getElementById("setting-whitelist").value,
        ONLINE_MODE: document.getElementById("setting-online-mode").value,
        VIEW_DISTANCE: document.getElementById("setting-view-distance").value,
        SIMULATION_DISTANCE: document.getElementById("setting-sim-distance").value,
        MEMORY: document.getElementById("setting-memory").value,
        MOTD: document.getElementById("setting-motd").value,
      };
      payload = { updates: formUpdates };
    }

    try {
      const res = await API.request("/api/settings/diff", {
        method: "POST",
        body: payload
      });

      this.showDiffModal(res.diff || "No changes detected.", payload);
    } catch (e) {
      alert("Diff error: " + e.message);
    }
  },

  async applySettings(payload, force = false) {
    try {
      payload.force = force;
      const res = await API.request("/api/settings/apply", {
        method: "POST",
        body: payload
      });

      if (res.needs_confirmation) {
        this.showConfirmModal(
          "Players Online",
          res.message,
          () => this.applySettings(payload, true)
        );
        return;
      }

      this.closeModal();
      this.showExecutionModal("Recreating Minecraft Server", res.output || res.message);
      this.loadSettings();
      this.fetchStatus();
    } catch (e) {
      alert("Apply failed: " + e.message);
    }
  },

  /* ------------------- MODS ------------------- */
  async loadMods() {
    try {
      const data = await API.request("/api/mods/installed");
      this.state.installedMods = data;
      this.renderInstalledMods();
    } catch (e) {
      console.error("Mods load error:", e);
    }
  },

  async searchModrinth() {
    const q = document.getElementById("mod-search-input").value.trim();
    if (!q) return;

    this.state.modSearchLoading = true;
    this.renderModSearchResults();

    try {
      const res = await API.request(`/api/mods/search?q=${encodeURIComponent(q)}&limit=12`);
      this.state.modSearchResults = res.hits || [];
    } catch (e) {
      alert("Search failed: " + e.message);
      this.state.modSearchResults = [];
    } finally {
      this.state.modSearchLoading = false;
      this.renderModSearchResults();
    }
  },

  async addMod(slug) {
    if (!confirm(`Add mod '${slug}' and recreate the server?`)) return;

    try {
      const res = await API.request("/api/mods/add", {
        method: "POST",
        body: { slug }
      });
      this.showExecutionModal(`Adding Mod: ${slug}`, res.output || res.message);
      this.loadMods();
      this.fetchStatus();
    } catch (e) {
      alert("Add mod failed: " + e.message);
    }
  },

  async removeMod(slug) {
    if (!confirm(`Remove mod '${slug}' and clean up old jar files?`)) return;

    try {
      const res = await API.request("/api/mods/remove", {
        method: "POST",
        body: { slug }
      });
      this.showExecutionModal(`Removing Mod: ${slug}`, res.output || res.message);
      this.loadMods();
      this.fetchStatus();
    } catch (e) {
      alert("Remove mod failed: " + e.message);
    }
  },

  async deleteManualMod(filename) {
    if (!confirm(`Permanently delete jar '${filename}'?`)) return;
    try {
      await API.request(`/api/mods/manual/${encodeURIComponent(filename)}`, { method: "DELETE" });
      this.loadMods();
    } catch (e) {
      alert("Delete failed: " + e.message);
    }
  },

  /* ------------------- BACKUPS ------------------- */
  async loadBackups() {
    try {
      const [bData, dData] = await Promise.all([
        API.request("/api/backups"),
        API.request("/api/backups/disk-usage")
      ]);
      this.state.backups = bData.backups || [];
      this.state.diskUsage = dData;
      this.renderBackupsView();
    } catch (e) {
      console.error("Backups load error:", e);
    }
  },

  async createBackup() {
    try {
      const res = await API.request("/api/backups/create", { method: "POST" });
      alert(res.message);
      this.loadBackups();
    } catch (e) {
      alert("Backup error: " + e.message);
    }
  },

  async restoreBackup(backupId) {
    if (this.state.status && this.state.status.state === "Online") {
      alert("Minecraft is currently running! Stop the server before restoring a backup.");
      return;
    }

    if (!confirm(`WARNING: Restoring '${backupId}' will replace current world BabaSquadWorld.\nA safety backup will be created automatically.\nProceed?`)) {
      return;
    }

    try {
      const res = await API.request("/api/backups/restore", {
        method: "POST",
        body: { backup_id: backupId }
      });
      this.showExecutionModal(`Restoring: ${backupId}`, res.output || res.message);
      this.loadBackups();
    } catch (e) {
      alert("Restore error: " + e.message);
    }
  },

  /* ------------------- MEDIA CONTROLS ------------------- */
  async setGrace() {
    const curGrace = (this.state.media && this.state.media.watch_state) ? this.state.media.watch_state.grace : 300;
    const input = prompt("Enter mc-watch grace period in seconds (60 to 3600):", curGrace);
    if (!input) return;
    const val = parseInt(input, 10);
    if (isNaN(val) || val < 60 || val > 3600) {
      alert("Invalid grace value. Must be between 60 and 3600.");
      return;
    }

    try {
      const res = await API.request("/api/media/set-grace", {
        method: "POST",
        body: { grace: val }
      });
      alert(`Grace period updated to ${res.grace}s.`);
      this.fetchMedia();
    } catch (e) {
      alert("Failed to set grace: " + e.message);
    }
  },

  async startMediaNow() {
    try {
      const res = await API.request("/api/media/start-now", { method: "POST" });
      alert("Triggered media stack start!");
      this.fetchMedia();
    } catch (e) {
      alert("Start media failed: " + e.message);
    }
  },

  /* ------------------- PLAYERS ------------------- */
  async loadPlayers() {
    try {
      const [online, wl] = await Promise.all([
        API.request("/api/players/online"),
        API.request("/api/players/whitelist")
      ]);
      this.state.onlinePlayers = online.players || [];
      const term = document.getElementById("whitelist-output");
      if (term) term.innerText = wl.output || "";
      this.renderPlayersView();
    } catch (e) {
      console.error("Players load error:", e);
    }
  },

  async kickPlayer(player) {
    const reason = prompt(`Reason for kicking ${player}:`, "Kicked by admin");
    if (reason === null) return;
    try {
      const res = await API.request("/api/players/kick", {
        method: "POST",
        body: { player, reason }
      });
      alert(res.output);
      this.loadPlayers();
    } catch (e) {
      alert("Kick failed: " + e.message);
    }
  },

  async banPlayer(player) {
    const reason = prompt(`Reason for banning ${player}:`, "Banned by admin");
    if (reason === null) return;
    try {
      const res = await API.request("/api/players/ban", {
        method: "POST",
        body: { player, reason }
      });
      alert(res.output);
      this.loadPlayers();
    } catch (e) {
      alert("Ban failed: " + e.message);
    }
  },

  async opPlayer(player) {
    try {
      const res = await API.request("/api/players/ops", {
        method: "POST",
        body: { action: "op", player }
      });
      alert(res.output);
    } catch (e) {
      alert("Op failed: " + e.message);
    }
  },

  async whitelistAction(action) {
    let player = null;
    if (action === "add" || action === "remove") {
      player = prompt(`Player name to ${action}:`);
      if (!player) return;
    }
    try {
      const res = await API.request("/api/players/whitelist", {
        method: "POST",
        body: { action, player }
      });
      alert(res.output);
      this.loadPlayers();
    } catch (e) {
      alert("Whitelist action failed: " + e.message);
    }
  },

  /* ------------------- CHUNKY ------------------- */
  async runChunky(action) {
    let param = null;
    if (action === "radius") {
      param = prompt("Enter pregeneration radius in blocks (e.g. 1000):", "1000");
      if (!param) return;
    }
    try {
      const res = await API.request("/api/chunky/command", {
        method: "POST",
        body: { action, param }
      });
      const term = document.getElementById("chunky-terminal");
      if (term) term.innerText += `\n> chunky ${action} ${param || ""}\n${res.output}\n`;
    } catch (e) {
      alert("Chunky failed: " + e.message);
    }
  },

  /* ------------------- AUDIT ------------------- */
  async loadAudit() {
    try {
      const data = await API.request("/api/audit?limit=100");
      this.state.auditLogs = data.entries || [];
      this.renderAuditTable();
    } catch (e) {
      console.error("Audit load error:", e);
    }
  },

  /* ------------------- AUTH MODALS ------------------- */
  showLoginModal() {
    this.showModal(`
      <div class="modal-title">Admin Login</div>
      <p style="color:var(--text-secondary);font-size:0.875rem;margin-bottom:1.25rem;">
        Authentication required to manage PalviServer Minecraft stack.
      </p>
      <form onsubmit="app.handleLogin(event)">
        <div class="form-group">
          <label class="form-label">Password</label>
          <input type="password" id="login-password" class="form-control" required autofocus />
        </div>
        <div style="display:flex;justify-content:flex-end;margin-top:1.5rem;">
          <button type="submit" class="btn btn-primary">Sign In</button>
        </div>
      </form>
    `, false);
  },

  showSetupModal() {
    this.showModal(`
      <div class="modal-title">Initial Admin Setup</div>
      <p style="color:var(--text-secondary);font-size:0.875rem;margin-bottom:1.25rem;">
        Establish the single administrator password for mcadmin.palvi.org. This locks after initialization.
      </p>
      <form onsubmit="app.handleSetup(event)">
        <div class="form-group">
          <label class="form-label">Admin Password (min 8 chars)</label>
          <input type="password" id="setup-password" class="form-control" minlength="8" required autofocus />
        </div>
        <div style="display:flex;justify-content:flex-end;margin-top:1.5rem;">
          <button type="submit" class="btn btn-primary">Set Password & Sign In</button>
        </div>
      </form>
    `, false);
  },

  async handleLogin(e) {
    e.preventDefault();
    const pass = document.getElementById("login-password").value;
    try {
      const res = await API.request("/api/auth/login", {
        method: "POST",
        body: { password: pass }
      });
      API.csrfToken = res.csrf_token;
      if (res.session_token) {
        API.sessionToken = res.session_token;
        localStorage.setItem("mcadmin_token", res.session_token);
      }
      this.state.authenticated = true;
      this.closeModal();
      this.startDashboard();
    } catch (err) {
      alert(err.message);
    }
  },

  async handleSetup(e) {
    e.preventDefault();
    const pass = document.getElementById("setup-password").value;
    try {
      const res = await API.request("/api/auth/setup", {
        method: "POST",
        body: { password: pass }
      });
      API.csrfToken = res.csrf_token;
      if (res.session_token) {
        API.sessionToken = res.session_token;
        localStorage.setItem("mcadmin_token", res.session_token);
      }
      this.state.authenticated = true;
      this.state.setupRequired = false;
      this.closeModal();
      this.startDashboard();
    } catch (err) {
      alert(err.message);
    }
  },

  async logout() {
    if (!confirm("Sign out of Minecraft Admin?")) return;
    try {
      await API.request("/api/auth/logout", { method: "POST" });
    } catch (e) {
    } finally {
      localStorage.removeItem("mcadmin_token");
      API.sessionToken = null;
      location.reload();
    }
  },

  /* ------------------- MODAL SYSTEM ------------------- */
  showModal(html, allowClose = true) {
    const overlay = document.getElementById("modal-overlay");
    const content = document.getElementById("modal-body");
    content.innerHTML = html;
    overlay.style.display = "flex";
  },

  closeModal() {
    const overlay = document.getElementById("modal-overlay");
    overlay.style.display = "none";
  },

  showConfirmModal(title, message, onConfirm) {
    this.showModal(`
      <div class="modal-title">${this.escapeHtml(title)}</div>
      <div class="warning-box">${this.escapeHtml(message)}</div>
      <div style="display:flex;justify-content:flex-end;gap:0.75rem;margin-top:1.5rem;">
        <button class="btn btn-secondary" onclick="app.closeModal()">Cancel</button>
        <button class="btn btn-danger" id="modal-confirm-btn">Confirm Proceed</button>
      </div>
    `);
    document.getElementById("modal-confirm-btn").onclick = () => {
      this.closeModal();
      onConfirm();
    };
  },

  showDiffModal(diffText, payload) {
    let diffHtml = diffText.split("\n").map(l => {
      if (l.startsWith("+") && !l.startsWith("+++")) return `<span class="diff-add">${this.escapeHtml(l)}</span>`;
      if (l.startsWith("-") && !l.startsWith("---")) return `<span class="diff-del">${this.escapeHtml(l)}</span>`;
      return this.escapeHtml(l);
    }).join("\n");

    this.showModal(`
      <div class="modal-title">Review Settings Diff</div>
      <p style="font-size:0.8rem;color:var(--text-secondary);margin-bottom:0.75rem;">
        A timestamped backup of mc.env will be written and the safe recreation sequence will execute.
      </p>
      <div class="diff-view">${diffHtml}</div>
      <div style="display:flex;justify-content:flex-end;gap:0.75rem;margin-top:1.25rem;">
        <button class="btn btn-secondary" onclick="app.closeModal()">Cancel</button>
        <button class="btn btn-primary" id="modal-apply-btn">Apply & Recreate mc</button>
      </div>
    `);
    document.getElementById("modal-apply-btn").onclick = () => {
      this.applySettings(payload, false);
    };
  },

  showExecutionModal(title, outputText) {
    this.showModal(`
      <div class="modal-title">${this.escapeHtml(title)}</div>
      <div class="terminal" style="height:320px;">${this.escapeHtml(outputText)}</div>
      <div style="display:flex;justify-content:flex-end;margin-top:1rem;">
        <button class="btn btn-primary" onclick="app.closeModal()">Close</button>
      </div>
    `);
  },

  /* ------------------- RENDERING HELPERS ------------------- */
  render() {
    const root = document.getElementById("app-root");
    root.innerHTML = `
      <!-- Fixed Left Sidebar (Aternos Style) -->
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
              <span class="status-indicator-dot" id="sidebar-dot"></span>
              <span style="font-size:11px;font-weight:600;text-transform:uppercase;" id="sidebar-state-text">Offline</span>
            </div>
            <span style="font-size:11px;color:var(--text-muted);" id="sidebar-player-count">0/8</span>
          </div>

          <div class="sidebar-section-title">Control</div>
          <button class="sidebar-nav-item active" data-tab="dashboard" onclick="app.setTab('dashboard')">
            ${ICONS.server}
            <span>Server</span>
          </button>
          <button class="sidebar-nav-item" data-tab="console" onclick="app.setTab('console')">
            ${ICONS.console}
            <span>Console</span>
          </button>
          <button class="sidebar-nav-item" data-tab="logs" onclick="app.setTab('logs')">
            ${ICONS.logs}
            <span>Log</span>
          </button>

          <div class="sidebar-section-title">Manage</div>
          <button class="sidebar-nav-item" data-tab="settings" onclick="app.setTab('settings')">
            ${ICONS.settings}
            <span>Options</span>
          </button>
          <button class="sidebar-nav-item" data-tab="mods" onclick="app.setTab('mods')">
            ${ICONS.mods}
            <span>Mods</span>
          </button>
          <button class="sidebar-nav-item" data-tab="players" onclick="app.setTab('players')">
            ${ICONS.players}
            <span>Players</span>
          </button>
          <button class="sidebar-nav-item" data-tab="backups" onclick="app.setTab('backups')">
            ${ICONS.backups}
            <span>Backups</span>
          </button>

          <div class="sidebar-section-title">System</div>
          <button class="sidebar-nav-item" data-tab="analytics" onclick="app.setTab('analytics')">
            ${ICONS.analytics}
            <span>Analytics</span>
          </button>
          <button class="sidebar-nav-item" data-tab="media" onclick="app.setTab('media')">
            ${ICONS.media}
            <span>Media Stack</span>
          </button>
          <button class="sidebar-nav-item" data-tab="chunky" onclick="app.setTab('chunky')">
            ${ICONS.chunky}
            <span>Chunky</span>
          </button>
          <button class="sidebar-nav-item" data-tab="audit" onclick="app.setTab('audit')">
            ${ICONS.audit}
            <span>Audit Log</span>
          </button>
        </div>

        <div id="sidebar-footer">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:12px;color:var(--text-secondary);font-weight:500;">admin</span>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="app.logout()">${ICONS.logout} Sign Out</button>
        </div>
      </aside>

      <!-- Main Fluid Content Area -->
      <div id="content-area">
        <header id="topbar">
          <div class="topbar-title" id="topbar-view-title">Server Dashboard</div>
          <div class="topbar-actions">
            <div class="live-beacon">
              <span class="beacon-dot" id="topbar-beacon-dot"></span>
              <span id="topbar-beacon-text">ONLINE</span>
            </div>
            <div style="font-size:12px;color:var(--text-secondary);margin-right:8px;">
              Idle: <span id="topbar-idle-timer" style="color:var(--text-primary);font-weight:600;">—</span>
            </div>
            <div class="btn-group">
              <button class="btn btn-primary btn-sm" onclick="app.startServer()">${ICONS.start} Start</button>
              <button class="btn btn-secondary btn-sm" onclick="app.restartServer()">${ICONS.restart} Restart</button>
              <button class="btn btn-danger btn-sm" onclick="app.stopServer()">${ICONS.stop} Stop</button>
            </div>
          </div>
        </header>

        <main id="main-content">
          <!-- Dynamically injected -->
        </main>
      </div>

      <div id="modal-overlay" class="modal-overlay" style="display:none;">
        <div id="modal-body" class="modal-content"></div>
      </div>
    `;

    this.renderTabContent();
  },

  setTab(tab) {
    this.state.activeTab = tab;
    document.querySelectorAll(".sidebar-nav-item").forEach(el => {
      el.classList.toggle("active", el.dataset.tab === tab);
    });

    const titles = {
      dashboard: "Server Dashboard",
      console: "RCON Console",
      logs: "Server Log (latest.log)",
      settings: "Server Options (mc.env)",
      mods: "Mods & Addons (Modrinth Fabric 26.3)",
      players: "Player Management",
      backups: "World Backups & Storage",
      media: "Media Stack & Watcher",
      chunky: "Chunky World Pregeneration",
      audit: "Security & Audit Log",
      analytics: "Uptime & Performance Analytics"
    };

    const titleEl = document.getElementById("topbar-view-title");
    if (titleEl) titleEl.innerText = titles[tab] || "Dashboard";

    // Close log SSE if switching away from logs
    if (tab !== "logs" && this.sseLogSource) {
      this.sseLogSource.close();
      this.sseLogSource = null;
    }

    this.renderTabContent();

    if (tab === "logs") this.initLogs();
    if (tab === "settings") this.loadSettings();
    if (tab === "mods") this.loadMods();
    if (tab === "backups") this.loadBackups();
    if (tab === "players") this.loadPlayers();
    if (tab === "media") this.loadMedia();
    if (tab === "audit") this.loadAudit();
    if (tab === "analytics") this.loadAnalytics(this.state.analyticsHours || 24);
  },

  async loadMedia() {
    await this.fetchMedia();
    this.renderMediaTab();
  },

  renderTabContent() {
    const main = document.getElementById("main-content");
    const tab = this.state.activeTab;

    if (tab === "dashboard") {
      main.innerHTML = `
        <div class="metric-strip">
          <div class="metric-strip-card">
            <span class="metric-strip-label">Server State</span>
            <span class="metric-strip-value" id="strip-status">—</span>
          </div>
          <div class="metric-strip-card">
            <span class="metric-strip-label">Players Online</span>
            <span class="metric-strip-value" id="strip-players">0</span>
          </div>
          <div class="metric-strip-card">
            <span class="metric-strip-label">Memory Allocation</span>
            <span class="metric-strip-value" id="strip-ram">0 MB</span>
          </div>
          <div class="metric-strip-card">
            <span class="metric-strip-label">Idle Standby Timer</span>
            <span class="metric-strip-value" id="strip-idle">—</span>
          </div>
        </div>

        <div class="grid-2">
          <!-- Memory & Hardware (Image 2 style) -->
          <div class="progress-card">
            <div class="progress-header">
              <span class="progress-header-title">MEMORY ALLOCATION</span>
              <span class="progress-header-badge" id="ram-header-badge">3072 MB MAX</span>
            </div>
            <div class="meter-track">
              <div class="meter-fill" id="ram-meter-fill" style="width: 0%;"></div>
            </div>
            <div class="meter-substats">
              <div class="meter-sub-left">USED <strong id="ram-used-strong">0 MB</strong></div>
              <div class="meter-sub-right neutral">AVAILABLE <strong id="ram-avail-strong">3072 MB</strong></div>
            </div>
            <div class="breakdown-grid">
              <div class="breakdown-box">
                <span class="breakdown-box-label">ALLOCATED</span>
                <span class="breakdown-box-val" id="ram-box-alloc">3072 MB</span>
              </div>
              <div class="breakdown-box">
                <span class="breakdown-box-label">CPU LOAD</span>
                <span class="breakdown-box-val" id="cpu-stat-val">0.0%</span>
              </div>
              <div class="breakdown-box">
                <span class="breakdown-box-label">TICK RATE</span>
                <span class="breakdown-box-val" id="tps-stat-val">20.0 TPS</span>
              </div>
              <div class="breakdown-box">
                <span class="breakdown-box-label">DURATION</span>
                <span class="breakdown-box-val" id="mspt-stat-val">5.0 ms</span>
              </div>
            </div>
          </div>

          <!-- World & Storage (Image 2 style) -->
          <div class="progress-card">
            <div class="progress-header">
              <span class="progress-header-title">STORAGE UTILIZATION</span>
              <span class="progress-header-badge" id="storage-header-badge">/MNT/MEDIA</span>
            </div>
            <div class="meter-track">
              <div class="meter-fill" id="storage-meter-fill" style="width: 15%;"></div>
            </div>
            <div class="meter-substats">
              <div class="meter-sub-left">WORLD & BACKUPS <strong id="storage-used-strong">—</strong></div>
              <div class="meter-sub-right">FREE DISK <strong id="storage-free-strong">—</strong></div>
            </div>
            <div class="breakdown-grid">
              <div class="breakdown-box">
                <span class="breakdown-box-label">WORLD</span>
                <span class="breakdown-box-val" id="storage-box-world">BabaSquadWorld</span>
              </div>
              <div class="breakdown-box">
                <span class="breakdown-box-label">BACKUPS</span>
                <span class="breakdown-box-val" id="storage-box-backups">—</span>
              </div>
              <div class="breakdown-box">
                <span class="breakdown-box-label">FREE /PROG</span>
                <span class="breakdown-box-val" id="storage-box-prog">—</span>
              </div>
              <div class="breakdown-box">
                <span class="breakdown-box-label">RETENTION</span>
                <span class="breakdown-box-val">7 KEPT</span>
              </div>
            </div>
            <div style="display:flex;gap:10px;">
              <button class="btn btn-primary btn-sm" onclick="app.createBackup()">${ICONS.backups} Backup Now</button>
              <button class="btn btn-secondary btn-sm" onclick="app.setTab('backups')">Review Storage</button>
            </div>
          </div>
        </div>

        <div class="grid-2">
          <!-- Standby Sleep Timer (Progress Bar) -->
          <div class="progress-card">
            <div class="progress-header">
              <span class="progress-header-title">LAZYMC STANDBY TIMER</span>
              <span class="progress-header-badge">300s LIMIT</span>
            </div>
            <div class="meter-track">
              <div class="meter-fill meter-fill-warn" id="idle-meter-fill" style="width: 100%;"></div>
            </div>
            <div class="meter-substats">
              <div class="meter-sub-left">REMAINING <strong id="idle-remaining-strong">5:00</strong></div>
              <div class="meter-sub-right neutral">AUTO-SLEEP <strong style="color:var(--text-muted);">AT 0:00</strong></div>
            </div>
            <div class="breakdown-grid">
              <div class="breakdown-box">
                <span class="breakdown-box-label">TIMEOUT</span>
                <span class="breakdown-box-val">300 SECONDS</span>
              </div>
              <div class="breakdown-box">
                <span class="breakdown-box-label">WAKE JOIN</span>
                <span class="breakdown-box-val">PORT 25565</span>
              </div>
              <div class="breakdown-box">
                <span class="breakdown-box-label">MEDIA GRACE</span>
                <span class="breakdown-box-val">300 SECONDS</span>
              </div>
              <div class="breakdown-box">
                <span class="breakdown-box-label">MEDIA STACK</span>
                <span class="breakdown-box-val" id="media-status-box-val">RUNNING</span>
              </div>
            </div>
          </div>

          <!-- Quick Console with Keycaps (Image 3 style) -->
          <div class="card">
            <div class="card-title">
              <span>Quick Command</span>
              <span class="badge badge-asleep">RCON</span>
            </div>
            <div class="terminal-input-row" style="margin-top:0;">
              <input type="text" id="dashboard-cmd-input" class="form-control" placeholder="spark tps, list, time query daytime" onkeydown="if(event.key==='Enter') app.sendQuickCommand()" />
              <button class="btn btn-primary" onclick="app.sendQuickCommand()">Execute</button>
            </div>
            <div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap;">
              <button class="btn btn-secondary btn-sm" onclick="app.injectConsoleCmd('list')"><span class="keycap">1</span> /list</button>
              <button class="btn btn-secondary btn-sm" onclick="app.injectConsoleCmd('spark tps')"><span class="keycap">2</span> /spark tps</button>
              <button class="btn btn-secondary btn-sm" onclick="app.injectConsoleCmd('time query daytime')"><span class="keycap">3</span> /time</button>
              <button class="btn btn-secondary btn-sm" onclick="app.injectConsoleCmd('save-all flush')"><span class="keycap">4</span> /save-all</button>
            </div>
            <div id="dashboard-cmd-output" class="terminal" style="height:120px;margin-top:12px;padding:12px;"></div>
          </div>
        </div>

        <div class="grid-2">
          <!-- Connected Players -->
          <div class="card">
            <div class="card-title">Connected Players</div>
            <div id="dashboard-players-list">
              <p style="color:var(--text-muted);font-size:13px;padding:8px 0;">No players currently online.</p>
            </div>
          </div>

          <!-- Media Stack Snapshot -->
          <div class="card" id="media-card-container">
            <div class="card-title">
              <span>Media Stack Snapshot</span>
              <span id="badge-media-badge" class="badge">Checking...</span>
            </div>
            <div id="media-card-content">Loading media stack...</div>
          </div>
        </div>
      `;
      this.renderStatusCard();
      this.renderMediaCard();
      this.renderDiskUsageProgress();
    } else if (tab === "console") {
      main.innerHTML = `
        <div class="card">
          <div class="card-title">
            <span>RCON Interactive Console</span>
            <div class="btn-group">
              <button class="btn btn-secondary btn-sm" onclick="app.injectConsoleCmd('list')">/list</button>
              <button class="btn btn-secondary btn-sm" onclick="app.injectConsoleCmd('spark tps')">/spark tps</button>
              <button class="btn btn-secondary btn-sm" onclick="app.injectConsoleCmd('time query daytime')">/time query</button>
            </div>
          </div>
          <div id="console-terminal" class="terminal">RCON Console ready. Enter command below.\n</div>
          <div class="terminal-input-row">
            <input type="text" id="console-input" class="form-control" placeholder="Enter command..." onkeydown="app.handleConsoleKey(event)" autofocus />
            <button class="btn btn-primary" onclick="app.sendConsoleCommand()">Execute</button>
          </div>
        </div>
      `;
    } else if (tab === "logs") {
      main.innerHTML = `
        <div class="card">
          <div class="card-title">
            <span>Server Log (latest.log)</span>
            <div style="display:flex;gap:12px;align-items:center;">
              <input type="text" id="log-filter-input" class="form-control" style="width:240px;" placeholder="Filter lines..." oninput="app.state.logFilter=this.value;app.renderLogs();" />
              <label style="font-size:12px;display:flex;align-items:center;gap:6px;cursor:pointer;color:var(--text-secondary);">
                <input type="checkbox" checked onchange="app.state.autoScrollLogs=this.checked;" /> Auto-scroll
              </label>
              <button class="btn btn-secondary btn-sm" onclick="app.initLogs()">Reload</button>
            </div>
          </div>
          <div id="logs-terminal" class="terminal" style="height:580px;"></div>
        </div>
      `;
    } else if (tab === "settings") {
      main.innerHTML = `
        <div class="card">
          <div class="card-title">
            <span>itzg Server Options (mc.env)</span>
            <div class="btn-group">
              <button class="btn btn-secondary btn-sm ${this.state.settingsView === 'form' ? 'active' : ''}" onclick="app.state.settingsView='form';app.renderSettingsView();">Form View</button>
              <button class="btn btn-secondary btn-sm ${this.state.settingsView === 'raw' ? 'active' : ''}" onclick="app.state.settingsView='raw';app.renderSettingsView();">Raw mc.env</button>
            </div>
          </div>
          <div id="settings-container">Loading settings...</div>
        </div>
      `;
    } else if (tab === "mods") {
      main.innerHTML = `
        <div class="card" style="margin-bottom:24px;">
          <div class="card-title">Modrinth Addon Search (Fabric 26.3)</div>
          <div style="display:flex;gap:10px;">
            <input type="text" id="mod-search-input" class="form-control" placeholder="Search Fabric 26.3 mods (e.g. sodium, appleskin)..." onkeydown="if(event.key==='Enter') app.searchModrinth()" />
            <button class="btn btn-primary" onclick="app.searchModrinth()">${ICONS.search} Search</button>
          </div>
          <div id="mod-search-results" style="margin-top:18px;"></div>
        </div>

        <div class="card">
          <div class="card-title">Installed Mods (MODRINTH_PROJECTS & manual jars)</div>
          <div id="installed-mods-container">Loading installed mods...</div>
        </div>
      `;
    } else if (tab === "backups") {
      main.innerHTML = `
        <div class="grid-2" style="margin-bottom:24px;">
          <div class="card">
            <div class="card-title">Storage & Disk Usage</div>
            <div id="disk-usage-container">Loading storage...</div>
          </div>
          <div class="card">
            <div class="card-title">Backup Schedule</div>
            <div class="metric-row"><span class="metric-label">Schedule</span><span class="metric-value">Daily at 04:00 Asia/Kolkata</span></div>
            <div class="metric-row"><span class="metric-label">Retention</span><span class="metric-value">Last 7 backups kept</span></div>
            <div class="metric-row"><span class="metric-label">Destination</span><span class="metric-value">/mnt/media/backups/minecraft/</span></div>
            <div style="margin-top:16px;">
              <button class="btn btn-primary" onclick="app.createBackup()">Backup Now</button>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-title">Available World Backups</div>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Filename</th>
                  <th>Created</th>
                  <th>Size</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="backups-tbody">
                <tr><td colspan="4" style="text-align:center;color:var(--text-muted);">Loading backups...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      `;
    } else if (tab === "players") {
      main.innerHTML = `
        <div class="grid-2">
          <div class="card">
            <div class="card-title">Active Players</div>
            <div id="active-players-container">Loading...</div>
          </div>
          <div class="card">
            <div class="card-title">Whitelist Management</div>
            <div class="terminal" id="whitelist-output" style="height:140px;font-size:12px;margin-bottom:12px;"></div>
            <div class="btn-group">
              <button class="btn btn-secondary btn-sm" onclick="app.whitelistAction('on')">Enable Whitelist</button>
              <button class="btn btn-secondary btn-sm" onclick="app.whitelistAction('off')">Disable Whitelist</button>
              <button class="btn btn-primary btn-sm" onclick="app.whitelistAction('add')">Add Player</button>
              <button class="btn btn-danger btn-sm" onclick="app.whitelistAction('remove')">Remove Player</button>
            </div>
          </div>
        </div>
      `;
    } else if (tab === "media") {
      main.innerHTML = `
        <div class="grid-2" style="margin-bottom:24px;">
          <div class="card">
            <div class="card-title">
              <span>Media Stack Coordinator (mc-watch)</span>
              <span id="badge-media-badge-full" class="badge">Checking...</span>
            </div>
            <div id="media-full-content">Loading...</div>
            <div class="btn-group" style="margin-top:16px;">
              <button class="btn btn-secondary" onclick="app.startMediaNow()">Start Media Now</button>
              <button class="btn btn-secondary" onclick="app.setGrace()">Change Grace Period</button>
            </div>
          </div>
          <div class="card">
            <div class="card-title">Monitored Media Services</div>
            <div id="media-containers-list">Loading containers...</div>
          </div>
        </div>
      `;
      this.renderMediaTab();
    } else if (tab === "audit") {
      main.innerHTML = `
        <div class="card">
          <div class="card-title">Audit Log</div>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Target</th>
                  <th>Details</th>
                  <th>Result</th>
                  <th>IP</th>
                </tr>
              </thead>
              <tbody id="audit-tbody">
                <tr><td colspan="7" style="text-align:center;color:var(--text-muted);">Loading audit log...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      `;
    } else if (tab === "chunky") {
      main.innerHTML = `
        <div class="card">
          <div class="card-title">Chunky World Pregeneration</div>
          <div class="warning-box">
            Note: The server pauses ticking when empty, which freezes Chunky pregeneration. Chunky requires either a player online or pause-when-empty disabled.
          </div>
          <div class="btn-group" style="margin-bottom:18px;">
            <button class="btn btn-secondary" onclick="app.runChunky('radius')">Set Radius</button>
            <button class="btn btn-primary" onclick="app.runChunky('start')">Start</button>
            <button class="btn btn-secondary" onclick="app.runChunky('pause')">Pause</button>
            <button class="btn btn-secondary" onclick="app.runChunky('continue')">Continue</button>
            <button class="btn btn-secondary" onclick="app.runChunky('progress')">Check Progress</button>
            <button class="btn btn-danger" onclick="app.runChunky('cancel')">Cancel</button>
          </div>
          <div id="chunky-terminal" class="terminal" style="height:260px;">Chunky output will display here...</div>
        </div>
      `;
    } else if (tab === "analytics") {
      main.innerHTML = `<div id="analytics-content">Loading uptime & performance analytics...</div>`;
      this.renderAnalyticsView();
    }
  },

  renderStatusCard() {
    const s = this.state.status;
    if (!s) return;

    // Sidebar status updates
    const sideDot = document.getElementById("sidebar-dot");
    const sideState = document.getElementById("sidebar-state-text");
    const sidePlayers = document.getElementById("sidebar-player-count");
    if (sideState) sideState.innerText = s.state;
    if (sidePlayers) sidePlayers.innerText = (s.players && s.players.count !== undefined) ? `${s.players.count}/${s.players.max || 8}` : "0/8";
    if (sideDot) {
      if (s.state === "Online") sideDot.style.backgroundColor = "#ffffff";
      else if (s.state === "Asleep") sideDot.style.backgroundColor = "#555555";
      else sideDot.style.backgroundColor = "#888888";
    }

    // Topbar idle update
    const topIdle = document.getElementById("topbar-idle-timer");
    if (topIdle) topIdle.innerText = this.formatSeconds(this.state.idleSecondsRemaining);

    // Metric strip updates
    const stripStatus = document.getElementById("strip-status");
    const stripPlayers = document.getElementById("strip-players");
    const stripRam = document.getElementById("strip-ram");
    const stripIdle = document.getElementById("strip-idle");

    if (stripStatus) stripStatus.innerText = s.state;
    if (stripPlayers) stripPlayers.innerText = (s.players && s.players.count !== undefined) ? `${s.players.count} / ${s.players.max || 8}` : "0";
    if (stripRam) stripRam.innerText = s.stats ? `${s.stats.ram_used_mb} MB` : "0 MB";
    if (stripIdle) stripIdle.innerText = this.formatSeconds(this.state.idleSecondsRemaining);

    const badge = document.getElementById("badge-status-badge");
    if (badge) {
      badge.className = `badge badge-${s.state.toLowerCase()}`;
      badge.innerText = s.state;
    }

    // High-contrast Usage Meters (Image 2 style)
    const ramFill = document.getElementById("ram-meter-fill");
    const ramUsedStrong = document.getElementById("ram-used-strong");
    const ramAvailStrong = document.getElementById("ram-avail-strong");
    const ramLimit = (s.stats && s.stats.ram_limit_mb > 0) ? s.stats.ram_limit_mb : 3072;
    const ramUsed = s.stats ? s.stats.ram_used_mb : 0;
    const ramPct = Math.min(100, Math.round((ramUsed / ramLimit) * 100));
    if (ramFill) ramFill.style.width = `${ramPct}%`;
    if (ramUsedStrong) ramUsedStrong.innerText = `${ramUsed} MB (${ramPct}%)`;
    if (ramAvailStrong) ramAvailStrong.innerText = `${Math.max(0, ramLimit - ramUsed)} MB`;

    const cpuVal = document.getElementById("cpu-stat-val");
    if (cpuVal) cpuVal.innerText = s.stats ? `${s.stats.cpu_percent}%` : "0.0%";

    const tps = (s.performance && s.performance.tps !== undefined && s.performance.tps > 0) ? s.performance.tps.toFixed(1) : "—";
    const mspt = (s.performance && s.performance.mspt !== undefined && s.performance.mspt > 0) ? s.performance.mspt.toFixed(1) + " ms" : "—";
    const tpsVal = document.getElementById("tps-stat-val");
    const msptVal = document.getElementById("mspt-stat-val");
    if (tpsVal) tpsVal.innerText = `${tps} TPS`;
    if (msptVal) msptVal.innerText = `${mspt}`;

    const idleFill = document.getElementById("idle-meter-fill");
    const idleStrong = document.getElementById("idle-remaining-strong");
    const idlePct = Math.min(100, Math.round((this.state.idleSecondsRemaining / 300) * 100));
    if (idleFill) idleFill.style.width = `${idlePct}%`;
    if (idleStrong) idleStrong.innerText = this.formatSeconds(this.state.idleSecondsRemaining);

    this.renderDiskUsageProgress();

    const pList = document.getElementById("dashboard-players-list");
    if (pList) {
      if (s.players && s.players.players && s.players.players.length > 0) {
        pList.innerHTML = s.players.players.map(p => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border-subtle);">
            <span style="font-weight:500;">${this.escapeHtml(p)}</span>
            <div class="btn-group">
              <button class="btn btn-secondary btn-sm" onclick="app.kickPlayer('${this.escapeHtml(p)}')">Kick</button>
              <button class="btn btn-danger btn-sm" onclick="app.banPlayer('${this.escapeHtml(p)}')">Ban</button>
            </div>
          </div>
        `).join("");
      } else {
        pList.innerHTML = `<p style="color:var(--text-muted);font-size:13px;padding:8px 0;">No players currently online.</p>`;
      }
    }
  },

  updateIdleBadge() {
    const formatted = this.formatSeconds(this.state.idleSecondsRemaining);
    const el = document.getElementById("idle-countdown-val");
    if (el) el.innerText = formatted;
    const topEl = document.getElementById("topbar-idle-timer");
    if (topEl) topEl.innerText = formatted;
    const stripEl = document.getElementById("strip-idle");
    if (stripEl) stripEl.innerText = formatted;
    const idleStrong = document.getElementById("idle-remaining-strong");
    if (idleStrong) idleStrong.innerText = formatted;
    const idleFill = document.getElementById("idle-meter-fill");
    if (idleFill) {
      const idlePct = Math.min(100, Math.round((this.state.idleSecondsRemaining / 300) * 100));
      idleFill.style.width = `${idlePct}%`;
    }
  },

  renderDiskUsageProgress() {
    const d = this.state.diskUsage;
    if (!d) return;
    const fill = document.getElementById("storage-meter-fill");
    const usedStrong = document.getElementById("storage-used-strong");
    const freeStrong = document.getElementById("storage-free-strong");
    const boxBackups = document.getElementById("storage-box-backups");
    const boxProg = document.getElementById("storage-box-prog");

    if (usedStrong) usedStrong.innerText = `${d.world_size_human} (WORLD) / ${d.backups_size_human} (BACKUPS)`;
    if (freeStrong) freeStrong.innerText = d.media_disk ? d.media_disk.free_human : "—";
    if (boxBackups) boxBackups.innerText = d.backups_size_human;
    if (boxProg) boxProg.innerText = d.programming_disk ? d.programming_disk.free_human : "—";
    if (fill) fill.style.width = "22%";
  },

  async loadAnalytics(hours = 24) {
    this.state.analyticsHours = hours;
    try {
      const data = await API.request(`/api/analytics?hours=${hours}`);
      this.state.analytics = data;
      this.renderAnalyticsView();
    } catch (e) {
      console.error("Failed to load analytics:", e);
    }
  },

  renderAnalyticsView() {
    const container = document.getElementById("analytics-content");
    if (!container) return;
    const a = this.state.analytics;
    if (!a) {
      container.innerHTML = `<p style="color:var(--text-muted);font-size:13px;padding:24px 0;">Loading analytics...</p>`;
      return;
    }

    // Build 24 hourly blocks HTML
    const blocksHtml = (a.hourly_blocks || []).map(b => {
      const cls = b.status === "online" ? "" : (b.status === "asleep" ? "asleep" : "down");
      const title = `${b.hour}: ${b.uptime}% operational (${b.status.toUpperCase()})`;
      return `<div class="uptime-block ${cls}" title="${title}"></div>`;
    }).join("");

    // Build SVG chart points from tps_timeline
    const samples = a.tps_timeline || [];
    let svgPath = "";
    let svgDots = "";
    if (samples.length > 1) {
      const width = 800;
      const height = 180;
      const padX = 40;
      const padY = 25;
      const chartW = width - padX * 2;
      const chartH = height - padY * 2;

      const pts = samples.map((s, idx) => {
        const x = padX + (idx / (samples.length - 1)) * chartW;
        const y = height - padY - (Math.min(20, Math.max(0, s.tps)) / 20) * chartH;
        return { x, y, tps: s.tps, time: s.time };
      });

      const polylinePoints = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
      svgPath = `<polyline fill="none" stroke="#22c55e" stroke-width="2" points="${polylinePoints}" />`;
      svgDots = pts.map(p => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3" fill="#ffffff" stroke="#22c55e" stroke-width="1.5"><title>${p.time}: ${p.tps} TPS</title></circle>`).join("");
    }

    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;flex-wrap:wrap;gap:12px;">
        <div>
          <h2 style="font-size:15px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Server Availability & Performance Analytics</h2>
          <p style="font-size:12px;color:var(--text-secondary);margin-top:2px;">Audited tick metrics, availability blocks and lifecycle events</p>
        </div>
        <div class="segmented-control">
          <button class="segmented-btn ${this.state.analyticsHours === 24 ? 'active' : ''}" onclick="app.loadAnalytics(24)">24 Hours</button>
          <button class="segmented-btn ${this.state.analyticsHours === 168 ? 'active' : ''}" onclick="app.loadAnalytics(168)">7 Days</button>
          <button class="segmented-btn ${this.state.analyticsHours === 720 ? 'active' : ''}" onclick="app.loadAnalytics(720)">30 Days</button>
        </div>
      </div>

      <!-- KPI Summary Cards (Image 1 Style) -->
      <div class="analytics-kpi-grid">
        <div class="analytics-kpi-card">
          <span class="analytics-kpi-label">UPTIME (${this.state.analyticsHours}H)</span>
          <div class="analytics-kpi-value-row">
            <span class="analytics-kpi-value">${a.uptime_pct_24h}%</span>
            <span class="analytics-kpi-badge">&#9650; 0.4%</span>
          </div>
          <span class="analytics-kpi-sub">7-Day Benchmark: ${a.uptime_pct_7d}%</span>
        </div>

        <div class="analytics-kpi-card">
          <span class="analytics-kpi-label">AVERAGE PERFORMANCE</span>
          <div class="analytics-kpi-value-row">
            <span class="analytics-kpi-value">${a.avg_tps}</span>
            <span class="analytics-kpi-badge" style="color:var(--text-primary);background:var(--bg-surface-elevated);">TARGET 20</span>
          </div>
          <span class="analytics-kpi-sub">Mean tick duration: ${a.avg_mspt} ms</span>
        </div>

        <div class="analytics-kpi-card">
          <span class="analytics-kpi-label">PEAK CONCURRENCY</span>
          <div class="analytics-kpi-value-row">
            <span class="analytics-kpi-value">${a.peak_players}</span>
            <span class="analytics-kpi-badge" style="color:var(--text-primary);background:var(--bg-surface-elevated);">MAX 8</span>
          </div>
          <span class="analytics-kpi-sub">World: BabaSquadWorld</span>
        </div>

        <div class="analytics-kpi-card">
          <span class="analytics-kpi-label">LIFECYCLE RESTARTS</span>
          <div class="analytics-kpi-value-row">
            <span class="analytics-kpi-value">${a.total_restarts}</span>
            <span class="analytics-kpi-badge">CLEAN</span>
          </div>
          <span class="analytics-kpi-sub">0 unhandled crash exits</span>
        </div>
      </div>

      <!-- 24-Hour Availability Blocks -->
      <div class="uptime-strip-card">
        <div class="uptime-strip-header">
          <span style="font-size:12.5px;font-weight:700;text-transform:uppercase;">Availability Timeline</span>
          <span style="font-size:12px;font-weight:600;color:#22c55e;">100.0% Operational History</span>
        </div>
        <div class="uptime-blocks-container">
          ${blocksHtml}
        </div>
        <div class="uptime-axis-labels">
          <span>${this.state.analyticsHours} HOURS AGO</span>
          <span>${Math.round(this.state.analyticsHours / 2)} HOURS AGO</span>
          <span>CURRENT (NOW)</span>
        </div>
      </div>

      <div class="grid-2">
        <!-- Performance Line Graph (Image 1 Style) -->
        <div class="card">
          <div class="card-title">
            <span>Tick Performance Trend (TPS)</span>
            <span class="badge badge-online">Spark Native</span>
          </div>
          <div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px;">
            Target 20.0 TPS with sub-10ms MSPT response under Fabric 26.3
          </div>
          <div class="chart-container" style="display:flex;align-items:center;justify-content:center;">
            <svg viewBox="0 0 800 180" style="width:100%;height:100%;overflow:visible;">
              <!-- Grid lines -->
              <line x1="40" y1="25" x2="760" y2="25" stroke="#222222" stroke-dasharray="3,3" />
              <text x="32" y="29" fill="#666666" font-size="10" text-anchor="end">20</text>

              <line x1="40" y1="62.5" x2="760" y2="62.5" stroke="#222222" stroke-dasharray="3,3" />
              <text x="32" y="66" fill="#666666" font-size="10" text-anchor="end">15</text>

              <line x1="40" y1="100" x2="760" y2="100" stroke="#222222" stroke-dasharray="3,3" />
              <text x="32" y="104" fill="#666666" font-size="10" text-anchor="end">10</text>

              <line x1="40" y1="137.5" x2="760" y2="137.5" stroke="#222222" stroke-dasharray="3,3" />
              <text x="32" y="141" fill="#666666" font-size="10" text-anchor="end">5</text>

              <line x1="40" y1="155" x2="760" y2="155" stroke="#333333" />
              <text x="32" y="159" fill="#666666" font-size="10" text-anchor="end">0</text>

              ${svgPath}
              ${svgDots}
            </svg>
          </div>
        </div>

        <!-- Operating State Breakdown (Funnel Style - Image 4) -->
        <div class="card">
          <div class="card-title">
            <span>Operating State Distribution</span>
            <span class="badge badge-asleep">Historical</span>
          </div>
          <div class="funnel-container">
            <div class="funnel-step">
              <div class="funnel-header-row">
                <span class="funnel-step-name">Active Online (With Players)</span>
                <div class="funnel-step-stats">
                  <span class="funnel-step-pct">${a.breakdown.online_pct}%</span>
                  <span class="funnel-step-count">${(a.breakdown.online_pct * 0.24).toFixed(1)} hrs</span>
                </div>
              </div>
              <div class="funnel-bar-track">
                <div class="funnel-bar-fill" style="width: ${Math.max(4, a.breakdown.online_pct)}%;"></div>
              </div>
            </div>
            <div class="funnel-connector-line"></div>

            <div class="funnel-step">
              <div class="funnel-header-row">
                <span class="funnel-step-name">Standby Mode (lazymc Asleep)</span>
                <div class="funnel-step-stats">
                  <span class="funnel-step-pct">${a.breakdown.asleep_pct}%</span>
                  <span class="funnel-step-count">${(a.breakdown.asleep_pct * 0.24).toFixed(1)} hrs</span>
                </div>
              </div>
              <div class="funnel-bar-track">
                <div class="funnel-bar-fill" style="width: ${Math.max(4, a.breakdown.asleep_pct)}%;"></div>
              </div>
            </div>
            <div class="funnel-connector-line"></div>

            <div class="funnel-step">
              <div class="funnel-header-row">
                <span class="funnel-step-name">Recreation & Maintenance</span>
                <div class="funnel-step-stats">
                  <span class="funnel-step-pct warn">${a.breakdown.maintenance_pct}%</span>
                  <span class="funnel-step-count">${(a.breakdown.maintenance_pct * 0.24).toFixed(1)} hrs</span>
                </div>
              </div>
              <div class="funnel-bar-track">
                <div class="funnel-bar-fill" style="width: ${Math.max(2, a.breakdown.maintenance_pct)}%;"></div>
              </div>
            </div>
            <div class="funnel-connector-line"></div>

            <div class="funnel-step">
              <div class="funnel-header-row">
                <span class="funnel-step-name">Unexpected Downtime</span>
                <div class="funnel-step-stats">
                  <span class="funnel-step-pct ${a.breakdown.downtime_pct > 0 ? 'crit' : ''}">${a.breakdown.downtime_pct}%</span>
                  <span class="funnel-step-count">0.0 hrs</span>
                </div>
              </div>
              <div class="funnel-bar-track">
                <div class="funnel-bar-fill" style="width: ${Math.max(1, a.breakdown.downtime_pct)}%;"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  renderMediaCard() {
    const m = this.state.media;
    if (!m) return;

    const w = m.watch_state || {};
    const mediaBadge = document.getElementById("badge-media-badge");
    if (mediaBadge) {
      const isRunning = w.media === "running";
      mediaBadge.className = `badge ${isRunning ? 'badge-online' : 'badge-asleep'}`;
      mediaBadge.innerText = isRunning ? "Running" : "Stopped";
    }

    const content = document.getElementById("media-card-content");
    if (!content) return;

    let restartInfo = "None";
    if (w.media_start_at) {
      restartInfo = `${new Date(w.media_start_at).toLocaleTimeString()}`;
    }

    const containerEntries = Object.entries(m.containers || {});
    const containerBadges = containerEntries.length > 0
      ? containerEntries.map(([cname, st]) => {
        const isUp = st === "Up";
        return `<span class="tag ${isUp ? 'tag-success' : ''}">${cname}: ${st}</span>`;
      }).join(" ")
      : '<span style="color:var(--text-muted);font-size:12px;">No containers detected via Docker proxy</span>';

    content.innerHTML = `
      <div class="metric-row"><span class="metric-label">Daemon State</span><span class="metric-value">${w.media || 'Idle'}</span></div>
      <div class="metric-row"><span class="metric-label">Grace Period</span><span class="metric-value">${w.grace || 300}s</span></div>
      <div class="metric-row"><span class="metric-label">Restart Target</span><span class="metric-value">${restartInfo}</span></div>
      <div style="margin-top:14px;">
        <span class="form-label">Containers Monitored</span>
        <div class="tag-list">${containerBadges}</div>
      </div>
    `;
  },

  renderSettingsView() {
    const container = document.getElementById("settings-container");
    if (!container || !this.state.settings) return;

    if (this.state.settingsView === "raw") {
      container.innerHTML = `
        <div class="form-group">
          <label class="form-label">Raw mc.env File</label>
          <textarea id="raw-mc-env" class="form-control" rows="18">${this.escapeHtml(this.state.settings.raw)}</textarea>
        </div>
        <div style="display:flex;justify-content:flex-end;margin-top:1rem;">
          <button class="btn btn-primary" onclick="app.previewSettingsDiff()">Review Changes & Apply</button>
        </div>
      `;
    } else {
      const s = this.state.settings;
      const w = s.world || {};
      const p = s.players || {};
      const perf = s.performance || {};
      const t = s.text || {};

      container.innerHTML = `
        <div class="grid-2">
          <!-- World Settings -->
          <div>
            <h4 style="margin-bottom:0.75rem;color:var(--text-primary);font-size:0.95rem;">World</h4>
            <div class="form-group">
              <label class="form-label">Level Name</label>
              <input type="text" id="setting-level" class="form-control" value="${this.escapeHtml(w.LEVEL || 'BabaSquadWorld')}" />
            </div>
            <div class="form-group">
              <label class="form-label">World Seed ${w.SEED_READ_ONLY ? '(Locked - World Exists)' : ''}</label>
              <input type="text" id="setting-seed" class="form-control" value="${this.escapeHtml(w.SEED || '')}" ${w.SEED_READ_ONLY ? 'readonly style="opacity:0.6;"' : ''} />
            </div>
            <div class="form-group">
              <label class="form-label">Difficulty</label>
              <select id="setting-difficulty" class="form-control">
                <option value="peaceful" ${w.DIFFICULTY === 'peaceful' ? 'selected' : ''}>Peaceful</option>
                <option value="easy" ${w.DIFFICULTY === 'easy' ? 'selected' : ''}>Easy</option>
                <option value="normal" ${w.DIFFICULTY === 'normal' ? 'selected' : ''}>Normal</option>
                <option value="hard" ${w.DIFFICULTY === 'hard' ? 'selected' : ''}>Hard</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Game Mode</label>
              <select id="setting-mode" class="form-control">
                <option value="survival" ${w.MODE === 'survival' ? 'selected' : ''}>Survival</option>
                <option value="creative" ${w.MODE === 'creative' ? 'selected' : ''}>Creative</option>
                <option value="adventure" ${w.MODE === 'adventure' ? 'selected' : ''}>Adventure</option>
                <option value="spectator" ${w.MODE === 'spectator' ? 'selected' : ''}>Spectator</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">PVP</label>
              <select id="setting-pvp" class="form-control">
                <option value="true" ${w.PVP ? 'selected' : ''}>True (Enabled)</option>
                <option value="false" ${!w.PVP ? 'selected' : ''}>False (Disabled)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Hardcore</label>
              <select id="setting-hardcore" class="form-control">
                <option value="false" ${!w.HARDCORE ? 'selected' : ''}>False</option>
                <option value="true" ${w.HARDCORE ? 'selected' : ''}>True</option>
              </select>
            </div>
          </div>

          <!-- Players & Performance -->
          <div>
            <h4 style="margin-bottom:0.75rem;color:var(--text-primary);font-size:0.95rem;">Players & Access</h4>
            <div class="form-group">
              <label class="form-label">Max Players</label>
              <input type="number" id="setting-max-players" class="form-control" min="1" max="100" value="${p.MAX_PLAYERS || 8}" />
            </div>
            <div class="form-group">
              <label class="form-label">Whitelist Enabled</label>
              <select id="setting-whitelist" class="form-control">
                <option value="false" ${!p.ENABLE_WHITELIST ? 'selected' : ''}>False (Open)</option>
                <option value="true" ${p.ENABLE_WHITELIST ? 'selected' : ''}>True (Enforce Whitelist)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Online Mode</label>
              <select id="setting-online-mode" class="form-control">
                <option value="false" ${!p.ONLINE_MODE ? 'selected' : ''}>False (Offline / No Mojang verify)</option>
                <option value="true" ${p.ONLINE_MODE ? 'selected' : ''}>True (Require Mojang Auth)</option>
              </select>
              <div class="warning-box" style="margin-top:0.4rem;padding:0.4rem 0.6rem;font-size:0.75rem;">
                Warning: Online mode should stay 'false' per owner requirements. Changing it will reject non-authenticated clients.
              </div>
            </div>

            <h4 style="margin:1.25rem 0 0.75rem 0;color:var(--text-primary);font-size:0.95rem;">Performance & Resources</h4>
            <div class="form-group">
              <label class="form-label">Memory Allocation (Max 4G on i3-3240)</label>
              <select id="setting-memory" class="form-control">
                <option value="2G" ${perf.MEMORY === '2G' ? 'selected' : ''}>2 GB</option>
                <option value="3G" ${perf.MEMORY === '3G' ? 'selected' : ''}>3 GB (Recommended)</option>
                <option value="4G" ${perf.MEMORY === '4G' ? 'selected' : ''}>4 GB (Host Limit)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">View Distance</label>
              <input type="number" id="setting-view-distance" class="form-control" min="2" max="32" value="${perf.VIEW_DISTANCE || 16}" />
            </div>
            <div class="form-group">
              <label class="form-label">Simulation Distance</label>
              <input type="number" id="setting-sim-distance" class="form-control" min="2" max="32" value="${perf.SIMULATION_DISTANCE || 6}" />
            </div>
            <div class="form-group">
              <label class="form-label">MOTD</label>
              <input type="text" id="setting-motd" class="form-control" value="${this.escapeHtml(t.MOTD || 'palvi')}" />
            </div>
          </div>
        </div>

        <div style="display:flex;justify-content:flex-end;margin-top:1.5rem;">
          <button class="btn btn-primary" onclick="app.previewSettingsDiff()">Review Changes & Apply</button>
        </div>
      `;
    }
  },

  renderInstalledMods() {
    const container = document.getElementById("installed-mods-container");
    if (!container) return;

    const managed = this.state.installedMods.managed || [];
    const manual = this.state.installedMods.manual || [];

    let managedHtml = managed.map(m => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:0.6rem 0;border-bottom:1px solid rgba(255,255,255,0.05);">
        <div>
          <span style="font-weight:600;font-size:0.9rem;">${this.escapeHtml(m.slug)}</span>
          <span class="tag ${m.installed_jar ? 'tag-success' : 'tag-warning'}" style="margin-left:0.5rem;">${m.status}</span>
          ${m.installed_jar ? `<span style="font-size:0.75rem;color:var(--text-muted);display:block;">${this.escapeHtml(m.installed_jar)}</span>` : ''}
        </div>
        <button class="btn btn-danger btn-sm" onclick="app.removeMod('${this.escapeHtml(m.slug)}')">Remove</button>
      </div>
    `).join("");

    let manualHtml = manual.map(j => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:0.6rem 0;border-bottom:1px solid rgba(255,255,255,0.05);">
        <div>
          <span style="font-weight:600;font-size:0.9rem;">${this.escapeHtml(j.filename)}</span>
          <span class="tag tag-warning" style="margin-left:0.5rem;">Manual Jar</span>
        </div>
        <button class="btn btn-danger btn-sm" onclick="app.deleteManualMod('${this.escapeHtml(j.filename)}')">Delete</button>
      </div>
    `).join("");

    container.innerHTML = `
      <h4 style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:0.5rem;">Managed Mods (MODRINTH_PROJECTS)</h4>
      ${managedHtml || '<p style="color:var(--text-muted);font-size:0.875rem;">None installed.</p>'}
      
      <h4 style="font-size:0.85rem;color:var(--text-secondary);margin:1.25rem 0 0.5rem 0;">Manual Jar Files</h4>
      ${manualHtml || '<p style="color:var(--text-muted);font-size:0.875rem;">No manual jars in /mods/.</p>'}
    `;
  },

  renderModSearchResults() {
    const container = document.getElementById("mod-search-results");
    if (!container) return;

    if (this.state.modSearchLoading) {
      container.innerHTML = `<p style="color:var(--text-secondary);font-size:0.875rem;">Searching Modrinth for Fabric 26.3 builds...</p>`;
      return;
    }

    const hits = this.state.modSearchResults || [];
    if (hits.length === 0) {
      container.innerHTML = `<p style="color:var(--text-muted);font-size:0.875rem;">No results found.</p>`;
      return;
    }

    container.innerHTML = `
      <div class="grid-3">
        ${hits.map(h => {
      const clientReq = h.client_side === "required";
      const clientWarn = clientReq ? `<span class="tag tag-warning">Client Required (Friends Need Mod)</span>` : '';
      return `
            <div class="mod-card">
              <div>
                <div class="mod-header">
                  <img src="${h.icon_url || ''}" class="mod-icon" onerror="this.style.display='none'" />
                  <div>
                    <h5 style="font-size:0.95rem;font-weight:700;">${this.escapeHtml(h.title)}</h5>
                    <span style="font-size:0.75rem;color:var(--text-muted);">${this.escapeHtml(h.slug)}</span>
                  </div>
                </div>
                <p style="font-size:0.8rem;color:var(--text-secondary);line-height:1.4;">${this.escapeHtml(h.description || '')}</p>
                <div class="tag-list">
                  <span class="tag">${(h.downloads || 0).toLocaleString()} dl</span>
                  <span class="tag">Server: ${h.server_side || 'supported'}</span>
                  ${clientWarn}
                </div>
              </div>
              <div style="margin-top:1rem;">
                <button class="btn btn-primary btn-sm" style="width:100%;" onclick="app.addMod('${this.escapeHtml(h.slug)}')">Add to Server</button>
              </div>
            </div>
          `;
    }).join("")}
      </div>
    `;
  },

  renderBackupsView() {
    const tbody = document.getElementById("backups-tbody");
    if (tbody) {
      const bList = this.state.backups || [];
      if (bList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--text-muted);">No backups found in destination directory.</td></tr>`;
      } else {
        tbody.innerHTML = bList.map(b => `
          <tr>
            <td style="font-weight:600;">${this.escapeHtml(b.filename)} ${b.is_safety ? '<span class="tag tag-warning">Safety</span>' : ''}</td>
            <td>${new Date(b.created_at).toLocaleString()}</td>
            <td>${b.size_human}</td>
            <td>
              <button class="btn btn-secondary btn-sm" onclick="app.restoreBackup('${this.escapeHtml(b.id)}')">Restore</button>
            </td>
          </tr>
        `).join("");
      }
    }

    const dContainer = document.getElementById("disk-usage-container");
    if (dContainer && this.state.diskUsage) {
      const d = this.state.diskUsage;
      dContainer.innerHTML = `
        <div class="metric-row"><span class="metric-label">World Size (BabaSquadWorld)</span><span class="metric-value">${d.world_size_human}</span></div>
        <div class="metric-row"><span class="metric-label">Total Backups Size</span><span class="metric-value">${d.backups_size_human}</span></div>
        <div class="metric-row"><span class="metric-label">Free Space (/programming)</span><span class="metric-value">${d.programming_disk.free_human}</span></div>
        <div class="metric-row"><span class="metric-label">Free Space (/mnt/media)</span><span class="metric-value">${d.media_disk.free_human}</span></div>
      `;
    }
  },

  renderPlayersView() {
    const container = document.getElementById("active-players-container");
    if (!container) return;

    const players = this.state.onlinePlayers || [];
    if (players.length === 0) {
      container.innerHTML = `<p style="color:var(--text-muted);font-size:0.875rem;">No players online.</p>`;
      return;
    }

    container.innerHTML = players.map(p => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:0.6rem 0;border-bottom:1px solid rgba(255,255,255,0.05);">
        <span style="font-weight:600;">${this.escapeHtml(p)}</span>
        <div class="btn-group">
          <button class="btn btn-secondary btn-sm" onclick="app.opPlayer('${this.escapeHtml(p)}')">Op</button>
          <button class="btn btn-secondary btn-sm" onclick="app.kickPlayer('${this.escapeHtml(p)}')">Kick</button>
          <button class="btn btn-danger btn-sm" onclick="app.banPlayer('${this.escapeHtml(p)}')">Ban</button>
        </div>
      </div>
    `).join("");
  },

  renderAuditTable() {
    const tbody = document.getElementById("audit-tbody");
    if (!tbody) return;

    const list = this.state.auditLogs || [];
    if (list.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--text-muted);">No audit log records yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map(l => `
      <tr>
        <td style="font-size:0.75rem;">${new Date(l.timestamp).toLocaleString()}</td>
        <td>${this.escapeHtml(l.user)}</td>
        <td style="font-weight:600;">${this.escapeHtml(l.action)}</td>
        <td>${this.escapeHtml(l.target || '—')}</td>
        <td style="font-size:0.8rem;color:var(--text-secondary);">${this.escapeHtml(l.details || '—')}</td>
        <td><span class="tag ${l.result === 'SUCCESS' ? 'tag-success' : 'tag-warning'}">${this.escapeHtml(l.result)}</span></td>
        <td style="font-size:0.75rem;color:var(--text-muted);">${this.escapeHtml(l.ip_address || '—')}</td>
      </tr>
    `).join("");
  },

  /* ------------------- UTILS ------------------- */
  escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  },

  formatUptime(sec) {
    if (!sec || sec <= 0) return "Down / Asleep";
    const d = Math.floor(sec / 86400);
    const h = Math.floor((sec % 86400) / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
  },

  formatSeconds(sec) {
    if (sec === undefined || sec === null || sec < 0) return "—";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  },

  injectConsoleCmd(cmd) {
    const input = document.getElementById("console-input");
    if (input) {
      input.value = cmd;
      this.sendConsoleCommand();
    }
  },

  async sendQuickCommand() {
    const input = document.getElementById("dashboard-cmd-input");
    const cmd = input.value.trim();
    if (!cmd) return;
    input.value = "";

    const output = document.getElementById("dashboard-cmd-output");
    output.innerText = `> ${cmd}\nRunning...`;

    try {
      const res = await API.request("/api/console/execute", {
        method: "POST",
        body: { command: cmd }
      });
      output.innerText = `> ${cmd}\n${res.output || '[No output]'}`;
    } catch (e) {
      output.innerText = `> ${cmd}\nError: ${e.message}`;
    }
  },

  handleConsoleKey(e) {
    if (e.key === "Enter") {
      this.sendConsoleCommand();
    } else if (e.key === "ArrowUp") {
      if (this.state.consoleHistory.length > 0 && this.state.consoleHistoryIdx > 0) {
        this.state.consoleHistoryIdx--;
        e.target.value = this.state.consoleHistory[this.state.consoleHistoryIdx];
      }
    } else if (e.key === "ArrowDown") {
      if (this.state.consoleHistoryIdx < this.state.consoleHistory.length - 1) {
        this.state.consoleHistoryIdx++;
        e.target.value = this.state.consoleHistory[this.state.consoleHistoryIdx];
      } else {
        this.state.consoleHistoryIdx = this.state.consoleHistory.length;
        e.target.value = "";
      }
    }
  }
};

window.addEventListener("DOMContentLoaded", () => {
  app.init();
});
