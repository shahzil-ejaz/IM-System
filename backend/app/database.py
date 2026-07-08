import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load the environment variables from your .env file
load_dotenv()

# Fetch the exact same database URL we used for Alembic
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# Explicitly check if the variable was loaded successfully
if not SQLALCHEMY_DATABASE_URL:
    raise ValueError("CRITICAL: DATABASE_URL environment variable is not set. Check your .env file.")

# The Engine is the core interface to the database
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# SessionLocal will be the factory that generates new database sessions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# The Dependency Function
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()