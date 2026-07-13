import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from app.routers import (
    users,
    categories,
    brands,
    units,
    warehouses,
    products,
    product_batches,
    suppliers,
    purchase_invoices,
    stock_transactions,
    sales,
)

# Initialize the application
app = FastAPI(
    title="Store Management System API",
    description="Backend for POS and Inventory Management",
    version="1.0.0"
)

# Configure CORS — origins loaded exclusively from .env
origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,            # type: ignore
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# Register all routers
# ==========================================
app.include_router(users.router)
app.include_router(categories.router)
app.include_router(brands.router)
app.include_router(units.router)
app.include_router(warehouses.router)
app.include_router(products.router)
app.include_router(product_batches.router)
app.include_router(suppliers.router)
app.include_router(purchase_invoices.router)
app.include_router(stock_transactions.router)
app.include_router(sales.router)


# A simple health check route
@app.get("/")
def read_root():
    return {"status": "API is running successfully"}

