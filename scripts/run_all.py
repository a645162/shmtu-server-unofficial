#!/usr/bin/env python3
"""
run_all.py — 同时启动 shmtu-server-unofficial 后端 + 1 个（或 2 个）前端。

支持子命令：
    start   启动后端 + 前端（detached，写 PID 到 .run/）
    stop    按 PID 停止所有进程
    status  打印当前状态
    restart 先 stop 再 start
    logs    实时 tail 所有日志（Ctrl+C 退出）

跨平台：Windows / Linux / macOS 同源运行。
- 后端启动：调用本仓的 gradlew / gradlew.bat
- 前端启动：自动检测"合并后根前端"是否存在；如无则回退启动 admin + homepage

设计目标：
- 一个 spring-boot 后端进程（端口 8080）
- 1 个或 2 个 vite dev server 进程（默认 5173 / 3000，冲突自动改）
- 所有进程以 detached 子进程方式启动，shell 退出后继续跑
- 日志写入 .run/logs/{backend,frontend-<name>}.log
"""
from __future__ import annotations

import argparse
import os
import signal
import subprocess
import sys
import time
from pathlib import Path


# ==================== 路径与配置 ====================

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
RUN_DIR = PROJECT_ROOT / ".run"
LOG_DIR = RUN_DIR / "logs"
PID_DIR = RUN_DIR / "pids"

IS_WINDOWS = os.name == "nt"

# 后端配置
BACKEND_PORT = 8080
BACKEND_STARTUP_WAIT = 25

# 前端端口
FRONTEND_PORT_MERGED = 5173
FRONTEND_PORT_ADMIN = 5173
FRONTEND_PORT_HOMEPAGE = 3000

PID_BACKEND = PID_DIR / "backend.pid"
PID_FRONTEND_MERGED = PID_DIR / "frontend-merged.pid"
PID_FRONTEND_ADMIN = PID_DIR / "frontend-admin.pid"
PID_FRONTEND_HOMEPAGE = PID_DIR / "frontend-homepage.pid"


# ==================== 工具函数 ====================

def info(msg: str) -> None:
    print(f"[run_all] {msg}", flush=True)


def ensure_dirs() -> None:
    RUN_DIR.mkdir(parents=True, exist_ok=True)
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    PID_DIR.mkdir(parents=True, exist_ok=True)


def read_pid(pid_file: Path) -> int | None:
    if not pid_file.exists():
        return None
    try:
        return int(pid_file.read_text().strip())
    except ValueError:
        return None


def pid_alive(pid: int) -> bool:
    if pid <= 0:
        return False
    if IS_WINDOWS:
        result = subprocess.run(
            ["tasklist", "/FI", f"PID eq {pid}"],
            capture_output=True, text=True,
        )
        return str(pid) in result.stdout
    else:
        try:
            os.kill(pid, 0)
            return True
        except OSError:
            return False


def write_pid(pid_file: Path, pid: int) -> None:
    pid_file.write_text(str(pid))


def clear_pid(pid_file: Path) -> None:
    if pid_file.exists():
        pid_file.unlink()


def stop_pid(pid_file: Path, name: str, timeout: int = 10) -> None:
    pid = read_pid(pid_file)
    if pid is None:
        return
    if not pid_alive(pid):
        info(f"{name} (pid={pid}) already dead, cleaning pidfile")
        clear_pid(pid_file)
        return

    info(f"stopping {name} (pid={pid})")
    try:
        if IS_WINDOWS:
            subprocess.run(
                ["taskkill", "/PID", str(pid), "/T", "/F"],
                capture_output=True, text=True,
            )
        else:
            os.killpg(os.getpgid(pid), signal.SIGTERM)
    except (OSError, ProcessLookupError):
        pass

    for _ in range(timeout * 2):
        if not pid_alive(pid):
            break
        time.sleep(0.5)

    if pid_alive(pid):
        info(f"{name} did not exit gracefully, killing")
        if IS_WINDOWS:
            subprocess.run(
                ["taskkill", "/PID", str(pid), "/T", "/F"],
                capture_output=True, text=True,
            )
        else:
            try:
                os.killpg(os.getpgid(pid), signal.SIGKILL)
            except (OSError, ProcessLookupError):
                pass

    clear_pid(pid_file)


