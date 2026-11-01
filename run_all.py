"""
DevTrace Unified Runner
Starts both the FastAPI Python Backend and Vite Frontend together.
Press Ctrl+C to cleanly stop both servers.
"""
import os
import sys
import subprocess
import time
import signal

# Ensure utf-8 output encoding on Windows console
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))

def check_node_path():
    """Ensure node and npm are reachable on Windows."""
    paths_to_check = [
        r"C:\Program Files\nodejs",
        r"C:\Program Files (x86)\nodejs",
        os.path.expandvars(r"%APPDATA%\npm"),
    ]
    current_path = os.environ.get("PATH", "")
    for p in paths_to_check:
        if os.path.isdir(p) and p not in current_path:
            os.environ["PATH"] = f"{p};{current_path}"
            current_path = os.environ["PATH"]

def main():
    check_node_path()

    print("=" * 60)
    print("   DevTrace Unified Server Launcher")
    print("=" * 60)
    print("-> Starting Python Backend on http://127.0.0.1:8000 ...")
    print("-> Starting Vite Frontend on http://localhost:5173 ...")
    print("-> Press Ctrl+C at any time to shut down both.")
    print("=" * 60)

    # 1. Start Python backend
    backend_cmd = [sys.executable, os.path.join(PROJECT_DIR, "backend", "run_server.py")]
    backend_proc = subprocess.Popen(
        backend_cmd,
        cwd=PROJECT_DIR,
    )

    # 2. Wait 1 second for backend socket
    time.sleep(1.0)

    # 3. Start Vite frontend
    npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
    frontend_cmd = [npm_cmd, "run", "dev"]
    frontend_proc = subprocess.Popen(
        frontend_cmd,
        cwd=PROJECT_DIR,
    )

    def shutdown(signum, frame):
        print("\n[!] Shutting down servers gracefully...")
        try:
            frontend_proc.terminate()
            backend_proc.terminate()
        except Exception:
            pass
        sys.exit(0)

    signal.signal(signal.SIGINT, shutdown)
    if hasattr(signal, 'SIGTERM'):
        signal.signal(signal.SIGTERM, shutdown)

    try:
        while True:
            time.sleep(1)
            # If any process died unexpectedly, report it
            if backend_proc.poll() is not None:
                print(f"[!] Backend stopped with code {backend_proc.returncode}")
                frontend_proc.terminate()
                break
            if frontend_proc.poll() is not None:
                print(f"[!] Frontend stopped with code {frontend_proc.returncode}")
                backend_proc.terminate()
                break
    except KeyboardInterrupt:
        shutdown(None, None)

if __name__ == "__main__":
    main()
