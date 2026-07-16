from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app import models, schemas
from app.database import get_db
from app.auth import require_role

router = APIRouter(
    prefix="/api/batches",
    tags=["Product Batches"]
)


@router.post("/", response_model=schemas.ProductBatchResponse, status_code=status.HTTP_201_CREATED)
def create_batch(
    batch: schemas.ProductBatchCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["admin", "manager"])),
):
    # STEP 1: Verify the Product actually exists
    product = db.query(models.Product).filter(models.Product.id == batch.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Cannot create batch. The assigned Product ID does not exist.")

    # STEP 2: Check for duplicate batch numbers for this specific product
    existing_batch = db.query(models.ProductBatch).filter(
        models.ProductBatch.product_id == batch.product_id,
        models.ProductBatch.batch_number == batch.batch_number
    ).first()

    if existing_batch:
        raise HTTPException(status_code=400, detail="This batch number already exists for this product.")

    # STEP 3: Save to database
    new_batch = models.ProductBatch(**batch.model_dump())
    db.add(new_batch)
    db.commit()
    db.refresh(new_batch)

    return new_batch


@router.get("/", response_model=List[schemas.ProductBatchResponse])
def get_all_batches(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["admin", "manager", "cashier", "self_order"])),
):
    batches = db.query(models.ProductBatch).offset(skip).limit(limit).all()
    return batches


@router.get("/{batch_id}", response_model=schemas.ProductBatchResponse)
def get_single_batch(
    batch_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["admin", "manager", "cashier", "self_order"])),
):
    batch = db.query(models.ProductBatch).filter(models.ProductBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    return batch


@router.put("/{batch_id}", response_model=schemas.ProductBatchResponse)
def update_batch(
    batch_id: int,
    batch_update: schemas.ProductBatchCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["admin", "manager"])),
):
    batch_query = db.query(models.ProductBatch).filter(models.ProductBatch.id == batch_id)
    existing_batch = batch_query.first()

    if not existing_batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    # Verify the new product_id exists (if they changed it)
    product = db.query(models.Product).filter(models.Product.id == batch_update.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="The assigned Product ID does not exist.")

    # Prevent duplicate batch numbers for the same product, excluding the current batch
    conflict = db.query(models.ProductBatch).filter(
        models.ProductBatch.product_id == batch_update.product_id,
        models.ProductBatch.batch_number == batch_update.batch_number,
        models.ProductBatch.id != batch_id
    ).first()

    if conflict:
        raise HTTPException(status_code=400, detail="Another batch with this number already exists for this product.")

    batch_query.update(batch_update.model_dump(), synchronize_session=False)
    db.commit()

    return batch_query.first()



@router.delete("/{batch_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_batch(
    batch_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["admin"])),
):
    batch_query = db.query(models.ProductBatch).filter(models.ProductBatch.id == batch_id)

    if not batch_query.first():
        raise HTTPException(status_code=404, detail="Batch not found")

    batch_query.delete(synchronize_session=False)
    db.commit()

    return None