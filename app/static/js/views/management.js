import { ICONS, escapeHtml, formatDate } from "../api.js";
import { updateSquareMeter } from "./server.js";

export function renderSoftwareTab() {
  return `
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
}

export async function loadSoftware(app) {
  const container = document.getElementById("software-grid-container");
  if (!container) return;

  try {
    const data = await app.api.request("/api/software");
    app.state.currentSoftware = data.current;
    app.state.softwareCatalog = data.available;

    container.innerHTML = data.available.map(sw => {
      const isCurrent = sw.id === data.current.type;
      return `
        <div class="software-card ${isCurrent ? "active" : ""}">
          <div>
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">
              <h3 style="font-size:15px;font-weight:700;">${escapeHtml(sw.name)}</h3>
              <span class="software-badge ${isCurrent ? "active" : ""}">
                ${isCurrent ? "Active · " + (data.current.version || "-") : (sw.supports_mods ? "Modded" : "Vanilla")}
              </span>
            </div>
            <p style="font-size:12.5px;color:var(--text-secondary);line-height:1.55;margin-bottom:14px;">
              ${escapeHtml(sw.description)}
            </p>
          </div>

          <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--border-subtle);padding-top:12px;margin-top:12px;">
            <span style="font-size:13px;color:var(--text-muted);">
              ${sw.supports_mods ? "Supports Mods" : (sw.supports_plugins ? "Supports Plugins" : "Standard")}
            </span>
            ${isCurrent ? `
              <button class="btn btn-secondary btn-sm" disabled>Current Software</button>
            ` : `
              <button class="btn btn-secondary btn-sm" onclick="app.requestSwitchSoftware('${sw.id}', '${escapeHtml(sw.name)}')">Switch to ${escapeHtml(sw.name)}</button>
            `}
          </div>
        </div>
      `;
    }).join("");
  } catch (e) {
    container.innerHTML = `<span class="badge badge-error">ERROR</span> <span style="margin-left:8px;color:var(--text-secondary);">${escapeHtml(e.message)}</span>`;
  }
}

export function requestSwitchSoftware(app, swId, swName) {
  app.showConfirmModal(
    `Switch to ${swName}`,
    `WARNING: Fabric is the default and current server software. Switching to ${swName} will disable installed Fabric mods and may require world backup. Confirm to proceed.`,
    async () => {
      try {
        const res = await app.api.request("/api/software/switch", {
          method: "POST",
          body: { software_id: swId, confirm: true }
        });
        alert(res.message);
        loadSoftware(app);
      } catch (e) {
        alert(e.message);
      }
    },
    { danger: true, confirmText: "Switch Software" }
  );
}

export function renderModsTab() {
  return `
    <div class="subnav-tabs">
      <button class="subnav-btn active" id="mods-tab-installed" onclick="app.switchModsTab('installed')">Installed Mods</button>
      <button class="subnav-btn" id="mods-tab-browse" onclick="app.switchModsTab('browse')">Search & Install (Modrinth)</button>
    </div>

    <div id="mods-content-view"></div>
  `;
}

export function switchModsTab(app, tab) {
  const btnInstalled = document.getElementById("mods-tab-installed");
  const btnBrowse = document.getElementById("mods-tab-browse");
  const view = document.getElementById("mods-content-view");
  if (!view) return;

  if (btnInstalled) btnInstalled.classList.toggle("active", tab === "installed");
  if (btnBrowse) btnBrowse.classList.toggle("active", tab === "browse");

  if (tab === "installed") {
    renderInstalledMods(app);
  } else {
    renderBrowseMods(app);
  }
}

export async function renderInstalledMods(app) {
  const view = document.getElementById("mods-content-view");
  if (!view) return;

  view.innerHTML = `<div style="color:var(--text-muted);font-size:13px;padding:20px 0;">Loading installed mods...</div>`;

  try {
    const data = await app.api.request("/api/mods/installed");
    app.state.installedMods = data;
    const sw = app.state.status || {};
    const loaderLabel = data.loader ? `${data.loader.charAt(0).toUpperCase() + data.loader.slice(1)} ${data.game_version || ""}`.trim() : `${sw.software || "Fabric"} ${sw.version || "26.3"}`;

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
                    <div style="font-weight:600;">${escapeHtml(m.title || m.slug)}</div>
                    <div style="font-size:11px;color:var(--text-muted);">${escapeHtml(m.slug)}${m.installed_jar ? ` · ${escapeHtml(m.installed_jar)}` : ""}</div>
                  </td>
                  <td><span class="badge">Modrinth</span></td>
                  <td><span class="badge" style="color:#22c55e;">${escapeHtml(loaderLabel)}</span></td>
                  <td style="text-align:right;">
                    <button class="btn btn-danger btn-sm" onclick="app.removeMod('${escapeHtml(m.slug)}')">${ICONS.trash} Remove</button>
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
            <h2 style="font-size:15px;font-weight:700;text-transform:uppercase;">Installed ${escapeHtml(loaderLabel)} Mods</h2>
            <div style="font-size:12px;color:var(--text-secondary);">Managed automatically via MODRINTH_PROJECTS in mc.env</div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="app.switchModsTab('browse')">${ICONS.plus} Install New Mod</button>
        </div>
        ${managedHtml}
      </div>
    `;
  } catch (e) {
    view.innerHTML = `<span class="badge badge-error">ERROR</span> <span style="margin-left:8px;color:var(--text-secondary);">${escapeHtml(e.message)}</span>`;
  }
}

