import sqlite3
import psycopg2
from psycopg2.extras import RealDictCursor
import os
import sys

def migrate(postgres_url):
    sqlite_db = 'db.sqlite3.backup'
    if not os.path.exists(sqlite_db):
        sqlite_db = 'db.sqlite3'
    
    if not os.path.exists(sqlite_db):
        print("SQLite database not found!")
        return

    s_conn = sqlite3.connect(sqlite_db)
    s_conn.row_factory = sqlite3.Row
    s_cur = s_conn.cursor()

    try:
        m_conn = psycopg2.connect(postgres_url)
        m_cur = m_conn.cursor()
    except Exception as e:
        print(f"Error connecting to Postgres: {e}")
        return

    tables = [
        'guide_user',
        'guide_location',
        'guide_event',
        'guide_route',
        'guide_routepoint',
        'guide_transport',
        'guide_review',
        'guide_favorite',
        'guide_visitedlocation',
    ]

    print("Starting data migration to PostgreSQL...")

    for table in tables:
        print(f"Migrating table: {table}")
        s_cur.execute(f"SELECT * FROM {table}")
        rows = s_cur.fetchall()
        
        if not rows:
            continue

        # Очищаем таблицу в Postgres
        m_cur.execute(f"TRUNCATE TABLE {table} RESTART IDENTITY CASCADE;")

        columns = rows[0].keys()
        # В Postgres используем двойные кавычки для колонок
        escaped_columns = [f'"{col}"' for col in columns]
        placeholders = ', '.join(['%s'] * len(columns))
        sql = f"INSERT INTO {table} ({', '.join(escaped_columns)}) VALUES ({placeholders})"
        
        count = 0
        for row in rows:
            # Преобразуем 0/1 в True/False для булевых полей
            clean_row = []
            for col in columns:
                val = row[col]
                if col in ['is_superuser', 'is_staff', 'is_active']:
                    val = bool(val)
                clean_row.append(val)
                
            m_cur.execute(sql, tuple(clean_row))
            count += 1
        
        print(f"  Done! Migrated {count} rows.")

    m_conn.commit()
    s_conn.close()
    m_conn.close()
    print("Migration finished successfully!")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python migrate_to_postgres.py <POSTGRES_EXTERNAL_URL>")
        sys.exit(1)
    migrate(sys.argv[1])
