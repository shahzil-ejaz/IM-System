from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app import models, schemas
from app.database import get_db
from app.auth import require_role

router = APIRouter(
    prefix="/api/units",
    tags=["units"],
)


@router.get("/", response_model=List[schemas.UnitResponse])
def get_all_units(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["admin", "manager", "cashier", "self_order"])),
):
    units = db.query(models.Unit).offset(skip).limit(limit).all()
    return units


@router.get("/{id}", response_model=schemas.UnitResponse)
def get_single_unit(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["admin", "manager", "cashier", "self_order"])),
):
    unit = db.query(models.Unit).filter(models.Unit.id == id).first()

    # FIX 2: Added 404 check
    if not unit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unit not found")

    return unit


@router.post("/", response_model=schemas.UnitResponse, status_code=status.HTTP_201_CREATED)
def create_unit(
    unit: schemas.UnitCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["admin", "manager"])),
):
    # ADDED: Check for duplicates before creating
    existing_unit = db.query(models.Unit).filter(models.Unit.name == unit.name).first()
    if existing_unit:
        raise HTTPException(status_code=400, detail="Unit already exists")

    # FIX 3: Changed variable name to new_unit
    new_unit = models.Unit(**unit.model_dump())

    db.add(new_unit)
    db.commit()
    db.refresh(new_unit)

    return new_unit


@router.put("/{unit_id}", response_model=schemas.UnitResponse)
def update_unit(
    unit_id: int,
    unit: schemas.UnitCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["admin", "manager"])),
):
    unit_query = db.query(models.Unit).filter(models.Unit.id == unit_id)
    existing_unit = unit_query.first()

    if not existing_unit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unit not found")

    name_conflict = db.query(models.Unit).filter(
        models.Unit.name == unit.name,
        models.Unit.id != unit_id
    ).first()

    if name_conflict:
        raise HTTPException(status_code=400, detail="Another Unit with this name already exists")

    unit_query.update(unit.model_dump(), synchronize_session=False)
    db.commit()
    return unit_query.first()


@router.delete("/{unit_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_unit(
    unit_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["admin"])),
):
    query_unit = db.query(models.Unit).filter(models.Unit.id == unit_id)
    selected_unit = query_unit.first()

    # FIX 1: Added 'not'
    if not selected_unit:
        raise HTTPException(status_code=404, detail="Unit not found")

    query_unit.delete(synchronize_session=False)
    db.commit()

    return None