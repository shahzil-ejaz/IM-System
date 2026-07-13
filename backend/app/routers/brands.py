from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app import models, schemas
from app.database import get_db
from app.auth import require_role

router = APIRouter(
    prefix="/api/brands",
    tags=["Brands"]
)


@router.post("/", response_model=schemas.BrandResponse, status_code=status.HTTP_201_CREATED)
def create_brand(
    brand: schemas.BrandCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["admin", "manager"])),
):
    existing_brand = db.query(models.Brand).filter(models.Brand.name == brand.name).first()
    if existing_brand:
        raise HTTPException(status_code=400, detail="Brand already exists")

    new_brand = models.Brand(**brand.model_dump())
    db.add(new_brand)
    db.commit()
    db.refresh(new_brand)
    return new_brand


@router.get("/", response_model=List[schemas.BrandResponse])
def get_brands(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["admin", "manager", "cashier"])),
):
    brands = db.query(models.Brand).offset(skip).limit(limit).all()
    return brands


@router.get("/{brand_id}", response_model=schemas.BrandResponse)
def get_brand(
    brand_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["admin", "manager", "cashier"])),
):
    brand = db.query(models.Brand).filter(models.Brand.id == brand_id).first()
    if not brand:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Brand not found")
    return brand


@router.put("/{brand_id}", response_model=schemas.BrandResponse)
def update_brand(
    brand_id: int,
    brand_update: schemas.BrandCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["admin", "manager"])),
):
    brand_query = db.query(models.Brand).filter(models.Brand.id == brand_id)
    existing_brand = brand_query.first()

    if not existing_brand:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Brand not found")

    name_conflict = db.query(models.Brand).filter(
        models.Brand.name == brand_update.name,
        models.Brand.id != brand_id
    ).first()

    if name_conflict:
        raise HTTPException(status_code=400, detail="Another brand with this name already exists")

    brand_query.update(brand_update.model_dump(), synchronize_session=False)
    db.commit()
    return brand_query.first()


@router.delete("/{brand_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_brand(
    brand_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["admin"])),
):
    brand_query = db.query(models.Brand).filter(models.Brand.id == brand_id)
    if not brand_query.first():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Brand not found")

    brand_query.delete(synchronize_session=False)
    db.commit()
    return None