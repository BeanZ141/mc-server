import { ICONS, escapeHtml, formatDate, renderStatusBadge } from "../api.js?v=20261128-v11";
import { updateSquareMeter } from "./server.js?v=20261128-v11";

export function renderSoftwareTab() {
  return `
    <div style="margin-bottom:16px;">
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
      <button class="subnav-btn" id="mods-tab-browse" onclick="app.switchModsTab('browse')">Browse Mods [Modrinth]</button>
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

    let manualHtml = "";
    if (!data.manual || data.manual.length === 0) {
      manualHtml = `<div style="color:var(--text-muted);font-size:12.5px;padding:12px 0;">No manual .jar files in mods/ directory.</div>`;
    } else {
      manualHtml = `
        <div class="file-table-container">
          <table class="file-table">
            <thead>
              <tr>
                <th>Manual JAR Filename</th>
                <th>Size</th>
                <th>Source</th>
                <th style="text-align:right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${data.manual.map(j => {
        const sz = j.size_bytes >= 1048576 ? `${(j.size_bytes / 1048576).toFixed(2)} MB` : `${Math.max(1, Math.round((j.size_bytes || 0) / 1024))} KB`;
        return `
                  <tr>
                    <td style="font-weight:600;">${escapeHtml(j.filename)}</td>
                    <td style="color:var(--text-secondary);font-size:12px;">${sz}</td>
                    <td><span class="badge">Manual .jar</span></td>
                    <td style="text-align:right;">
                      <button class="btn btn-danger btn-sm" onclick="app.deleteManualJar('${escapeHtml(j.filename)}')">${ICONS.trash} Delete</button>
                    </td>
                  </tr>
                `;
      }).join("")}
            </tbody>
          </table>
        </div>
      `;
    }

    view.innerHTML = `
      <div class="card" style="padding:22px 24px;margin-bottom:16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px;">
          <div>
            <h2 style="font-size:15px;font-weight:700;text-transform:uppercase;">Installed ${escapeHtml(loaderLabel)} Mods</h2>
            <div style="font-size:12px;color:var(--text-secondary);">Managed automatically via MODRINTH_PROJECTS in mc.env</div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="app.switchModsTab('browse')">${ICONS.plus} Install New Mod</button>
        </div>
        ${managedHtml}
      </div>

      <div class="card" style="padding:22px 24px;">
        <div style="margin-bottom:12px;">
          <h3 style="font-size:14px;font-weight:700;text-transform:uppercase;">Manual Mod Files (mods/)</h3>
          <div style="font-size:12px;color:var(--text-secondary);">Standalone .jar files outside MODRINTH_PROJECTS</div>
        </div>
        ${manualHtml}
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
    <div class="card" style="padding:22px 24px;margin-bottom:16px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:16px;">
        <div>
          <h2 style="font-size:15px;font-weight:700;text-transform:uppercase;">Browse Modrinth Repository <a href="https://modrinth.com/discover/mods" style="text-decoration: none;"> 🔗</a></h2>
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

