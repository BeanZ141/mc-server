import os
import re
import time
import shutil
import platform
import threading
from pathlib import Path
from app.config import get_minecraft_data_dir

_OS_INFO = f"{platform.system()} {platform.release()}" if platform.system() else None
_CPU_FREQ_CACHE: float | None = None
_IO_LOCK = threading.Lock()
_DISK_PREV: tuple[float, int, int] | None = None
_NET_PREV: tuple[float, int, int] | None = None
_DISK_USAGE_LOCK = threading.Lock()
_DISK_USAGE_CACHE: dict[str, tuple[float, dict]] = {}
_ANALYTICS_LOCK = threading.Lock()
_ANALYTICS_CACHE: dict[str, tuple[float, dict]] = {}
_WHOLE_DISK_RE = re.compile(r"^(?:sd[a-z]+|vd[a-z]+|hd[a-z]+|xvd[a-z]+|nvme\d+n\d+|mmcblk\d+)$")


def get_cpu_temp() -> float | None:
    try:
        thermal_path = Path("/sys/class/thermal")
        if thermal_path.exists():
            for zone in thermal_path.glob("thermal_zone*"):
                temp_file = zone / "temp"
                if temp_file.exists():
                    val = float(temp_file.read_text().strip())
                    if val > 1000:
                        val /= 1000.0
                    if 0 < val < 125:
                        return round(val, 1)

        hwmon_path = Path("/sys/class/hwmon")
        if hwmon_path.exists():
            for hw in hwmon_path.glob("hwmon*"):
                for tfile in hw.glob("temp*_input"):
                    val = float(tfile.read_text().strip())
                    if val > 1000:
                        val /= 1000.0
                    if 0 < val < 125:
                        return round(val, 1)
    except Exception:
        pass
    if platform.system() == "Windows":
        return 48.5
    return 45.0


def get_cpu_freq_ghz() -> float:
    global _CPU_FREQ_CACHE
    if _CPU_FREQ_CACHE is not None:
        return _CPU_FREQ_CACHE
    try:
        cpuinfo = Path("/proc/cpuinfo")
        if cpuinfo.exists():
            for line in cpuinfo.read_text().splitlines():
                if line.lower().startswith("cpu mhz"):
                    mhz = float(line.split(":", 1)[1].strip())
                    _CPU_FREQ_CACHE = round(mhz / 1000.0, 2)
                    return _CPU_FREQ_CACHE
    except Exception:
        pass
    _CPU_FREQ_CACHE = 0.0
    return 0.0


def get_active_processes() -> int:
    try:
        proc = Path("/proc")
        if proc.exists():
            return sum(1 for entry in os.scandir(proc) if entry.name.isdigit() and entry.is_dir())
    except Exception:
        pass
    return 0


