import {
  ICONS,
  escapeHtml,
  formatSeconds,
  formatDate,
  renderStatusBadge,
  setTextIfChanged,
  setHtmlIfChanged,
  createApiClient
} from "./api.js?v=20261128-v11";
import {
  renderServerTab,
  updateServerMetrics,
  updateSquareMeter,
  loadMediaStatus,
  setMediaGrace,
  startMediaNow
} from "./views/server.js?v=20261128-v11";
import {
  renderAnalyticsPage,
  loadAnalytics,
  setHeatmapView,
  prevHeatmapPeriod,
  nextHeatmapPeriod,
  getAllHeatmapWeeks,
  renderHeatmap
} from "./views/analytics.js?v=20261128-v11";
import {
  renderPropertiesTab,
  loadProperties,
  togglePropertySwitch,
  saveProperties,
  renderConsoleTab,
  initConsole,
  sendConsoleCommand,
  sendConsoleCommandSilent,
  handleConsoleKey,
  appendConsoleLine,
  clearConsole,
  renderLogsTab,
  initLogs,
  stopLogStream,
  renderLogs,
  appendLogLine,
  filterLogs,
  formatLogLine,
  renderPlayersTab,
  loadPlayers,
  setPlayerSection,
  renderPlayerSection,
  addPlayerOp,
  removePlayerOp,
  banPlayer,
  unbanPlayer,
  banIp,
  unbanIp,
  addPlayerWhitelist,
  removePlayerWhitelist,
  kickPlayer,
  toggleWhitelist,
  selectPlayerTarget
} from "./views/operations.js?v=20261128-v11";
import {
  renderSoftwareTab,
  loadSoftware,
  requestSwitchSoftware,
  renderModsTab,
  switchModsTab,
  renderInstalledMods,
  renderBrowseMods,
  executeModSearch,
  installMod,
  removeMod,
  deleteManualJar,
  renderFilesTab,
  loadFiles,
  openFileEditor,
  saveFileContent,
  deleteFileItem,
  promptCreateFolder,
  uploadFile,
  renderWorldsTab,
  loadWorlds,
  sendChunkyCommand,
  showUploadWorldModal,
  executeWorldUpload,
  showGenerateWorldModal,
  executeWorldGenerate,
  renderBackupsTab,
  loadBackups,
  createBackup,
  restoreBackup,
  renderAccessTab,
  loadAccess,
  changeAdminPassword,
  loadAuditLogs,
  prevAuditPage,
  nextAuditPage,
  renderSettingsTab,
  loadSettings,
  switchSettingsTab,
  saveMcEnvProperties,
  previewMcEnvDiff,
  applyMcEnvSettings,
  saveAlertWebhook
} from "./views/management.js?v=20261128-v11";

const API = createApiClient(() => app.showLoginModal());