def spawn_detached(cmd: list[str], cwd: Path, log_file: Path, env: dict | None = None) -> int:
    log_handle = open(log_file, "ab", buffering=0)
    if IS_WINDOWS:
        creationflags = subprocess.CREATE_NEW_PROCESS_GROUP | subprocess.DETACHED_PROCESS
        proc = subprocess.Popen(
            cmd,
            cwd=cwd,
            stdin=subprocess.DEVNULL,
            stdout=log_handle,
            stderr=subprocess.STDOUT,
            env=env,
            creationflags=creationflags,
            close_fds=True,
        )
    else:
        proc = subprocess.Popen(
            cmd,
            cwd=cwd,
            stdin=subprocess.DEVNULL,
            stdout=log_handle,
            stderr=subprocess.STDOUT,
            env=env,
            start_new_session=True,
            close_fds=True,
        )
    return proc.pid


def wait_for_port(port: int, host: str = "127.0.0.1", timeout: float = 30.0) -> bool:
    import socket
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            with socket.create_connection((host, port), timeout=1.0):
                return True
        except OSError:
            time.sleep(0.5)
    return False


# ==================== 各服务启动 ====================

def start_backend() -> int:
    if (pid := read_pid(PID_BACKEND)) and pid_alive(pid):
        info(f"backend already running (pid={pid}), skip")
        return pid

    gradlew = PROJECT_ROOT / ("gradlew.bat" if IS_WINDOWS else "gradlew")
    if not gradlew.exists():
        raise FileNotFoundError(f"gradlew not found: {gradlew}")

    cmd = [str(gradlew), "bootRun"]
    log_file = LOG_DIR / "backend.log"
    info(f"starting backend → {log_file}")
    pid = spawn_detached(cmd, cwd=PROJECT_ROOT, log_file=log_file)
    write_pid(PID_BACKEND, pid)
    info(f"backend pid={pid}, waiting for port {BACKEND_PORT} ...")
    if wait_for_port(BACKEND_PORT, timeout=BACKEND_STARTUP_WAIT):
        info(f"backend is up on http://localhost:{BACKEND_PORT}")
    else:
        info(f"backend startup timeout — see {log_file}")
    return pid


def detect_frontend_layout() -> list[tuple[str, Path, int]]:
    frontend_root = PROJECT_ROOT / "frontend"
    candidates: list[tuple[str, Path, int]] = []

    merged = frontend_root / "package.json"
    if frontend_root.is_dir() and merged.exists():
        candidates.append(("merged", frontend_root, FRONTEND_PORT_MERGED))
    else:
        admin = frontend_root / "admin"
        homepage = frontend_root / "homepage"
        if (admin / "package.json").exists():
            candidates.append(("admin", admin, FRONTEND_PORT_ADMIN))
        if (homepage / "package.json").exists():
            candidates.append(("homepage", homepage, FRONTEND_PORT_HOMEPAGE))

    return candidates


def start_frontend(name: str, cwd: Path, port: int) -> int:
    pid_file = PID_DIR / f"frontend-{name}.pid"
    if (pid := read_pid(pid_file)) and pid_alive(pid):
        info(f"frontend[{name}] already running (pid={pid}), skip")
        return pid

    if not (cwd / "package.json").exists():
        info(f"frontend[{name}] skipped: {cwd}/package.json not found")
        return 0

    npm_cmd = "npm.cmd" if IS_WINDOWS else "npm"
    cmd = [npm_cmd, "run", "dev", "--", "--port", str(port), "--host", "0.0.0.0"]
    log_file = LOG_DIR / f"frontend-{name}.log"
    info(f"starting frontend[{name}] on :{port} → {log_file}")
    pid = spawn_detached(cmd, cwd=cwd, log_file=log_file)
    write_pid(pid_file, pid)
    if wait_for_port(port, timeout=20):
        info(f"frontend[{name}] is up on http://localhost:{port}")
    else:
        info(f"frontend[{name}] startup timeout — see {log_file}")
    return pid