export function renderBrowseMods(app) {
  const view = document.getElementById("mods-content-view");
  if (!view) return;

  view.innerHTML = `
    <div class="card" style="padding:22px 24px;margin-bottom:20px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:16px;">
        <div>
          <h2 style="font-size:15px;font-weight:700;text-transform:uppercase;">Browse Modrinth Repository</h2>
          <div style="font-size:12px;color:var(--text-secondary);margin-top:2px;" id="modrinth-target-subtitle">
            Direct Modrinth API catalog
          </div>
        </div>

        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          <label style="font-size:12px;color:var(--text-muted);font-weight:600;text-transform:uppercase;">Sort:</label>
          <select id="mod-sort-select" class="input" style="width:auto;padding:5px 10px;font-size:12px;" onchange="app.changeModSort(this.value)">
            <option value="downloads" ${app.state.modSort === "downloads" ? "selected" : ""}>Most Downloaded</option>
            <option value="follows" ${app.state.modSort === "follows" ? "selected" : ""}>Most Followed</option>
            <option value="updated" ${app.state.modSort === "updated" ? "selected" : ""}>Recently Updated</option>
            <option value="newest" ${app.state.modSort === "newest" ? "selected" : ""}>Newest</option>
            <option value="relevance" ${app.state.modSort === "relevance" ? "selected" : ""}>Relevance</option>
          </select>
        </div>
      </div>

      <div style="display:flex;gap:10px;margin-bottom:16px;">
        <input type="text" id="mod-search-input" class="input" style="flex:1;" placeholder="Search mods (e.g. lithium, ferrite-core, sodium)..." value="${escapeHtml(app.state.modQuery || "")}" onkeydown="if(event.key==='Enter') app.searchMods(this.value)">
        <button class="btn btn-primary" onclick="app.searchMods(document.getElementById('mod-search-input').value)">${ICONS.search} Search</button>
      </div>

      <div style="display:flex;flex-direction:column;gap:12px;border-top:1px solid var(--border-subtle);padding-top:14px;">
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
          <span style="font-size:11px;font-weight:600;text-transform:uppercase;color:var(--text-muted);min-width:90px;">Environment:</span>
          <div style="display:flex;gap:6px;flex-wrap:wrap;" id="mod-env-filters">
            <button class="keycap ${app.state.modEnv === "all" ? "active" : ""}" onclick="app.changeModEnv('all')">All</button>
            <button class="keycap ${app.state.modEnv === "client" ? "active" : ""}" onclick="app.changeModEnv('client')">Client</button>
            <button class="keycap ${app.state.modEnv === "server" ? "active" : ""}" onclick="app.changeModEnv('server')">Server</button>
          </div>
        </div>

        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
          <span style="font-size:11px;font-weight:600;text-transform:uppercase;color:var(--text-muted);min-width:90px;">Categories:</span>
          <div style="display:flex;gap:6px;flex-wrap:wrap;" id="mod-cat-filters">
            <button class="keycap ${app.state.modCategory === "all" ? "active" : ""}" onclick="app.changeModCategory('all')">All</button>
            <button class="keycap ${app.state.modCategory === "optimization" ? "active" : ""}" onclick="app.changeModCategory('optimization')">Optimization</button>
            <button class="keycap ${app.state.modCategory === "utility" ? "active" : ""}" onclick="app.changeModCategory('utility')">Utility</button>
            <button class="keycap ${app.state.modCategory === "decoration" ? "active" : ""}" onclick="app.changeModCategory('decoration')">Decoration</button>
            <button class="keycap ${app.state.modCategory === "technology" ? "active" : ""}" onclick="app.changeModCategory('technology')">Technology</button>
            <button class="keycap ${app.state.modCategory === "adventure" ? "active" : ""}" onclick="app.changeModCategory('adventure')">Adventure</button>
            <button class="keycap ${app.state.modCategory === "magic" ? "active" : ""}" onclick="app.changeModCategory('magic')">Magic</button>
            <button class="keycap ${app.state.modCategory === "storage" ? "active" : ""}" onclick="app.changeModCategory('storage')">Storage</button>
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

  executeModSearch(app);
}

export async function executeModSearch(app) {
  const area = document.getElementById("mod-search-results-area");
  if (!area) return;

  area.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:10px;padding:30px 0;align-items:center;">
      <div class="loading-skeleton" style="width:240px;height:16px;"></div>
      <span style="color:var(--text-muted);font-size:12px;">Querying Modrinth...</span>
    </div>
  `;

  const q = encodeURIComponent(app.state.modQuery || "");
  const sort = encodeURIComponent(app.state.modSort || "downloads");
  const cat = app.state.modCategory && app.state.modCategory !== "all" ? `&category=${encodeURIComponent(app.state.modCategory)}` : "";
  const env = app.state.modEnv && app.state.modEnv !== "all" ? `&environment=${encodeURIComponent(app.state.modEnv)}` : "";

  try {
    const res = await app.api.request(`/api/mods/search?q=${q}&sort=${sort}${cat}${env}&limit=20`);
    app.state.modSearchResults = res.hits || [];

    const loaderBadge = res.loader ? `${res.loader.charAt(0).toUpperCase() + res.loader.slice(1)} ${res.game_version || ""}`.trim() : "Fabric 26.3";
    const subEl = document.getElementById("modrinth-target-subtitle");
    if (subEl) subEl.innerText = `Direct Modrinth API catalog · ${loaderBadge} verified`;

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
                  <h3 style="font-size:14px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:2px;">${escapeHtml(h.title)}</h3>
                  <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">by ${escapeHtml(h.author)}</div>
                  <div style="display:flex;align-items:center;gap:10px;font-size:11px;color:var(--text-secondary);">
                    <span>${(h.downloads || 0).toLocaleString()} dl</span>
                    <span>·</span>
                    <span>Updated ${formatDate(h.date_modified)}</span>
                  </div>
                </div>
              </div>

              <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;">
                <span class="badge" style="font-size:10px;padding:2px 6px;">Client: ${h.client_side || "optional"}</span>
                <span class="badge" style="font-size:10px;padding:2px 6px;">Server: ${h.server_side || "optional"}</span>
              </div>

              <p style="font-size:12px;color:var(--text-secondary);line-height:1.5;margin-bottom:12px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;min-height:54px;">
                ${escapeHtml(h.description)}
              </p>
            </div>

            <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--border-subtle);padding-top:10px;">
              <span class="badge" style="color:#22c55e;">${escapeHtml(loaderBadge)}</span>
              <button class="btn btn-primary btn-sm" onclick="app.installMod('${escapeHtml(h.slug)}')">${ICONS.plus} Install</button>
            </div>
          </div>
        `).join("")}
      </div>
    `;
  } catch (e) {
    if (area) area.innerHTML = `<span class="badge badge-error">ERROR</span> <span style="margin-left:8px;color:var(--text-secondary);">${escapeHtml(e.message)}</span>`;
  }
}