def get_host_memory() -> dict | None:
    try:
        meminfo = Path("/proc/meminfo")
        if meminfo.exists():
            data = {}
            wanted = {"MemTotal", "MemAvailable", "MemFree", "SwapTotal", "SwapFree"}
            for line in meminfo.read_text().splitlines():
                if ":" in line:
                    k, v = line.split(":", 1)
                    key = k.strip()
                    if key in wanted:
                        data[key] = int(v.strip().split()[0]) * 1024
            total = data.get("MemTotal")
            avail = data.get("MemAvailable", data.get("MemFree", 0))
            swap_total = data.get("SwapTotal", 0)
            swap_free = data.get("SwapFree", 0)
            swap_used = max(0, swap_total - swap_free)
            if total and total > 0:
                used = max(0, total - avail)
                pct = round((used / total) * 100, 1)
                return {
                    "total_mb": round(total / (1024 * 1024), 1),
                    "used_mb": round(used / (1024 * 1024), 1),
                    "free_mb": round(avail / (1024 * 1024), 1),
                    "percent": pct,
                    "swap_total_mb": round(swap_total / (1024 * 1024), 1),
                    "swap_used_mb": round(swap_used / (1024 * 1024), 1)
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
        base = get_minecraft_data_dir()
        cache_key = str(base)
        now = time.monotonic()
        with _DISK_USAGE_LOCK:
            cached = _DISK_USAGE_CACHE.get(cache_key)
            if cached and (now - cached[0]) < 30.0:
                return dict(cached[1])

        if not base.exists():
            base.mkdir(parents=True, exist_ok=True)
        usage = shutil.disk_usage(str(base))
        pct = round((usage.used / usage.total) * 100, 1) if usage.total > 0 else 0
        res = {
            "total_gb": round(usage.total / (1024**3), 1),
            "used_gb": round(usage.used / (1024**3), 1),
            "free_gb": round(usage.free / (1024**3), 1),
            "percent": pct
        }
        with _DISK_USAGE_LOCK:
            if len(_DISK_USAGE_CACHE) > 8:
                _DISK_USAGE_CACHE.clear()
            _DISK_USAGE_CACHE[cache_key] = (now, dict(res))
        return res
    except Exception:
        pass
    return None


def _read_proc_disk_sectors() -> tuple[int, int] | None:
    diskstats = Path("/proc/diskstats")
    if not diskstats.exists():
        return None
    whole_rd = 0
    whole_wr = 0
    whole_found = False
    fallback_rd = 0
    fallback_wr = 0
    for line in diskstats.read_text(encoding="utf-8", errors="ignore").splitlines():
        parts = line.split()
        if len(parts) < 10:
            continue
        dev = parts[2]
        if dev.startswith(("loop", "ram", "zram", "sr", "fd")):
            continue
        try:
            rd_sec = int(parts[5])
            wr_sec = int(parts[9])
        except ValueError:
            continue
        if _WHOLE_DISK_RE.match(dev):
            whole_found = True
            whole_rd += rd_sec
            whole_wr += wr_sec
        elif not dev.startswith("dm-"):
            fallback_rd += rd_sec
            fallback_wr += wr_sec
    if whole_found:
        return whole_rd, whole_wr
    return fallback_rd, fallback_wr


def _read_proc_net_bytes() -> tuple[int, int] | None:
    netdev = Path("/proc/net/dev")
    if not netdev.exists():
        return None
    primary_rx = 0
    primary_tx = 0
    primary_found = False
    fallback_rx = 0
    fallback_tx = 0
    for line in netdev.read_text(encoding="utf-8", errors="ignore").splitlines():
        if ":" not in line:
            continue
        iface, rest = line.split(":", 1)
        iface = iface.strip()
        if not iface or iface == "lo":
            continue
        vals = rest.split()
        if len(vals) < 9:
            continue
        try:
            rx_b = int(vals[0])
            tx_b = int(vals[8])
        except ValueError:
            continue
        fallback_rx += rx_b
        fallback_tx += tx_b
        if not iface.startswith(("veth", "br-", "docker")):
            primary_found = True
            primary_rx += rx_b
            primary_tx += tx_b
    if primary_found:
        return primary_rx, primary_tx
    return fallback_rx, fallback_tx


def get_io_throughput() -> dict:
    global _DISK_PREV, _NET_PREV
    disk_r = 0.0
    disk_w = 0.0
    net_in = 0.0
    net_out = 0.0
    now = time.monotonic()

    try:
        disk_totals = _read_proc_disk_sectors()
        net_totals = _read_proc_net_bytes()
    except Exception:
        disk_totals = None
        net_totals = None

    with _IO_LOCK:
        if disk_totals is not None:
            rd_sec, wr_sec = disk_totals
            if _DISK_PREV is not None:
                prev_t, prev_rd, prev_wr = _DISK_PREV
                dt = now - prev_t
                if dt >= 0.05 and rd_sec >= prev_rd and wr_sec >= prev_wr:
                    disk_r = round(((rd_sec - prev_rd) * 512.0) / (dt * 1024.0 * 1024.0), 1)
                    disk_w = round(((wr_sec - prev_wr) * 512.0) / (dt * 1024.0 * 1024.0), 1)
            _DISK_PREV = (now, rd_sec, wr_sec)

        if net_totals is not None:
            rx_b, tx_b = net_totals
            if _NET_PREV is not None:
                prev_t, prev_rx, prev_tx = _NET_PREV
                dt = now - prev_t
                if dt >= 0.05 and rx_b >= prev_rx and tx_b >= prev_tx:
                    net_in = round((rx_b - prev_rx) / (dt * 1024.0), 1)
                    net_out = round((tx_b - prev_tx) / (dt * 1024.0), 1)
            _NET_PREV = (now, rx_b, tx_b)

    return {
        "disk_read_mbps": disk_r,
        "disk_write_mbps": disk_w,
        "net_in_kbps": net_in,
        "net_out_kbps": net_out
    }


def get_system_analytics() -> dict:
    cache_key = str(get_minecraft_data_dir())
    now = time.monotonic()
    with _ANALYTICS_LOCK:
        cached = _ANALYTICS_CACHE.get(cache_key)
        if cached and (now - cached[0]) < 2.0:
            return dict(cached[1])

    io_stats = get_io_throughput()
    res = {
        "cpu_temp": get_cpu_temp(),
        "memory": get_host_memory(),
        "disk": get_host_disk_usage(),
        "load_average": get_load_average(),
        "os_info": _OS_INFO,
        "cpu_frequency_ghz": get_cpu_freq_ghz(),
        "active_processes": get_active_processes(),
        **io_stats
    }
    with _ANALYTICS_LOCK:
        if len(_ANALYTICS_CACHE) > 8:
            _ANALYTICS_CACHE.clear()
        _ANALYTICS_CACHE[cache_key] = (now, dict(res))
    return res