# ==================== 子命令 ====================

def cmd_start(_args: argparse.Namespace) -> int:
    ensure_dirs()
    info(f"project: {PROJECT_ROOT}")
    info(f"runtime:  {RUN_DIR}")

    start_backend()
    for name, cwd, port in detect_frontend_layout():
        start_frontend(name, cwd, port)

    info("all services started. Use 'run_all.py status' to inspect, "
         "'run_all.py logs' to tail, 'run_all.py stop' to stop.")
    return 0


def cmd_stop(_args: argparse.Namespace) -> int:
    ensure_dirs()
    stop_pid(PID_FRONTEND_MERGED, "frontend-merged")
    stop_pid(PID_FRONTEND_ADMIN, "frontend-admin")
    stop_pid(PID_FRONTEND_HOMEPAGE, "frontend-homepage")
    stop_pid(PID_BACKEND, "backend", timeout=15)
    info("all services stopped.")
    return 0


def cmd_status(_args: argparse.Namespace) -> int:
    ensure_dirs()
    rows: list[tuple[str, Path, int]] = [
        ("backend", PID_BACKEND, BACKEND_PORT),
        ("frontend-merged", PID_FRONTEND_MERGED, FRONTEND_PORT_MERGED),
        ("frontend-admin", PID_FRONTEND_ADMIN, FRONTEND_PORT_ADMIN),
        ("frontend-homepage", PID_FRONTEND_HOMEPAGE, FRONTEND_PORT_HOMEPAGE),
    ]
    for name, pid_file, port in rows:
        pid = read_pid(pid_file)
        alive = pid_alive(pid) if pid else False
        state = f"RUNNING pid={pid}" if alive else "stopped"
        print(f"  {name:<22} :{port:<5} {state}")
    return 0


def cmd_restart(args: argparse.Namespace) -> int:
    cmd_stop(args)
    time.sleep(1.5)
    return cmd_start(args)


def cmd_logs(_args: argparse.Namespace) -> int:
    ensure_dirs()
    logs = sorted(LOG_DIR.glob("*.log"))
    if not logs:
        info(f"no logs under {LOG_DIR}")
        return 0
    info(f"tailing {len(logs)} log file(s); Ctrl+C to stop")
    if IS_WINDOWS:
        handles = {p: open(p, "rb", buffering=0) for p in logs}
        try:
            while True:
                for path, fh in handles.items():
                    line = fh.readline()
                    if line:
                        sys.stdout.write(f"[{path.name}] ")
                        sys.stdout.write(line.decode("utf-8", errors="replace"))
                        sys.stdout.flush()
                time.sleep(0.3)
        except KeyboardInterrupt:
            pass
        finally:
            for fh in handles.values():
                fh.close()
    else:
        cmd = ["tail", "-F"] + [str(p) for p in logs]
        try:
            subprocess.run(cmd)
        except KeyboardInterrupt:
            pass
    return 0


# ==================== 入口 ====================

def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="run_all.py",
        description="同时启动 shmtu-server-unofficial 后端 + 前端（跨平台）",
    )
    sub = p.add_subparsers(dest="command", required=True)
    sub.add_parser("start", help="启动所有服务").set_defaults(func=cmd_start)
    sub.add_parser("stop", help="停止所有服务").set_defaults(func=cmd_stop)
    sub.add_parser("status", help="查看服务状态").set_defaults(func=cmd_status)
    sub.add_parser("restart", help="重启所有服务").set_defaults(func=cmd_restart)
    sub.add_parser("logs", help="实时 tail 日志").set_defaults(func=cmd_logs)
    return p


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    try:
        return args.func(args)
    except FileNotFoundError as e:
        print(f"[run_all] error: {e}", file=sys.stderr)
        return 2
    except KeyboardInterrupt:
        info("interrupted")
        return 130


if __name__ == "__main__":
    sys.exit(main())