function getInstalledModStatus(app, slug) {
  const data = app.state.installedMods || {};
  const managed = data.managed || [];
  const manual = data.manual || [];
  const lowerSlug = String(slug || "").toLowerCase();
  const cleanSlug = lowerSlug.replace(/[-_\s]/g, "");
  if (!cleanSlug) return null;

  const isManaged = managed.some(m => {
    const ms = String(m.slug || "").toLowerCase();
    return ms === lowerSlug || ms.replace(/[-_\s]/g, "") === cleanSlug;
  });
  if (isManaged) return "managed";

  const isManual = manual.some(j => {
    const jf = String(j.filename || j.name || "").toLowerCase().replace(/[-_\s]/g, "");
    return jf.includes(cleanSlug);
  });
  if (isManual) return "manual";
  return null;
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
    const installedPromise = app.state.installedModsLoaded
      ? Promise.resolve(null)
      : app.api.request("/api/mods/installed").catch(() => null);
    const [installedRes, res] = await Promise.all([
      installedPromise,
      app.api.request(`/api/mods/search?q=${q}&sort=${sort}${cat}${env}&limit=20`)
    ]);
    if (installedRes) {
      app.state.installedMods = installedRes;
      app.state.installedModsLoaded = true;
    }
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
        ${res.hits.map(h => {
      const installedSrc = getInstalledModStatus(app, h.slug);
      return `
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
                <span class="badge" style="font-size:10px;padding:2px 6px;">Client: ${escapeHtml(h.client_side || "optional")}</span>
                <span class="badge" style="font-size:10px;padding:2px 6px;">Server: ${escapeHtml(h.server_side || "optional")}</span>
                ${h.client_side === "required" ? `<span class="badge" style="font-size:10px;padding:2px 6px;color:var(--color-warning);border-color:var(--border-high);">Client Mod Required</span>` : ""}
                ${installedSrc ? `<span class="badge badge-online" style="font-size:10px;padding:2px 6px;">Installed${installedSrc === "manual" ? " (.jar)" : ""}</span>` : ""}
              </div>

              <p style="font-size:12px;color:var(--text-secondary);line-height:1.5;margin-bottom:12px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;min-height:54px;">
                ${escapeHtml(h.description)}
              </p>
            </div>

            <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--border-subtle);padding-top:10px;">
              <span class="badge" style="color:#22c55e;">${escapeHtml(loaderBadge)}</span>
              ${installedSrc
          ? `<button class="btn btn-secondary btn-sm" disabled title="Already installed">${ICONS.check} Installed</button>`
          : `<button class="btn btn-primary btn-sm" id="mod-install-btn-${escapeHtml(h.slug)}" onclick="app.installMod('${escapeHtml(h.slug)}', '${escapeHtml(h.title || h.slug)}', '${escapeHtml(h.client_side || "optional")}')">${ICONS.plus} Install</button>`}
            </div>
          </div>
        `;
    }).join("")}
      </div>
    `;
  } catch (e) {
    if (area) area.innerHTML = `<span class="badge badge-error">ERROR</span> <span style="margin-left:8px;color:var(--text-secondary);">${escapeHtml(e.message)}</span>`;
  }
}

export async function installMod(app, slug, title = null, clientSide = null) {
  const btn = document.getElementById(`mod-install-btn-${slug}`);
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Checking...";
  }
  let compat = null;
  try {
    compat = await app.api.request(`/api/mods/check?slug=${encodeURIComponent(slug)}`);
  } catch (e) {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `${ICONS.plus} Install`;
    }
    alert("Failed to verify compatibility: " + e.message);
    return;
  }

  if (!compat.compatible) {
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Incompatible";
      btn.title = compat.reason || "Incompatible build";
    }
    alert(`Cannot install '${compat.title || title || slug}': ${compat.reason || "No compatible release for active server version."}`);
    return;
  }

  if (btn) {
    btn.disabled = false;
    btn.innerHTML = `${ICONS.plus} Install`;
  }

  const clientWarn = (compat.client_required || clientSide === "required")
    ? "WARNING: Players MUST also install this mod on their own Minecraft client! "
    : "";
  const buildLabel = compat.version_number ? ` (build ${compat.version_number})` : "";

  app.showConfirmModal(
    `Install ${compat.title || title || slug}`,
    `${clientWarn}Install '${slug}'${buildLabel} from Modrinth? This adds it to mc.env and recreates the server container.`,
    async () => {
      try {
        const res = await app.api.request("/api/mods/add", { method: "POST", body: { slug: slug } });
        app.state.installedModsLoaded = false;
        alert(res.message);
        switchModsTab(app, "installed");
      } catch (e) {
        alert(e.message);
      }
    },
    { danger: Boolean(compat.client_required || clientSide === "required"), confirmText: "Install Mod" }
  );
}

export function deleteManualJar(app, filename) {
  app.showConfirmModal(
    "Delete Manual Mod JAR",
    `Permanently delete '${filename}' from mods/? A restart may be needed for changes to apply.`,
    async () => {
      try {
        const res = await app.api.request(`/api/mods/manual/${encodeURIComponent(filename)}`, { method: "DELETE" });
        app.state.installedModsLoaded = false;
        alert(res.message);
        renderInstalledMods(app);
      } catch (e) {
        alert(e.message);
      }
    },
    { danger: true, confirmText: "Delete JAR" }
  );
}

export function removeMod(app, slug) {
  app.showConfirmModal(
    `Remove ${slug}`,
    `Remove mod '${slug}' from server? The mod will be removed from mc.env and deleted from mods folder.`,
    async () => {
      try {
        const res = await app.api.request("/api/mods/remove", { method: "POST", body: { slug: slug } });
        app.state.installedModsLoaded = false;
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
            <span id="editor-saved-toast" style="display:none;font-size:11px;color:var(--color-success);font-weight:600;">SAVED</span>
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
    <div class="card" style="margin-bottom:16px;padding:22px 24px;">
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

    <div class="grid-2" style="margin-bottom:16px;">
      <div class="card">
        <div class="card-header">
          <span class="card-title">DIMENSIONS & COMPONENTS</span>
        </div>
        <div style="padding:14px 20px;display:flex;flex-direction:column;gap:0px;" id="world-dimensions-container">
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

    <div class="card" style="padding:22px 24px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px;margin-bottom:14px;">
        <div>
          <h3 style="font-size:14px;font-weight:700;text-transform:uppercase;">Chunky World Pregeneration</h3>
          <div style="font-size:12px;color:var(--text-secondary);margin-top:3px;">
            Pre-generates chunks while the server is online. Pause before players join so tick rate stays smooth.
          </div>
        </div>
        <span class="badge">RCON</span>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:14px;">
        <div>
          <label style="font-size:11px;font-weight:600;text-transform:uppercase;color:var(--text-secondary);display:block;margin-bottom:4px;">Dimension</label>
          <select id="chunky-world" class="input">
            <option value="minecraft:overworld">Overworld</option>
            <option value="minecraft:the_nether">The Nether</option>
            <option value="minecraft:the_end">The End</option>
          </select>
        </div>
        <div>
          <label style="font-size:11px;font-weight:600;text-transform:uppercase;color:var(--text-secondary);display:block;margin-bottom:4px;">Shape</label>
          <select id="chunky-shape" class="input">
            <option value="square">Square</option>
            <option value="circle">Circle</option>
            <option value="diamond">Diamond</option>
            <option value="rectangle">Rectangle</option>
          </select>
        </div>
        <div>
          <label style="font-size:11px;font-weight:600;text-transform:uppercase;color:var(--text-secondary);display:block;margin-bottom:4px;">Radius (Blocks)</label>
          <input type="number" id="chunky-radius" class="input" min="500" max="25000" value="2500">
        </div>
        <div>
          <label style="font-size:11px;font-weight:600;text-transform:uppercase;color:var(--text-secondary);display:block;margin-bottom:4px;">Center (X Z)</label>
          <input type="text" id="chunky-center" class="input" value="0 0" placeholder="0 0">
        </div>
      </div>

      <div class="btn-group" style="flex-wrap:wrap;margin-bottom:12px;">
        <button class="btn btn-primary btn-sm" onclick="app.sendChunkyCommand('start')">${ICONS.start} Start Pregen</button>
        <button class="btn btn-secondary btn-sm" onclick="app.sendChunkyCommand('pause')">Pause</button>
        <button class="btn btn-secondary btn-sm" onclick="app.sendChunkyCommand('continue')">Continue</button>
        <button class="btn btn-secondary btn-sm" onclick="app.sendChunkyCommand('progress')">Progress</button>
        <button class="btn btn-danger btn-sm" onclick="app.sendChunkyCommand('cancel')">Cancel</button>
      </div>

      <div id="chunky-output-box" style="padding:10px 12px;background:var(--bg-canvas);border:1px solid var(--border-subtle);font-family:monospace;font-size:12px;color:var(--text-secondary);min-height:42px;white-space:pre-wrap;">[Ready] Select parameters and click Start Pregen when Minecraft is Online.</div>
    </div>
  `;
}

