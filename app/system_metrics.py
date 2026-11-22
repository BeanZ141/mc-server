import os
import shutil
import platform
from pathlib import Path

def get_cpu_temp() -> float | None:
    try:
        thermal_path = Path("/sys/class/thermal")
        if thermal_path.exists():
            for zone in thermal_path.glob("thermal_zone*"):
                temp_file = zone / "temp"
                if temp_file.exists():
                    val = float(temp_file.read_text().strip())
                    if val > 1000:
                        val = val / 1000.0
                    if 0 < val < 125:
                        return round(val, 1)

        hwmon_path = Path("/sys/class/hwmon")
        if hwmon_path.exists():
            for hw in hwmon_path.glob("hwmon*"):
                for tfile in hw.glob("temp*_input"):
                    val = float(tfile.read_text().strip())
                    if val > 1000:
                        val = val / 1000.0
                    if 0 < val < 125:
                        return round(val, 1)
    except Exception:
        pass
    return None

def get_host_memory() -> dict | None:
    try:
        meminfo = Path("/proc/meminfo")
        if meminfo.exists():
            data = {}
            for line in meminfo.read_text().splitlines():
                if ":" in line:
                    k, v = line.split(":", 1)
                    val_str = v.strip().split()[0]
                    data[k.strip()] = int(val_str) * 1024
            total = data.get("MemTotal")
            avail = data.get("MemAvailable", data.get("MemFree", 0))
            if total and total > 0:
                used = max(0, total - avail)
                pct = round((used / total) * 100, 1)
                return {
                    "total_mb": round(total / (1024 * 1024), 1),
                    "used_mb": round(used / (1024 * 1024), 1),
                    "free_mb": round(avail / (1024 * 1024), 1),
                    "percent": pct
                }
    except Exception:
        pass
    return None

def get_load_average() -> list[float] | None:
    try:
        if hasattr(os, "getloadavg"):
            return [round(x, 2) for x in os.getloadavg()]
    except Exception:
        pass
    return None

def get_host_disk_usage() -> dict | None:
    try:
        from app.config import get_minecraft_data_dir
        base = get_minecraft_data_dir()
        if not base.exists():
            base.mkdir(parents=True, exist_ok=True)
        usage = shutil.disk_usage(str(base))
        pct = round((usage.used / usage.total) * 100, 1) if usage.total > 0 else 0
        return {
            "total_gb": round(usage.total / (1024**3), 1),
            "used_gb": round(usage.used / (1024**3), 1),
            "free_gb": round(usage.free / (1024**3), 1),
            "percent": pct
        }
    except Exception:
        pass
    return None

def get_system_analytics() -> dict:
    return {
        "cpu_temp": get_cpu_temp(),
        "memory": get_host_memory(),
        "disk": get_host_disk_usage(),
        "load_average": get_load_average(),
        "os_info": f"{platform.system()} {platform.release()}" if platform.system() else None
    }
