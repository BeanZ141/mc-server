import asyncio
import calendar
import datetime
from fastapi import APIRouter, Depends
from app.auth import get_current_user_and_session
from app.database import get_db_connection, get_analytics_data
from app.system_metrics import get_system_analytics
from app.settings_manager import settings_manager
from app.utils import format_duration_minutes

router = APIRouter(tags=["analytics"])


@router.get("/api/analytics")
async def get_analytics(session: dict = Depends(get_current_user_and_session), hours: int = 24):
    clamped = max(1, min(hours, 24 * 30))
    return await asyncio.to_thread(get_analytics_data, clamped)


def _query_server_analytics_sync() -> tuple[dict[str, dict], list]:
    conn = get_db_connection()
    cursor = conn.cursor()

    now = datetime.datetime.now()
    cutoff_95d = (now - datetime.timedelta(days=95)).strftime("%Y-%m-%dT%H")

    cursor.execute(
        """
        SELECT hour_key, online_samples, asleep_samples, active_samples, error_samples,
               total_samples, peak_players
        FROM server_metrics_hourly
        WHERE hour_key >= ?
        ORDER BY hour_key ASC
        """,
        (cutoff_95d,)
    )
    hourly_rows = cursor.fetchall()

    hour_buckets: dict[str, dict] = {}
    if hourly_rows:
        for r in hourly_rows:
            hour_buckets[r["hour_key"]] = dict(r)
    else:
        # Fallback for existing DBs prior to hourly rollup creation
        cutoff_iso = (now - datetime.timedelta(days=14)).isoformat()
        cursor.execute(
            "SELECT timestamp, state, players_count FROM server_metrics WHERE timestamp >= ? ORDER BY id ASC",
            (cutoff_iso,)
        )
        for r in cursor.fetchall():
            hk = r["timestamp"][:13]
            b = hour_buckets.setdefault(hk, {
                "hour_key": hk,
                "online_samples": 0,
                "asleep_samples": 0,
                "active_samples": 0,
                "error_samples": 0,
                "total_samples": 0,
                "peak_players": 0
            })
            st = r["state"]
            pc = r["players_count"] or 0
            b["total_samples"] += 1
            if st == "Online":
                b["online_samples"] += 1
                if pc > 0:
                    b["active_samples"] += 1
            elif st == "Asleep":
                b["asleep_samples"] += 1
            elif st == "Error":
                b["error_samples"] += 1
            if pc > b["peak_players"]:
                b["peak_players"] = pc

    cursor.execute(
        """
        SELECT timestamp, action, details, result FROM audit_log
        WHERE action IN ('state_transition', 'restart_server', 'start_server', 'stop_server', 'backup', 'restore', 'recreate-mc')
        ORDER BY id DESC LIMIT 10
        """
    )
    audit_rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return hour_buckets, audit_rows