export function installMod(app, slug) {
  app.showConfirmModal(
    `Install ${slug}`,
    `Install mod '${slug}' from Modrinth? This will add it to mc.env and recreate the server container.`,
    async () => {
      try {
        const res = await app.api.request("/api/mods/add", { method: "POST", body: { slug: slug } });
        alert(res.message);
        switchModsTab(app, "installed");
      } catch (e) {
        alert(e.message);
      }
    },
    { danger: false, confirmText: "Install Mod" }
  );
}

export function removeMod(app, slug) {
  app.showConfirmModal(
    `Remove ${slug}`,
    `Remove mod '${slug}' from server? The mod will be removed from mc.env and deleted from mods folder.`,
    async () => {
      try {
        const res = await app.api.request("/api/mods/remove", { method: "POST", body: { slug: slug } });
        alert(res.message);
        renderInstalledMods(app);
      } catch (e) {
        alert(e.message);
      }
    },
    { danger: true, confirmText: "Remove Mod" }
  );
}

export function renderFilesTab() {
  return `
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
}

export async function loadFiles(app, relPath = "") {
  app.state.currentFilePath = relPath;
  const body = document.getElementById("files-table-body");
  const bc = document.getElementById("files-breadcrumbs");

  if (body) body.innerHTML = `<tr><td colspan="4" style="color:var(--text-muted);text-align:center;padding:30px;">Loading files...</td></tr>`;

  try {
    const data = await app.api.request(`/api/files/list?path=${encodeURIComponent(relPath)}`);
    app.state.fileItems = data.items || [];
    app.state.fileBreadcrumbs = data.breadcrumbs || [];

    if (bc) {
      bc.innerHTML = data.breadcrumbs.map((b, idx) => {
        const isLast = idx === data.breadcrumbs.length - 1;
        if (isLast) {
          return `<span class="breadcrumb-current">${escapeHtml(b.name)}</span>`;
        }
        return `
          <span class="breadcrumb-item" onclick="app.loadFiles('${escapeHtml(b.path)}')">${escapeHtml(b.name)}</span>
          <span class="breadcrumb-separator">/</span>
        `;
      }).join("");
    }

    if (body) {
      if (!data.items || data.items.length === 0) {
        body.innerHTML = `<tr><td colspan="4" style="color:var(--text-muted);text-align:center;padding:30px;">This directory is empty.</td></tr>`;
        return;
      }

      body.innerHTML = data.items.map(item => {
        const isDir = item.type === "directory";
        const canOpenText = !isDir && (item.editable || item.read_only);
        const clickHandler = isDir
          ? `app.loadFiles('${escapeHtml(item.path)}')`
          : (canOpenText ? `app.openFileEditor('${escapeHtml(item.path)}')` : "");

        return `
          <tr>
            <td>
              <div class="file-name-cell" onclick="${clickHandler}">
                <span style="opacity:0.8;">${isDir ? ICONS.folder : ICONS.file}</span>
                <span style="font-weight:${isDir ? "600" : "400"};">${escapeHtml(item.name)}</span>
                ${item.read_only ? `<span class="badge" style="margin-left:8px;font-size:9.5px;color:var(--color-warning);" title="${escapeHtml(item.warning || "Read-only file")}">READ-ONLY</span>` : ""}
              </div>
            </td>
            <td style="color:var(--text-secondary);font-size:12px;">${item.size_formatted}</td>
            <td style="color:var(--text-muted);font-size:13px;">${item.modified}</td>
            <td style="text-align:right;">
              <div style="display:inline-flex;gap:6px;">
                ${canOpenText ? `
                  <button class="btn btn-secondary btn-sm" onclick="app.openFileEditor('${escapeHtml(item.path)}')">${ICONS.edit} ${item.read_only ? "View" : "Edit"}</button>
                ` : ""}
                <a href="/api/files/download?path=${encodeURIComponent(item.path)}" target="_blank" class="btn btn-secondary btn-sm" title="Download">${ICONS.download}</a>
                ${!item.read_only ? `
                  <button class="btn btn-danger btn-sm" onclick="app.deleteFileItem('${escapeHtml(item.path)}', '${escapeHtml(item.name)}', ${isDir})" title="Delete">${ICONS.trash}</button>
                ` : ""}
              </div>
            </td>
          </tr>
        `;
      }).join("");
    }
  } catch (e) {
    if (body) body.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:30px;"><span class="badge badge-error">ERROR</span> <span style="margin-left:8px;color:var(--text-secondary);">${escapeHtml(e.message)}</span></td></tr>`;
  }
}

