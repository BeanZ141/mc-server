import calendar
import datetime
from fastapi import APIRouter, Depends
from app.auth import get_current_user_and_session
from app.database import get_db_connection, get_analytics_data
from app.system_metrics import get_system_analytics

router = APIRouter(tags=["analytics"])

@router.get("/api/analytics")
async def get_analytics(session: dict = Depends(get_current_user_and_session), hours: int = 24):
    return get_analytics_data(hours=hours)

def format_duration_minutes(total_minutes: float) -> str:
    hours = int(total_minutes // 60)
    mins = int(total_minutes % 60)
    if hours > 0:
        return f"{hours}h {mins}m"
    return f"{mins}m"

@router.get("/api/server/analytics")
async def get_server_analytics(session: dict = Depends(get_current_user_and_session)):
    raw_24h = get_analytics_data(hours=24)
    sys_metrics = get_system_analytics()

    cpu_temp = sys_metrics.get("cpu_temp") if sys_metrics.get("cpu_temp") is not None else 0.0
    load_avg = sys_metrics.get("load_average") or [0.0, 0.0, 0.0]
    host_mem = sys_metrics.get("memory") or {}
    host_disk = sys_metrics.get("disk") or {}

    ram_total_gb = round(host_mem.get("total_mb", 0) / 1024, 1)
    ram_used_gb = round(host_mem.get("used_mb", 0) / 1024, 1)
    ram_percent = host_mem.get("percent", 0.0)

    disk_total_gb = host_disk.get("total_gb", 0.0)
    disk_used_gb = host_disk.get("used_gb", 0.0)
    disk_percent = host_disk.get("percent", 0.0)

    host_telemetry = {
        "cpu_temp": cpu_temp,
        "load_1m": load_avg[0] if len(load_avg) > 0 else 0.0,
        "load_5m": load_avg[1] if len(load_avg) > 1 else 0.0,
        "load_15m": load_avg[2] if len(load_avg) > 2 else 0.0,
        "cpu_frequency_ghz": 3.8,
        "active_processes": 0,
        "ram_used_gb": ram_used_gb,
        "ram_total_gb": ram_total_gb,
        "ram_percent": ram_percent,
        "swap_used_mb": 0,
        "swap_total_mb": 0,
        "disk_used_gb": disk_used_gb,
        "disk_total_gb": disk_total_gb,
        "disk_percent": disk_percent,
        "disk_read_mbps": 0.0,
        "disk_write_mbps": 0.0,
        "net_in_kbps": 0.0,
        "net_out_kbps": 0.0
    }

    conn = get_db_connection()
    cursor = conn.cursor()

    now = datetime.datetime.now()
    fourteen_days_ago = (now - datetime.timedelta(days=14)).isoformat()
    cursor.execute(
        "SELECT * FROM server_metrics WHERE timestamp >= ? ORDER BY id ASC",
        (fourteen_days_ago,)
    )
    metric_rows = cursor.fetchall()

    cursor.execute(
        """
        SELECT timestamp, action, details, result FROM audit_log
        WHERE action IN ('state_transition', 'restart_server', 'start_server', 'stop_server', 'backup', 'restore', 'recreate-mc')
        ORDER BY id DESC LIMIT 10
        """
    )
    audit_rows = cursor.fetchall()
    conn.close()

    if not metric_rows:
        return {
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
            "incidents_log": []
        }

    # 1. Compute 14-day history from SQLite metric rows
    history_14d = []
    days_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    for i in range(14):
        d_day = now - datetime.timedelta(days=13 - i)
        d_str = d_day.strftime("%Y-%m-%d")
        day_rows = [r for r in metric_rows if r["timestamp"].startswith(d_str)]

        if not day_rows:
            history_14d.append({
                "day": f"{14 - i}d",
                "label": d_day.strftime("%b %d"),
                "status": "down",
                "uptime_pct": 0.0,
                "sleep_hours": 0.0,
                "peak_players": 0
            })
        else:
            total_day = len(day_rows)
            online_day = sum(1 for r in day_rows if r["state"] == "Online")
            asleep_day = sum(1 for r in day_rows if r["state"] == "Asleep")
            peak_p = max((r["players_count"] for r in day_rows), default=0)
            uptime_p = round(((online_day + asleep_day) / total_day) * 100.0, 1)
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

    # 2. Build 3-month heatmaps dynamically from real rows
    heatmap_months = []
    current_year = now.year
    current_month = now.month

    for offset in range(3):
        target_month = current_month - offset
        target_year = current_year
        while target_month <= 0:
            target_month += 12
            target_year -= 1

        cal = calendar.Calendar()
        month_name = calendar.month_name[target_month]
        num_days = calendar.monthrange(target_year, target_month)[1]
        first_weekday = calendar.weekday(target_year, target_month, 1)

        days_list = []
        for d in range(1, num_days + 1):
            wday = (first_weekday + d - 1) % 7
            date_prefix = f"{target_year}-{target_month:02d}-{d:02d}"
            day_metrics = [r for r in metric_rows if r["timestamp"].startswith(date_prefix)]

            hours_list = []
            for h in range(24):
                h_prefix = f"{date_prefix}T{h:02d}:"
                h_rows = [r for r in day_metrics if r["timestamp"].startswith(h_prefix)]

                if not h_rows:
                    hours_list.append({"h": h, "s": "down", "p": 0})
                else:
                    h_online = sum(1 for r in h_rows if r["state"] == "Online")
                    h_asleep = sum(1 for r in h_rows if r["state"] == "Asleep")
                    h_peak = max((r["players_count"] for r in h_rows), default=0)
                    h_status = "online" if h_online > 0 else ("asleep" if h_asleep > 0 else "down")
                    hours_list.append({"h": h, "s": h_status, "p": h_peak})

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

    # 3. Funnel Stages based on past 24h SQLite metrics
    cutoff_24h = (now - datetime.timedelta(hours=24)).isoformat()
    rows_24h = [r for r in metric_rows if r["timestamp"] >= cutoff_24h]
    n_samples = len(rows_24h)

    if n_samples > 0:
        asleep_cnt = sum(1 for r in rows_24h if r["state"] == "Asleep")
        active_cnt = sum(1 for r in rows_24h if r["state"] == "Online" and r["players_count"] > 0)
        bootstrap_cnt = sum(1 for r in rows_24h if r["state"] == "Online" and r["players_count"] == 0)
        down_cnt = sum(1 for r in rows_24h if r["state"] == "Error")

        funnel_stages = [
            {"name": "Standby Sleep (lazymc)", "pct": round(asleep_cnt / n_samples * 100.0, 1), "count": format_duration_minutes(asleep_cnt * 0.5), "status": "ok"},
            {"name": "Active Player Sessions", "pct": round(active_cnt / n_samples * 100.0, 1), "count": format_duration_minutes(active_cnt * 0.5), "status": "ok"},
            {"name": "Server Bootstrap / Wake Overhead", "pct": round(bootstrap_cnt / n_samples * 100.0, 1), "count": format_duration_minutes(bootstrap_cnt * 0.5), "status": "warn" if bootstrap_cnt > 0 else "ok"},
            {"name": "Unscheduled Offline Downtime", "pct": round(down_cnt / n_samples * 100.0, 1), "count": format_duration_minutes(down_cnt * 0.5), "status": "error" if down_cnt > 0 else "ok"},
        ]
    else:
        funnel_stages = []

    # 4. Incidents Log from audit_log
    incidents_log = []
    tag_map = {
        "state_transition": "[SYSTEM_STATE]",
        "restart_server": "[PROCESS_TR]",
        "start_server": "[PROCESS_TR]",
        "stop_server": "[PROCESS_TR]",
        "recreate-mc": "[PROCESS_TR]",
        "backup": "[BACKUP]",
        "restore": "[RESTORE]"
    }
    for row in audit_rows:
        time_str = row["timestamp"][:19].replace("T", " ")
        tag = tag_map.get(row["action"], "[AUDIT]")
        incidents_log.append({
            "time": time_str,
            "tag": tag,
            "msg": f"{row['details'] or row['action'].upper()} [{row['result']}]"
        })

    # Summary metrics for header cards
    total_metrics_count = len(metric_rows)
    all_online = sum(1 for r in metric_rows if r["state"] == "Online")
    all_asleep = sum(1 for r in metric_rows if r["state"] == "Asleep")
    uptime_pct_total = round(((all_online + all_asleep) / total_metrics_count) * 100.0, 1)

    today_str = now.strftime("%Y-%m-%d")
    today_rows = [r for r in metric_rows if r["timestamp"].startswith(today_str)]
    today_count = len(today_rows)
    today_asleep = sum(1 for r in today_rows if r["state"] == "Asleep")
    today_active = sum(1 for r in today_rows if r["state"] == "Online")

    sleep_hours_today = round((today_asleep * 30) / 3600.0, 1)
    active_hours_today = round((today_active * 30) / 3600.0, 1)
    sleep_pct_today = round((today_asleep / today_count * 100.0), 1) if today_count > 0 else 0.0
    active_pct_today = round((today_active / today_count * 100.0), 1) if today_count > 0 else 0.0

    return {
        "uptime_pct_total": uptime_pct_total,
        "total_uptime_formatted": format_duration_minutes((all_online + all_asleep) * 0.5),
        "avg_uptime_hours": round(((all_online + all_asleep) * 0.5) / 60.0, 1),
        "avg_uptime_formatted": format_duration_minutes((all_online + all_asleep) * 0.5),
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
