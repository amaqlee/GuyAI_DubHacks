import sqlite3
import os

#stores everything in guyai.db
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "guyai.db")

# opens connection to database
def get_connection():
    conn = sqlite3.connect(DB_PATH)
    # return data like dictionaries
    conn.row_factory = sqlite3.Row
    return conn

# creates a profile table if not alr made + inserts default row so page
# always has smth to display
def init_db():
    conn = get_connection()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS profile (
            id INTEGER PRIMARY KEY,
            business_name TEXT,
            owner_name TEXT,
            business_type TEXT,
            email TEXT
        )
    """)
    #doesn't override data if table alr exists
    conn.execute("""
        INSERT OR IGNORE INTO profile (id, business_name, owner_name, business_type, email)
        VALUES (1, 'My Business', 'Owner', 'Café', '')
    """)

    conn.commit()
    conn.close()

def get_profile():
    conn = get_connection()
    row = conn.execute("SELECT * FROM profile WHERE id = 1").fetchone()
    conn.close()
    return dict(row) if row else {}

def update_profile(business_name, owner_name, business_type, email):
    conn = get_connection()
    conn.execute("""
        UPDATE profile
        SET business_name = ?, owner_name = ?, business_type = ?, email = ?
        WHERE id = 1
    """, (business_name, owner_name, business_type, email))
    conn.commit()
    conn.close()

init_db()