@router.get("/api/server/analytics")
async def get_server_analytics(session: dict = Depends(get_current_user_and_session)):
    (hour_buckets, audit_rows), raw_24h, sys_metrics = await asyncio.gather(
        asyncio.to_thread(_query_server_analytics_sync),
        asyncio.to_thread(get_analytics_data, 24),
        asyncio.to_thread(get_system_analytics)
    )

    env_vars = settings_manager.parse_env()
    sw_type = env_vars.get("TYPE", "FABRIC").capitalize()
    sw_ver = env_vars.get("VERSION", "26.3")

    cpu_temp = sys_metrics.get("cpu_temp") if sys_metrics.get("cpu_temp") is not None else 0.0
    load_avg = sys_metrics.get("load_average") or [0.0, 0.0, 0.0]
    host_mem = sys_metrics.get("memory") or {}
    host_disk = sys_metrics.get("disk") or {}

    host_telemetry = {
        "cpu_temp": cpu_temp,
        "load_1m": load_avg[0] if len(load_avg) > 0 else 0.0,
        "load_5m": load_avg[1] if len(load_avg) > 1 else 0.0,
        "load_15m": load_avg[2] if len(load_avg) > 2 else 0.0,
        "cpu_frequency_ghz": sys_metrics.get("cpu_frequency_ghz", 0.0),
        "active_processes": sys_metrics.get("active_processes", 0),
        "ram_used_gb": round(host_mem.get("used_mb", 0) / 1024, 1),
        "ram_total_gb": round(host_mem.get("total_mb", 0) / 1024, 1),
        "ram_percent": host_mem.get("percent", 0.0),
        "swap_used_mb": round(host_mem.get("swap_used_mb", 0)),
        "swap_total_mb": round(host_mem.get("swap_total_mb", 0)),
        "disk_used_gb": host_disk.get("used_gb", 0.0),
        "disk_total_gb": host_disk.get("total_gb", 0.0),
        "disk_percent": host_disk.get("percent", 0.0),
        "disk_read_mbps": 0.0,
        "disk_write_mbps": 0.0,
        "net_in_kbps": 0.0,
        "net_out_kbps": 0.0
    }

    tag_map = {
        "state_transition": "[SYSTEM_STATE]",
        "restart_server": "[PROCESS_TR]",
        "start_server": "[PROCESS_TR]",
        "stop_server": "[PROCESS_TR]",
        "recreate-mc": "[PROCESS_TR]",
        "backup": "[BACKUP]",
        "restore": "[RESTORE]"
    }
    incidents_log = [
        {
            "time": row["timestamp"][:19].replace("T", " "),
            "tag": tag_map.get(row["action"], "[AUDIT]"),
            "msg": f"{row['details'] or row['action'].upper()} [{row['result']}]"
        }
        for row in audit_rows
    ]

    if not hour_buckets:
        return {
            "os_info": sys_metrics.get("os_info"),
            "server_label": f"{sw_type} {sw_ver}",
            "uptime_pct_total": 0.0,
            "total_uptime_formatted": "0m",
            "avg_uptime_hours": 0.0,
            "avg_uptime_formatted": "0m",
            "avg_session_minutes": 0.0,
            "avg_session_formatted": "0m",
            "sleep_hours_today": 0.0,
            "sleep_formatted_today": "0m",
            "sleep_pct_today": 0.0,
            "active_hours_today": 0.0,
            "active_formatted_today": "0m",
            "active_pct_today": 0.0,
            "power_saved_pct": 0.0,
            "idle_threshold_seconds": 300,
            "uptime_history_14d": [],
            "heatmap_7d_24h": [],
            "heatmap_months": [],
            "host_telemetry": host_telemetry,
            "funnel_stages": [],
            "incidents_log": incidents_log
        }

    now = datetime.datetime.now()
    days_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

    # Index hourly buckets by date string YYYY-MM-DD in O(H)
    day_buckets: dict[str, list[dict]] = {}
    for hk, b in hour_buckets.items():
        day_buckets.setdefault(hk[:10], []).append(b)

    # 1. 14-day history
    history_14d = []
    recent_14_totals = {"samples": 0, "online": 0, "asleep": 0}
    for i in range(14):
        d_day = now - datetime.timedelta(days=13 - i)
        d_str = d_day.strftime("%Y-%m-%d")
        d_hours = day_buckets.get(d_str, [])

        if not d_hours:
            history_14d.append({
                "day": f"{14 - i}d",
                "label": d_day.strftime("%b %d"),
                "status": "down",
                "uptime_pct": 0.0,
                "sleep_hours": 0.0,
                "peak_players": 0
            })
        else:
            total_day = sum(b["total_samples"] for b in d_hours)
            online_day = sum(b["online_samples"] for b in d_hours)
            asleep_day = sum(b["asleep_samples"] for b in d_hours)
            peak_p = max((b["peak_players"] for b in d_hours), default=0)

            recent_14_totals["samples"] += total_day
            recent_14_totals["online"] += online_day
            recent_14_totals["asleep"] += asleep_day

            uptime_p = round(((online_day + asleep_day) / total_day) * 100.0, 1) if total_day > 0 else 0.0
            sleep_h = round((asleep_day * 30) / 3600.0, 1)
            status_day = "online" if online_day > 0 else ("asleep" if asleep_day > 0 else "down")

            history_14d.append({
                "day": f"{14 - i}d",
                "label": d_day.strftime("%b %d"),
                "status": status_day,
                "uptime_pct": uptime_p,
                "sleep_hours": sleep_h,
                "peak_players": peak_p
            })

    # 2. 3-month heatmaps via O(1) dictionary lookups per hour
    heatmap_months = []
    current_year = now.year
    current_month = now.month

    for offset in range(3):
        target_month = current_month - offset
        target_year = current_year
        while target_month <= 0:
            target_month += 12
            target_year -= 1

        month_name = calendar.month_name[target_month]
        num_days = calendar.monthrange(target_year, target_month)[1]
        first_weekday = calendar.weekday(target_year, target_month, 1)

        days_list = []
        for d in range(1, num_days + 1):
            wday = (first_weekday + d - 1) % 7
            date_prefix = f"{target_year}-{target_month:02d}-{d:02d}"

            hours_list = []
            for h in range(24):
                b = hour_buckets.get(f"{date_prefix}T{h:02d}")
                if not b or b["total_samples"] == 0:
                    hours_list.append({"h": h, "s": "down", "p": 0})
                else:
                    h_status = "online" if b["online_samples"] > 0 else ("asleep" if b["asleep_samples"] > 0 else "down")
                    hours_list.append({"h": h, "s": h_status, "p": b["peak_players"]})

            days_list.append({
                "day": days_names[wday],
                "date": f"{month_name[:3]} {d:02d}",
                "hours": hours_list
            })

        heatmap_months.append({
            "month": f"{month_name} {target_year}",
            "short_month": month_name[:3],
            "days_count": num_days,
            "days": days_list
        })

    heatmap_7d_24h = heatmap_months[0]["days"][-7:] if heatmap_months and heatmap_months[0]["days"] else []

    # 3. Past 24h funnel stages from hourly buckets in last 24h
    cutoff_24h_hk = (now - datetime.timedelta(hours=24)).strftime("%Y-%m-%dT%H")
    buckets_24h = [b for hk, b in hour_buckets.items() if hk >= cutoff_24h_hk]
    n_samples = sum(b["total_samples"] for b in buckets_24h)

    if n_samples > 0:
        asleep_cnt = sum(b["asleep_samples"] for b in buckets_24h)
        active_cnt = sum(b["active_samples"] for b in buckets_24h)
        online_total = sum(b["online_samples"] for b in buckets_24h)
        bootstrap_cnt = max(0, online_total - active_cnt)
        down_cnt = sum(b["error_samples"] for b in buckets_24h)

        funnel_stages = [
            {"name": "Standby Sleep (lazymc)", "pct": round(asleep_cnt / n_samples * 100.0, 1), "count": format_duration_minutes(asleep_cnt * 0.5), "status": "ok"},
            {"name": "Active Player Sessions", "pct": round(active_cnt / n_samples * 100.0, 1), "count": format_duration_minutes(active_cnt * 0.5), "status": "ok"},
            {"name": "Server Bootstrap / Wake Overhead", "pct": round(bootstrap_cnt / n_samples * 100.0, 1), "count": format_duration_minutes(bootstrap_cnt * 0.5), "status": "warn" if bootstrap_cnt > 0 else "ok"},
            {"name": "Unscheduled Offline Downtime", "pct": round(down_cnt / n_samples * 100.0, 1), "count": format_duration_minutes(down_cnt * 0.5), "status": "error" if down_cnt > 0 else "ok"},
        ]
    else:
        funnel_stages = []

    total_all = recent_14_totals["samples"]
    good_all = recent_14_totals["online"] + recent_14_totals["asleep"]
    uptime_pct_total = round((good_all / total_all) * 100.0, 1) if total_all > 0 else 0.0

    today_str = now.strftime("%Y-%m-%d")
    today_hours = day_buckets.get(today_str, [])
    today_count = sum(b["total_samples"] for b in today_hours)
    today_asleep = sum(b["asleep_samples"] for b in today_hours)
    today_active = sum(b["online_samples"] for b in today_hours)

    sleep_hours_today = round((today_asleep * 30) / 3600.0, 1)
    active_hours_today = round((today_active * 30) / 3600.0, 1)
    sleep_pct_today = round((today_asleep / today_count * 100.0), 1) if today_count > 0 else 0.0
    active_pct_today = round((today_active / today_count * 100.0), 1) if today_count > 0 else 0.0

    return {
        "os_info": sys_metrics.get("os_info"),
        "server_label": f"{sw_type} {sw_ver}",
        "uptime_pct_total": uptime_pct_total,
        "total_uptime_formatted": format_duration_minutes(good_all * 0.5),
        "avg_uptime_hours": round((good_all * 0.5) / 60.0, 1),
        "avg_uptime_formatted": format_duration_minutes(good_all * 0.5),
        "avg_session_minutes": round((today_active * 0.5) / max(1, raw_24h.get("peak_players", 1)), 1),
        "avg_session_formatted": f"{round((today_active * 0.5) / max(1, raw_24h.get('peak_players', 1)), 1)} min",
        "sleep_hours_today": sleep_hours_today,
        "sleep_formatted_today": format_duration_minutes(today_asleep * 0.5),
        "sleep_pct_today": sleep_pct_today,
        "active_hours_today": active_hours_today,
        "active_formatted_today": format_duration_minutes(today_active * 0.5),
        "active_pct_today": active_pct_today,
        "power_saved_pct": sleep_pct_today,
        "idle_threshold_seconds": 300,
        "uptime_history_14d": history_14d,
        "heatmap_7d_24h": heatmap_7d_24h,
        "heatmap_months": heatmap_months,
        "host_telemetry": host_telemetry,
        "funnel_stages": funnel_stages,
        "incidents_log": incidents_log
    }
