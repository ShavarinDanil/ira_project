# Инструкция по развертыванию (Deployment Guide)

## 1. Запуск Backend-сервера
Бекенд написан на Python FastAPI.

1. Откройте терминал в папке проекта `Ira_project`.
2. Активируйте виртуальное окружение: `.\venv\Scripts\activate` (или установите зависимости глобально).
3. Установите зависимости: `pip install -r requirements.txt`.
4. Перейдите в папку бекенда: `cd backend`.
5. Инициализируйте БД (один раз): `python seed.py`
    - Этот скрипт стянет реальные данные из OpenStreetMap и сформирует базу.
6. Запустите сервер: `uvicorn main:app --reload`.
    - Сервер запустится на `http://localhost:8000`.

## 2. Запуск и Сборка Frontend-приложения (Мобильное приложение)
Фронтенд написан на библиотеке Flet.
1. Откройте новый терминал и активируйте окружение `.\venv\Scripts\activate`.
2. Перейдите в папку фронтенда: `cd frontend`.
3. Для **тестирования на компьютере** (запустится симулятор телефона): `python main.py` или `flet run main.py`.

### Сборка APK для Android
Для сборки настоящего APK-файла у вас должен быть установлен Flutter SDK.
Если Flutter установлен, выполните команду:
```bash
flet build apk
```
Файл `app-release.apk` появится в папке `build/apk/`.

*Примечание по безопасности: Для продакшн сервера, FastAPI должен запускаться через HTTPS (например `uvicorn main:app --ssl-keyfile key.pem --ssl-certfile cert.pem`).*
