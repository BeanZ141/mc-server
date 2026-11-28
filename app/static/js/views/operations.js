import { ICONS, escapeHtml, renderStatusBadge, setHtmlIfChanged } from "../api.js?v=20261128-v11";

export function renderPropertiesTab() {
  return `
    <div class="card" style="max-width:900px;">
      <div class="card-header" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
        <div>
          <h2 style="font-size:15px;font-weight:700;text-transform:uppercase;">Server Properties</h2>
          <div style="font-size:12px;color:var(--text-secondary);margin-top:2px;">
            Syncs mc.env and server.properties. Difficulty, Whitelist &amp; Gamemode apply live via RCON; container flags apply on wake or Settings -&gt; Apply &amp; Recreate.
          </div>
        </div>
        <button class="btn btn-primary btn-sm" onclick="app.saveProperties()">${ICONS.check} Save Properties</button>
      </div>

      <div style="padding:20px 24px;display:flex;flex-direction:column;gap:18px;" id="properties-form-container">
        <div style="color:var(--text-muted);font-size:13px;">Loading properties...</div>
      </div>
    </div>
  `;
}

export async function loadProperties(app) {
  const container = document.getElementById("properties-form-container");
  if (!container) return;

  try {
    const props = await app.api.request("/api/settings/properties");
    app.state.properties = props;

    const toggles = [
      { id: "prop-whitelist", key: "whitelist", label: "Whitelist", desc: "Only allow players listed on whitelist.json to connect", def: false },
      { id: "prop-allow-flight", key: "allow_flight", label: "Allow Flight", desc: "Permit non-creative players to fly without being kicked", def: false },
      { id: "prop-pvp", key: "pvp", label: "PvP Combat", desc: "Allow player-versus-player damage", def: true },
      { id: "prop-hardcore", key: "hardcore", label: "Hardcore Mode", desc: "Lock difficulty to Hard and spectate/ban on death", def: false },
      { id: "prop-command-block", key: "enable_command_block", label: "Enable Command Blocks", desc: "Allow redstone command blocks to execute commands", def: false },
      { id: "prop-allow-nether", key: "allow_nether", label: "Allow Nether", desc: "Permit travel to the Nether dimension via portals", def: true },
      { id: "prop-spawn-monsters", key: "spawn_monsters", label: "Spawn Monsters", desc: "Enable hostile mob spawning across worlds", def: true },
      { id: "prop-spawn-animals", key: "spawn_animals", label: "Spawn Animals", desc: "Enable passive animals (cows, sheep, etc.) to spawn", def: true },
      { id: "prop-spawn-npcs", key: "spawn_npcs", label: "Spawn Villagers (NPCs)", desc: "Allow villagers to spawn in generated villages", def: true },
      { id: "prop-force-gamemode", key: "force_gamemode", label: "Force Gamemode on Join", desc: "Reset connecting players back to default gamemode", def: false }
    ];

    container.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:6px;">
        <div class="form-group">
          <label class="form-label" style="font-size:12px;font-weight:600;text-transform:uppercase;color:var(--text-secondary);display:block;margin-bottom:6px;">
            Maximum Players (Slots)
          </label>
          <input type="number" id="prop-max-players" class="input" min="1" max="100" value="${props.max_players !== undefined ? props.max_players : 8}">
        </div>

        <div class="form-group">
          <label class="form-label" style="font-size:12px;font-weight:600;text-transform:uppercase;color:var(--text-secondary);display:block;margin-bottom:6px;">
            Default Gamemode
          </label>
          <select id="prop-gamemode" class="input">
            <option value="survival" ${props.gamemode === "survival" ? "selected" : ""}>Survival</option>
            <option value="creative" ${props.gamemode === "creative" ? "selected" : ""}>Creative</option>
            <option value="adventure" ${props.gamemode === "adventure" ? "selected" : ""}>Adventure</option>
            <option value="spectator" ${props.gamemode === "spectator" ? "selected" : ""}>Spectator</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label" style="font-size:12px;font-weight:600;text-transform:uppercase;color:var(--text-secondary);display:block;margin-bottom:6px;">
            Difficulty
          </label>
          <select id="prop-difficulty" class="input">
            <option value="peaceful" ${props.difficulty === "peaceful" ? "selected" : ""}>Peaceful</option>
            <option value="easy" ${props.difficulty === "easy" ? "selected" : ""}>Easy</option>
            <option value="normal" ${props.difficulty === "normal" ? "selected" : ""}>Normal</option>
            <option value="hard" ${props.difficulty === "hard" ? "selected" : ""}>Hard</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label" style="font-size:12px;font-weight:600;text-transform:uppercase;color:var(--text-secondary);display:block;margin-bottom:6px;">
            Spawn Protection Radius
          </label>
          <input type="number" id="prop-spawn-protection" class="input" min="0" max="1000" value="${props.spawn_protection !== undefined ? props.spawn_protection : 16}">
        </div>

        <div class="form-group">
          <label class="form-label" style="font-size:12px;font-weight:600;text-transform:uppercase;color:var(--text-secondary);display:block;margin-bottom:6px;">
            View Distance (Chunks)
          </label>
          <input type="number" id="prop-view-distance" class="input" min="2" max="32" value="${props.view_distance !== undefined ? props.view_distance : 16}">
        </div>

        <div class="form-group">
          <label class="form-label" style="font-size:12px;font-weight:600;text-transform:uppercase;color:var(--text-secondary);display:block;margin-bottom:6px;">
            Simulation Distance (Chunks)
          </label>
          <input type="number" id="prop-simulation-distance" class="input" min="2" max="32" value="${props.simulation_distance !== undefined ? props.simulation_distance : 6}">
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" style="font-size:12px;font-weight:600;text-transform:uppercase;color:var(--text-secondary);display:block;margin-bottom:6px;">
          Server List MOTD
        </label>
        <input type="text" id="prop-motd" class="input" maxlength="120" value="${escapeHtml(props.motd !== undefined ? props.motd : "palvi")}">
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:12px;margin-top:4px;">
        ${toggles.map(t => {
      const val = props[t.key] !== undefined ? Boolean(props[t.key]) : t.def;
      return `
            <div class="switch-label" onclick="app.togglePropertySwitch('${t.id}')">
              <div>
                <div style="font-size:13px;font-weight:600;">${t.label}</div>
                <div style="font-size:12px;color:var(--text-muted);">${t.desc}</div>
              </div>
              <div class="switch-toggle-box ${val ? "active" : ""}" id="${t.id}-box">
                <div class="switch-toggle-thumb"></div>
              </div>
              <input type="hidden" id="${t.id}" value="${val ? "true" : "false"}">
            </div>
          `;
    }).join("")}
      </div>
    `;
  } catch (e) {
    container.innerHTML = `<span class="badge badge-error">ERROR</span> <span style="margin-left:8px;color:var(--text-secondary);">${escapeHtml(e.message)}</span>`;
  }
}

export function togglePropertySwitch(hiddenInputId) {
  const input = document.getElementById(hiddenInputId);
  const box = document.getElementById(`${hiddenInputId}-box`);
  if (!input || !box) return;

  const next = !(input.value === "true");
  input.value = next ? "true" : "false";
  box.classList.toggle("active", next);
}

export async function saveProperties(app) {
  const maxPlayers = parseInt(document.getElementById("prop-max-players").value, 10);
  const gamemode = document.getElementById("prop-gamemode").value;
  const difficulty = document.getElementById("prop-difficulty").value;
  const spawnProt = parseInt(document.getElementById("prop-spawn-protection").value, 10);
  const viewDist = parseInt(document.getElementById("prop-view-distance").value, 10);
  const simDist = parseInt(document.getElementById("prop-simulation-distance").value, 10);
  const motd = document.getElementById("prop-motd").value.trim();

  const readBool = (id) => document.getElementById(id)?.value === "true";

  try {
    const res = await app.api.request("/api/settings/properties", {
      method: "POST",
      body: {
        max_players: maxPlayers,
        gamemode: gamemode,
        difficulty: difficulty,
        whitelist: readBool("prop-whitelist"),
        allow_flight: readBool("prop-allow-flight"),
        spawn_protection: spawnProt,
        view_distance: viewDist,
        simulation_distance: simDist,
        motd: motd,
        pvp: readBool("prop-pvp"),
        hardcore: readBool("prop-hardcore"),
        enable_command_block: readBool("prop-command-block"),
        allow_nether: readBool("prop-allow-nether"),
        spawn_monsters: readBool("prop-spawn-monsters"),
        spawn_animals: readBool("prop-spawn-animals"),
        spawn_npcs: readBool("prop-spawn-npcs"),
        force_gamemode: readBool("prop-force-gamemode")
      }
    });
    app.state.serverSettingsData = null;
    alert(res.message);
    loadProperties(app);
  } catch (e) {
    alert("Error saving properties: " + e.message);
  }
}

export function renderConsoleTab() {
  const prefs = JSON.parse(localStorage.getItem("mcadmin_webapp_prefs") || "{}");
  const autoChecked = prefs.autoScroll !== false ? "checked" : "";
  return `
    <div class="terminal-window" style="display:flex;flex-direction:column;height:calc(100vh - 120px);background:var(--bg-canvas);border:1px solid var(--border-subtle);">
      <div class="terminal-header" style="display:flex;justify-content:space-between;align-items:center;padding:10px 16px;background:var(--bg-surface);border-bottom:1px solid var(--border-subtle);flex-wrap:wrap;gap:8px;">
        <div style="display:flex;align-items:center;gap:12px;">
          <span style="font-size:12px;font-weight:600;text-transform:uppercase;color:var(--text-primary);">RCON Console Terminal</span>
          <span class="badge" id="console-conn-status">Connected</span>
        </div>
        <div style="display:flex;align-items:center;gap:12px;">
          <label style="font-size:13px;color:var(--text-secondary);display:flex;align-items:center;gap:6px;cursor:pointer;">
            <input type="checkbox" id="console-autoscroll" ${autoChecked} onchange="app.state.autoScrollConsole = this.checked"> Auto-scroll
          </label>
          <button class="btn btn-secondary btn-sm" onclick="app.clearConsole()">Clear</button>
        </div>
      </div>

      <div class="terminal-screen" id="console-scroll-screen" style="flex:1;overflow-y:auto;display:flex;flex-direction:column;background:var(--bg-canvas);">
        <div style="flex:1;min-height:20px;"></div>
        <div id="console-output" style="padding:14px 16px;font-size:12.5px;line-height:1.6;color:var(--text-primary);display:flex;flex-direction:column;gap:3px;">
          <div style="color:var(--text-muted);">[Console Initialized.]</div>
        </div>
      </div>

      <div class="terminal-inline-bar" style="display:flex;align-items:center;gap:10px;padding:10px 16px;background:var(--bg-surface);border-top:1px solid var(--border-subtle);">
        <span style="font-size:14px;font-weight:700;color:var(--text-secondary);user-select:none;">&gt;</span>
        <input type="text" id="console-input" class="input" style="flex:1;background:transparent !important;border:none !important;box-shadow:none !important;padding:4px 0;font-size:13px;color:var(--text-primary);" onkeydown="app.handleConsoleKey(event)">
        <button class="btn btn-primary btn-sm" onclick="app.sendConsoleCommand()">Execute</button>
      </div>
    </div>
  `;
}

export function initConsole(app) {
  const output = document.getElementById("console-output");
  if (output && output.children.length <= 1) {
    sendConsoleCommandSilent(app, "list");
  }
}

export async function sendConsoleCommand(app) {
  const input = document.getElementById("console-input");
  const cmd = input.value.trim();
  if (!cmd) return;

  app.state.consoleHistory.push(cmd);
  app.state.consoleHistoryIdx = app.state.consoleHistory.length;
  input.value = "";

  appendConsoleLine(`> ${cmd}`, "cmd");

  try {
    const res = await app.api.request("/api/console/execute", {
      method: "POST",
      body: { command: cmd }
    });
    if (res.output) {
      appendConsoleLine(res.output, res.success ? "res" : "err");
    } else {
      appendConsoleLine("[Command executed with no return output]", "res");
    }
  } catch (e) {
    appendConsoleLine(`Error executing command: ${e.message}`, "err");
  }
}

export async function sendConsoleCommandSilent(app, cmd) {
  try {
    const res = await app.api.request("/api/console/execute", {
      method: "POST",
      body: { command: cmd }
    });
    if (res.output) {
      appendConsoleLine(res.output, "res");
    }
  } catch (e) { }
}

export function handleConsoleKey(app, e) {
  if (e.key === "Enter") {
    sendConsoleCommand(app);
  } else if (e.key === "ArrowUp") {
    if (app.state.consoleHistoryIdx > 0) {
      app.state.consoleHistoryIdx--;
      e.target.value = app.state.consoleHistory[app.state.consoleHistoryIdx] || "";
    }
  } else if (e.key === "ArrowDown") {
    if (app.state.consoleHistoryIdx < app.state.consoleHistory.length - 1) {
      app.state.consoleHistoryIdx++;
      e.target.value = app.state.consoleHistory[app.state.consoleHistoryIdx] || "";
    } else {
      app.state.consoleHistoryIdx = app.state.consoleHistory.length;
      e.target.value = "";
    }
  }
}

export function appendConsoleLine(text, type = "normal") {
  const output = document.getElementById("console-output");
  if (!output) return;

  const prefs = JSON.parse(localStorage.getItem("mcadmin_webapp_prefs") || "{}");
  const bufferLimit = Math.max(50, parseInt(prefs.consoleBuffer, 10) || 250);

  const lines = String(text).split(/\r?\n/);
  lines.forEach(rawLine => {
    const lineEl = document.createElement("div");
    if (type === "cmd" || rawLine.startsWith("> ")) {
      lineEl.className = "console-line-cmd";
      const promptSpan = document.createElement("span");
      promptSpan.className = "console-prompt";
      promptSpan.textContent = ">";
      const textSpan = document.createElement("span");
      textSpan.className = "console-cmd-text";
      textSpan.textContent = rawLine.startsWith("> ") ? rawLine.slice(2) : rawLine;
      lineEl.appendChild(promptSpan);
      lineEl.appendChild(textSpan);
    } else {
      const lower = rawLine.toLowerCase();
      if (type === "err" || lower.includes("error") || lower.includes("exception") || lower.includes("failed") || lower.includes("fatal") || lower.includes("unknown or incomplete") || lower.includes("cannot execute")) {
        lineEl.className = "console-line-err";
      } else if (lower.includes("warn") || lower.includes("warning")) {
        lineEl.className = "console-line-warn";
      } else if (lower.includes("done (") || lower.includes("saved the game") || lower.includes("joined the game") || lower.includes("success")) {
        lineEl.className = "console-line-success";
      } else {
        lineEl.className = "console-line-info";
      }
      lineEl.textContent = rawLine;
    }
    output.appendChild(lineEl);
  });

  while (output.children.length > bufferLimit) {
    output.removeChild(output.firstChild);
  }

  const autoScroll = document.getElementById("console-autoscroll");
  const screen = document.getElementById("console-scroll-screen") || output;
  if (!autoScroll || autoScroll.checked) {
    screen.scrollTop = screen.scrollHeight;
  }
}

export function clearConsole() {
  const output = document.getElementById("console-output");
  if (output) output.innerHTML = `<div style="color:var(--text-muted);">[Console cleared]</div>`;
}

export function renderLogsTab() {
  const prefs = JSON.parse(localStorage.getItem("mcadmin_webapp_prefs") || "{}");
  const autoChecked = prefs.autoScroll !== false ? "checked" : "";
  return `
    <div style="display:flex;flex-direction:column;height:calc(100vh - 120px);">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:var(--bg-surface);border:1px solid var(--border-subtle);border-bottom:none;flex-wrap:wrap;gap:12px;">
        <div style="display:flex;align-items:center;gap:12px;">
          <span style="font-size:12px;font-weight:600;text-transform:uppercase;color:var(--text-primary);">latest.log Viewer</span>
          <span id="logs-sse-status">${renderStatusBadge("asleep", "CONNECTING")}</span>
          <span style="font-size:13px;color:var(--text-muted);">(Preserved across restarts and offline)</span>
        </div>
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
          <div style="position:relative;width:240px;">
            <input type="text" class="input" id="log-filter-input" placeholder="Filter log entries..." oninput="app.filterLogs(this.value)" style="padding-left:26px;font-size:12px;height:30px;">
            <span style="position:absolute;left:8px;top:7px;color:var(--text-muted);">${ICONS.search}</span>
          </div>
          <label style="font-size:13px;color:var(--text-secondary);display:flex;align-items:center;gap:6px;cursor:pointer;">
            <input type="checkbox" id="log-autoscroll" ${autoChecked} onchange="app.state.autoScrollLogs = this.checked"> Auto-scroll
          </label>
          <button class="btn btn-secondary btn-sm" onclick="app.initLogs()">${ICONS.refresh} Refresh</button>
          <a href="/api/files/download?path=logs/latest.log" target="_blank" class="btn btn-secondary btn-sm">${ICONS.download} Download</a>
        </div>
      </div>

      <div class="terminal" id="log-output" style="flex:1;overflow-y:auto;background:var(--bg-canvas);border:1px solid var(--border-subtle);padding:14px 16px;font-size:12px;line-height:1.55;color:var(--text-primary);">
        <div style="color:var(--text-muted);">Loading server log...</div>
      </div>
    </div>
  `;
}

function setLogStreamStatus(stateKey, label) {
  const el = document.getElementById("logs-sse-status");
  if (el) {
    setHtmlIfChanged(el, renderStatusBadge(stateKey, label));
  }
}

export function stopLogStream(app) {
  if (app.sseReconnectTimer) {
    clearTimeout(app.sseReconnectTimer);
    app.sseReconnectTimer = null;
  }
  if (app.sseLogSource) {
    app.sseLogSource.close();
    app.sseLogSource = null;
  }
}

function connectLogStream(app) {
  stopLogStream(app);
  if (app.state.activeTab !== "log") return;

  const src = new EventSource("/api/logs/stream");
  app.sseLogSource = src;

  src.onopen = () => {
    app.sseRetryCount = 0;
    setLogStreamStatus("online", "LIVE");
  };

  src.onmessage = (event) => {
    app.sseRetryCount = 0;
    setLogStreamStatus("online", "LIVE");
    app.state.logs.push(event.data);
    if (app.state.logs.length > 2000) app.state.logs.shift();
    appendLogLine(app, event.data);
  };

  src.onerror = () => {
    if (app.sseLogSource) {
      app.sseLogSource.close();
      app.sseLogSource = null;
    }
    if (app.state.activeTab !== "log") return;
    app.sseRetryCount = (app.sseRetryCount || 0) + 1;
    if (app.sseRetryCount <= 5) {
      const delay = Math.min(15000, 1000 * Math.pow(2, app.sseRetryCount - 1));
      setLogStreamStatus("asleep", "RECONNECTING");
      app.sseReconnectTimer = setTimeout(() => connectLogStream(app), delay);
    } else {
      setLogStreamStatus("offline", "DISCONNECTED");
    }
  };
}

export async function initLogs(app) {
  const output = document.getElementById("log-output");
  if (!output) return;
  stopLogStream(app);
  app.sseRetryCount = 0;
  setLogStreamStatus("asleep", "CONNECTING");

  try {
    const res = await app.api.request("/api/logs/tail?lines=500");
    app.state.logs = res.lines || [];
    renderLogs(app);
    connectLogStream(app);
  } catch (e) {
    setLogStreamStatus("error", "ERROR");
    output.innerHTML = `<span class="badge badge-error">ERROR</span> <span style="margin-left:8px;color:var(--text-secondary);">${escapeHtml(e.message)}</span>`;
  }
}

export function renderLogs(app) {
  const output = document.getElementById("log-output");
  if (!output) return;

  const filter = app.state.logFilter.toLowerCase();
  const filtered = filter ? app.state.logs.filter(l => l.toLowerCase().includes(filter)) : app.state.logs;

  output.innerHTML = filtered.map(line => formatLogLine(line)).join("");

  const autoScroll = document.getElementById("log-autoscroll");
  if (!autoScroll || autoScroll.checked) {
    output.scrollTop = output.scrollHeight;
  }
}

export function appendLogLine(app, line) {
  const output = document.getElementById("log-output");
  if (!output) return;

  const filter = app.state.logFilter.toLowerCase();
  if (filter && !line.toLowerCase().includes(filter)) return;

  const div = document.createElement("div");
  div.innerHTML = formatLogLine(line);
  output.appendChild(div);

  while (output.children.length > 2000) {
    output.removeChild(output.firstChild);
  }

  const autoScroll = document.getElementById("log-autoscroll");
  if (!autoScroll || autoScroll.checked) {
    output.scrollTop = output.scrollHeight;
  }
}

export function filterLogs(app, val) {
  app.state.logFilter = val;
  renderLogs(app);
}

export function formatLogLine(line) {
  let color = "var(--text-secondary)";
  let isErr = false;
  if (line.includes("/ERROR]") || line.includes("Exception") || line.includes("Error")) {
    color = "var(--color-error)";
    isErr = true;
  } else if (line.includes("/WARN]")) {
    color = "var(--color-warning)";
  } else if (line.includes("/INFO]")) {
    color = "var(--text-primary)";
  }
  return `<div style="color:${color};font-family:var(--font-universal);white-space:pre-wrap;word-break:break-all;">${isErr ? '<span class="badge badge-error" style="margin-right:6px;font-size:9.5px;padding:1px 5px;">ERROR</span>' : ""}${escapeHtml(line)}</div>`;
}

export function renderPlayersTab() {
  return `
    <div class="card" style="padding:16px 20px;margin-bottom:16px;" id="players-online-bar">
      <div style="color:var(--text-muted);font-size:12px;">Loading online players &amp; whitelist controls...</div>
    </div>

    <div class="subnav-tabs">
      <button class="subnav-btn active" data-sub="ops" onclick="app.setPlayerSection('ops')">OP Players</button>
      <button class="subnav-btn" data-sub="banned_players" onclick="app.setPlayerSection('banned_players')">Banned Players</button>
      <button class="subnav-btn" data-sub="banned_ips" onclick="app.setPlayerSection('banned_ips')">Banned IPs</button>
      <button class="subnav-btn" data-sub="whitelisted" onclick="app.setPlayerSection('whitelisted')">Whitelisted Players</button>
      <button class="subnav-btn" data-sub="offline" onclick="app.setPlayerSection('offline')">Offline Players</button>
    </div>

    <div id="player-section-content"></div>
  `;
}

function renderOnlinePlayersBar(app) {
  const bar = document.getElementById("players-online-bar");
  if (!bar) return;
  const online = (app.state.playersData && app.state.playersData.online_players) || [];
  const chipsHtml = online.length === 0
    ? `<span style="font-size:12px;color:var(--text-muted);">No players currently online.</span>`
    : online.map(name => `
        <div style="display:inline-flex;align-items:center;gap:8px;padding:6px 10px;background:var(--bg-surface-elevated);border:1px solid var(--border-subtle);">
          ${renderStatusBadge("online", name)}
          <button class="btn btn-secondary btn-sm" style="padding:2px 6px;font-size:10.5px;" onclick="app.selectPlayerTarget('${escapeHtml(name)}')" title="Copy name to action input">Select</button>
          <button class="btn btn-danger btn-sm" style="padding:2px 6px;font-size:10.5px;" onclick="app.kickPlayer('${escapeHtml(name)}')">Kick</button>
        </div>
      `).join("");

  bar.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:10px;">
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="font-size:12px;font-weight:700;text-transform:uppercase;color:var(--text-primary);">Online Players (${online.length})</span>
      </div>
      <div class="btn-group">
        <button class="btn btn-secondary btn-sm" onclick="app.toggleWhitelist('on')">Whitelist ON</button>
        <button class="btn btn-secondary btn-sm" onclick="app.toggleWhitelist('off')">Whitelist OFF</button>
        <button class="btn btn-secondary btn-sm" onclick="app.loadPlayers()">${ICONS.refresh} Refresh</button>
      </div>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;">
      ${chipsHtml}
    </div>
  `;
}

export async function loadPlayers(app) {
  try {
    const data = await app.api.request("/api/players/all");
    app.state.playersData = data;
    renderPlayerSection(app);
  } catch (e) {
    console.error("Failed to load players data:", e);
  }
}

export function setPlayerSection(app, sec) {
  app.state.playerSection = sec;
  document.querySelectorAll(".subnav-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.sub === sec);
  });
  renderPlayerSection(app);
}

