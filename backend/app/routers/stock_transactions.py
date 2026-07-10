from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from app import models, schemas
from app.database import get_db

# Initialize the router
router = APIRouter(
    prefix="/api/stock-transactions",
    tags=["Stock Ledger"]
)

# ==========================================
# 1. CREATE A MANUAL TRANSACTION (Adjustment / Transfer)
# ==========================================
@router.post("/", response_model=schemas.StockTransactionResponse, status_code=status.HTTP_201_CREATED)
def create_stock_transaction(transaction: schemas.StockTransactionCreate, db: Session = Depends(get_db)):
    """
    Manually create a stock ledger entry.
    Normally used for 'adjustment', 'transfer_in', 'transfer_out', or 'return'.
    (Sales and Purchases should ideally be handled by their respective routers, not here).
    """
    # 1. Validate the Warehouse exists
    warehouse = db.query(models.Warehouse).filter(models.Warehouse.id == transaction.warehouse_id).first()
    if not warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")

    # 2. Validate the Batch exists
    batch = db.query(models.ProductBatch).filter(models.ProductBatch.id == transaction.batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Product Batch not found")

    # 3. Validate the User exists
    user = db.query(models.User).filter(models.User.id == transaction.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 4. Save to Database
    new_transaction = models.StockTransaction(**transaction.model_dump())
    db.add(new_transaction)
    db.commit()
    db.refresh(new_transaction)

    return new_transaction


# ==========================================
# 2. GET ENTIRE STOCK HISTORY (Ledger)
# ==========================================
@router.get("/", response_model=List[schemas.StockTransactionResponse])
def get_all_transactions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Returns the complete history of all stock movements, sorted by newest first.
    """
    transactions = db.query(models.StockTransaction).order_by(models.StockTransaction.created_at.desc()).offset(skip).limit(limit).all()
    return transactions


# ==========================================
# 3. GET A SPECIFIC TRANSACTION BY ID
# ==========================================
@router.get("/{transaction_id}", response_model=schemas.StockTransactionResponse)
def get_single_transaction(transaction_id: int, db: Session = Depends(get_db)):
    transaction = db.query(models.StockTransaction).filter(models.StockTransaction.id == transaction_id).first()

    if not transaction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Stock transaction not found")

    return transaction


# ==========================================
# 4. GET TRANSACTION HISTORY FOR A SPECIFIC BATCH
# ==========================================
@router.get("/batch/{batch_id}", response_model=List[schemas.StockTransactionResponse])
def get_batch_transactions(batch_id: int, db: Session = Depends(get_db)):
    """
    Helpful for auditing exactly what happened to a specific delivery of products.
    """
    transactions = db.query(models.StockTransaction).filter(
        models.StockTransaction.batch_id == batch_id
    ).order_by(models.StockTransaction.created_at.desc()).all()
    
    return transactions

# ==========================================
# 5. CALCULATE LIVE BALANCE (SPECIFIC BATCH)
# ==========================================
@router.get("/balance/batch/{batch_id}/warehouse/{warehouse_id}")
def get_batch_balance(batch_id: int, warehouse_id: int, db: Session = Depends(get_db)):
    """
    Sums up all historical movements to find the exact current stock 
    of a specific batch in a specific warehouse.
    """
    current_stock = db.query(func.sum(models.StockTransaction.quantity)).filter(
        models.StockTransaction.batch_id == batch_id,
        models.StockTransaction.warehouse_id == warehouse_id
    ).scalar() or 0  # Returns 0 if no transactions exist yet
    
    return {
        "batch_id": batch_id,
        "warehouse_id": warehouse_id,
        "current_balance": current_stock
    }

# ==========================================
# 6. CALCULATE TOTAL BALANCE (MASTER PRODUCT)
# ==========================================
@router.get("/balance/product/{product_id}/warehouse/{warehouse_id}")
def get_total_product_balance(product_id: int, warehouse_id: int, db: Session = Depends(get_db)):
    """
    Finds all batches belonging to a product and sums their quantities 
    for a master warehouse inventory count.
    """
    total_stock = db.query(func.sum(models.StockTransaction.quantity)).join(
        models.ProductBatch, models.StockTransaction.batch_id == models.ProductBatch.id
    ).filter(
        models.ProductBatch.product_id == product_id,
        models.StockTransaction.warehouse_id == warehouse_id
    ).scalar() or 0
    
    return {
        "product_id": product_id,
        "warehouse_id": warehouse_id,
        "total_balance": total_stock
    }
