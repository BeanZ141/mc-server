(() => {
  const isMock = new URLSearchParams(window.location.search).get("mock") === "1";
  if (!isMock) {
    return;
  }
  const originalFetch = window.fetch;
  const originalEventSource = window.EventSource;

  function buildMonthHeatmap(monthName, daysCount, startWeekdayIdx) {
    const daysNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const days = [];
    for (let d = 1; d <= daysCount; d++) {
      const wday = (startWeekdayIdx + d - 1) % 7;
      const isWeekend = wday >= 5;
      const hoursList = [];
      for (let h = 0; h < 24; h++) {
        let isOnline = false;
        let pCount = 0;
        if (isWeekend) {
          isOnline = (h >= 9 && h <= 23);
          pCount = (h >= 14 && h <= 20) ? 8 : (isOnline ? 4 : 0);
        } else {
          isOnline = (h >= 8 && h <= 10) || (h >= 12 && h <= 13) || (h >= 16 && h <= 22);
          pCount = (h >= 17 && h <= 20) ? 7 : (isOnline ? 2 : 0);
        }
        const isDown = (d === 9 && (h === 4 || h === 5));
        const status = isDown ? "down" : (isOnline ? "online" : "asleep");
        hoursList.push({
          h: h,
          s: status,
          p: isDown ? 0 : pCount
        });
      }
      days.push({
        day: daysNames[wday],
        date: `${monthName.slice(0, 3)} ${d < 10 ? '0' + d : d}`,
        hours: hoursList
      });
    }
    return {
      month: `${monthName} 2026`,
      short_month: monthName.slice(0, 3),
      days_count: daysCount,
      days: days
    };
  }

  const mockHeatmapMonths = [
    buildMonthHeatmap("November", 30, 6),
    buildMonthHeatmap("October", 31, 3),
    buildMonthHeatmap("September", 30, 1)
  ];

  const mockState = {
    status: {
      state: "Online",
      exit_code: 0,
      lazymc_running: true,
      uptime_seconds: 86420,
      stats: {
        cpu_percent: 14.8,
        ram_used_mb: 2680.0,
        ram_limit_mb: 6144.0,
        tps: 20.0,
        mspt: 18.4,
        entities: 142,
        chunks: 89
      },
      players: {
        count: 3,
        max: 8,
        players: ["PalviGamer", "Notch_99", "SteveCraft"]
      },
      performance: {
        tps: 20.0,
        mspt: 18.4
      },
      idle: {
        is_idle: false,
        remaining_seconds: 300,
        threshold_seconds: 300
      },
      software: "Fabric",
      version: "1.21.4 (Fabric 26.3)",
      watch_state: {
        mc: "running",
        media: "stopped",
        media_start_at: null,
        grace: 300
      },
      host_analytics: {
        cpu_temp: 42.5,
        memory: {
          total_mb: 16384.0,
          used_mb: 7420.0,
          free_mb: 8964.0,
          percent: 45.3
        },
        disk: {
          total_gb: 480.0,
          used_gb: 128.4,
          free_gb: 351.6,
          percent: 26.8
        },
        load_average: [0.42, 0.58, 0.65],
        os_info: "Linux 6.6.137-palvi (x86_64)"
      }
    },
    properties: {
      max_players: 8,
      gamemode: "survival",
      difficulty: "normal",
      whitelist: false,
      white_list: false,
      allow_flight: true,
      spawn_protection: 16,
      motd: "A Palvi Minecraft Server",
      pvp: true,
      hardcore: false,
      online_mode: false,
      view_distance: 16,
      simulation_distance: 6,
      enable_command_block: false,
      allow_nether: true,
      spawn_monsters: true,
      spawn_animals: true,
      spawn_npcs: true,
      force_gamemode: false
    },
    logs: [
      "[13:40:02 INFO]: Loading Minecraft 1.21.4 with Fabric Loader 0.16.10",
      "[13:40:04 INFO]: [FabricLoader] Loading 38 mods: fabricloader 0.16.10, java 21, minecraft 1.21.4, lithium 0.14.7, ferritecore 7.0.0, sodium 0.6.5...",
      "[13:40:08 INFO]: Environment: Environment[authHost=https://authserver.mojang.com, name=PROD]",
      "[13:40:12 INFO]: Loaded 7 recipes",
      "[13:40:15 INFO]: Loaded 1399 advancements",
      "[13:40:20 INFO]: Starting minecraft server version 1.21.4",
      "[13:40:20 INFO]: Loading properties",
      "[13:40:20 INFO]: Default game type: SURVIVAL",
      "[13:40:20 INFO]: Generating keypair",
      "[13:40:21 INFO]: Starting Minecraft server on *:25565",
      "[13:40:22 INFO]: Using epoll channel type",
      "[13:40:25 INFO]: Preparing level \"BabaSquadWorld\"",
      "[13:40:28 INFO]: Preparing start region for dimension minecraft:overworld",
      "[13:40:32 INFO]: Time elapsed: 4820 ms",
      "[13:40:32 INFO]: Done (12.430s)! For help, type \"help\"",
      "[13:41:00 INFO]: Thread RCON Listener started on 0.0.0.0:25575",
      "[13:45:10 INFO]: PalviGamer[local] logged in with entity id 120 at (-124.5, 68.0, 312.2)",
      "[13:45:10 INFO]: PalviGamer joined the game",
      "[13:48:32 INFO]: Notch_99[local] logged in with entity id 145 at (-120.1, 68.0, 315.8)",
      "[13:48:32 INFO]: Notch_99 joined the game",
      "[13:52:14 INFO]: SteveCraft[local] logged in with entity id 198 at (-105.0, 71.0, 290.4)",
      "[13:52:14 INFO]: SteveCraft joined the game",
      "[14:00:00 INFO]: [AutoSave] Saved the game",
      "[14:05:00 INFO]: [TickMonitor] Average tick rate 20.0 TPS (18.4ms MSPT)"
    ],
    players: {
      online_players: ["PalviGamer", "Notch_99", "SteveCraft"],
      ops: [
        { name: "PalviGamer", uuid: "d1c2-3b4a-5c6d", level: 4 }
      ],
      banned_players: [
        { name: "GrieferGuy", uuid: "bad-player-1", created: "2026-11-20 18:22:01", reason: "Lava griefing at spawn", source: "Server" }
      ],
      banned_ips: [
        { ip: "192.168.1.199", created: "2026-11-20 18:25:00", reason: "Repeated unauthorized access", source: "Server" }
      ],
      whitelisted: [
        { name: "PalviGamer", uuid: "d1c2-3b4a-5c6d" },
        { name: "Notch_99", uuid: "e5f6-7a8b-9c0d" },
        { name: "SteveCraft", uuid: "f9a0-1b2c-3d4e" },
        { name: "AlexBuilder", uuid: "a1b2-c3d4-e5f6" }
      ],
      offline_players: [
        { name: "AlexBuilder", uuid: "a1b2-c3d4-e5f6", expiresOn: "2026-12-01" },
        { name: "DiamondMiner", uuid: "b2c3-d4e5-f6a7", expiresOn: "2026-12-01" },
        { name: "CreeperHunter", uuid: "c3d4-e5f6-a7b8", expiresOn: "2026-12-01" },
        { name: "RedstoneEngineer", uuid: "d4e5-f6a7-b8c9", expiresOn: "2026-12-01" }
      ]
    },
    software: {
      current: {
        type: "FABRIC",
        version: "26.3",
        name: "Fabric",
        is_default: true,
        status: "Installed (Active)"
      },
      available: [
        { id: "FABRIC", name: "Fabric", description: "Lightweight, experimental modding toolchain for Minecraft. Default and currently installed software.", icon: "fabric", supports_mods: true, supports_plugins: false, mod_loader: "fabric", is_default: true },
        { id: "VANILLA", name: "Vanilla", description: "The official Minecraft server by Mojang. Pure unmodified game experience.", icon: "vanilla", supports_mods: false, supports_plugins: false, mod_loader: null, is_default: false },
        { id: "SNAPSHOT", name: "Snapshot", description: "Preview versions of upcoming Minecraft updates. For testing future features.", icon: "snapshot", supports_mods: false, supports_plugins: false, mod_loader: null, is_default: false },
        { id: "PAPER", name: "Paper / Bukkit", description: "High-performance Minecraft server software supporting Spigot and Bukkit plugins.", icon: "paper", supports_mods: false, supports_plugins: true, mod_loader: null, is_default: false },
        { id: "NEOFORGE", name: "NeoForge", description: "Modern fork of the Minecraft Forge mod loader for recent Minecraft versions.", icon: "neoforge", supports_mods: true, supports_plugins: false, mod_loader: "neoforge", is_default: false },
        { id: "FORGE", name: "Forge", description: "Classic modding platform with the largest legacy ecosystem of mods.", icon: "forge", supports_mods: true, supports_plugins: false, mod_loader: "forge", is_default: false }
      ]
    },
    installedMods: {
      loader: "fabric",
      game_version: "26.3",
      managed: [
        { slug: "fabric-api", title: "Fabric API", installed_jar: "fabric-api-0.115.0+26.3.jar", status: "Installed" },
        { slug: "lithium", title: "Lithium", installed_jar: "lithium-fabric-0.14.7+mc26.3.jar", status: "Installed" },
        { slug: "ferrite-core", title: "FerriteCore", installed_jar: "ferritecore-7.0.0-fabric.jar", status: "Installed" }
      ],
      manual: [
        { filename: "lazydfu-0.1.3.jar", size_bytes: 14200, modified_at: 1763800000 }
      ]
    },
    mediaContainers: [
      { name: "jellyfin", status: "Exited (0)", running: false },
      { name: "jellyseerr", status: "Exited (0)", running: false },
      { name: "sonarr", status: "Exited (0)", running: false },
      { name: "radarr", status: "Exited (0)", running: false },
      { name: "bazarr", status: "Exited (0)", running: false },
      { name: "prowlarr", status: "Exited (0)", running: false },
      { name: "flaresolverr", status: "Exited (0)", running: false },
      { name: "qbittorrent", status: "Exited (0)", running: false }
    ],
    backups: [
      { id: "backup-2026-11-22-daily", filename: "backup-2026-11-22-daily.tar.gz", size_bytes: 420000000, size_human: "400.5 MB", created_at: "2026-11-22T04:00:00", is_safety: false },
      { id: "backup-2026-11-21-daily", filename: "backup-2026-11-21-daily.tar.gz", size_bytes: 418000000, size_human: "398.6 MB", created_at: "2026-11-21T04:00:00", is_safety: false },
      { id: "safety-before-update", filename: "safety-before-update.tar.gz", size_bytes: 415000000, size_human: "395.8 MB", created_at: "2026-11-20T12:00:00", is_safety: true }
    ],
    audit: [
      { timestamp: "2026-11-22T04:00:02", user: "system", action: "backup", target: "minecraft", details: "Automated daily backup completed", result: "SUCCESS", ip_address: "127.0.0.1" },
      { timestamp: "2026-11-22T09:15:10", user: "admin", action: "login", target: "session", details: "Successful admin sign in", result: "SUCCESS", ip_address: "192.168.1.42" },
      { timestamp: "2026-11-22T09:20:44", user: "admin", action: "add_mod", target: "lithium", details: "Added mod lithium (success=True)", result: "SUCCESS", ip_address: "192.168.1.42" }
    ],
    panelWebhookUrl: "",
    rawEnv: "VERSION=26.3\nTYPE=FABRIC\nMEMORY=3G\nVIEW_DISTANCE=16\nSIMULATION_DISTANCE=6\nMAX_PLAYERS=8\nMODE=survival\nDIFFICULTY=easy\nPVP=true\nHARDCORE=false\nENABLE_WHITELIST=false\nONLINE_MODE=false\nMOTD=palvi\nLEVEL=BabaSquadWorld\nSEED=1807738846518060059\nMODRINTH_PROJECTS=fabric-api,lithium,ferrite-core\nTZ=Asia/Kolkata\n",
    modrinthCatalog: [
      { id: "P7dR8mSH", slug: "fabric-api", title: "Fabric API", description: "Essential hooks and interoperability libraries for the Fabric mod ecosystem.", downloads: 84200310, date_modified: "2026-11-18T14:20:00Z", client_side: "optional", server_side: "required", icon_url: "https://cdn.modrinth.com/data/P7dR8mSH/icon.png" },
      { id: "gvQqBUqZ", slug: "lithium", title: "Lithium", description: "General-purpose physics, chunk generation, and AI optimization mod.", downloads: 32450120, date_modified: "2026-11-15T09:12:00Z", client_side: "optional", server_side: "required", icon_url: "https://cdn.modrinth.com/data/gvQqBUqZ/icon.png" },
      { id: "u6dDxUn5", slug: "ferrite-core", title: "FerriteCore", description: "Memory usage optimizations reducing RAM footprint by up to 50%.", downloads: 19830400, date_modified: "2026-11-10T11:45:00Z", client_side: "optional", server_side: "optional", icon_url: "https://cdn.modrinth.com/data/u6dDxUn5/icon.png" },
      { id: "AANobbMI", slug: "sodium", title: "Sodium", description: "Modern rendering engine drastically replacing Minecraft render pipeline.", downloads: 41200800, date_modified: "2026-11-12T16:00:00Z", client_side: "required", server_side: "optional", icon_url: "https://cdn.modrinth.com/data/AANobbMI/icon.png" },
      { id: "YL57xq9U", slug: "iris", title: "Iris Shaders", description: "Modern shaders mod compatible with Sodium and existing shaderpacks.", downloads: 28150000, date_modified: "2026-11-14T18:30:00Z", client_side: "required", server_side: "optional", icon_url: "https://cdn.modrinth.com/data/YL57xq9U/icon.png" },
      { id: "9eGKb6K1", slug: "simple-voice-chat", title: "Simple Voice Chat", description: "Proximity voice chat in Minecraft with positional audio and group chats.", downloads: 21340900, date_modified: "2026-11-19T20:10:00Z", client_side: "required", server_side: "required", icon_url: "https://cdn.modrinth.com/data/9eGKb6K1/icon.png" },
      { id: "fALzjRMS", slug: "chunky", title: "Chunky", description: "Pre-generates chunks rapidly to eliminate exploration lag.", downloads: 4890200, date_modified: "2026-11-05T08:00:00Z", client_side: "optional", server_side: "required", icon_url: "https://cdn.modrinth.com/data/fALzjRMS/icon.png" },
      { id: "x0wE4aE5", slug: "dynmap", title: "Dynmap", description: "Dynamic Google Maps-style web map of your Minecraft world in browser.", downloads: 8720100, date_modified: "2026-11-01T12:00:00Z", client_side: "optional", server_side: "required", icon_url: "https://cdn.modrinth.com/data/x0wE4aE5/icon.png" }
    ],
    fileStore: {
      "": [
        { name: "BabaSquadWorld", path: "BabaSquadWorld", type: "directory", extension: "", size: 0, size_formatted: "—", modified: "2026-11-22 13:40:25", editable: false },
        { name: "config", path: "config", type: "directory", extension: "", size: 0, size_formatted: "—", modified: "2026-11-22 13:40:20", editable: false },
        { name: "logs", path: "logs", type: "directory", extension: "", size: 0, size_formatted: "—", modified: "2026-11-22 13:40:02", editable: false },
        { name: "mods", path: "mods", type: "directory", extension: "", size: 0, size_formatted: "—", modified: "2026-11-22 13:40:04", editable: false },
        { name: "banned-ips.json", path: "banned-ips.json", type: "file", extension: ".json", size: 148, size_formatted: "148 B", modified: "2026-11-20 18:25:00", editable: true },
        { name: "banned-players.json", path: "banned-players.json", type: "file", extension: ".json", size: 172, size_formatted: "172 B", modified: "2026-11-20 18:22:01", editable: true },
        { name: "eula.txt", path: "eula.txt", type: "file", extension: ".txt", size: 18, size_formatted: "18 B", modified: "2026-11-21 10:00:00", editable: true },
        { name: "ops.json", path: "ops.json", type: "file", extension: ".json", size: 98, size_formatted: "98 B", modified: "2026-11-21 11:00:00", editable: true },
        { name: "server.properties", path: "server.properties", type: "file", extension: ".properties", size: 1240, size_formatted: "1.2 KB", modified: "2026-11-22 13:40:20", editable: true },
        { name: "whitelist.json", path: "whitelist.json", type: "file", extension: ".json", size: 384, size_formatted: "384 B", modified: "2026-11-21 12:00:00", editable: true }
      ],
      "contents": {
        "server.properties": "server-port=25565\nmotd=A Palvi Minecraft Server\nmax-players=8\ngamemode=survival\ndifficulty=normal\nwhite-list=false\nallow-flight=true\nspawn-protection=16\npvp=true\nonline-mode=false\nlevel-name=BabaSquadWorld\n",
        "whitelist.json": "[\n  {\"uuid\": \"d1c2-3b4a-5c6d\", \"name\": \"PalviGamer\"},\n  {\"uuid\": \"e5f6-7a8b-9c0d\", \"name\": \"Notch_99\"},\n  {\"uuid\": \"f9a0-1b2c-3d4e\", \"name\": \"SteveCraft\"},\n  {\"uuid\": \"a1b2-c3d4-e5f6\", \"name\": \"AlexBuilder\"}\n]",
        "ops.json": "[\n  {\"uuid\": \"d1c2-3b4a-5c6d\", \"name\": \"PalviGamer\", \"level\": 4, \"bypassesPlayerLimit\": false}\n]",
        "banned-players.json": "[\n  {\"uuid\": \"bad-player-1\", \"name\": \"GrieferGuy\", \"created\": \"2026-11-20 18:22:01\", \"reason\": \"Lava griefing at spawn\", \"source\": \"Server\"}\n]",
        "banned-ips.json": "[\n  {\"ip\": \"192.168.1.199\", \"created\": \"2026-11-20 18:25:00\", \"reason\": \"Repeated unauthorized access\", \"source\": \"Server\"}\n]",
        "eula.txt": "eula=true\n"
      }
    },
    analytics: {
      uptime_pct_total: 99.8,
      total_uptime_formatted: "24d 14h 22m",
      avg_uptime_hours: 162.5,
      avg_uptime_formatted: "6d 18h",
      avg_session_minutes: 48.5,
      avg_session_formatted: "48.5 min",
      sleep_hours_today: 14.3,
      sleep_formatted_today: "14h 18m",
      sleep_pct_today: 59.6,
      active_hours_today: 9.7,
      active_formatted_today: "9h 42m",
      active_pct_today: 40.4,
      power_saved_pct: 64.0,
      idle_threshold_seconds: 300,
      uptime_history_14d: [
        { day: "14d", label: "Nov 09", status: "online", uptime_pct: 100, sleep_hours: 14.8, peak_players: 7 },
        { day: "13d", label: "Nov 10", status: "online", uptime_pct: 100, sleep_hours: 13.5, peak_players: 8 },
        { day: "12d", label: "Nov 11", status: "online", uptime_pct: 100, sleep_hours: 15.1, peak_players: 6 },
        { day: "11d", label: "Nov 12", status: "asleep", uptime_pct: 98.4, sleep_hours: 18.2, peak_players: 4 },
        { day: "10d", label: "Nov 13", status: "online", uptime_pct: 100, sleep_hours: 12.0, peak_players: 8 },
        { day: "9d", label: "Nov 14", status: "online", uptime_pct: 100, sleep_hours: 11.4, peak_players: 8 },
        { day: "8d", label: "Nov 15", status: "online", uptime_pct: 100, sleep_hours: 10.8, peak_players: 8 },
        { day: "7d", label: "Nov 16", status: "online", uptime_pct: 100, sleep_hours: 13.9, peak_players: 7 },
        { day: "6d", label: "Nov 17", status: "down", uptime_pct: 94.2, sleep_hours: 8.5, peak_players: 5 },
        { day: "5d", label: "Nov 18", status: "online", uptime_pct: 100, sleep_hours: 14.6, peak_players: 6 },
        { day: "4d", label: "Nov 19", status: "online", uptime_pct: 100, sleep_hours: 15.0, peak_players: 7 },
        { day: "3d", label: "Nov 20", status: "online", uptime_pct: 100, sleep_hours: 13.2, peak_players: 8 },
        { day: "2d", label: "Nov 21", status: "online", uptime_pct: 100, sleep_hours: 12.8, peak_players: 8 },
        { day: "1d", label: "Today", status: "online", uptime_pct: 99.9, sleep_hours: 14.3, peak_players: 8 }
      ],
      hourly_distribution: [
        { hour: "00", label: "00:00", status: "asleep", players: 0, activity_pct: 0 },
        { hour: "01", label: "01:00", status: "asleep", players: 0, activity_pct: 0 },
        { hour: "02", label: "02:00", status: "asleep", players: 0, activity_pct: 0 },
        { hour: "03", label: "03:00", status: "asleep", players: 0, activity_pct: 0 },
        { hour: "04", label: "04:00", status: "asleep", players: 0, activity_pct: 0 },
        { hour: "05", label: "05:00", status: "asleep", players: 0, activity_pct: 0 },
        { hour: "06", label: "06:00", status: "asleep", players: 0, activity_pct: 0 },
        { hour: "07", label: "07:00", status: "asleep", players: 0, activity_pct: 0 },
        { hour: "08", label: "08:00", status: "online", players: 1, activity_pct: 15 },
        { hour: "09", label: "09:00", status: "online", players: 2, activity_pct: 25 },
        { hour: "10", label: "10:00", status: "online", players: 2, activity_pct: 25 },
        { hour: "11", label: "11:00", status: "asleep", players: 0, activity_pct: 0 },
        { hour: "12", label: "12:00", status: "online", players: 3, activity_pct: 38 },
        { hour: "13", label: "13:00", status: "online", players: 3, activity_pct: 38 },
        { hour: "14", label: "14:00", status: "asleep", players: 0, activity_pct: 0 },
        { hour: "15", label: "15:00", status: "online", players: 2, activity_pct: 25 },
        { hour: "16", label: "16:00", status: "online", players: 4, activity_pct: 50 },
        { hour: "17", label: "17:00", status: "online", players: 5, activity_pct: 63 },
        { hour: "18", label: "18:00", status: "online", players: 7, activity_pct: 88 },
        { hour: "19", label: "19:00", status: "online", players: 8, activity_pct: 100 },
        { hour: "20", label: "20:00", status: "online", players: 8, activity_pct: 100 },
        { hour: "21", label: "21:00", status: "online", players: 6, activity_pct: 75 },
        { hour: "22", label: "22:00", status: "online", players: 4, activity_pct: 50 },
        { hour: "23", label: "23:00", status: "asleep", players: 0, activity_pct: 0 }
      ],
      funnel_stages: [
        { name: "Standby Sleep (lazymc)", pct: 59.6, count: "14h 18m", status: "ok" },
        { name: "Active Player Sessions", pct: 35.8, count: "8h 36m", status: "ok" },
        { name: "Server Bootstrap / Wake Overhead", pct: 4.6, count: "1h 06m", status: "warn" },
        { name: "Unscheduled Offline Downtime", pct: 0.0, count: "0m", status: "ok" }
      ],
      incidents_log: [
        { time: "08:42:15 UTC", tag: "[SYSTEM_STATE]", msg: "STANDBY_WAKE_TRIGGERED (PLAYERS: 1/8)" },
        { time: "04:59:00 UTC", tag: "[PROCESS_TR]", msg: "RESTART_OK (COMPLETED IN 18.4s)" },
        { time: "11/22 03:00", tag: "[BACKUP]", msg: "BACKUP_OK - SEED WORLD (942MB)" }
      ],
      host_telemetry: {
        cpu_temp: 42.5,
        load_1m: 0.42,
        load_5m: 0.58,
        load_15m: 0.65,
        cpu_frequency_ghz: 3.8,
        active_processes: 142,
        ram_used_gb: 7.4,
        ram_total_gb: 16.0,
        ram_percent: 45.3,
        swap_used_mb: 0,
        swap_total_mb: 4096,
        disk_used_gb: 128.4,
        disk_total_gb: 480.0,
        disk_percent: 26.8,
        disk_read_mbps: 1.4,
        disk_write_mbps: 3.8,
        net_in_kbps: 48.2,
        net_out_kbps: 124.6
      },
      heatmap_months: mockHeatmapMonths,
      heatmap_7d_24h: mockHeatmapMonths[0].days.slice(-7)
    }
  };

  let tickCount = 0;
  let gcOffset = 0;

  function stepTelemetry() {
    if (mockState.status.state !== "Online") {
      mockState.status.stats.cpu_percent = 0.0;
      mockState.status.stats.mspt = 0.0;
      mockState.status.stats.tps = 0.0;
      mockState.status.stats.ram_used_mb = 0.0;
      mockState.status.host_analytics.cpu_temp = 34.0;
      return;
    }

    tickCount++;
    mockState.status.uptime_seconds += 3;

    const t = tickCount * 0.4;
    const wave = Math.sin(t) * 6.5 + Math.cos(t * 0.73) * 3.8;
    const isSpike = Math.random() < 0.12;
    const spike = isSpike ? (Math.random() * 20.0 + 10.0) : 0;
    const jitter = (Math.random() - 0.5) * 3.0;
    const cpu = Math.max(7.2, Math.min(84.0, 16.5 + wave + spike + jitter));
    mockState.status.stats.cpu_percent = Math.round(cpu * 10) / 10;

    const targetTemp = 42.0 + (cpu * 0.28) + (Math.random() - 0.5) * 1.2;
    const prevTemp = mockState.status.host_analytics.cpu_temp || 45.0;
    const nextTemp = Math.round((prevTemp * 0.7 + targetTemp * 0.3) * 10) / 10;
    mockState.status.host_analytics.cpu_temp = Math.max(38.0, Math.min(68.0, nextTemp));

    const msptBase = 15.0 + (cpu * 0.25);
    const msptNoise = (Math.random() - 0.5) * 2.2;
    const mspt = Math.max(12.0, Math.round((msptBase + msptNoise + (isSpike ? 14.0 : 0)) * 10) / 10);
    mockState.status.stats.mspt = mspt;
    mockState.status.performance.mspt = mspt;

    const tps = mspt > 50.0 ? Math.max(15.0, Math.round((1000.0 / mspt) * 10) / 10) : 20.0;
    mockState.status.stats.tps = tps;
    mockState.status.performance.tps = tps;

    gcOffset += (Math.random() * 18 + 8);
    if (gcOffset > 850) {
      gcOffset = 0;
      mockState.status.stats.ram_used_mb = Math.round((2520.0 + Math.random() * 50) * 10) / 10;
    } else {
      mockState.status.stats.ram_used_mb = Math.round((2520.0 + gcOffset) * 10) / 10;
    }

    const load1 = Math.max(0.24, Math.round((0.34 + (cpu / 42.0) + (Math.random() - 0.5) * 0.07) * 100) / 100);
    const loads = mockState.status.host_analytics.load_average || [0.42, 0.58, 0.65];
    const load5 = Math.round((loads[1] * 0.96 + load1 * 0.04) * 100) / 100;
    const load15 = Math.round((loads[2] * 0.99 + load5 * 0.01) * 100) / 100;
    mockState.status.host_analytics.load_average = [load1, load5, load15];

    let hostMem = mockState.status.host_analytics.memory.used_mb + (Math.random() * 22 - 10);
    if (hostMem > 8400.0) hostMem = 7350.0;
    if (hostMem < 7100.0) hostMem = 7420.0;
    mockState.status.host_analytics.memory.used_mb = Math.round(hostMem * 10) / 10;
    mockState.status.host_analytics.memory.free_mb = Math.round((mockState.status.host_analytics.memory.total_mb - hostMem) * 10) / 10;
    mockState.status.host_analytics.memory.percent = Math.round((hostMem / mockState.status.host_analytics.memory.total_mb) * 1000) / 10;

    const entJitter = Math.floor((Math.random() - 0.5) * 6);
    mockState.status.stats.entities = Math.max(90, 142 + entJitter + (mockState.status.players.count * 8));
    mockState.status.stats.chunks = Math.max(48, 89 + (mockState.status.players.count * 6));

    if (tickCount % 20 === 0) {
      const hasAlex = mockState.status.players.players.includes("AlexBuilder");
      if (!hasAlex) {
        mockState.status.players.players.push("AlexBuilder");
        mockState.status.players.count = mockState.status.players.players.length;
        mockState.players.online_players = [...mockState.status.players.players];
        const now = new Date().toTimeString().slice(0, 8);
        const joinLog = `[${now} INFO]: AlexBuilder[local] logged in with entity id 214 at (45.2, 70.0, -112.5)`;
        mockState.logs.push(joinLog);
        if (mockState.logs.length > 250) mockState.logs.shift();
      } else {
        mockState.status.players.players = mockState.status.players.players.filter(p => p !== "AlexBuilder");
        mockState.status.players.count = mockState.status.players.players.length;
        mockState.players.online_players = [...mockState.status.players.players];
        const now = new Date().toTimeString().slice(0, 8);
        const leaveLog = `[${now} INFO]: AlexBuilder left the game`;
        mockState.logs.push(leaveLog);
        if (mockState.logs.length > 250) mockState.logs.shift();
      }
    }
  }

  setInterval(stepTelemetry, 3000);

  function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json" }
    });
  }

  function textResponse(text, status = 200) {
    return new Response(text, {
      status,
      headers: { "Content-Type": "text/plain" }
    });
  }

  window.fetch = async function (input, init = {}) {
    const urlStr = typeof input === "string" ? input : (input && input.url ? input.url : "");
    const parsedUrl = new URL(urlStr, window.location.origin);
    const pathname = parsedUrl.pathname;
    const method = (init.method || "GET").toUpperCase();

    if (!pathname.startsWith("/api/")) {
      return originalFetch.apply(this, arguments);
    }

    if (pathname === "/api/auth/me") {
      return jsonResponse({
        authenticated: true,
        username: "admin",
        csrf_token: "mock-csrf-token-12345"
      });
    }

    if (pathname === "/api/auth/login") {
      return jsonResponse({
        success: true,
        token: "mock-session-token-67890",
        username: "admin"
      });
    }

    if (pathname === "/api/auth/logout") {
      return jsonResponse({ success: true });
    }

    if (pathname === "/api/auth/setup") {
      return jsonResponse({ setup_required: false });
    }

    if (pathname === "/api/status") {
      stepTelemetry();
      return jsonResponse(mockState.status);
    }

    if (pathname === "/api/server/analytics" || pathname === "/api/analytics") {
      return jsonResponse(mockState.analytics);
    }

    if (pathname === "/api/control/start") {
      mockState.status.state = "Online";
      mockState.status.exit_code = 0;
      mockState.status.players.count = 3;
      mockState.status.players.players = ["PalviGamer", "Notch_99", "SteveCraft"];
      mockState.players.online_players = [...mockState.status.players.players];
      mockState.status.watch_state.mc = "running";
      mockState.status.watch_state.media = "stopped";
      mockState.status.watch_state.media_start_at = null;
      mockState.mediaContainers.forEach(c => { c.running = false; c.status = "Exited (0)"; });
      stepTelemetry();
      return jsonResponse({ success: true, message: "Server started" });
    }

    if (pathname === "/api/control/stop") {
      mockState.status.state = "Asleep";
      mockState.status.exit_code = 0;
      mockState.status.players.count = 0;
      mockState.status.players.players = [];
      mockState.players.online_players = [];
      mockState.status.watch_state.mc = "stopped";
      mockState.status.watch_state.media_start_at = new Date(Date.now() + (mockState.status.watch_state.grace || 300) * 1000).toISOString();
      stepTelemetry();
      return jsonResponse({ success: true, message: "Server stopped" });
    }

    if (pathname === "/api/control/restart") {
      mockState.status.state = "Online";
      stepTelemetry();
      return jsonResponse({ success: true, message: "Server restarting" });
    }

    if (pathname === "/api/media/status") {
      return jsonResponse({
        watch_state: mockState.status.watch_state,
        containers: mockState.mediaContainers
      });
    }

    if (pathname === "/api/media/set-grace") {
      const body = typeof init.body === "string" ? JSON.parse(init.body) : (init.body || {});
      mockState.status.watch_state.grace = parseInt(body.grace, 10) || 300;
      return jsonResponse({ success: true, grace: mockState.status.watch_state.grace, output: "SUCCESS: grace updated" });
    }

    if (pathname === "/api/media/start-now") {
      mockState.status.watch_state.media = "running";
      mockState.status.watch_state.media_start_at = null;
      mockState.mediaContainers.forEach(c => { c.running = true; c.status = "Up 5 seconds"; });
      return jsonResponse({ success: true, output: "SUCCESS: media stack started" });
    }

    if (pathname === "/api/auth/change-password") {
      return jsonResponse({ success: true, message: "Password updated" });
    }

    if (pathname === "/api/audit") {
      const lim = parseInt(parsedUrl.searchParams.get("limit") || "15", 10);
      const off = parseInt(parsedUrl.searchParams.get("offset") || "0", 10);
      return jsonResponse({
        entries: mockState.audit.slice(off, off + lim),
        total: mockState.audit.length,
        limit: lim,
        offset: off
      });
    }

    if (pathname === "/api/settings/panel-prefs") {
      if (method === "POST") {
        const body = typeof init.body === "string" ? JSON.parse(init.body) : (init.body || {});
        mockState.panelWebhookUrl = body.alert_webhook_url || "";
        return jsonResponse({ success: true, alert_webhook_url: mockState.panelWebhookUrl });
      }
      return jsonResponse({ alert_webhook_url: mockState.panelWebhookUrl });
    }

    if (pathname === "/api/settings") {
      return jsonResponse({
        properties: mockState.properties,
        world: {
          LEVEL: "BabaSquadWorld",
          SEED: "1807738846518060059",
          SEED_READ_ONLY: true,
          DIFFICULTY: mockState.properties.difficulty || "easy",
          MODE: mockState.properties.gamemode || "survival",
          PVP: mockState.properties.pvp !== false,
          HARDCORE: Boolean(mockState.properties.hardcore)
        },
        players: {
          MAX_PLAYERS: mockState.properties.max_players || 8,
          ENABLE_WHITELIST: Boolean(mockState.properties.white_list),
          ONLINE_MODE: Boolean(mockState.properties.online_mode)
        },
        performance: {
          VIEW_DISTANCE: 16,
          SIMULATION_DISTANCE: 6,
          MEMORY: "3G"
        },
        text: {
          MOTD: mockState.properties.motd || "palvi"
        },
        system: {
          TYPE: "FABRIC",
          VERSION: "26.3",
          TZ: "Asia/Kolkata",
          MODRINTH_PROJECTS: mockState.installedMods.managed.map(m => m.slug).join(",")
        },
        world_exists: true,
        raw: mockState.rawEnv
      });
    }

    if (pathname === "/api/settings/diff") {
      const body = typeof init.body === "string" ? JSON.parse(init.body) : (init.body || {});
      const proposed = body.raw_content !== undefined ? body.raw_content : mockState.rawEnv;
      return jsonResponse({
        diff: proposed === mockState.rawEnv ? "" : "--- mc.env (current)\n+++ mc.env (proposed)\n+ # Updated preview\n",
        new_content: proposed
      });
    }

    if (pathname === "/api/settings/apply") {
      const body = typeof init.body === "string" ? JSON.parse(init.body) : (init.body || {});
      if (body.raw_content !== undefined) mockState.rawEnv = body.raw_content;
      if (body.updates) {
        if (body.updates.MODE) mockState.properties.gamemode = body.updates.MODE;
        if (body.updates.DIFFICULTY) mockState.properties.difficulty = body.updates.DIFFICULTY;
        if (body.updates.MAX_PLAYERS) mockState.properties.max_players = parseInt(body.updates.MAX_PLAYERS, 10);
        if (body.updates.ONLINE_MODE !== undefined) mockState.properties.online_mode = body.updates.ONLINE_MODE === "true";
        if (body.updates.ENABLE_WHITELIST !== undefined) mockState.properties.white_list = body.updates.ENABLE_WHITELIST === "true";
        if (body.updates.MOTD) mockState.properties.motd = body.updates.MOTD;
      }
      return jsonResponse({ success: true, backup_file: "mc.env.bak-mock", message: "Settings applied cleanly (mock)." });
    }

    if (pathname === "/api/settings/properties") {
      if (method === "POST") {
        try {
          const body = typeof init.body === "string" ? JSON.parse(init.body) : (init.body || {});
          Object.assign(mockState.properties, body);
          return jsonResponse({ success: true, message: "Properties updated" });
        } catch (e) {
          return jsonResponse({ success: true });
        }
      }
      return jsonResponse(mockState.properties);
    }

    if (pathname === "/api/console/execute") {
      try {
        const body = typeof init.body === "string" ? JSON.parse(init.body) : (init.body || {});
        const cmd = (body.command || "").trim().toLowerCase();
        let out = "";
        if (cmd === "list") {
          out = `There are ${mockState.status.players.count} of a max of ${mockState.status.players.max} players online: ${mockState.status.players.players.join(", ")}`;
        } else if (cmd === "tps") {
          out = "TPS from last 1m, 5m, 15m: 20.0, 20.0, 20.0";
        } else if (cmd === "help") {
          out = "Available commands: /help, /list, /tps, /say, /whitelist, /op, /deop, /kick, /ban";
        } else if (cmd.startsWith("say ")) {
          out = `[Server] ${body.command.slice(4).trim()}`;
        } else if (cmd.startsWith("op ")) {
          const target = body.command.slice(3).trim();
          if (!mockState.players.ops.some(o => o.name.toLowerCase() === target.toLowerCase())) {
            mockState.players.ops.push({ name: target, uuid: "mock-uuid", level: 4 });
          }
          out = `Made ${target} a server operator`;
        } else if (cmd.startsWith("deop ")) {
          const target = body.command.slice(5).trim();
          mockState.players.ops = mockState.players.ops.filter(o => o.name.toLowerCase() !== target.toLowerCase());
          out = `Made ${target} no longer a server operator`;
        } else {
          out = `Executed command: /${body.command.replace(/^\//, "")}`;
        }
        return jsonResponse({ success: true, output: out });
      } catch (e) {
        return jsonResponse({ success: true, output: "Command completed" });
      }
    }

    if (pathname === "/api/logs/tail") {
      return jsonResponse({ lines: mockState.logs });
    }

    if (pathname === "/api/players/all") {
      return jsonResponse(mockState.players);
    }

    if (pathname.startsWith("/api/players/ops")) {
      if (method === "POST") {
        try {
          const body = typeof init.body === "string" ? JSON.parse(init.body) : (init.body || {});
          if (body.player && !mockState.players.ops.some(o => o.name === body.player)) {
            mockState.players.ops.push({ name: body.player, uuid: "mock-" + Date.now(), level: 4 });
          }
        } catch (e) { }
        return jsonResponse({ success: true });
      }
      if (method === "DELETE") {
        const parts = pathname.split("/");
        const target = decodeURIComponent(parts[parts.length - 1]);
        mockState.players.ops = mockState.players.ops.filter(o => o.name !== target);
        return jsonResponse({ success: true });
      }
      return jsonResponse(mockState.players.ops);
    }

    if (pathname.startsWith("/api/players/whitelist")) {
      if (method === "POST") {
        try {
          const body = typeof init.body === "string" ? JSON.parse(init.body) : (init.body || {});
          if (body.player && !mockState.players.whitelisted.some(w => w.name === body.player)) {
            mockState.players.whitelisted.push({ name: body.player, uuid: "mock-" + Date.now() });
          }
        } catch (e) { }
        return jsonResponse({ success: true });
      }
      if (method === "DELETE") {
        const parts = pathname.split("/");
        const target = decodeURIComponent(parts[parts.length - 1]);
        mockState.players.whitelisted = mockState.players.whitelisted.filter(w => w.name !== target);
        return jsonResponse({ success: true });
      }
      return jsonResponse({ players: mockState.players.whitelisted.map(w => w.name) });
    }

    if (pathname === "/api/players/ban") {
      try {
        const body = typeof init.body === "string" ? JSON.parse(init.body) : (init.body || {});
        mockState.players.banned_players.push({
          name: body.player,
          uuid: "mock-" + Date.now(),
          created: new Date().toISOString().replace("T", " ").slice(0, 19),
          reason: body.reason || "Banned by admin",
          source: "Server"
        });
      } catch (e) { }
      return jsonResponse({ success: true });
    }

    if (pathname === "/api/players/unban") {
      try {
        const body = typeof init.body === "string" ? JSON.parse(init.body) : (init.body || {});
        mockState.players.banned_players = mockState.players.banned_players.filter(b => b.name !== body.player);
      } catch (e) { }
      return jsonResponse({ success: true });
    }

    if (pathname === "/api/players/ban-ip") {
      try {
        const body = typeof init.body === "string" ? JSON.parse(init.body) : (init.body || {});
        mockState.players.banned_ips.push({
          ip: body.ip,
          created: new Date().toISOString().replace("T", " ").slice(0, 19),
          reason: body.reason || "Banned by admin",
          source: "Server"
        });
      } catch (e) { }
      return jsonResponse({ success: true });
    }

    if (pathname === "/api/players/unban-ip") {
      try {
        const body = typeof init.body === "string" ? JSON.parse(init.body) : (init.body || {});
        mockState.players.banned_ips = mockState.players.banned_ips.filter(b => b.ip !== body.ip);
      } catch (e) { }
      return jsonResponse({ success: true });
    }

    if (pathname === "/api/players/kick") {
      try {
        const body = typeof init.body === "string" ? JSON.parse(init.body) : (init.body || {});
        mockState.players.online_players = mockState.players.online_players.filter(p => p !== body.player);
        mockState.status.players.players = mockState.status.players.players.filter(p => p !== body.player);
        mockState.status.players.count = mockState.status.players.players.length;
        return jsonResponse({ success: true, output: `Kicked ${body.player}: ${body.reason || "Kicked by admin"}` });
      } catch (e) {
        return jsonResponse({ success: true, output: "Player kicked" });
      }
    }

    if (pathname === "/api/software") {
      return jsonResponse(mockState.software);
    }

    if (pathname === "/api/software/switch") {
      return jsonResponse({ success: true, message: "Software platform switched" });
    }

    if (pathname === "/api/mods/installed") {
      return jsonResponse(mockState.installedMods);
    }

    if (pathname === "/api/mods/check") {
      const slug = (parsedUrl.searchParams.get("slug") || "").toLowerCase();
      const item = mockState.modrinthCatalog.find(m => m.slug === slug);
      return jsonResponse({
        compatible: slug !== "noisium",
        reason: slug === "noisium" ? "Noisium has no Fabric 26.3 release yet" : "Compatible build found",
        client_required: item ? item.client_side === "required" : false,
        server_supported: true,
        title: item ? item.title : slug,
        version_number: "1.0.0+26.3"
      });
    }

    if (pathname === "/api/mods/search") {
      const q = (parsedUrl.searchParams.get("q") || parsedUrl.searchParams.get("query") || "").toLowerCase();
      const env = parsedUrl.searchParams.get("environment") || "all";
      let results = mockState.modrinthCatalog;
      if (q) {
        results = results.filter(m => m.title.toLowerCase().includes(q) || m.description.toLowerCase().includes(q));
      }
      if (env === "client") {
        results = results.filter(m => m.client_side === "required" || m.client_side === "optional");
      } else if (env === "server") {
        results = results.filter(m => m.server_side === "required" || m.server_side === "optional");
      }
      return jsonResponse({ hits: results, total_hits: results.length, loader: "fabric", game_version: "26.3" });
    }

    if (pathname === "/api/mods/add") {
      try {
        const body = typeof init.body === "string" ? JSON.parse(init.body) : (init.body || {});
        const slug = body.slug || "custom-mod";
        if (!mockState.installedMods.managed.some(m => m.slug === slug)) {
          mockState.installedMods.managed.push({
            slug: slug,
            title: slug,
            installed_jar: `${slug}-1.0.0.jar`,
            status: "Installed"
          });
        }
      } catch (e) { }
      return jsonResponse({ success: true, message: "Mod added cleanly (mock)." });
    }

    if (pathname === "/api/mods/remove") {
      try {
        const body = typeof init.body === "string" ? JSON.parse(init.body) : (init.body || {});
        mockState.installedMods.managed = mockState.installedMods.managed.filter(m => m.slug !== body.slug);
      } catch (e) { }
      return jsonResponse({ success: true, message: "Mod removed cleanly (mock)." });
    }

    if (pathname.startsWith("/api/mods/manual/")) {
      const filename = decodeURIComponent(pathname.split("/").pop());
      mockState.installedMods.manual = mockState.installedMods.manual.filter(j => j.filename !== filename);
      return jsonResponse({ success: true, message: `Deleted ${filename}` });
    }

    if (pathname === "/api/chunky/command") {
      const body = typeof init.body === "string" ? JSON.parse(init.body) : (init.body || {});
      const act = body.action || "progress";
      const prm = body.param ? ` ${body.param}` : "";
      return jsonResponse({ success: true, command: `chunky ${act}${prm}`, output: `[Chunky] Executed ${act}${prm} cleanly.` });
    }

    if (pathname === "/api/files/list") {
      const p = parsedUrl.searchParams.get("path") || "";
      const items = mockState.fileStore[p] || [
        { name: "level.dat", path: `${p}/level.dat`.replace(/^\//, ""), type: "file", extension: ".dat", size: 12040, size_formatted: "11.8 KB", modified: "2026-11-22 13:40:20", editable: false },
        { name: "session.lock", path: `${p}/session.lock`.replace(/^\//, ""), type: "file", extension: ".lock", size: 3, size_formatted: "3 B", modified: "2026-11-22 13:40:20", editable: false }
      ];
      const parts = p.split("/").filter(Boolean);
      const breadcrumbs = [{ name: "root", path: "" }];
      let acc = "";
      for (const seg of parts) {
        acc = acc ? `${acc}/${seg}` : seg;
        breadcrumbs.push({ name: seg, path: acc });
      }
      return jsonResponse({
        current_path: p,
        breadcrumbs,
        items
      });
    }

    if (pathname === "/api/files/read") {
      const p = parsedUrl.searchParams.get("path") || "";
      const filename = p.split("/").pop();
      const content = mockState.fileStore.contents[filename] || `# Palvi Minecraft Server Configuration\n# Target: ${p}\n\nserver-ip=0.0.0.0\nserver-port=25565\nmotd=A Palvi Minecraft Community Server\nmax-players=8\npvp=true\ndifficulty=normal\nlevel-name=BabaSquadWorld\nview-distance=12\nsimulation-distance=8\nwhite-list=false\nenable-rcon=true\nrcon.port=25575\nrcon.password=SecretRcon123\nsync-chunk-writes=true\nallow-flight=true\nspawn-protection=16\n`;
      return jsonResponse({
        path: p,
        name: filename,
        content: content,
        size: content.length,
        size_formatted: `${(content.length / 1024).toFixed(1)} KB`,
        modified: "2026-11-23 15:40:00"
      });
    }

    if (pathname === "/api/files/write") {
      try {
        const body = typeof init.body === "string" ? JSON.parse(init.body) : (init.body || {});
        const p = body.path || "";
        const filename = p.split("/").pop();
        if (filename) {
          mockState.fileStore.contents[filename] = body.content !== undefined ? body.content : "";
        }
      } catch (e) { }
      return jsonResponse({ success: true, message: "File saved successfully" });
    }

    if (pathname === "/api/files/create-folder") {
      return jsonResponse({ success: true, message: "Folder created" });
    }

    if (pathname === "/api/files/delete") {
      return jsonResponse({ success: true, message: "File deleted" });
    }

    if (pathname === "/api/worlds/info") {
      return jsonResponse({
        world_name: "BabaSquadWorld",
        seed: "-49204918204918204",
        exists: true,
        size_bytes: 505413632,
        size_formatted: "482 MB",
        has_level_dat: true,
        has_overworld: true,
        has_nether: true,
        has_end: true,
        datapacks: ["vanilla_tweaks_armor_statues.zip"],
        player_records: 6,
        path: "/BabaSquadWorld"
      });
    }

    if (pathname === "/api/worlds/files") {
      return jsonResponse({
        files: [
          { name: "level.dat", type: "file", size_formatted: "11.8 KB" },
          { name: "region", type: "directory", size_formatted: "410 MB" },
          { name: "playerdata", type: "directory", size_formatted: "124 KB" },
          { name: "datapacks", type: "directory", size_formatted: "1.2 MB" },
          { name: "data", type: "directory", size_formatted: "84 KB" },
          { name: "session.lock", type: "file", size_formatted: "3 B" }
        ]
      });
    }

    if (pathname === "/api/worlds/generate") {
      return jsonResponse({ success: true, message: "World generation initialized" });
    }

    if (pathname === "/api/backups/disk-usage") {
      return jsonResponse({
        world_size_bytes: 505413632,
        world_size_human: "482.0 MB",
        backups_size_bytes: 1258291200,
        backups_size_human: "1.2 GB",
        programming_disk: {
          free_bytes: 377487360000,
          free_human: "351.6 GB",
          total_bytes: 515396075520,
          total_human: "480.0 GB"
        },
        media_disk: {
          free_bytes: 377487360000,
          free_human: "351.6 GB",
          total_bytes: 515396075520,
          total_human: "480.0 GB"
        }
      });
    }

    if (pathname === "/api/backups") {
      return jsonResponse({ backups: mockState.backups });
    }

    if (pathname === "/api/backups/create") {
      const id = `backup-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}`;
      mockState.backups.unshift({
        id: id,
        filename: `${id}.tar.gz`,
        size_bytes: 422000000,
        size_human: "402.4 MB",
        created_at: new Date().toISOString(),
        is_safety: false
      });
      return jsonResponse({ success: true, message: `Backup ${id} created successfully (mock).` });
    }

    if (pathname === "/api/backups/restore") {
      const body = typeof init.body === "string" ? JSON.parse(init.body) : (init.body || {});
      return jsonResponse({ success: true, message: `Backup ${body.backup_id} restored successfully (mock).` });
    }

    return originalFetch.apply(this, arguments);
  };

  class MockEventSource {
    constructor(url) {
      this.url = url;
      this.readyState = 1;
      this.onopen = null;
      this.onmessage = null;
      this.onerror = null;
      setTimeout(() => {
        if (typeof this.onopen === "function") this.onopen();
      }, 40);
      this.timer = setInterval(() => {
        if (typeof this.onmessage === "function") {
          const now = new Date().toTimeString().slice(0, 8);
          const tps = (mockState.status.stats.tps || 20.0).toFixed(1);
          const mspt = (mockState.status.stats.mspt || 18.0).toFixed(1);
          const samples = [
            `[${now} INFO]: [TickMonitor] Average tick rate: ${tps} TPS (${mspt}ms MSPT)`,
            `[${now} INFO]: [AutoSave] World auto-save completed in 15ms`,
            `[${now} INFO]: PalviGamer: Mining down near y=-58 for ancient debris`,
            `[${now} INFO]: Notch_99: Anyone need redstone components?`,
            `[${now} INFO]: SteveCraft achieved [Cover Me With Diamonds]`,
            `[${now} INFO]: PalviGamer: Trade station completed with mending librarians`,
            `[${now} INFO]: [Server] Saving chunks for level 'BabaSquadWorld'/overworld`
          ];
          const line = samples[Math.floor(Math.random() * samples.length)];
          mockState.logs.push(line);
          if (mockState.logs.length > 250) mockState.logs.shift();
          this.onmessage({ data: line });
        }
      }, 3500);
    }
    close() {
      if (this.timer) clearInterval(this.timer);
    }
  }

  window.EventSource = function (url) {
    if (typeof url === "string" && url.includes("/api/logs/stream")) {
      return new MockEventSource(url);
    }
    return new originalEventSource(url);
  };
})();
