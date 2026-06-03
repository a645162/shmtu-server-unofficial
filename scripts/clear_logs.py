#!/usr/bin/env python3
"""
清理项目下所有 .log 文件，等价于原 clear_logs.sh：
  cd "$(dirname "$0")/.."
  find . -name "*.log" -type f -delete
  echo "Logs cleared."
"""
from __future__ import annotations

import sys
from pathlib import Path


def main() -> int:
    project_root = Path(__file__).resolve().parent.parent
    removed = 0
    for log_file in project_root.rglob("*.log"):
        if not log_file.is_file():
            continue
        # 跳过 .git 目录里的文件，避免影响仓库元数据
        if ".git" in log_file.parts:
            continue
        try:
            log_file.unlink()
            removed += 1
        except OSError as exc:
            print(f"[clear_logs] failed to remove {log_file}: {exc}", file=sys.stderr)
    print(f"[clear_logs] removed {removed} log file(s). Logs cleared.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
