#!/usr/bin/env bash
# exit on error
set -o errexit

# Установка зависимостей Python
pip install -r requirements.txt

# Сборка статики
python manage.py collectstatic --no-input

# Применение миграций БД
python manage.py migrate
