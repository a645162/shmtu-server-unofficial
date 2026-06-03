#!/usr/bin/env python3
"""
启动 Spring Boot 开发服务器，等价于原 run.sh：
  cd "$(dirname "$0")/.."
  ./gradlew bootRun
"""
from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path


def main() -> int:
    project_root = Path(__file__).resolve().parent.parent
    gradlew = project_root / ("gradlew.bat" if os.name == "nt" else "gradlew")
    if not gradlew.exists():
        print(f"[run] gradlew not found at {gradlew}", file=sys.stderr)
        return 1
    result = subprocess.run([str(gradlew), "bootRun"], cwd=project_root)
    return result.returncode


if __name__ == "__main__":
    sys.exit(main())
