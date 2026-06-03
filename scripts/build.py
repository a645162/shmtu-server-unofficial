#!/usr/bin/env python3
"""
构建 Docker 镜像，等价于原 build.sh：
  cd "$(dirname "$0")/.."
  docker build -t shmtu-server-unofficial:latest .
"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path


def main() -> int:
    project_root = Path(__file__).resolve().parent.parent
    image_tag = "shmtu-server-unofficial:latest"
    print(f"[build] project root: {project_root}")
    print(f"[build] docker image: {image_tag}")
    result = subprocess.run(
        ["docker", "build", "-t", image_tag, "."],
        cwd=project_root,
    )
    return result.returncode


if __name__ == "__main__":
    sys.exit(main())
