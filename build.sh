#!/usr/bin/env bash
# exit on error
set -o errexit

# Установка зависимостей
pip install --upgrade pip
pip install -r requirements.txt
pip install Pillow  # Явно ставим Pillow для работы с изображениями

# Сборка фронтенда (если нужно, но мы уже запушили dist)
# npm install && npm run build

# Сборка статики Django
python manage.py collectstatic --no-input

# Миграции
python manage.py migrate

# Синхронизация данных (координаты, описания из db.json)
python scripts/sync_data.py
