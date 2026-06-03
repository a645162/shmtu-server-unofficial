#!/usr/bin/env python3
"""
停掉 docker-compose 启动的容器，等价于原 stop.sh：
  cd "$(dirname "$0")/.."
  docker-compose down
"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path


def main() -> int:
    project_root = Path(__file__).resolve().parent.parent
    print(f"[stop] project root: {project_root}")
    result = subprocess.run(
        ["docker", "compose", "down"],
        cwd=project_root,
    )
    return result.returncode


if __name__ == "__main__":
    sys.exit(main())
