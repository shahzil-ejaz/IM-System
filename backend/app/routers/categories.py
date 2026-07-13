from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app import models, schemas
from app.database import get_db
from app.auth import require_role

# Initialize the router
router = APIRouter(
    prefix="/api/categories",
    tags=["Categories"]
)


@router.post("/", response_model=schemas.CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    category: schemas.CategoryCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["admin", "manager"])),
):
    # Check if category already exists to prevent duplicates
    existing_category = db.query(models.Category).filter(models.Category.name == category.name).first()
    if existing_category:
        raise HTTPException(status_code=400, detail="Category already exists")

    # Unpack Pydantic schema to SQLAlchemy model
    new_category = models.Category(**category.model_dump())

    # Save to database
    db.add(new_category)
    db.commit()
    db.refresh(new_category)

    return new_category


@router.get("/", response_model=List[schemas.CategoryResponse])
def get_categories(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["admin", "manager", "cashier"])),
):
    # Fetch all categories with optional pagination
    categories = db.query(models.Category).offset(skip).limit(limit).all()
    return categories


@router.get("/{category_id}", response_model=schemas.CategoryResponse)
def get_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["admin", "manager", "cashier"])),
):
    category = db.query(models.Category).filter(models.Category.id == category_id).first()

    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    return category


@router.put("/{category_id}", response_model=schemas.CategoryResponse)
def update_category(
    category_id: int,
    category_update: schemas.CategoryCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["admin", "manager"])),
):
    # Find the existing category
    category_query = db.query(models.Category).filter(models.Category.id == category_id)
    existing_category = category_query.first()

    if not existing_category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    # Check if the new name conflicts with another existing category
    name_conflict = db.query(models.Category).filter(
        models.Category.name == category_update.name,
        models.Category.id != category_id
    ).first()

    if name_conflict:
        raise HTTPException(status_code=400, detail="Another category with this name already exists")

    # Update the data
    category_query.update(category_update.model_dump(), synchronize_session=False)
    db.commit()

    return category_query.first()



@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["admin"])),
):
    category_query = db.query(models.Category).filter(models.Category.id == category_id)
    existing_category = category_query.first()

    if not existing_category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    # Delete from database
    category_query.delete(synchronize_session=False)
    db.commit()

    # A 204 No Content response requires no data to be returned
    return None