export async function openFileEditor(app, path) {
  const area = document.getElementById("files-browser-area");
  if (!area) return;

  try {
    let fileData = await app.api.request(`/api/files/read?path=${encodeURIComponent(path)}`);
    if (typeof fileData === "string") {
      fileData = { name: path.split("/").pop(), content: fileData, size_formatted: `${(fileData.length / 1024).toFixed(1)} KB` };
    }
    app.state.editingFile = fileData;
    const rawContent = fileData.content !== undefined ? fileData.content : "";
    const isReadOnly = Boolean(fileData.read_only);

    area.innerHTML = `
      ${isReadOnly && fileData.warning ? `
        <div class="card" style="padding:10px 14px;margin-bottom:10px;border-left:3px solid var(--color-warning);font-size:12px;color:var(--text-secondary);">
          <strong style="color:var(--color-warning);">READ-ONLY:</strong> ${escapeHtml(fileData.warning)}
        </div>
      ` : ""}
      <div class="editor-container">
        <div class="editor-header">
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="font-size:13px;font-weight:600;color:var(--text-primary);">${escapeHtml(fileData.name || path.split("/").pop())}</span>
            <span style="font-size:11px;color:var(--text-muted);">(${fileData.size_formatted || ""})</span>
            <span class="badge" id="editor-dirty-badge" style="display:none;background:var(--color-warning);color:var(--bg-canvas);font-weight:600;">UNSAVED</span>
            <span id="editor-saved-toast" style="display:none;font-size:11px;color:var(--color-success);font-weight:600;">SAVED ✓</span>
          </div>
          <div style="display:flex;gap:8px;align-items:center;">
            <button class="btn btn-secondary btn-sm" onclick="app.loadFiles(app.state.currentFilePath)">Back</button>
            ${!isReadOnly ? `
              <button class="btn btn-primary btn-sm" id="editor-save-btn" onclick="app.saveFileContent('${escapeHtml(path)}')">${ICONS.check} Save File</button>
            ` : ""}
          </div>
        </div>
        <div class="editor-body">
          <div class="editor-gutter" id="editor-gutter"></div>
          <textarea id="file-editor-content" class="editor-textarea" spellcheck="false" wrap="off" ${isReadOnly ? "readonly" : ""}></textarea>
        </div>
        <div class="editor-status-bar">
          <span id="editor-cursor-pos">Ln 1, Col 1</span>
          <span id="editor-line-count">1 lines</span>
          <span>UTF-8${isReadOnly ? " · READ-ONLY" : ""}</span>
        </div>
      </div>
    `;

    const textarea = document.getElementById("file-editor-content");
    const gutter = document.getElementById("editor-gutter");
    const dirtyBadge = document.getElementById("editor-dirty-badge");
    const savedToast = document.getElementById("editor-saved-toast");
    const cursorPos = document.getElementById("editor-cursor-pos");
    const lineCount = document.getElementById("editor-line-count");

    if (textarea && gutter) {
      textarea.value = rawContent;

      const updateLines = () => {
        const lines = textarea.value.split("\n").length;
        let nums = "";
        for (let i = 1; i <= lines; i++) {
          nums += `<div class="editor-line-num">${i}</div>`;
        }
        gutter.innerHTML = nums;
        if (lineCount) lineCount.innerText = `${lines} lines`;
      };
      updateLines();

      textarea.addEventListener("scroll", () => {
        gutter.scrollTop = textarea.scrollTop;
      });

      if (!isReadOnly) {
        textarea.addEventListener("input", () => {
          updateLines();
          if (dirtyBadge) dirtyBadge.style.display = "inline-block";
          if (savedToast) savedToast.style.display = "none";
        });
      }

      const updateCursor = () => {
        const selStart = textarea.selectionStart || 0;
        const linesBefore = textarea.value.substring(0, selStart).split("\n");
        const curLine = linesBefore.length;
        const curCol = linesBefore[linesBefore.length - 1].length + 1;
        if (cursorPos) cursorPos.innerText = `Ln ${curLine}, Col ${curCol}`;
      };

      textarea.addEventListener("keyup", updateCursor);
      textarea.addEventListener("click", updateCursor);

      if (!isReadOnly) {
        textarea.addEventListener("keydown", (e) => {
          if (e.key === "Tab") {
            e.preventDefault();
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            textarea.value = textarea.value.substring(0, start) + "  " + textarea.value.substring(end);
            textarea.selectionStart = textarea.selectionEnd = start + 2;
            updateLines();
            if (dirtyBadge) dirtyBadge.style.display = "inline-block";
          }
          if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
            e.preventDefault();
            saveFileContent(app, path);
          }
        });
      }
    }
  } catch (e) {
    alert("Error opening file: " + e.message);
  }
}

