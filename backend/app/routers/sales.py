from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
import uuid
from decimal import Decimal

from app import models, schemas
from app.database import get_db

router = APIRouter(
    prefix="/api/sales",
    tags=["Sales (POS)"]
)

@router.post("/checkout", response_model=schemas.SalesInvoiceResponse, status_code=status.HTTP_201_CREATED)
def process_checkout(payload: schemas.SalesInvoiceCreate, db: Session = Depends(get_db)):
    # 1. Verify Cashier Exists
    cashier = db.query(models.User).filter(models.User.id == payload.cashier_id).first()
    if not cashier:
        raise HTTPException(status_code=404, detail="Cashier not found")

    # Generate a unique receipt number
    receipt_number = f"REC-{uuid.uuid4().hex[:8].upper()}"

    # Initialize totals
    total_subtotal = Decimal("0.00")
    total_tax = Decimal("0.00")

    # 2. Create the Invoice header first (we'll update the totals later)
    new_invoice = models.SalesInvoice(
        cashier_id=payload.cashier_id,
        receipt_number=receipt_number,
        subtotal=0,
        discount_amount=payload.discount_amount,
        tax_amount=0,
        total_amount=0,
        payment_method=payload.payment_method,
        status="completed"
    )
    db.add(new_invoice)
    db.flush() # Save temporarily to get the new_invoice.id

    # 3. Process each item
    for item in payload.items:
        # Fetch the physical batch being sold
        batch = db.query(models.ProductBatch).filter(models.ProductBatch.id == item.batch_id).first()
        if not batch:
            raise HTTPException(status_code=404, detail=f"Batch ID {item.batch_id} not found")
        
        # Fetch the abstract product for tax details
        product = db.query(models.Product).filter(models.Product.id == batch.product_id).first()
        
        # Backend Calculations
        unit_price = Decimal(batch.retail_price)
        item_subtotal = unit_price * item.quantity
        
        tax_rate = Decimal(product.tax_rate)
        tax_applied = (item_subtotal * (tax_rate / Decimal("100.00"))).quantize(Decimal("0.00"))
        
        # Accumulate totals
        total_subtotal += item_subtotal
        total_tax += tax_applied

        # Create SalesItem record
        new_sales_item = models.SalesItem(
            invoice_id=new_invoice.id,
            batch_id=batch.id,
            quantity=item.quantity,
            unit_price=unit_price,
            tax_applied=tax_applied,
            subtotal=item_subtotal
        )
        db.add(new_sales_item)

        # 4. Inventory Ledger (Deduct Stock)
        # Find which warehouses currently have this batch in stock
        stock_balances = db.query(
            models.StockTransaction.warehouse_id, 
            func.sum(models.StockTransaction.quantity).label("balance")
        ).filter(
            models.StockTransaction.batch_id == batch.id
        ).group_by(models.StockTransaction.warehouse_id).all()
        
        remaining_qty_to_deduct = item.quantity
        for warehouse_id, balance in stock_balances:
            if balance > 0 and remaining_qty_to_deduct > 0:
                deduct_qty = min(balance, remaining_qty_to_deduct)
                
                # Write to ledger
                ledger_entry = models.StockTransaction(
                    warehouse_id=warehouse_id,
                    batch_id=batch.id,
                    user_id=payload.cashier_id,
                    quantity=-deduct_qty, # Negative value to deduct stock
                    transaction_type="sale",
                    reference_id=receipt_number,
                    notes="Sold via POS"
                )
                db.add(ledger_entry)
                
                # FIX: Flush immediately so the next loop iteration (if they scanned the same item twice) 
                # sees the deducted inventory and doesn't oversell!
                db.flush()
                
                remaining_qty_to_deduct -= deduct_qty
                
            if remaining_qty_to_deduct == 0:
                break
                
        # If we went through all warehouses and still couldn't fulfill the quantity
        if remaining_qty_to_deduct > 0:
            db.rollback()
            raise HTTPException(
                status_code=400, 
                detail=f"Insufficient stock for Batch ID {batch.id}. Need {item.quantity}, but only found {item.quantity - remaining_qty_to_deduct} available across all warehouses."
            )

    # 5. Finalize Invoice Totals
    new_invoice.subtotal = total_subtotal
    new_invoice.tax_amount = total_tax
    
    # Calculate final total (Note: You are applying discount AFTER tax here. Adjust if local tax laws differ.)
    final_total = (total_subtotal + total_tax) - payload.discount_amount
    if final_total < 0:
        db.rollback()
        raise HTTPException(status_code=400, detail="Discount cannot exceed total amount")
        
    new_invoice.total_amount = final_total

    db.commit()
    db.refresh(new_invoice)
    
    # FIX: No longer need manual sale.items assignment. Pydantic fetches via models.py relationships!
    return new_invoice


@router.get("/", response_model=List[schemas.SalesInvoiceResponse])
def get_sales(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    sales = db.query(models.SalesInvoice).offset(skip).limit(limit).all()
    # FIX: Removed manual item loops. SQLAlchemy relationships handle this automatically.
    return sales


@router.get("/{invoice_id}", response_model=schemas.SalesInvoiceResponse)
def get_sale(invoice_id: int, db: Session = Depends(get_db)):
    sale = db.query(models.SalesInvoice).filter(models.SalesInvoice.id == invoice_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale Invoice not found")
        
    # FIX: Removed manual item assignment here as well.
    return sale