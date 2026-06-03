#!/usr/bin/env python3
"""
后台启动 docker-compose 容器，等价于原 up.sh：
  cd "$(dirname "$0")/.."
  docker-compose up -d
"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path


def main() -> int:
    project_root = Path(__file__).resolve().parent.parent
    print(f"[up] project root: {project_root}")
    result = subprocess.run(
        ["docker", "compose", "up", "-d"],
        cwd=project_root,
    )
    return result.returncode


if __name__ == "__main__":
    sys.exit(main())
