from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Initialize the application
app = FastAPI(
    title="Store Management System API",
    description="Backend for POS and Inventory Management",
    version="1.0.0"
)

# Configure CORS so your React frontend (e.g., running on port 5173) can talk to this backend
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# A simple health check route
@app.get("/")
def read_root():
    return {"status": "API is running successfully"}
