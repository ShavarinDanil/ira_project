import subprocess
import sys
import os
import atexit
import time

# Фикс для вывода кириллицы и эмодзи в консоль Windows
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

def setup_mysql(python_exe):
    print(f"[{time.strftime('%H:%M:%S')}] Проверка и настройка MySQL...")
    try:
        # 1. Создание БД если нет
        import MySQLdb
        db = MySQLdb.connect(host='localhost', user='root', passwd='349151210')
        cursor = db.cursor()
        cursor.execute('CREATE DATABASE IF NOT EXISTS ugra_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci')
        db.close()
        
        # 2. Применение миграций Django
        subprocess.run([python_exe, "manage.py", "migrate"], check=True)
        
        # 3. Перенос данных из SQLite если файл существует
        if os.path.exists("db.sqlite3"):
            print(f"[{time.strftime('%H:%M:%S')}] Обнаружен старый файл sqlite3. Перенос данных...")
            subprocess.run([python_exe, "migrate_to_mysql.py"], check=True)
            # Переименовываем, чтобы не переносить каждый раз
            os.rename("db.sqlite3", "db.sqlite3.backup")
            print(f"[{time.strftime('%H:%M:%S')}] Перенос завершен. SQLite файл переименован в .backup")
            
    except Exception as e:
        print(f"Ошибка при настройке MySQL: {e}")
        print("Убедитесь, что сервер MySQL запущен и пароль '349151210' верен.")

def main():
    print("Запуск проекта 'Гид Югры' (SQL Edition)...")
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yugra_project.settings')

    # Путь к локальному питону
    python_exe = os.path.join(os.getcwd(), "venv", "Scripts", "python.exe")
    if not os.path.exists(python_exe):
        python_exe = sys.executable

    # Предварительная настройка БД
    setup_mysql(python_exe)

    print(f"[{time.strftime('%H:%M:%S')}] Запуск Django API...")
    django_process = subprocess.Popen([python_exe, "manage.py", "runserver", "0.0.0.0:8000"])

    print(f"[{time.strftime('%H:%M:%S')}] Запуск React Frontend (Vite)...")
    frontend_dir = os.path.join(os.getcwd(), "frontend")
    npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
    react_process = subprocess.Popen([npm_cmd, "run", "dev"], cwd=frontend_dir)

    def cleanup():
        print("\nОстановка серверов...")
        django_process.kill()
        react_process.kill()

    atexit.register(cleanup)

    print("\n====================================================")
    print("Сервера в процессе запуска!")
    print(f"Frontend:   http://localhost:5173/")
    print(f"Backend API: http://127.0.0.1:8000/")
    # Определяем локальный IP для APK
    import socket
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
    except Exception:
        local_ip = "unknown"
    print(f"Для APK (по Wi-Fi): http://{local_ip}:8000/")
    print("Для остановки закройте это окно или нажмите CTRL+C")
    print("====================================================\n")

    try:
        django_process.wait()
        react_process.wait()
    except KeyboardInterrupt:
        cleanup()

if __name__ == "__main__":
    main()
