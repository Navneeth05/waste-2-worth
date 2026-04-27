import psycopg2
import psycopg2.extras
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()              # Load from current directory
load_dotenv("server/.env")  # Load from server directory if called from root
load_dotenv(".env")         # Backup

# Database connection configuration using environment variables
DB_CONFIG = {
    "host":     os.getenv("DB_HOST", "localhost"),
    "user":     os.getenv("DB_USER", "waste2worth_user"),
    "password": os.getenv("DB_PASSWORD", ""),
    "dbname":   os.getenv("DB_NAME", "waste2worth"),
    "port":     int(os.getenv("DB_PORT", 5432)),
    "sslmode":  os.getenv("DB_SSLMODE", "require"),  # Set DB_SSLMODE=disable for local dev
}

def get_db():
    """Get a PostgreSQL database connection"""
    try:
        db = psycopg2.connect(**DB_CONFIG)
        return db
    except psycopg2.Error as err:
        print(f"[DB_ERROR] Failed to connect: {err}")
        return None

def get_cursor(db):
    """Get a dictionary cursor for the connection"""
    return db.cursor(cursor_factory=psycopg2.extras.RealDictCursor)