export async function saveFileContent(app, path) {
  const textarea = document.getElementById("file-editor-content");
  if (!textarea) return;
  const saveBtn = document.getElementById("editor-save-btn");
  const dirtyBadge = document.getElementById("editor-dirty-badge");
  const savedToast = document.getElementById("editor-saved-toast");
  if (saveBtn) saveBtn.disabled = true;

  try {
    await app.api.request("/api/files/write", {
      method: "POST",
      body: { path: path, content: textarea.value }
    });
    if (dirtyBadge) dirtyBadge.style.display = "none";
    if (savedToast) {
      savedToast.style.display = "inline-block";
      setTimeout(() => { if (savedToast) savedToast.style.display = "none"; }, 3000);
    }
  } catch (e) {
    alert("Save failed: " + e.message);
  } finally {
    if (saveBtn) saveBtn.disabled = false;
  }
}

export function deleteFileItem(app, path, name, isDir) {
  app.showConfirmModal(
    `Delete ${isDir ? "Folder" : "File"}`,
    `Are you sure you want to permanently delete '${name}'? This action cannot be undone.`,
    async () => {
      try {
        const res = await app.api.request("/api/files/delete", {
          method: "DELETE",
          body: { path: path, confirm: true }
        });
        alert(res.message);
        loadFiles(app, app.state.currentFilePath);
      } catch (e) {
        alert(e.message);
      }
    },
    { danger: true, confirmText: `Delete ${name}` }
  );
}

export function promptCreateFolder(app) {
  const name = prompt("Enter folder name:");
  if (!name) return;
  app.api.request("/api/files/create-folder", {
    method: "POST",
    body: { path: app.state.currentFilePath, name: name }
  }).then(res => {
    alert(res.message);
    loadFiles(app, app.state.currentFilePath);
  }).catch(e => alert(e.message));
}

export async function uploadFile(app, input) {
  if (!input.files || input.files.length === 0) return;
  const file = input.files[0];
  const formData = new FormData();
  formData.append("file", file);

  const url = `/api/files/upload?path=${encodeURIComponent(app.state.currentFilePath)}`;
  try {
    const res = await app.api.request(url, {
      method: "POST",
      body: formData
    });
    alert(res.message);
    loadFiles(app, app.state.currentFilePath);
  } catch (e) {
    alert("Upload error: " + e.message);
  } finally {
    input.value = "";
  }
}

