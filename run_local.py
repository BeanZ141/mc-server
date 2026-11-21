"""
Run Minecraft Admin Panel Locally for Preview
Usage: python run_local.py
"""
import os
import sys
import time
import webbrowser
import threading
import uvicorn

def open_browser():
    time.sleep(1.2)
    print("\n[+] Opening browser at http://localhost:3555 ...\n")
    webbrowser.open("http://localhost:3555")

if __name__ == "__main__":
    os.environ["SECURE_COOKIES"] = "false"
    os.environ["PORT"] = "3555"

    print("=" * 65)
    print("  mcadmin.palvi.org — Minecraft Admin Panel (Local)")
    print("=" * 65)
    print(" * Local URL:    http://localhost:3555")
    print(" * Password:     admin1234")
    print(" * Press Ctrl+C: To stop the server")
    print("=" * 65)

    threading.Thread(target=open_browser, daemon=True).start()

    uvicorn.run("app.main:app", host="0.0.0.0", port=3555, log_level="info", reload=True)
