from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app import models, schemas
from app.routers.audit_logs import record_audit
from app.database import get_db
from app.auth import require_role

router = APIRouter(
    prefix="/api/purchase-invoices",
    tags=["Purchase Invoices"]
)

@router.post("/receive-stock", status_code=status.HTTP_201_CREATED)
def receive_new_stock(
    payload: schemas.ReceiveStockPayload,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["admin", "manager"])),
):
    try:
        # STEP 1: Verify Supplier Exists
        supplier = db.query(models.Supplier).filter(models.Supplier.id == payload.supplier_id).first()
        if not supplier:
            raise HTTPException(status_code=404, detail="Supplier not found.")

        # STEP 2: Create the Invoice Header
        new_invoice = models.PurchaseInvoice(
            supplier_id=payload.supplier_id,
            invoice_number=payload.invoice_number,
            total_amount=payload.total_amount,
            status="pending"
        )
        db.add(new_invoice)

        # STEP 3: Loop through the items on the truck
        for item in payload.items:

            # Verify the Product exists
            if not db.query(models.Product).filter(models.Product.id == item.product_id).first():
                raise HTTPException(status_code=404, detail=f"Product ID {item.product_id} not found.")

            # Verify the Warehouse exists
            if not db.query(models.Warehouse).filter(models.Warehouse.id == item.warehouse_id).first():
                raise HTTPException(status_code=404, detail=f"Warehouse ID {item.warehouse_id} not found.")

            # A. FIND OR CREATE the Physical Batch (FIX: Prevents duplicate batches)
            existing_batch = db.query(models.ProductBatch).filter(
                models.ProductBatch.product_id == item.product_id,
                models.ProductBatch.batch_number == item.batch_number
            ).first()

            if existing_batch:
                batch_id_for_ledger = existing_batch.id
            else:
                new_batch = models.ProductBatch(
                    product_id=item.product_id,
                    batch_number=item.batch_number,
                    cost_price=item.cost_price,
                    retail_price=item.retail_price,
                    expiry_date=item.expiry_date
                )
                db.add(new_batch)
                db.flush()  # Temporarily saves the batch so we can grab its new ID
                batch_id_for_ledger = new_batch.id

            # B. Write to the Stock Ledger
            ledger_entry = models.StockTransaction(
                warehouse_id=item.warehouse_id,
                batch_id=batch_id_for_ledger,
                user_id=payload.received_by_user_id,
                quantity=item.quantity_received,  # Positive number means stock is increasing
                transaction_type="purchase",
                reference_id=payload.invoice_number,
                notes="Received via Purchase Invoice"
            )
            db.add(ledger_entry)
            db.flush() # Ensure it's tracked for the next loop iteration

        # STEP 4: ALL OR NOTHING. Save everything to the database permanently.
        db.commit()

        record_audit(
            db, "STOCK_RECEIVED", actor=current_user,
            resource="PurchaseInvoice", resource_id=payload.invoice_number,
            detail=f"Stock received via invoice '{payload.invoice_number}' from supplier ID {payload.supplier_id} — {len(payload.items)} item(s)",
        )
        db.commit()

        return {"message": "Stock successfully received and ledger updated."}

    except HTTPException:
        db.rollback()  # If we raised a 404 error above, cancel the transaction!
        raise
    except Exception as e:
        db.rollback()  # If the database crashes, cancel the transaction!
        raise HTTPException(status_code=400, detail=f"Failed to receive stock: {str(e)}")


# ==========================================
# 2. GET ALL PURCHASE INVOICES
# ==========================================
@router.get("/", response_model=List[schemas.PurchaseInvoiceResponse])
def get_all_purchase_invoices(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["admin", "manager"])),
):
    invoices = db.query(models.PurchaseInvoice).offset(skip).limit(limit).all()
    return invoices


# ==========================================
# 3. GET A SINGLE PURCHASE INVOICE
# ==========================================
@router.get("/{invoice_id}", response_model=schemas.PurchaseInvoiceResponse)
def get_single_purchase_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["admin", "manager"])),
):
    invoice = db.query(models.PurchaseInvoice).filter(models.PurchaseInvoice.id == invoice_id).first()

    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Purchase invoice not found")

    return invoice


# ==========================================
# 4. UPDATE INVOICE STATUS (Safe Update)
# ==========================================
@router.patch("/{invoice_id}/status", response_model=schemas.PurchaseInvoiceResponse)
def update_invoice_status(
    invoice_id: int,
    new_status: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["admin", "manager"])),
):
    """
    Only allows updating the status (e.g., 'pending' to 'paid').
    Does NOT alter the ledger or batches.
    """
    invoice_query = db.query(models.PurchaseInvoice).filter(models.PurchaseInvoice.id == invoice_id)
    invoice = invoice_query.first()

    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Purchase invoice not found")

    valid_statuses = ["pending", "paid", "returned"]
    if new_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")

    invoice_query.update({"status": new_status}, synchronize_session=False)
    db.commit()

    return invoice_query.first()