export async function sendChunkyCommand(app, action) {
  const outBox = document.getElementById("chunky-output-box");
  const runCmd = async (act, param = "") => {
    return app.api.request("/api/chunky/command", {
      method: "POST",
      body: { action: act, param: String(param) }
    });
  };

  if (action === "start") {
    const world = document.getElementById("chunky-world")?.value || "minecraft:overworld";
    const shape = document.getElementById("chunky-shape")?.value || "square";
    const radius = parseInt(document.getElementById("chunky-radius")?.value || "2500", 10);
    const center = (document.getElementById("chunky-center")?.value || "0 0").trim() || "0 0";
    if (Number.isNaN(radius) || radius < 100 || radius > 30000) {
      alert("Radius must be between 100 and 30000 blocks.");
      return;
    }
    const execStart = async () => {
      if (outBox) outBox.textContent = "Configuring Chunky and starting task...";
      try {
        const logs = [];
        for (const [act, prm] of [["world", world], ["shape", shape], ["center", center], ["radius", String(radius)], ["start", ""]]) {
          const r = await runCmd(act, prm);
          logs.push(`> chunky ${act}${prm ? " " + prm : ""}: ${r.output || "OK"}`);
        }
        if (outBox) outBox.textContent = logs.join("\n");
      } catch (e) {
        if (outBox) outBox.textContent = `Error: ${e.message}`;
      }
    };
    if (radius > 5000) {
      app.showConfirmModal(
        "Large Pregeneration Radius",
        `Start Chunky with radius ${radius} blocks? Large radii increase disk usage and CPU load substantially.`,
        execStart,
        { danger: true, confirmText: "Start Pregen" }
      );
    } else {
      await execStart();
    }
    return;
  }

  if (outBox) outBox.textContent = `Sending chunky ${action}...`;
  try {
    const r = await runCmd(action, "");
    if (outBox) outBox.textContent = `> chunky ${action}\n${r.output || "Command executed."}`;
  } catch (e) {
    if (outBox) outBox.textContent = `Error: ${e.message}`;
  }
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
    <div class="card" style="margin-bottom:16px;padding:22px 24px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:14px;">
        <div>
          <h2 style="font-size:16px;font-weight:700;text-transform:uppercase;margin-bottom:8px;">WORLD BACKUPS & SNAPSHOTS</h2>
          <p style="font-size:13px;color:var(--text-secondary);line-height:1.6;max-width:700px;">
            Automated backups run daily at <strong>04:00 AM (Asia/Kolkata)</strong>. Create manual snapshots or restore an archived snapshot below (server must be stopped before restore).
          </p>
        </div>
        <div class="btn-group">
          <button class="btn btn-primary btn-sm" id="backup-create-btn" onclick="app.createBackup()">${ICONS.plus} Backup Now</button>
          <button class="btn btn-secondary btn-sm" onclick="app.loadBackups()">${ICONS.refresh} Refresh</button>
        </div>
      </div>
    </div>

    <div class="metric-strip" style="margin-bottom:16px;">
      <div class="metric-strip-card">
        <span class="metric-strip-label">Active World Size</span>
        <span class="metric-strip-value" id="backup-world-size">-</span>
      </div>
      <div class="metric-strip-card">
        <span class="metric-strip-label">Backup Archives Total</span>
        <span class="metric-strip-value" id="backup-archives-size">-</span>
      </div>
      <div class="metric-strip-card">
        <span class="metric-strip-label">MC Disk Free</span>
        <span class="metric-strip-value" id="backup-mc-free">-</span>
      </div>
      <div class="metric-strip-card">
        <span class="metric-strip-label">Backup Volume Free</span>
        <span class="metric-strip-value" id="backup-avail-text">-</span>
      </div>
    </div>

    <div class="progress-card" style="margin-bottom:16px;">
      <div class="progress-header">
        <span class="progress-header-title">BACKUP VOLUME STORAGE USAGE</span>
        <span class="progress-header-badge" id="backup-storage-badge">-</span>
      </div>
      <div class="meter-track" id="backup-meter-track">
        ${blocks}
      </div>
      <div class="meter-substats">
        <div class="meter-sub-left">BACKUPS ARCHIVES <strong id="backup-used-text">-</strong></div>
        <div class="meter-sub-right neutral">TOTAL ARCHIVES <strong id="backup-count-text">-</strong></div>
      </div>
    </div>

    <div class="card" style="padding:22px 24px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
        <h3 style="font-size:14px;font-weight:700;text-transform:uppercase;">Available Archive Snapshots</h3>
        <span style="font-size:12px;color:var(--text-muted);" id="backups-status-note">Compressed .tar.gz archives</span>
      </div>
      <div class="file-table-container">
        <table class="file-table">
          <thead>
            <tr>
              <th>Backup Archive ID</th>
              <th>Type</th>
              <th>Created</th>
              <th>Size</th>
              <th style="text-align:right;">Actions</th>
            </tr>
          </thead>
          <tbody id="backups-table-body">
            <tr><td colspan="5" style="color:var(--text-muted);text-align:center;padding:24px;">Loading backup archives...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

export async function loadBackups(app) {
  const tbody = document.getElementById("backups-table-body");
  try {
    const [disk, listRes] = await Promise.all([
      app.api.request("/api/backups/disk-usage"),
      app.api.request("/api/backups")
    ]);
    app.state.diskUsage = disk;
    app.state.backupsList = listRes.backups || [];

    const badge = document.getElementById("backup-storage-badge");
    const usedText = document.getElementById("backup-used-text");
    const availText = document.getElementById("backup-avail-text");
    const worldSizeEl = document.getElementById("backup-world-size");
    const archSizeEl = document.getElementById("backup-archives-size");
    const mcFreeEl = document.getElementById("backup-mc-free");
    const countEl = document.getElementById("backup-count-text");

    if (worldSizeEl) worldSizeEl.innerText = disk.world_size_human || "-";
    if (archSizeEl) archSizeEl.innerText = disk.backups_size_human || "-";
    if (mcFreeEl) mcFreeEl.innerText = (disk.programming_disk && disk.programming_disk.free_human) || "-";
    if (countEl) countEl.innerText = String(app.state.backupsList.length);

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
      if (badge) badge.innerText = `${pctUsed}% IN USE`;
      if (usedText) usedText.innerText = disk.backups_size_human || `${(usedBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
      if (availText) availText.innerText = vol.free_human || `${(freeBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    } else {
      updateSquareMeter("backup-meter-track", 0);
      if (badge) badge.innerText = "-";
      if (usedText) usedText.innerText = "-";
      if (availText) availText.innerText = "-";
    }

    if (tbody) {
      if (!app.state.backupsList.length) {
        tbody.innerHTML = `<tr><td colspan="5" style="color:var(--text-muted);text-align:center;padding:24px;">No backup archives found yet. Click Backup Now to create one.</td></tr>`;
      } else {
        tbody.innerHTML = app.state.backupsList.map(b => {
          const dt = b.created_at ? `${formatDate(b.created_at)} ${String(b.created_at).slice(11, 16)}` : "-";
          const typeBadge = b.is_safety
            ? `<span class="badge" style="color:var(--color-warning);">Safety</span>`
            : `<span class="badge badge-online">Snapshot</span>`;
          return `
            <tr>
              <td style="font-weight:600;font-family:monospace;font-size:12px;">${escapeHtml(b.id)}</td>
              <td>${typeBadge}</td>
              <td style="color:var(--text-secondary);font-size:12px;">${escapeHtml(dt)}</td>
              <td style="font-size:12px;">${escapeHtml(b.size_human || "-")}</td>
              <td style="text-align:right;">
                <button class="btn btn-danger btn-sm" onclick="app.restoreBackup('${escapeHtml(b.id)}')">Restore</button>
              </td>
            </tr>
          `;
        }).join("");
      }
    }
  } catch (e) {
    if (tbody) tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:20px;"><span class="badge badge-error">ERROR</span> <span style="margin-left:8px;color:var(--text-secondary);">${escapeHtml(e.message)}</span></td></tr>`;
  }
}

export async function createBackup(app) {
  const btn = document.getElementById("backup-create-btn");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Backing up...";
  }
  try {
    const res = await app.api.request("/api/backups/create", { method: "POST" });
    alert(res.message || "Backup created successfully.");
    await loadBackups(app);
  } catch (e) {
    alert("Backup failed: " + e.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `${ICONS.plus} Backup Now`;
    }
  }
}

export function restoreBackup(app, backupId) {
  const isRunning = app.state.status && (app.state.status.state === "Online" || app.state.status.state === "Starting");
  const extraWarn = isRunning ? "WARNING: Minecraft currently appears Online. Stop the server first or restore will be blocked. " : "";
  app.showConfirmModal(
    `Restore ${backupId}`,
    `${extraWarn}Restore world archive '${backupId}'? Current unsaved world data will be replaced by this snapshot.`,
    async () => {
      try {
        const res = await app.api.request("/api/backups/restore", {
          method: "POST",
          body: { backup_id: backupId }
        });
        alert(res.message || "Restore completed.");
        await loadBackups(app);
      } catch (e) {
        alert("Restore failed: " + e.message);
      }
    },
    { danger: true, confirmText: "Restore Backup" }
  );
}

export function renderAccessTab() {
  return `
    <div class="card" style="margin-bottom:16px;padding:22px 24px;">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;">
        <div>
          <div style="font-size:11px;font-weight:600;text-transform:uppercase;color:var(--text-muted);margin-bottom:4px;">ACTIVE ADMINISTRATOR</div>
          <h2 style="font-size:18px;font-weight:700;color:var(--text-primary);">admin</h2>
          <div style="font-size:12px;color:var(--text-secondary);margin-top:2px;">
            LAN-only Access · Argon2id Password Hashing · Strict SameSite Cookie &amp; CSRF Guard
          </div>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="app.logout()">${ICONS.logout} Sign Out</button>
      </div>
    </div>

    <div class="grid-2" style="margin-bottom:16px;">
      <div class="card" style="padding:20px 24px;">
        <h3 style="font-size:14px;font-weight:700;text-transform:uppercase;margin-bottom:4px;">Change Admin Password</h3>
        <div style="font-size:12px;color:var(--text-secondary);margin-bottom:14px;">Update administrator credentials (minimum 6 characters).</div>
        <div style="display:flex;flex-direction:column;gap:10px;">
          <div>
            <label style="font-size:11px;font-weight:600;text-transform:uppercase;color:var(--text-secondary);display:block;margin-bottom:4px;">Current Password</label>
            <input type="password" id="acc-old-pass" class="input" placeholder="Enter current password...">
          </div>
          <div>
            <label style="font-size:11px;font-weight:600;text-transform:uppercase;color:var(--text-secondary);display:block;margin-bottom:4px;">New Password</label>
            <input type="password" id="acc-new-pass" class="input" placeholder="Enter new password...">
          </div>
          <div>
            <label style="font-size:11px;font-weight:600;text-transform:uppercase;color:var(--text-secondary);display:block;margin-bottom:4px;">Confirm New Password</label>
            <input type="password" id="acc-confirm-pass" class="input" placeholder="Confirm new password...">
          </div>
          <div style="display:flex;align-items:center;gap:12px;margin-top:4px;">
            <button class="btn btn-primary btn-sm" id="acc-change-pass-btn" onclick="app.changeAdminPassword()">${ICONS.check} Update Password</button>
            <span id="acc-pass-status" style="font-size:12px;"></span>
          </div>
        </div>
      </div>

      <div class="card" style="padding:20px 24px;">
        <h3 style="font-size:14px;font-weight:700;text-transform:uppercase;margin-bottom:4px;">Authorization Scope</h3>
        <div style="font-size:12px;color:var(--text-secondary);margin-bottom:12px;">Active privileges enforced for master admin session.</div>
        <table class="file-table">
          <thead>
            <tr>
              <th>Subsystem</th>
              <th>Privilege</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Container &amp; Media Watch</td><td>Full Control</td><td>${renderStatusBadge("online", "Active")}</td></tr>
            <tr><td>Console, Logs &amp; Players</td><td>Full Control</td><td>${renderStatusBadge("online", "Active")}</td></tr>
            <tr><td>Settings, Mods &amp; Files</td><td>Full Control</td><td>${renderStatusBadge("online", "Active")}</td></tr>
            <tr><td>Worlds, Chunky &amp; Backups</td><td>Full Control</td><td>${renderStatusBadge("online", "Active")}</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="card" style="padding:20px 24px;">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:14px;">
        <div>
          <h3 style="font-size:14px;font-weight:700;text-transform:uppercase;">Security &amp; Action Audit Log</h3>
          <div style="font-size:12px;color:var(--text-secondary);" id="audit-page-info">Recent recorded actions</div>
        </div>
        <div class="btn-group">
          <button class="btn btn-secondary btn-sm" id="audit-prev-btn" onclick="app.prevAuditPage()">&lt; Prev</button>
          <button class="btn btn-secondary btn-sm" id="audit-next-btn" onclick="app.nextAuditPage()">Next &gt;</button>
          <button class="btn btn-secondary btn-sm" onclick="app.loadAuditLogs()">${ICONS.refresh} Refresh</button>
        </div>
      </div>

      <div class="file-table-container">
        <table class="file-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Action</th>
              <th>Target</th>
              <th>Details</th>
              <th>IP</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody id="audit-table-body">
            <tr><td colspan="6" style="color:var(--text-muted);text-align:center;padding:24px;">Loading audit log...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

export function loadAccess(app) {
  app.state.auditPageOffset = 0;
  return loadAuditLogs(app, 0);
}

export async function loadAuditLogs(app, offset = null) {
  const tbody = document.getElementById("audit-table-body");
  if (!tbody) return;
  const off = offset !== null ? Math.max(0, offset) : (app.state.auditPageOffset || 0);
  app.state.auditPageOffset = off;
  const limit = app.state.auditLimit || 15;

  try {
    const res = await app.api.request(`/api/audit?limit=${limit}&offset=${off}`);
    const entries = res.entries || [];
    const total = res.total || 0;
    app.state.auditTotal = total;

    const infoEl = document.getElementById("audit-page-info");
    if (infoEl) {
      const startNum = total > 0 ? off + 1 : 0;
      const endNum = Math.min(total, off + entries.length);
      infoEl.innerText = `Showing ${startNum}–${endNum} of ${total} audit records`;
    }

    const prevBtn = document.getElementById("audit-prev-btn");
    const nextBtn = document.getElementById("audit-next-btn");
    if (prevBtn) prevBtn.disabled = off <= 0;
    if (nextBtn) nextBtn.disabled = off + limit >= total;

    if (!entries.length) {
      tbody.innerHTML = `<tr><td colspan="6" style="color:var(--text-muted);text-align:center;padding:24px;">No audit log entries recorded yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = entries.map(e => {
      const ts = e.timestamp ? String(e.timestamp).slice(0, 19).replace("T", " ") : "-";
      const ok = String(e.result || "").toUpperCase() === "SUCCESS";
      return `
        <tr>
          <td style="font-family:monospace;font-size:11.5px;white-space:nowrap;">${escapeHtml(ts)}</td>
          <td style="font-weight:600;font-size:12px;">${escapeHtml(e.action)}</td>
          <td style="font-size:12px;color:var(--text-secondary);">${escapeHtml(e.target || "-")}</td>
          <td style="font-size:12px;max-width:340px;word-break:break-word;">${escapeHtml(e.details || "-")}</td>
          <td style="font-family:monospace;font-size:11.5px;color:var(--text-muted);">${escapeHtml(e.ip_address || "-")}</td>
          <td>${renderStatusBadge(ok ? "online" : "error", e.result || "UNKNOWN")}</td>
        </tr>
      `;
    }).join("");
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:20px;"><span class="badge badge-error">ERROR</span> <span style="margin-left:8px;color:var(--text-secondary);">${escapeHtml(e.message)}</span></td></tr>`;
  }
}