const app = {
  api: API,
  state: {
    authenticated: false,
    setupRequired: false,
    activeTab: "server",
    theme: localStorage.getItem("mcadmin_theme") || "dark",
    font: localStorage.getItem("mcadmin_font") || "Outfit",
    status: null,
    idleSecondsRemaining: null,
    properties: null,
    heatmapView: "week",
    heatmapMonthIdx: 0,
    heatmapWeekIdx: 0,
    analyticsData: null,
    consoleHistory: [],
    consoleHistoryIdx: -1,
    logs: [],
    logFilter: "",
    autoScrollLogs: true,
    autoScrollConsole: true,
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
    installedModsLoaded: false,
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
    diskUsage: null,
    watchState: null,
    mediaContainers: [],
    lastServerState: null,
    lastWatchMediaState: null,
    lastMediaFetchAt: 0,
    settingsSubtab: "webapp",
    serverSettingsData: null,
    backupsList: [],
    auditPageOffset: 0,
    auditLimit: 15,
    auditTotal: 0,
    panelWebhookUrl: "",
    lastActivityAt: Date.now()
  },

  sseLogSource: null,
  sseReconnectTimer: null,
  sseRetryCount: 0,
  statusInterval: null,
  idleInterval: null,
  visibilityBound: false,
  activityBound: false,
  _lastBeaconState: null,

  fontMap: {
    "Outfit": "'Outfit', sans-serif",
    "IBM Plex Sans": "'IBM Plex Sans', sans-serif",
    "IBM Plex Mono": "'IBM Plex Mono', monospace",
    "Space Grotesk": "'Space Grotesk', sans-serif"
  },

  async init() {
    this.setTheme(this.state.theme);
    this.setFont(this.state.font);
    const prefs = JSON.parse(localStorage.getItem("mcadmin_webapp_prefs") || "{}");
    if (prefs.density === "compact") {
      document.documentElement.setAttribute("data-density", "compact");
    }
    this.initKeyboardShortcuts();
    this.bindVisibilityHandler();
    this.bindActivityHandlers();
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

  bindVisibilityHandler() {
    if (this.visibilityBound) return;
    this.visibilityBound = true;
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && this.state.authenticated) {
        this.fetchStatus();
      }
    });
  },

  bindActivityHandlers() {
    if (this.activityBound) return;
    this.activityBound = true;
    const touch = () => {
      const now = Date.now();
      if (now - this.state.lastActivityAt > 1000) {
        this.state.lastActivityAt = now;
      }
    };
    window.addEventListener("mousemove", touch, { passive: true });
    window.addEventListener("keydown", touch, { passive: true });
    window.addEventListener("click", touch, { passive: true });
  },

  playOutageChime() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const notes = [523.25, 349.23];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.08, ctx.currentTime + i * 0.18);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.18 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.18);
        osc.stop(ctx.currentTime + i * 0.18 + 0.26);
      });
    } catch (e) { }
  },

  checkOutageAlert(prevState, nextState) {
    if ((prevState === "Online" || prevState === "Starting") && nextState === "Error") {
      const prefs = JSON.parse(localStorage.getItem("mcadmin_webapp_prefs") || "{}");
      if (prefs.audioChime) {
        this.playOutageChime();
      }
      if ("Notification" in window && Notification.permission === "granted") {
        try {
          new Notification("Palvi MC Alert", { body: `Server transitioned from ${prevState} to Error.` });
        } catch (e) { }
      }
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

  toggleTheme() {
    const themes = ["dark", "medium-dark", "light"];
    const currIdx = themes.indexOf(this.state.theme);
    const nextTheme = themes[(currIdx + 1) % themes.length];
    this.setTheme(nextTheme);
  },

  initKeyboardShortcuts() {
    window.addEventListener("keydown", (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable)) {
        return;
      }
      if (e.key && e.key.toLowerCase() === "z") {
        e.preventDefault();
        this.toggleTheme();
      }
    });
  },

  setFont(fontName) {
    const fontVal = this.fontMap[fontName] || this.fontMap["Outfit"];
    this.state.font = this.fontMap[fontName] ? fontName : "Outfit";
    localStorage.setItem("mcadmin_font", this.state.font);
    document.documentElement.style.setProperty("--font-universal", fontVal);
    if (this.state.activeTab === "settings") {
      const main = document.getElementById("main-content");
      if (main) {
        this.renderTabContent();
      }
    }
  },

  getPollingRateMs() {
    const prefs = JSON.parse(localStorage.getItem("mcadmin_webapp_prefs") || "{}");
    return Math.max(1000, parseInt(prefs.pollingRate, 10) || 2500);
  },

  updateAppPref(key, value) {
    const prefs = JSON.parse(localStorage.getItem("mcadmin_webapp_prefs") || "{}");
    prefs[key] = value;
    localStorage.setItem("mcadmin_webapp_prefs", JSON.stringify(prefs));
    if (key === "density") {
      document.documentElement.setAttribute("data-density", value);
    }
    if (key === "pollingRate" && this.state.authenticated) {
      if (this.statusInterval) clearInterval(this.statusInterval);
      this.statusInterval = setInterval(() => {
        if (!document.hidden) this.fetchStatus();
      }, parseInt(value, 10) || 2500);
    }
  },

  requestNotificationPermission() {
    if ("Notification" in window) {
      Notification.requestPermission().then(perm => {
        alert("Browser notifications: " + perm);
      });
    } else {
      alert("Browser does not support notifications.");
    }
  },

  clearClientCache() {
    if (confirm("Reset local storage and web app cache?")) {
      localStorage.clear();
      window.location.reload();
    }
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

  stopDashboard() {
    if (this.statusInterval) {
      clearInterval(this.statusInterval);
      this.statusInterval = null;
    }
    if (this.idleInterval) {
      clearInterval(this.idleInterval);
      this.idleInterval = null;
    }
    stopLogStream(this);
  },

  async loadPanelPrefs() {
    try {
      const res = await API.request("/api/settings/panel-prefs");
      this.state.panelWebhookUrl = res.alert_webhook_url || "";
      const input = document.getElementById("setting-webhook-url");
      if (input && (!document.activeElement || document.activeElement.id !== "setting-webhook-url")) {
        input.value = this.state.panelWebhookUrl;
      }
    } catch (e) { }
  },

  startDashboard() {
    this.stopDashboard();
    this.state.lastActivityAt = Date.now();
    this.fetchStatus();
    this.loadPanelPrefs();
    this.statusInterval = setInterval(() => {
      if (!document.hidden) {
        this.fetchStatus();
      }
    }, this.getPollingRateMs());

    this.idleInterval = setInterval(() => {
      if (this.state.status && this.state.status.state === "Online") {
        if (this.state.idleSecondsRemaining !== null && this.state.idleSecondsRemaining > 0) {
          this.state.idleSecondsRemaining--;
          this.updateIdleBadge();
        }
      }
      const prefs = JSON.parse(localStorage.getItem("mcadmin_webapp_prefs") || "{}");
      const timeoutVal = prefs.sessionTimeout || "60";
      if (this.state.authenticated && timeoutVal !== "never") {
        const mins = parseInt(timeoutVal, 10);
        if (mins > 0 && Date.now() - this.state.lastActivityAt >= mins * 60 * 1000) {
          this.logout();
        }
      }
    }, 1000);

    this.setTab("server");
  },

  async fetchStatus() {
    try {
      const prevMcState = this.state.lastServerState;
      const prevWatchMedia = this.state.lastWatchMediaState;
      const data = await API.request("/api/status");
      this.state.status = data;
      if (data.watch_state) {
        this.state.watchState = data.watch_state;
        this.state.lastWatchMediaState = data.watch_state.media;
      }
      this.state.lastServerState = data.state;
      if (prevMcState) {
        this.checkOutageAlert(prevMcState, data.state);
      }
      if (data.idle && data.idle.remaining_seconds !== undefined) {
        this.state.idleSecondsRemaining = data.idle.remaining_seconds;
      }
      this.pulseUpdateBeacon(data.state);
      this.updateSidebarState(data);
      this.updateIdleBadge();
      if (this.state.activeTab === "server") {
        this.updateServerMetrics(data, this);
        const stateChanged = (prevMcState && prevMcState !== data.state) || (prevWatchMedia && data.watch_state && prevWatchMedia !== data.watch_state.media);
        if (stateChanged) {
          this.loadMediaStatus(true);
        }
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
    const changed = this._lastBeaconState !== state;
    this._lastBeaconState = state;

    if (bText) {
      setHtmlIfChanged(bText, renderStatusBadge(state));
    }

    if (bDot && changed) {
      if (isError) {
        bDot.className = "beacon-dot down flash";
      } else {
        bDot.className = "beacon-dot " + (state === "Online" ? "" : (state === "Asleep" ? "asleep" : "down"));
        bDot.classList.remove("flash");
        void bDot.offsetWidth;
        bDot.classList.add("flash");
      }
    }

    if (sDot && changed) {
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
      setHtmlIfChanged(sText, renderStatusBadge(data.state));
    }

    if (sCount) {
      const nextCount = (data.players && data.players.count !== undefined)
        ? `${data.players.count} / ${data.players.max !== undefined ? data.players.max : 8}`
        : "-";
      setTextIfChanged(sCount, nextCount);
    }
  },

  updateIdleBadge() {
    const idleEl = document.getElementById("topbar-idle-timer");
    const stripIdle = document.getElementById("strip-idle");
    const val = this.state.idleSecondsRemaining !== null ? this.formatSeconds(this.state.idleSecondsRemaining) : "-";
    setTextIfChanged(idleEl, val);
    setTextIfChanged(stripIdle, val);
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
        <button class="btn ${danger ? "btn-danger" : "btn-primary"} btn-sm" id="confirm-modal-ok-btn">${this.escapeHtml(confirmText)}</button>
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

  formatDate,
  updateSquareMeter,
  updateServerMetrics,

  loadMediaStatus(force = false) { return loadMediaStatus(this, force); },
  setMediaGrace() { return setMediaGrace(this); },
  startMediaNow() { return startMediaNow(this); },

  setTab(tab) {
    this.state.activeTab = tab;
    this.closeMobileSidebar();

    document.querySelectorAll(".sidebar-nav-item").forEach(el => {
      el.classList.toggle("active", el.dataset.tab === tab);
    });

    const titles = {
      server: "Server Overview",
      analytics: "Server Analytics",
      properties: "Server Properties",
      console: "Server Console",
      log: "Persistent Server Log",
      players: "Player Management",
      software: "Software Management",
      mods: "Mods & Addons (Modrinth)",
      files: "Server Files",
      worlds: "World Management",
      backups: "World Backups",
      access: "Access Control",
      settings: "Settings"
    };

    const titleEl = document.getElementById("topbar-view-title");
    if (titleEl) titleEl.innerText = titles[tab] || "Dashboard";

    if (tab !== "log") {
      stopLogStream(this);
    }

    this.renderTabContent();

    if (tab === "server") {
      this.fetchStatus();
      this.loadMediaStatus(false);
    }
    if (tab === "analytics") this.loadAnalytics();
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
    if (tab === "settings") this.loadSettings();
  },

  renderTabContent() {
    const main = document.getElementById("main-content");
    if (!main) return;
    const tab = this.state.activeTab;

    if (tab === "analytics") {
      renderAnalyticsPage(this);
      return;
    }
    if (tab === "server") {
      main.innerHTML = renderServerTab();
      if (this.state.status) this.updateServerMetrics(this.state.status, this);
      return;
    }
    const tabRenderers = {
      properties: renderPropertiesTab,
      console: renderConsoleTab,
      log: renderLogsTab,
      players: renderPlayersTab,
      software: renderSoftwareTab,
      mods: renderModsTab,
      files: renderFilesTab,
      worlds: renderWorldsTab,
      backups: renderBackupsTab,
      access: renderAccessTab,
      settings: () => renderSettingsTab(this)
    };
    const fn = tabRenderers[tab];
    if (fn) main.innerHTML = fn();
  },

  loadAnalytics() { return loadAnalytics(this); },
  setHeatmapView(view) { return setHeatmapView(this, view); },
  prevHeatmapPeriod() { return prevHeatmapPeriod(this); },
  nextHeatmapPeriod() { return nextHeatmapPeriod(this); },
  getAllHeatmapWeeks() { return getAllHeatmapWeeks(this); },
  renderHeatmap() { return renderHeatmap(this); },

  loadProperties() { return loadProperties(this); },
  togglePropertySwitch(hiddenInputId) { return togglePropertySwitch(hiddenInputId); },
  saveProperties() { return saveProperties(this); },

  initConsole() { return initConsole(this); },
  sendConsoleCommand() { return sendConsoleCommand(this); },
  sendConsoleCommandSilent(cmd) { return sendConsoleCommandSilent(this, cmd); },
  handleConsoleKey(e) { return handleConsoleKey(this, e); },
  appendConsoleLine(text, type = "normal") { return appendConsoleLine(text, type); },
  clearConsole() { return clearConsole(); },

  initLogs() { return initLogs(this); },
  renderLogs() { return renderLogs(this); },
  appendLogLine(line) { return appendLogLine(this, line); },
  filterLogs(val) { return filterLogs(this, val); },
  formatLogLine(line) { return formatLogLine(line); },

  loadPlayers() { return loadPlayers(this); },
  setPlayerSection(sec) { return setPlayerSection(this, sec); },
  renderPlayerSection() { return renderPlayerSection(this); },
  addPlayerOp() { return addPlayerOp(this); },
  removePlayerOp(name) { return removePlayerOp(this, name); },
  banPlayer() { return banPlayer(this); },
  unbanPlayer(name) { return unbanPlayer(this, name); },
  banIp() { return banIp(this); },
  unbanIp(ip) { return unbanIp(this, ip); },
  addPlayerWhitelist() { return addPlayerWhitelist(this); },
  removePlayerWhitelist(name) { return removePlayerWhitelist(this, name); },
  kickPlayer(name = null) { return kickPlayer(this, name); },
  toggleWhitelist(action) { return toggleWhitelist(this, action); },
  selectPlayerTarget(name) { return selectPlayerTarget(this, name); },

  loadSoftware() { return loadSoftware(this); },
  requestSwitchSoftware(swId, swName) { return requestSwitchSoftware(this, swId, swName); },

  loadMods() { switchModsTab(this, "installed"); },
  switchModsTab(tab) { return switchModsTab(this, tab); },
  renderInstalledMods() { return renderInstalledMods(this); },
  renderBrowseMods() { return renderBrowseMods(this); },
  changeModEnv(env) {
    this.state.modEnv = env;
    document.querySelectorAll("#mod-env-filters .keycap").forEach(k => {
      k.classList.toggle("active", k.innerText.toLowerCase() === env.toLowerCase());
    });
    executeModSearch(this);
  },
  changeModCategory(cat) {
    this.state.modCategory = cat;
    document.querySelectorAll("#mod-cat-filters .keycap").forEach(k => {
      k.classList.toggle("active", k.innerText.toLowerCase() === cat.toLowerCase());
    });
    executeModSearch(this);
  },
  changeModSort(val) {
    this.state.modSort = val;
    executeModSearch(this);
  },
  searchMods(query) {
    this.state.modQuery = (query || "").trim();
    executeModSearch(this);
  },
  executeModSearch() { return executeModSearch(this); },
  installMod(slug, title = null, clientSide = null) { return installMod(this, slug, title, clientSide); },
  removeMod(slug) { return removeMod(this, slug); },
  deleteManualJar(filename) { return deleteManualJar(this, filename); },

  loadFiles(relPath = "") { return loadFiles(this, relPath); },
  openFileEditor(path) { return openFileEditor(this, path); },
  saveFileContent(path) { return saveFileContent(this, path); },
  deleteFileItem(path, name, isDir) { return deleteFileItem(this, path, name, isDir); },
  promptCreateFolder() { return promptCreateFolder(this); },
  uploadFile(input) { return uploadFile(this, input); },

  loadWorlds() { return loadWorlds(this); },
  sendChunkyCommand(action) { return sendChunkyCommand(this, action); },
  jumpToWorldInFiles() {
    const worldName = this.state.worldInfo ? this.state.worldInfo.world_name : "";
    this.setTab("files");
    setTimeout(() => this.loadFiles(worldName), 100);
  },
  showUploadWorldModal() { return showUploadWorldModal(); },
  executeWorldUpload() { return executeWorldUpload(this); },
  showGenerateWorldModal() { return showGenerateWorldModal(); },
  executeWorldGenerate() { return executeWorldGenerate(this); },

  loadBackups() { return loadBackups(this); },
  createBackup() { return createBackup(this); },
  restoreBackup(backupId) { return restoreBackup(this, backupId); },
  loadAccess() { return loadAccess(this); },
  changeAdminPassword() { return changeAdminPassword(this); },
  loadAuditLogs(offset = null) { return loadAuditLogs(this, offset); },
  prevAuditPage() { return prevAuditPage(this); },
  nextAuditPage() { return nextAuditPage(this); },
  loadSettings() { return loadSettings(this); },
  switchSettingsTab(subtab) { return switchSettingsTab(this, subtab); },
  saveMcEnvProperties() { return saveMcEnvProperties(this); },
  previewMcEnvDiff() { return previewMcEnvDiff(this); },
  applyMcEnvSettings() { return applyMcEnvSettings(this); },
  saveAlertWebhook() { return saveAlertWebhook(this); },

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
    this.stopDashboard();
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
            <div class="brand-icon"><span>MC</span></div>
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
          <button class="sidebar-nav-item" data-tab="analytics" onclick="app.setTab('analytics')">
            ${ICONS.analytics}
            <span>Server Analytics</span>
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
          <button class="sidebar-nav-item" data-tab="settings" onclick="app.setTab('settings')">
            ${ICONS.settings}
            <span>Settings</span>
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
            <div class="theme-switch-group" title="Toggle theme (press 'z')">
              <button class="theme-btn ${this.state.theme === "dark" ? "active" : ""}" data-theme="dark" onclick="app.setTheme('dark')" title="Dark theme">Dark</button>
              <button class="theme-btn ${this.state.theme === "medium-dark" ? "active" : ""}" data-theme="medium-dark" onclick="app.setTheme('medium-dark')" title="Medium-dark theme">Mid</button>
              <button class="theme-btn ${this.state.theme === "light" ? "active" : ""}" data-theme="light" onclick="app.setTheme('light')" title="Light theme">Light</button>
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

  escapeHtml,
  formatSeconds
};

window.app = app;

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", () => app.init());
} else {
  app.init();
}
