import os
from pathlib import Path


def format_size(size_bytes: int | float) -> str:
    """Formats a byte count into a human-readable string."""
    val = float(size_bytes or 0)
    if val < 1024.0:
        return f"{int(val)} B"
    for unit in ("KB", "MB", "GB", "TB"):
        val /= 1024.0
        if val < 1024.0 or unit == "TB":
            return f"{val:.2f} {unit}" if unit == "GB" and val >= 1 else f"{val:.1f} {unit}"
    return f"{val:.1f} TB"


def get_dir_size(path: Path) -> int:
    """Calculates total size of regular files under a directory without following symlinks."""
    if not path.exists():
        return 0
    if path.is_file():
        try:
            return path.stat().st_size
        except OSError:
            return 0
    total = 0
    stack = [path]
    while stack:
        current = stack.pop()
        try:
            with os.scandir(current) as it:
                for entry in it:
                    try:
                        if entry.is_symlink():
                            continue
                        if entry.is_file(follow_symlinks=False):
                            total += entry.stat(follow_symlinks=False).st_size
                        elif entry.is_dir(follow_symlinks=False):
                            stack.append(Path(entry.path))
                    except OSError:
                        continue
        except OSError:
            continue
    return total


def format_duration_minutes(total_minutes: float) -> str:
    """Formats a minute duration into Xh Ym or Ym."""
    total_int = max(0, int(round(total_minutes)))
    hours = total_int // 60
    mins = total_int % 60
    if hours > 0:
        return f"{hours}h {mins}m"
    return f"{mins}m"
