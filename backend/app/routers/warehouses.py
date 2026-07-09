from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app import models, schemas
from app.database import get_db

# Initialize the router
router = APIRouter(
    prefix="/api/warehouses",
    tags=["Warehouses"]
)

@router.get("/", response_model=List[schemas.WarehouseResponse])
def get_all_warehouses(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    warehouses = db.query(models.Warehouse).offset(skip).limit(limit).all()
    return warehouses

@router.get("/{warehouse_id}", response_model=schemas.WarehouseResponse)
def get_single_warehouse(warehouse_id: int, db: Session = Depends(get_db)):
    warehouse = db.query(models.Warehouse).filter(models.Warehouse.id == warehouse_id).first()

    if not warehouse:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Warehouse not found")

    return warehouse


@router.post("/", response_model=schemas.WarehouseResponse, status_code=status.HTTP_201_CREATED)
def create_warehouse(warehouse: schemas.WarehouseCreate, db: Session = Depends(get_db)):
    # Check for duplicate warehouse names
    existing_warehouse = db.query(models.Warehouse).filter(models.Warehouse.name == warehouse.name).first()
    if existing_warehouse:
        raise HTTPException(status_code=400, detail="A warehouse with this name already exists")

    new_warehouse = models.Warehouse(**warehouse.model_dump())

    db.add(new_warehouse)
    db.commit()
    db.refresh(new_warehouse)

    return new_warehouse


@router.put("/{warehouse_id}", response_model=schemas.WarehouseResponse)
def update_warehouse(warehouse_id: int, warehouse_update: schemas.WarehouseCreate, db: Session = Depends(get_db)):
    warehouse_query = db.query(models.Warehouse).filter(models.Warehouse.id == warehouse_id)
    existing_warehouse = warehouse_query.first()

    if not existing_warehouse:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Warehouse not found")

    # Check if the new name conflicts with a DIFFERENT warehouse
    name_conflict = db.query(models.Warehouse).filter(
        models.Warehouse.name == warehouse_update.name,
        models.Warehouse.id != warehouse_id
    ).first()

    if name_conflict:
        raise HTTPException(status_code=400, detail="Another warehouse with this name already exists")

    warehouse_query.update(warehouse_update.model_dump(), synchronize_session=False)
    db.commit()

    return warehouse_query.first()


@router.delete("/{warehouse_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_warehouse(warehouse_id: int, db: Session = Depends(get_db)):
    warehouse_query = db.query(models.Warehouse).filter(models.Warehouse.id == warehouse_id)
    selected_warehouse = warehouse_query.first()

    if not selected_warehouse:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Warehouse not found")

    warehouse_query.delete(synchronize_session=False)
    db.commit()

    return None