export function prevAuditPage(app) {
  const limit = app.state.auditLimit || 15;
  const nextOff = Math.max(0, (app.state.auditPageOffset || 0) - limit);
  loadAuditLogs(app, nextOff);
}

export function nextAuditPage(app) {
  const limit = app.state.auditLimit || 15;
  const nextOff = (app.state.auditPageOffset || 0) + limit;
  if (nextOff < (app.state.auditTotal || 0)) {
    loadAuditLogs(app, nextOff);
  }
}

export async function changeAdminPassword(app) {
  const oldEl = document.getElementById("acc-old-pass");
  const newEl = document.getElementById("acc-new-pass");
  const confEl = document.getElementById("acc-confirm-pass");
  const statusEl = document.getElementById("acc-pass-status");
  const btn = document.getElementById("acc-change-pass-btn");

  const oldPass = oldEl ? oldEl.value : "";
  const newPass = newEl ? newEl.value : "";
  const confirmPass = confEl ? confEl.value : "";

  if (!oldPass || !newPass) {
    if (statusEl) statusEl.innerHTML = `<span style="color:var(--color-error);">Fill all password fields.</span>`;
    return;
  }
  if (newPass.length < 6) {
    if (statusEl) statusEl.innerHTML = `<span style="color:var(--color-error);">New password must be at least 6 characters.</span>`;
    return;
  }
  if (newPass !== confirmPass) {
    if (statusEl) statusEl.innerHTML = `<span style="color:var(--color-error);">New passwords do not match.</span>`;
    return;
  }

  if (btn) btn.disabled = true;
  try {
    await app.api.request("/api/auth/change-password", {
      method: "POST",
      body: { old_password: oldPass, new_password: newPass }
    });
    if (oldEl) oldEl.value = "";
    if (newEl) newEl.value = "";
    if (confEl) confEl.value = "";
    if (statusEl) statusEl.innerHTML = `<span style="color:var(--color-success);">Password updated cleanly.</span>`;
    loadAuditLogs(app, 0);
  } catch (e) {
    if (statusEl) statusEl.innerHTML = `<span style="color:var(--color-error);">${escapeHtml(e.message)}</span>`;
  } finally {
    if (btn) btn.disabled = false;
  }
}

