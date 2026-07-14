"""
Run once to create the first admin user.
Usage: python seed_admin.py
"""
import os
from dotenv import load_dotenv

load_dotenv()

from app.database import SessionLocal
from app.auth import get_password_hash
from app import models

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")

if not ADMIN_PASSWORD:
    print("ERROR: Set ADMIN_PASSWORD in your .env file first.")
    exit(1)


def seed():
    db = SessionLocal()
    try:
        # Check if admin already exists
        existing = db.query(models.User).filter(models.User.username == ADMIN_USERNAME).first()
        if existing:
            existing.password_hash = get_password_hash(ADMIN_PASSWORD)
            db.commit()
            print(f"Admin user '{ADMIN_USERNAME}' already exists (id={existing.id}). Password updated to match .env.")
            return

        admin = models.User(
            username=ADMIN_USERNAME,
            password_hash=get_password_hash(ADMIN_PASSWORD),
            role="admin",
            is_active=True,
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        print(f"Admin user '{admin.username}' created successfully (id={admin.id}).")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
