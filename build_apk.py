import subprocess
import sys
import os
import shutil

# Fix emoji/unicode output on Windows terminal
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "frontend")


def run(cmd, cwd=None):
    print(f"\n> {cmd}")
    result = subprocess.run(cmd, shell=True, cwd=cwd or FRONTEND_DIR)
    if result.returncode != 0:
        print(f"[ERROR] Failed: {cmd}")
        sys.exit(1)
    return result


def main():
    print("=" * 60)
    print("  Ugra Guide - Building Android APK")
    print("=" * 60)

    # 1. Build React frontend
    print("\n[1/4] Building React app...")
    run("npm run build")

    # 2. Sync Capacitor
    print("\n[2/4] Syncing with Android platform (Capacitor)...")
    run("npx cap sync android")

    # 3. Build Debug APK via Gradle (may take 2-5 minutes on first run)
    print("\n[3/4] Building APK via Gradle (first run may take ~5 min)...")
    run("gradlew.bat assembleDebug", cwd=os.path.join(FRONTEND_DIR, "android"))

    # 4. Copy APK to project root
    print("\n[4/4] Copying APK to project folder...")
    apk_src = os.path.join(
        FRONTEND_DIR, "android", "app", "build", "outputs", "apk", "debug", "app-debug.apk"
    )
    apk_dst = os.path.join(os.path.dirname(__file__), "ugra_guide.apk")

    if os.path.exists(apk_src):
        shutil.copy2(apk_src, apk_dst)
        size_mb = os.path.getsize(apk_dst) / 1024 / 1024
        print(f"\n[OK] APK ready: {apk_dst}")
        print(f"     Size: {size_mb:.1f} MB")
        print("\n--- INSTALLATION INSTRUCTIONS ---")
        print("1. Enable 'Install from unknown sources' on your Android phone")
        print("   Settings -> Security -> Install unknown apps")
        print("2. Copy ugra_guide.apk to your phone")
        print("3. Open the file on the phone and tap Install")
        print("\n🚀 STANDALONE MODE ENABLED")
        print("- The app now works WITHOUT a computer server.")
        print("- All locations, routes, and events are stored inside the APK.")
        print("- Favorites and reviews are saved directly on your phone.")
    else:
        print(f"\n[ERROR] APK not found at: {apk_src}")
        print("Try opening Android Studio manually:")
        print("  cd frontend && npx cap open android")
        print("Then in Android Studio: Build -> Build APK(s)")
        sys.exit(1)


if __name__ == "__main__":
    main()