export function renderSettingsTab(app) {
  const fonts = [
    { name: "Outfit", tag: "Modern Sans (Default)", desc: "Clean geometric sans-serif" },
    { name: "IBM Plex Sans", tag: "Tech Grotesque", desc: "Engineered typeface" },
    { name: "IBM Plex Mono", tag: "Precision Monospace", desc: "Fixed-width terminal" },
    { name: "Space Grotesk", tag: "Geometric Tech", desc: "Proportional futuristic" }
  ];
  const prefs = JSON.parse(localStorage.getItem("mcadmin_webapp_prefs") || "{}");
  const sub = app.state.settingsSubtab || "webapp";
  const webhookVal = app.state.panelWebhookUrl || prefs.webhookUrl || "";

  return `
    <div class="card" style="margin-bottom:16px;padding:16px 20px;">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
        <div>
          <div style="font-size:10.5px;font-weight:600;text-transform:uppercase;color:var(--text-muted);margin-bottom:2px;">PANEL &amp; SERVER CONFIGURATION</div>
          <h2 style="font-size:17px;font-weight:700;color:var(--text-primary);margin:0;">Settings &amp; Environment (mc.env)</h2>
        </div>
        <div style="display:flex;align-items:center;gap:10px;">
          <span class="badge" style="font-size:10.5px;">MCADMIN V2.4</span>
        </div>
      </div>
    </div>

    <div class="subnav-tabs">
      <button class="subnav-btn ${sub === "webapp" ? "active" : ""}" id="settings-tab-webapp" onclick="app.switchSettingsTab('webapp')">Web App Preferences</button>
      <button class="subnav-btn ${sub === "server" ? "active" : ""}" id="settings-tab-server" onclick="app.switchSettingsTab('server')">Server Configuration (mc.env)</button>
      <button class="subnav-btn ${sub === "raw" ? "active" : ""}" id="settings-tab-raw" onclick="app.switchSettingsTab('raw')">Raw mc.env Editor</button>
    </div>

    <div id="settings-webapp-panel" style="display:${sub === "webapp" ? "block" : "none"};">
      <div class="settings-grid-compact">
        <div class="settings-card-compact">
          <div class="settings-card-header-compact">
            <span class="settings-card-title-compact">Appearance &amp; Interface</span>
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
                      ${isCur ? `<span style="font-size:9.5px;color:var(--badge-text);font-weight:700;">▪</span>` : ""}
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
              <div class="settings-desc-compact">Spacing across lists &amp; tables</div>
            </div>
            <select class="settings-select-compact" id="setting-density" onchange="app.updateAppPref('density', this.value)">
              <option value="normal" ${prefs.density !== "compact" ? "selected" : ""}>Normal</option>
              <option value="compact" ${prefs.density === "compact" ? "selected" : ""}>Compact (Dense)</option>
            </select>
          </div>
        </div>

        <div class="settings-card-compact">
          <div class="settings-card-header-compact">
            <span class="settings-card-title-compact">Telemetry &amp; Live Streams</span>
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
            <span class="settings-card-title-compact">Web Alerts &amp; Notifications</span>
            <span class="badge">Audits</span>
          </div>
          <div class="settings-row-compact">
            <div>
              <div class="settings-label-compact">Audio Chime on Outage</div>
              <div class="settings-desc-compact">Play sound alert if server enters Error</div>
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
            <div style="display:flex;justify-content:space-between;width:100%;align-items:center;">
              <div class="settings-label-compact">Alert Webhook URL</div>
              <span id="webhook-saved-badge" style="font-size:11px;color:var(--color-success);display:none;">Saved</span>
            </div>
            <div class="settings-desc-compact">Discord or Slack incoming webhook for Error transitions</div>
            <div style="display:flex;gap:8px;width:100%;">
              <input type="text" class="settings-input-compact" style="flex:1;" placeholder="https://discord.com/api/webhooks/..." id="setting-webhook-url" value="${escapeHtml(webhookVal)}">
              <button class="btn btn-secondary btn-sm" onclick="app.saveAlertWebhook()">Save</button>
            </div>
          </div>
        </div>

        <div class="settings-card-compact">
          <div class="settings-card-header-compact">
            <span class="settings-card-title-compact">Session &amp; Client Storage</span>
            <span class="badge">Security</span>
          </div>
          <div class="settings-row-compact">
            <div>
              <div class="settings-label-compact">Session Inactivity Timeout</div>
              <div class="settings-desc-compact">Auto-logout after idle duration</div>
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
            <span class="badge badge-online">ENFORCED</span>
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
    </div>

    <div id="settings-server-panel" style="display:${sub === "server" ? "block" : "none"};">
      <div class="card" style="padding:22px 24px;">
        <div style="color:var(--text-muted);font-size:13px;">Loading mc.env configuration...</div>
      </div>
    </div>

    <div id="settings-raw-panel" style="display:${sub === "raw" ? "block" : "none"};">
      <div class="card" style="padding:22px 24px;">
        <div style="color:var(--text-muted);font-size:13px;">Loading raw mc.env editor...</div>
      </div>
    </div>
  `;
}