export function renderWorldsTab() {
  return `
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
}

export async function loadWorlds(app) {
  try {
    const info = await app.api.request("/api/worlds/info");
    app.state.worldInfo = info;

    const nameDisplay = document.getElementById("world-name-display");
    const seedDisplay = document.getElementById("world-seed-display");
    if (nameDisplay) nameDisplay.innerText = info.world_name || "-";
    if (seedDisplay) seedDisplay.innerText = info.seed ? info.seed : "-";

    const dimContainer = document.getElementById("world-dimensions-container");
    if (dimContainer) {
      dimContainer.innerHTML = `
        <div class="metric-row"><span class="metric-label">Total World Disk Size</span><span class="metric-value">${info.size_formatted || "-"}</span></div>
        <div class="metric-row"><span class="metric-label">level.dat Structure</span><span class="metric-value">${info.has_level_dat ? '<span class="badge" style="color:#22c55e;">Valid</span>' : '<span class="badge badge-error">MISSING</span>'}</span></div>
        <div class="metric-row"><span class="metric-label">Overworld Region</span><span class="metric-value">${info.has_overworld ? "Present (region/)" : "None"}</span></div>
        <div class="metric-row"><span class="metric-label">The Nether (DIM-1)</span><span class="metric-value">${info.has_nether ? "Present" : "Not generated"}</span></div>
        <div class="metric-row"><span class="metric-label">The End (DIM1)</span><span class="metric-value">${info.has_end ? "Present" : "Not generated"}</span></div>
        <div class="metric-row"><span class="metric-label">Datapacks Installed</span><span class="metric-value">${info.datapacks && info.datapacks.length ? info.datapacks.map(d => escapeHtml(d)).join(", ") : "None"}</span></div>
        <div class="metric-row"><span class="metric-label">Player Profile Data</span><span class="metric-value">${info.player_records !== undefined ? info.player_records : "-"} saved records</span></div>
      `;
    }

    const filesRes = await app.api.request("/api/worlds/files");
    const filesList = document.getElementById("world-files-list");
    if (filesList) {
      if (!filesRes.files || filesRes.files.length === 0) {
        filesList.innerHTML = `<div style="color:var(--text-muted);font-size:12px;padding:20px 0;text-align:center;">No files found in world directory.</div>`;
      } else {
        filesList.innerHTML = filesRes.files.map(f => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;border-bottom:1px solid var(--border-subtle);font-size:12.5px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <span>${f.type === "directory" ? ICONS.folder : ICONS.file}</span>
              <span style="font-weight:600;">${escapeHtml(f.name)}</span>
            </div>
            <span style="color:var(--text-muted);font-size:13px;">${f.size_formatted}</span>
          </div>
        `).join("");
      }
    }
  } catch (e) {
    console.error("Worlds load error:", e);
  }
}

export function showUploadWorldModal() {
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
}

export async function executeWorldUpload(app) {
  const input = document.getElementById("upload-world-file-input");
  if (!input || !input.files || input.files.length === 0) {
    alert("Please select a .zip file to upload.");
    return;
  }

  const formData = new FormData();
  formData.append("file", input.files[0]);

  try {
    const data = await app.api.request("/api/worlds/upload", {
      method: "POST",
      body: formData
    });
    app.closeModal();
    alert(data.message);
    loadWorlds(app);
  } catch (e) {
    alert("Error importing world: " + e.message);
  }
}

export function showGenerateWorldModal() {
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
}

export async function executeWorldGenerate(app) {
  const nameInput = document.getElementById("gen-world-name");
  const seedInput = document.getElementById("gen-world-seed");
  const name = nameInput ? nameInput.value.trim() : "";
  const seed = seedInput ? seedInput.value.trim() : "";

  if (!name) {
    alert("Please provide a world name.");
    return;
  }

  try {
    const res = await app.api.request("/api/worlds/generate", {
      method: "POST",
      body: { world_name: name, seed: seed, confirm: true }
    });
    app.closeModal();
    alert(res.message);
    loadWorlds(app);
  } catch (e) {
    alert("Failed to configure world: " + e.message);
  }
}

