import os
import sys
from dotenv import load_dotenv
from sqlalchemy import text
from sqlalchemy import create_engine

load_dotenv()
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(SQLALCHEMY_DATABASE_URL)
with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE suppliers ADD COLUMN whatsapp_number VARCHAR;"))
        conn.commit()
        print("Column whatsapp_number added successfully.")
    except Exception as e:
        print(f"Error or column already exists: {e}")