export function switchSettingsTab(app, subtab) {
  app.state.settingsSubtab = subtab;
  ["webapp", "server", "raw"].forEach(k => {
    const btn = document.getElementById(`settings-tab-${k}`);
    const panel = document.getElementById(`settings-${k}-panel`);
    if (btn) btn.classList.toggle("active", k === subtab);
    if (panel) panel.style.display = k === subtab ? "block" : "none";
  });
  if ((subtab === "server" || subtab === "raw") && !app.state.serverSettingsData) {
    loadSettings(app);
  }
}

export async function saveAlertWebhook(app) {
  const input = document.getElementById("setting-webhook-url");
  const badge = document.getElementById("webhook-saved-badge");
  const url = input ? input.value.trim() : "";
  try {
    const res = await app.api.request("/api/settings/panel-prefs", {
      method: "POST",
      body: { alert_webhook_url: url }
    });
    app.state.panelWebhookUrl = res.alert_webhook_url || "";
    app.updateAppPref("webhookUrl", app.state.panelWebhookUrl);
    if (badge) {
      badge.style.display = "inline-block";
      setTimeout(() => { if (badge) badge.style.display = "none"; }, 2500);
    }
  } catch (e) {
    alert("Failed to save webhook URL: " + e.message);
  }
}

export async function loadSettings(app) {
  app.loadPanelPrefs();
  try {
    const data = await app.api.request("/api/settings");
    app.state.serverSettingsData = data;
    renderServerConfigPanels(app, data);
  } catch (e) {
    const sp = document.getElementById("settings-server-panel");
    if (sp) sp.innerHTML = `<div class="card" style="padding:20px;"><span class="badge badge-error">ERROR</span> <span style="margin-left:8px;color:var(--text-secondary);">${escapeHtml(e.message)}</span></div>`;
  }
}