export function renderBackupsTab() {
  const blocks = '<div class="meter-block"></div>'.repeat(24);
  return `
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
        ${blocks}
      </div>
      <div class="meter-substats">
        <div class="meter-sub-left">BACKUPS ARCHIVES <strong id="backup-used-text">-</strong></div>
        <div class="meter-sub-right neutral">DISK AVAILABLE <strong id="backup-avail-text">-</strong></div>
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
}

export async function loadBackups(app) {
  try {
    const disk = await app.api.request("/api/backups/disk-usage");
    app.state.diskUsage = disk;

    const fill = document.getElementById("backup-meter-fill");
    const badge = document.getElementById("backup-storage-badge");
    const usedText = document.getElementById("backup-used-text");
    const availText = document.getElementById("backup-avail-text");

    const vol = (disk && (disk.media_disk || disk.programming_disk)) || {};
    const totalBytes = vol.total_bytes || disk.total_bytes || 0;
    const freeBytes = vol.free_bytes !== undefined ? vol.free_bytes : (disk.free_bytes || 0);
    const usedBytes = vol.used_bytes !== undefined ? vol.used_bytes : Math.max(0, totalBytes - freeBytes);
    const pctUsed = vol.percent_used !== undefined
      ? vol.percent_used
      : (totalBytes > 0 ? Math.round((usedBytes / totalBytes) * 1000) / 10 : 0);

    if (totalBytes > 0) {
      const bpct = Math.round(pctUsed);
      updateSquareMeter("backup-meter-track", bpct, bpct > 90 ? "crit" : (bpct > 80 ? "warn" : ""));
      if (fill) fill.style.width = `${bpct}%`;
      if (badge) badge.innerText = `${pctUsed}% IN USE`;
      if (usedText) usedText.innerText = disk.backups_size_human || `${(usedBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
      if (availText) availText.innerText = vol.free_human || `${(freeBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    } else {
      updateSquareMeter("backup-meter-track", 0);
      if (fill) fill.style.width = "0%";
      if (badge) badge.innerText = "-";
      if (usedText) usedText.innerText = "-";
      if (availText) availText.innerText = "-";
    }
  } catch (e) {
    console.debug("Disk usage fetch error:", e);
  }
}

export function renderAccessTab() {
  return `
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

export function renderSettingsTab(app) {
  const fonts = [
    { name: "Outfit", tag: "Modern Sans (Default)", desc: "Clean geometric sans-serif" },
    { name: "IBM Plex Sans", tag: "Tech Grotesque", desc: "Engineered typeface" },
    { name: "IBM Plex Mono", tag: "Precision Monospace", desc: "Fixed-width terminal" },
    { name: "Space Grotesk", tag: "Geometric Tech", desc: "Proportional futuristic" }
  ];
  const prefs = JSON.parse(localStorage.getItem("mcadmin_webapp_prefs") || "{}");

  return `
    <div class="card" style="margin-bottom:16px;padding:16px 20px;">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
        <div>
          <div style="font-size:10.5px;font-weight:600;text-transform:uppercase;color:var(--text-muted);margin-bottom:2px;">APPLICATION ENVIRONMENT</div>
          <h2 style="font-size:17px;font-weight:700;color:var(--text-primary);margin:0;">Web App Settings & Preferences</h2>
        </div>
        <div style="display:flex;align-items:center;gap:10px;">
          <span class="badge" style="font-size:10.5px;">MCADMIN V2.4</span>
        </div>
      </div>
    </div>

    <div class="settings-grid-compact">
      <div class="settings-card-compact">
        <div class="settings-card-header-compact">
          <span class="settings-card-title-compact">Appearance & Interface</span>
          <span class="badge">Visual</span>
        </div>
        <div class="settings-row-compact">
          <div>
            <div class="settings-label-compact">Active Theme</div>
            <div class="settings-desc-compact">Global color scheme</div>
          </div>
          <div class="theme-buttons">
            <button class="btn btn-secondary btn-sm theme-btn ${app.state.theme === "dark" ? "active" : ""}" onclick="app.setTheme('dark')">Dark</button>
            <button class="btn btn-secondary btn-sm theme-btn ${app.state.theme === "medium-dark" ? "active" : ""}" onclick="app.setTheme('medium-dark')">Slate</button>
            <button class="btn btn-secondary btn-sm theme-btn ${app.state.theme === "light" ? "active" : ""}" onclick="app.setTheme('light')">Light</button>
          </div>
        </div>
        <div>
          <div class="settings-label-compact" style="margin-bottom:6px;">Universal Typography</div>
          <div class="font-compact-grid">
            ${fonts.map(f => {
              const isCur = app.state.font === f.name;
              return `
                <div class="font-compact-card ${isCur ? "active" : ""}" onclick="app.setFont('${f.name}')">
                  <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-size:12px;font-weight:600;color:var(--text-primary);font-family:${app.fontMap[f.name] || "inherit"};">${f.name}</span>
                    ${isCur ? `<span style="font-size:9.5px;color:var(--color-success);font-weight:700;">✓</span>` : ""}
                  </div>
                  <div style="font-size:10px;color:var(--text-muted);margin-top:2px;">${f.tag}</div>
                </div>
              `;
            }).join("")}
          </div>
        </div>
        <div class="settings-row-compact">
          <div>
            <div class="settings-label-compact">Layout Density</div>
            <div class="settings-desc-compact">Spacing across lists & tables</div>
          </div>
          <select class="settings-select-compact" id="setting-density" onchange="app.updateAppPref('density', this.value)">
            <option value="normal" ${prefs.density !== "compact" ? "selected" : ""}>Normal</option>
            <option value="compact" ${prefs.density === "compact" ? "selected" : ""}>Compact (Dense)</option>
          </select>
        </div>
      </div>

      <div class="settings-card-compact">
        <div class="settings-card-header-compact">
          <span class="settings-card-title-compact">Telemetry & Live Streams</span>
          <span class="badge">Realtime</span>
        </div>
        <div class="settings-row-compact">
          <div>
            <div class="settings-label-compact">Telemetry Polling Rate</div>
            <div class="settings-desc-compact">Metrics refresh frequency</div>
          </div>
          <select class="settings-select-compact" id="setting-polling-rate" onchange="app.updateAppPref('pollingRate', this.value)">
            <option value="1000" ${prefs.pollingRate === "1000" ? "selected" : ""}>1.0s (Real-time)</option>
            <option value="2500" ${!prefs.pollingRate || prefs.pollingRate === "2500" ? "selected" : ""}>2.5s (Balanced)</option>
            <option value="5000" ${prefs.pollingRate === "5000" ? "selected" : ""}>5.0s (Low Data)</option>
            <option value="10000" ${prefs.pollingRate === "10000" ? "selected" : ""}>10.0s (Throttled)</option>
          </select>
        </div>
        <div class="settings-row-compact">
          <div>
            <div class="settings-label-compact">Console Buffer Limit</div>
            <div class="settings-desc-compact">Max rendered console log lines</div>
          </div>
          <select class="settings-select-compact" id="setting-console-buffer" onchange="app.updateAppPref('consoleBuffer', this.value)">
            <option value="100" ${prefs.consoleBuffer === "100" ? "selected" : ""}>100 lines</option>
            <option value="250" ${!prefs.consoleBuffer || prefs.consoleBuffer === "250" ? "selected" : ""}>250 lines</option>
            <option value="500" ${prefs.consoleBuffer === "500" ? "selected" : ""}>500 lines</option>
            <option value="1000" ${prefs.consoleBuffer === "1000" ? "selected" : ""}>1000 lines</option>
          </select>
        </div>
        <div class="settings-row-compact">
          <div>
            <div class="settings-label-compact">Auto-Scroll Stream</div>
            <div class="settings-desc-compact">Follow live console output</div>
          </div>
          <input type="checkbox" id="setting-auto-scroll" ${prefs.autoScroll !== false ? "checked" : ""} onchange="app.updateAppPref('autoScroll', this.checked)">
        </div>
      </div>

      <div class="settings-card-compact">
        <div class="settings-card-header-compact">
          <span class="settings-card-title-compact">Web Alerts & Notifications</span>
          <span class="badge">Audits</span>
        </div>
        <div class="settings-row-compact">
          <div>
            <div class="settings-label-compact">Audio Chime on Outage</div>
            <div class="settings-desc-compact">Play sound alert if server stops</div>
          </div>
          <input type="checkbox" id="setting-audio-chime" ${prefs.audioChime ? "checked" : ""} onchange="app.updateAppPref('audioChime', this.checked)">
        </div>
        <div class="settings-row-compact">
          <div>
            <div class="settings-label-compact">Browser Push Notifications</div>
            <div class="settings-desc-compact">Desktop toast notifications</div>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="app.requestNotificationPermission()">Enable</button>
        </div>
        <div class="settings-row-compact" style="flex-direction:column;align-items:flex-start;gap:6px;">
          <div class="settings-label-compact">Alert Webhook URL</div>
          <div class="settings-desc-compact">Discord or Slack incoming webhook for crash triggers</div>
          <input type="text" class="settings-input-compact" style="width:100%;" placeholder="https://discord.com/api/webhooks/..." id="setting-webhook-url" value="${escapeHtml(prefs.webhookUrl || "")}" onchange="app.updateAppPref('webhookUrl', this.value)">
        </div>
      </div>

      <div class="settings-card-compact">
        <div class="settings-card-header-compact">
          <span class="settings-card-title-compact">Session & Client Storage</span>
          <span class="badge">Security</span>
        </div>
        <div class="settings-row-compact">
          <div>
            <div class="settings-label-compact">Session Inactivity Timeout</div>
            <div class="settings-desc-compact">Auto-logout duration</div>
          </div>
          <select class="settings-select-compact" id="setting-session-timeout" onchange="app.updateAppPref('sessionTimeout', this.value)">
            <option value="15" ${prefs.sessionTimeout === "15" ? "selected" : ""}>15 Minutes</option>
            <option value="60" ${!prefs.sessionTimeout || prefs.sessionTimeout === "60" ? "selected" : ""}>1 Hour</option>
            <option value="480" ${prefs.sessionTimeout === "480" ? "selected" : ""}>8 Hours</option>
            <option value="never" ${prefs.sessionTimeout === "never" ? "selected" : ""}>Never (Stay signed in)</option>
          </select>
        </div>
        <div class="settings-row-compact">
          <div>
            <div class="settings-label-compact">CSRF Token Guard</div>
            <div class="settings-desc-compact">Strict double-submit verification</div>
          </div>
          <span class="badge" style="color:var(--color-success);border-color:var(--border-high);">ENFORCED</span>
        </div>
        <div class="settings-row-compact" style="padding-top:6px;border-top:1px solid var(--border-subtle);">
          <div>
            <div class="settings-label-compact">Local UI Cache</div>
            <div class="settings-desc-compact">Clear stored tokens and cache</div>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="app.clearClientCache()">Clear Cache</button>
        </div>
      </div>
    </div>
  `;
}
