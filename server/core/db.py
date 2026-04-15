import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

# Database connection configuration using environment variables
DB_CONFIG = {
    "host":     os.getenv("DB_HOST", "localhost"),
    "user":     os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD", "Navneeth@07"),
    "database": os.getenv("DB_NAME", "Waste2Worth"),
    "port":     int(os.getenv("DB_PORT", 3306))
}

def get_db():
    """Get a MySQL database connection"""
    try:
        db = mysql.connector.connect(**DB_CONFIG)
        return db
    except mysql.connector.Error as err:
        print(f"[DB_ERROR] Failed to connect: {err}")
        return None