function renderServerConfigPanels(app, data) {
  const world = data.world || {};
  const players = data.players || {};
  const perf = data.performance || {};
  const text = data.text || {};
  const sys = data.system || {};

  const sp = document.getElementById("settings-server-panel");
  if (sp) {
    sp.innerHTML = `
      <div class="card" style="padding:22px 24px;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:18px;padding-bottom:14px;border-bottom:1px solid var(--border-subtle);">
          <div>
            <h3 style="font-size:15px;font-weight:700;text-transform:uppercase;">Server Configuration (mc.env)</h3>
            <div style="font-size:12px;color:var(--text-secondary);margin-top:2px;">Applying creates a timestamped backup and runs <code>recreate-mc</code>.</div>
          </div>
          <div class="btn-group">
            <button class="btn btn-secondary btn-sm" onclick="app.previewMcEnvDiff()">Preview Diff</button>
            <button class="btn btn-primary btn-sm" id="apply-mcenv-btn" onclick="app.applyMcEnvSettings()">${ICONS.check} Apply &amp; Recreate</button>
          </div>
        </div>

        <div class="grid-2" style="margin-bottom:18px;">
          <div class="settings-card-compact">
            <div class="settings-card-header-compact">
              <span class="settings-card-title-compact">World Settings</span>
              <span class="badge">WORLD</span>
            </div>
            <div>
              <label style="font-size:11px;font-weight:600;text-transform:uppercase;color:var(--text-secondary);display:block;margin-bottom:4px;">World Folder Name (LEVEL)</label>
              <input type="text" id="env-level" class="input" value="${escapeHtml(world.LEVEL || "BabaSquadWorld")}">
            </div>
            <div>
              <label style="font-size:11px;font-weight:600;text-transform:uppercase;color:var(--text-secondary);display:block;margin-bottom:4px;">World Seed (SEED)${world.SEED_READ_ONLY ? " · Locked" : ""}</label>
              <input type="text" id="env-seed" class="input" value="${escapeHtml(world.SEED || "")}" ${world.SEED_READ_ONLY ? "readonly disabled" : ""}>
              ${world.SEED_READ_ONLY ? `<div style="font-size:11px;color:var(--text-muted);margin-top:3px;">World already generated on disk. Use Worlds -&gt; Generate New World to reset seed.</div>` : ""}
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
              <div>
                <label style="font-size:11px;font-weight:600;text-transform:uppercase;color:var(--text-secondary);display:block;margin-bottom:4px;">Difficulty</label>
                <select id="env-difficulty" class="input">
                  <option value="peaceful" ${world.DIFFICULTY === "peaceful" ? "selected" : ""}>Peaceful</option>
                  <option value="easy" ${world.DIFFICULTY === "easy" ? "selected" : ""}>Easy</option>
                  <option value="normal" ${world.DIFFICULTY === "normal" ? "selected" : ""}>Normal</option>
                  <option value="hard" ${world.DIFFICULTY === "hard" ? "selected" : ""}>Hard</option>
                </select>
              </div>
              <div>
                <label style="font-size:11px;font-weight:600;text-transform:uppercase;color:var(--text-secondary);display:block;margin-bottom:4px;">Gamemode (MODE)</label>
                <select id="env-mode" class="input">
                  <option value="survival" ${world.MODE === "survival" ? "selected" : ""}>Survival</option>
                  <option value="creative" ${world.MODE === "creative" ? "selected" : ""}>Creative</option>
                  <option value="adventure" ${world.MODE === "adventure" ? "selected" : ""}>Adventure</option>
                  <option value="spectator" ${world.MODE === "spectator" ? "selected" : ""}>Spectator</option>
                </select>
              </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
              <div>
                <label style="font-size:11px;font-weight:600;text-transform:uppercase;color:var(--text-secondary);display:block;margin-bottom:4px;">PVP Enabled</label>
                <select id="env-pvp" class="input">
                  <option value="true" ${world.PVP !== false ? "selected" : ""}>Enabled (true)</option>
                  <option value="false" ${world.PVP === false ? "selected" : ""}>Disabled (false)</option>
                </select>
              </div>
              <div>
                <label style="font-size:11px;font-weight:600;text-transform:uppercase;color:var(--text-secondary);display:block;margin-bottom:4px;">Hardcore</label>
                <select id="env-hardcore" class="input">
                  <option value="false" ${!world.HARDCORE ? "selected" : ""}>Off (false)</option>
                  <option value="true" ${world.HARDCORE ? "selected" : ""}>On (true)</option>
                </select>
              </div>
            </div>
          </div>

          <div class="settings-card-compact">
            <div class="settings-card-header-compact">
              <span class="settings-card-title-compact">Players, Memory &amp; Text</span>
              <span class="badge">TUNING</span>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
              <div>
                <label style="font-size:11px;font-weight:600;text-transform:uppercase;color:var(--text-secondary);display:block;margin-bottom:4px;">Max Players</label>
                <input type="number" id="env-max-players" class="input" min="1" max="100" value="${players.MAX_PLAYERS || 8}">
              </div>
              <div>
                <label style="font-size:11px;font-weight:600;text-transform:uppercase;color:var(--text-secondary);display:block;margin-bottom:4px;">JVM Memory (Max 4G)</label>
                <select id="env-memory" class="input">
                  <option value="1G" ${perf.MEMORY === "1G" ? "selected" : ""}>1G</option>
                  <option value="2G" ${perf.MEMORY === "2G" ? "selected" : ""}>2G</option>
                  <option value="3G" ${perf.MEMORY === "3G" ? "selected" : ""}>3G</option>
                  <option value="4G" ${perf.MEMORY === "4G" ? "selected" : ""}>4G</option>
                </select>
              </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
              <div>
                <label style="font-size:11px;font-weight:600;text-transform:uppercase;color:var(--text-secondary);display:block;margin-bottom:4px;">View Distance (2–32)</label>
                <input type="number" id="env-view-distance" class="input" min="2" max="32" value="${perf.VIEW_DISTANCE || 16}">
              </div>
              <div>
                <label style="font-size:11px;font-weight:600;text-transform:uppercase;color:var(--text-secondary);display:block;margin-bottom:4px;">Simulation Distance</label>
                <input type="number" id="env-sim-distance" class="input" min="2" max="32" value="${perf.SIMULATION_DISTANCE || 6}">
              </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
              <div>
                <label style="font-size:11px;font-weight:600;text-transform:uppercase;color:var(--text-secondary);display:block;margin-bottom:4px;">Whitelist (mc.env)</label>
                <select id="env-whitelist" class="input">
                  <option value="true" ${players.ENABLE_WHITELIST ? "selected" : ""}>Enabled (true)</option>
                  <option value="false" ${!players.ENABLE_WHITELIST ? "selected" : ""}>Disabled (false)</option>
                </select>
              </div>
              <div>
                <label style="font-size:11px;font-weight:600;text-transform:uppercase;color:var(--text-secondary);display:block;margin-bottom:4px;">Online Auth Mode</label>
                <select id="env-online-mode" class="input" onchange="const w=document.getElementById('online-mode-warning'); if(w) w.style.display=this.value==='false'?'block':'none';">
                  <option value="true" ${players.ONLINE_MODE ? "selected" : ""}>Online (Mojang Auth)</option>
                  <option value="false" ${!players.ONLINE_MODE ? "selected" : ""}>Offline / Cracked</option>
                </select>
              </div>
            </div>
            <div id="online-mode-warning" style="display:${!players.ONLINE_MODE ? "block" : "none"};padding:8px 10px;border-left:3px solid var(--color-error);background:var(--color-error-bg);font-size:11.5px;color:var(--color-error);line-height:1.45;">
              SECURITY WARNING: Offline mode disables Mojang authentication. Keep Whitelist enabled and expose Minecraft strictly over LAN/VPN.
            </div>
            <div>
              <label style="font-size:11px;font-weight:600;text-transform:uppercase;color:var(--text-secondary);display:block;margin-bottom:4px;">Server MOTD</label>
              <input type="text" id="env-motd" class="input" value="${escapeHtml(text.MOTD || "palvi")}">
            </div>
          </div>
        </div>

        <div style="display:flex;flex-wrap:wrap;gap:14px;font-size:11.5px;color:var(--text-muted);padding-top:10px;border-top:1px solid var(--border-subtle);">
          <span>Type: <strong style="color:var(--text-primary);">${escapeHtml(sys.TYPE || "FABRIC")}</strong></span>
          <span>Version: <strong style="color:var(--text-primary);">${escapeHtml(sys.VERSION || "26.3")}</strong></span>
          <span>Timezone: <strong style="color:var(--text-primary);">${escapeHtml(sys.TZ || "Asia/Kolkata")}</strong></span>
        </div>
      </div>
    `;
  }

  const rp = document.getElementById("settings-raw-panel");
  if (rp) {
    rp.innerHTML = `
      <div class="editor-container">
        <div class="editor-header">
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="font-size:13px;font-weight:600;">mc.env Raw Editor</span>
            <span class="badge">Validated Syntax</span>
          </div>
          <div class="btn-group">
            <button class="btn btn-secondary btn-sm" onclick="app.previewMcEnvDiff()">Preview Diff</button>
            <button class="btn btn-primary btn-sm" onclick="app.applyMcEnvSettings()">${ICONS.check} Apply Raw &amp; Recreate</button>
          </div>
        </div>
        <div class="editor-body">
          <div class="editor-gutter" id="raw-env-gutter"></div>
          <textarea id="raw-env-textarea" class="editor-textarea" spellcheck="false" wrap="off"></textarea>
        </div>
      </div>
    `;
    const ta = document.getElementById("raw-env-textarea");
    const gutter = document.getElementById("raw-env-gutter");
    if (ta && gutter) {
      ta.value = data.raw || "";
      const syncNums = () => {
        const count = ta.value.split("\n").length;
        let html = "";
        for (let i = 1; i <= count; i++) html += `<div class="editor-line-num">${i}</div>`;
        gutter.innerHTML = html;
      };
      syncNums();
      ta.addEventListener("input", syncNums);
      ta.addEventListener("scroll", () => { gutter.scrollTop = ta.scrollTop; });
    }
  }
}

