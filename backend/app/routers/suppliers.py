from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app import models, schemas
from app.database import get_db

# Initialize the router
router = APIRouter(
    prefix="/api/suppliers",
    tags=["Suppliers"]
)


# ==========================================
# 1. CREATE A SUPPLIER
# ==========================================
@router.post("/", response_model=schemas.SupplierResponse, status_code=status.HTTP_201_CREATED)
def create_supplier(supplier: schemas.SupplierCreate, db: Session = Depends(get_db)):
    # Check for duplicate Supplier Name
    name_conflict = db.query(models.Supplier).filter(models.Supplier.name == supplier.name).first()
    if name_conflict:
        raise HTTPException(status_code=400, detail="A supplier with this name already exists.")

    # Save to database
    new_supplier = models.Supplier(**supplier.model_dump())
    db.add(new_supplier)
    db.commit()
    db.refresh(new_supplier)

    return new_supplier


# ==========================================
# 2. GET ALL SUPPLIERS
# ==========================================
@router.get("/", response_model=List[schemas.SupplierResponse])
def get_all_suppliers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    suppliers = db.query(models.Supplier).offset(skip).limit(limit).all()
    return suppliers


# ==========================================
# 3. GET A SINGLE SUPPLIER
# ==========================================
@router.get("/{supplier_id}", response_model=schemas.SupplierResponse)
def get_single_supplier(supplier_id: int, db: Session = Depends(get_db)):
    supplier = db.query(models.Supplier).filter(models.Supplier.id == supplier_id).first()

    if not supplier:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supplier not found")

    return supplier


# ==========================================
# 4. UPDATE A SUPPLIER
# ==========================================
@router.put("/{supplier_id}", response_model=schemas.SupplierResponse)
def update_supplier(supplier_id: int, supplier_update: schemas.SupplierCreate, db: Session = Depends(get_db)):
    supplier_query = db.query(models.Supplier).filter(models.Supplier.id == supplier_id)
    existing_supplier = supplier_query.first()

    if not existing_supplier:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supplier not found")

    # Prevent renaming to a name that belongs to another supplier
    name_conflict = db.query(models.Supplier).filter(
        models.Supplier.name == supplier_update.name,
        models.Supplier.id != supplier_id
    ).first()

    if name_conflict:
        raise HTTPException(status_code=400, detail="Another supplier with this name already exists.")

    # Apply the Update
    supplier_query.update(supplier_update.model_dump(), synchronize_session=False)
    db.commit()

    return supplier_query.first()


# ==========================================
# 5. DELETE A SUPPLIER
# ==========================================
@router.delete("/{supplier_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_supplier(supplier_id: int, db: Session = Depends(get_db)):
    supplier_query = db.query(models.Supplier).filter(models.Supplier.id == supplier_id)

    if not supplier_query.first():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supplier not found")

    supplier_query.delete(synchronize_session=False)
    db.commit()

    return None