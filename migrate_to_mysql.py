import sqlite3
import MySQLdb
import os

def migrate():
    # Настройки
    sqlite_db = 'db.sqlite3'
    mysql_creds = {
        'host': 'localhost',
        'user': 'root',
        'passwd': '349151210',
        'db': 'ugra_db'
    }

    if not os.path.exists(sqlite_db):
        print("SQLite database not found!")
        return

    s_conn = sqlite3.connect(sqlite_db)
    s_conn.row_factory = sqlite3.Row
    s_cur = s_conn.cursor()

    m_conn = MySQLdb.connect(**mysql_creds)
    m_cur = m_conn.cursor()

    tables = [
        'guide_location',
        'guide_event',
        'guide_route',
        'guide_routepoint',
        'guide_transport',
    ]

    print("Starting data migration...")

    for table in tables:
        print(f"Migrating table: {table}")
        s_cur.execute(f"SELECT * FROM {table}")
        rows = s_cur.fetchall()
        
        if not rows:
            continue

        # Очищаем таблицу в MySQL перед вставкой (опционально)
        m_cur.execute(f"SET FOREIGN_KEY_CHECKS = 0;")
        m_cur.execute(f"TRUNCATE TABLE {table};")
        m_cur.execute(f"SET FOREIGN_KEY_CHECKS = 1;")

        columns = rows[0].keys()
        escaped_columns = [f"`{col}`" for col in columns]
        placeholders = ', '.join(['%s'] * len(columns))
        sql = f"INSERT INTO {table} ({', '.join(escaped_columns)}) VALUES ({placeholders})"
        
        count = 0
        for row in rows:
            m_cur.execute(sql, tuple(row))
            count += 1
        
        print(f"  Done! Migrated {count} rows.")

    m_conn.commit()
    s_conn.close()
    m_conn.close()
    print("Migration finished successfully!")

if __name__ == "__main__":
    migrate()