function buildSettingsPayload(app) {
  if (app.state.settingsSubtab === "raw") {
    const ta = document.getElementById("raw-env-textarea");
    return { raw_content: ta ? ta.value : "" };
  }
  const updates = {
    LEVEL: document.getElementById("env-level")?.value.trim() || "BabaSquadWorld",
    DIFFICULTY: document.getElementById("env-difficulty")?.value || "easy",
    MODE: document.getElementById("env-mode")?.value || "survival",
    PVP: document.getElementById("env-pvp")?.value || "true",
    HARDCORE: document.getElementById("env-hardcore")?.value || "false",
    MAX_PLAYERS: String(parseInt(document.getElementById("env-max-players")?.value || "8", 10)),
    MEMORY: document.getElementById("env-memory")?.value || "3G",
    VIEW_DISTANCE: String(parseInt(document.getElementById("env-view-distance")?.value || "16", 10)),
    SIMULATION_DISTANCE: String(parseInt(document.getElementById("env-sim-distance")?.value || "6", 10)),
    ENABLE_WHITELIST: document.getElementById("env-whitelist")?.value || "false",
    ONLINE_MODE: document.getElementById("env-online-mode")?.value || "false",
    MOTD: document.getElementById("env-motd")?.value || "palvi"
  };
  const seedEl = document.getElementById("env-seed");
  if (seedEl && !seedEl.disabled) {
    updates.SEED = seedEl.value.trim();
  }
  return { updates: updates };
}

export async function previewMcEnvDiff(app) {
  const payload = buildSettingsPayload(app);
  try {
    const res = await app.api.request("/api/settings/diff", {
      method: "POST",
      body: payload
    });
    const diffText = (res.diff && res.diff.trim()) ? res.diff : "No changes compared to active mc.env.";
    const overlay = document.getElementById("modal-overlay");
    const body = document.getElementById("modal-body");
    body.innerHTML = `
      <div class="modal-header">
        <h3 style="font-size:14px;font-weight:700;text-transform:uppercase;">Proposed mc.env Diff</h3>
        <button class="btn btn-secondary btn-sm" onclick="app.closeModal()">✕</button>
      </div>
      <div style="padding:16px 20px;max-height:60vh;overflow:auto;">
        <pre style="margin:0;font-family:monospace;font-size:12px;line-height:1.5;background:var(--bg-canvas);padding:12px;border:1px solid var(--border-subtle);white-space:pre-wrap;">${escapeHtml(diffText)}</pre>
      </div>
      <div class="modal-footer" style="display:flex;justify-content:flex-end;gap:10px;padding:12px 20px;border-top:1px solid var(--border-subtle);">
        <button class="btn btn-secondary btn-sm" onclick="app.closeModal()">Close</button>
        <button class="btn btn-primary btn-sm" onclick="app.closeModal(); app.applyMcEnvSettings()">Apply &amp; Recreate</button>
      </div>
    `;
    overlay.style.display = "flex";
  } catch (e) {
    alert("Diff preview error: " + e.message);
  }
}

export async function applyMcEnvSettings(app, force = false) {
  const payload = { ...buildSettingsPayload(app), force: force };
  const btn = document.getElementById("apply-mcenv-btn");
  if (btn) btn.disabled = true;
  try {
    const res = await app.api.request("/api/settings/apply", {
      method: "POST",
      body: payload
    });
    if (res.needs_confirmation) {
      if (btn) btn.disabled = false;
      app.showConfirmModal(
        "Players Online — Confirm Recreate",
        res.message || "Players are currently online. Applying mc.env will disconnect them while recreating the server.",
        () => applyMcEnvSettings(app, true),
        { danger: true, confirmText: "Disconnect Players & Apply" }
      );
      return;
    }
    alert(res.message || "Settings applied.");
    await loadSettings(app);
    app.fetchStatus();
  } catch (e) {
    alert("Failed to apply settings: " + e.message);
  } finally {
    if (btn) btn.disabled = false;
  }
}

export async function saveMcEnvProperties(app) {
  return applyMcEnvSettings(app, false);
}
