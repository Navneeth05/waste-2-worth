"""Quick diagnostic: Can we reach the PostgreSQL database on Render?"""
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()
load_dotenv("server/.env")
load_dotenv(".env")

DB_CONFIG = {
    "host":     os.getenv("DB_HOST", "dpg-d7g3k0hf9bms73am9a90-a.singapore-postgres.render.com"),
    "user":     os.getenv("DB_USER", "waste2worth_user"),
    "password": os.getenv("DB_PASSWORD", "GRSu9jyus6DB6HPCEHFZLeeeru7qAUBD"),
    "dbname":   os.getenv("DB_NAME", "waste2worth"),
    "port":     int(os.getenv("DB_PORT", 5432)),
    "sslmode":  "require",
}

print("=" * 50)
print("WASTE2WORTH — PostgreSQL Connection Test")
print("=" * 50)
print(f"Host:     {DB_CONFIG['host']}")
print(f"Database: {DB_CONFIG['dbname']}")
print(f"User:     {DB_CONFIG['user']}")
print(f"Port:     {DB_CONFIG['port']}")
print("-" * 50)

try:
    db = psycopg2.connect(**DB_CONFIG)
    cursor = db.cursor()
    cursor.execute("SELECT version()")
    version = cursor.fetchone()[0]
    print(f"[OK] CONNECTED! PostgreSQL version:")
    print(f"   {version}")
    
    # Check tables
    cursor.execute("""
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' ORDER BY table_name
    """)
    tables = [row[0] for row in cursor.fetchall()]
    print(f"\nTables found ({len(tables)}):")
    for t in tables:
        cursor.execute(f"SELECT COUNT(*) FROM {t}")
        count = cursor.fetchone()[0]
        print(f"   - {t} ({count} rows)")
    
    cursor.close()
    db.close()
except psycopg2.Error as e:
    print(f"[FAIL] Connection FAILED: {e}")
except Exception as e:
    print(f"[FAIL] Error: {e}")

print("=" * 50)