export function renderPlayerSection(app) {
  renderOnlinePlayersBar(app);
  const container = document.getElementById("player-section-content");
  if (!container) return;

  const sec = app.state.playerSection;
  const data = app.state.playersData;

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
  const supportsReason = sec === "banned_players" || sec === "banned_ips";
  if (sec !== "offline") {
    formHtml = `
      <div style="display:flex;gap:10px;margin-bottom:18px;flex-wrap:wrap;">
        <input type="text" id="player-action-input" class="input" style="max-width:260px;" placeholder="${cfg.placeholder}">
        ${supportsReason ? `<input type="text" id="player-reason-input" class="input" style="max-width:240px;" placeholder="Reason (optional)">` : ""}
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
              <th>Details</th>
              ${sec !== "offline" ? '<th style="text-align:right;">Actions</th>' : "<th>Status</th>"}
            </tr>
          </thead>
          <tbody>
            ${cfg.list.map(item => {
      const displayId = typeof item === "string" ? item : (item.name || item.ip || "");
      let details = "-";
      if (item && typeof item === "object") {
        if (item.reason) details = item.reason;
        else if (item.level !== undefined) details = `Level ${item.level}`;
        else if (item.uuid) details = item.uuid;
      }
      return `
                <tr>
                  <td style="font-weight:600;">${escapeHtml(displayId)}</td>
                  <td style="color:var(--text-secondary);font-size:12px;">${escapeHtml(details)}</td>
                  ${sec !== "offline" ? `
                    <td style="text-align:right;">
                      <button class="btn btn-danger btn-sm" onclick="${cfg.onRemove}('${escapeHtml(displayId)}')">${ICONS.trash} Remove</button>
                    </td>
                  ` : `
                    <td>${renderStatusBadge("Offline")}</td>
                  `}
                </tr>
              `;
    }).join("")}
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
}

export async function addPlayerOp(app) {
  const input = document.getElementById("player-action-input");
  const name = input ? input.value.trim() : "";
  if (!name) return;
  try {
    await app.api.request("/api/players/ops", { method: "POST", body: { player: name } });
    input.value = "";
    loadPlayers(app);
  } catch (e) {
    alert(e.message);
  }
}

export function removePlayerOp(app, name) {
  app.showConfirmModal("De-op Player", `Remove operator privileges from ${name}?`, async () => {
    try {
      await app.api.request(`/api/players/ops/${encodeURIComponent(name)}`, { method: "DELETE" });
      loadPlayers(app);
    } catch (e) {
      alert(e.message);
    }
  });
}

export async function banPlayer(app) {
  const input = document.getElementById("player-action-input");
  const reasonEl = document.getElementById("player-reason-input");
  const name = input ? input.value.trim() : "";
  const reason = reasonEl ? reasonEl.value.trim() : "";
  if (!name) return;
  try {
    await app.api.request("/api/players/ban", {
      method: "POST",
      body: reason ? { player: name, reason: reason } : { player: name }
    });
    input.value = "";
    if (reasonEl) reasonEl.value = "";
    loadPlayers(app);
  } catch (e) {
    alert(e.message);
  }
}

export function unbanPlayer(app, name) {
  app.showConfirmModal("Unban Player", `Pardon and unban ${name}?`, async () => {
    try {
      await app.api.request("/api/players/unban", { method: "POST", body: { player: name } });
      loadPlayers(app);
    } catch (e) {
      alert(e.message);
    }
  });
}

export async function banIp(app) {
  const input = document.getElementById("player-action-input");
  const reasonEl = document.getElementById("player-reason-input");
  const ip = input ? input.value.trim() : "";
  const reason = reasonEl ? reasonEl.value.trim() : "";
  if (!ip) return;
  try {
    await app.api.request("/api/players/ban-ip", {
      method: "POST",
      body: reason ? { ip: ip, reason: reason } : { ip: ip }
    });
    input.value = "";
    if (reasonEl) reasonEl.value = "";
    loadPlayers(app);
  } catch (e) {
    alert(e.message);
  }
}

export function unbanIp(app, ip) {
  app.showConfirmModal("Unban IP", `Unban IP address ${ip}?`, async () => {
    try {
      await app.api.request("/api/players/unban-ip", { method: "POST", body: { ip: ip } });
      loadPlayers(app);
    } catch (e) {
      alert(e.message);
    }
  });
}

export async function addPlayerWhitelist(app) {
  const input = document.getElementById("player-action-input");
  const name = input ? input.value.trim() : "";
  if (!name) return;
  try {
    await app.api.request("/api/players/whitelist", { method: "POST", body: { player: name } });
    input.value = "";
    loadPlayers(app);
  } catch (e) {
    alert(e.message);
  }
}

export function removePlayerWhitelist(app, name) {
  app.showConfirmModal("Remove Whitelist", `Remove ${name} from whitelist?`, async () => {
    try {
      await app.api.request(`/api/players/whitelist/${encodeURIComponent(name)}`, { method: "DELETE" });
      loadPlayers(app);
    } catch (e) {
      alert(e.message);
    }
  });
}

export function selectPlayerTarget(app, name) {
  const input = document.getElementById("player-action-input");
  if (input) {
    input.value = name;
    input.focus();
  }
}

export async function toggleWhitelist(app, action) {
  try {
    const res = await app.api.request("/api/players/whitelist", {
      method: "POST",
      body: { action: action }
    });
    alert(res.output || `Whitelist turned ${action.toUpperCase()}.`);
  } catch (e) {
    alert("Failed to toggle whitelist: " + e.message);
  }
}

export function kickPlayer(app, name = null) {
  const target = (name || document.getElementById("player-action-input")?.value || "").trim();
  if (!target) return;

  const overlay = document.getElementById("modal-overlay");
  const body = document.getElementById("modal-body");
  body.innerHTML = `
    <div class="modal-header">
      <h3 style="font-size:14px;font-weight:700;text-transform:uppercase;">Kick ${escapeHtml(target)}</h3>
      <button class="btn btn-secondary btn-sm" onclick="app.closeModal()">✕</button>
    </div>
    <div style="padding:18px 20px;display:flex;flex-direction:column;gap:12px;">
      <p style="font-size:12.5px;color:var(--text-secondary);">Disconnect <strong>${escapeHtml(target)}</strong> from the live server.</p>
      <div>
        <label style="font-size:11px;font-weight:600;text-transform:uppercase;color:var(--text-secondary);display:block;margin-bottom:4px;">Reason (Optional)</label>
        <input type="text" id="kick-reason-input" class="input" placeholder="Kicked by admin">
      </div>
    </div>
    <div class="modal-footer" style="display:flex;justify-content:flex-end;gap:10px;padding:12px 20px;border-top:1px solid var(--border-subtle);">
      <button class="btn btn-secondary btn-sm" onclick="app.closeModal()">Cancel</button>
      <button class="btn btn-danger btn-sm" id="kick-confirm-btn">Kick Player</button>
    </div>
  `;
  document.getElementById("kick-confirm-btn").onclick = async () => {
    const reason = (document.getElementById("kick-reason-input")?.value || "").trim() || "Kicked by admin";
    app.closeModal();
    try {
      const res = await app.api.request("/api/players/kick", {
        method: "POST",
        body: { player: target, reason: reason }
      });
      alert(res.output || `Kicked ${target}.`);
      loadPlayers(app);
    } catch (e) {
      alert("Kick failed: " + e.message);
    }
  };
  overlay.style.display = "flex";
}
