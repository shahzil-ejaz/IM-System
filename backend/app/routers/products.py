from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app import models, schemas
from app.database import get_db
from app.auth import require_role

# Initialize the router
router = APIRouter(
    prefix="/api/products",
    tags=["Products"]
)

def validate_product_fks(product_data: schemas.ProductCreate, db: Session):
    # Validate Unit ID
    if not db.query(models.Unit).filter(models.Unit.id == product_data.unit_id).first():
        raise HTTPException(status_code=404, detail="The specified Unit ID does not exist.")

    # Validate Category ID (if provided)
    if product_data.category_id and not db.query(models.Category).filter(models.Category.id == product_data.category_id).first():
        raise HTTPException(status_code=404, detail="The specified Category ID does not exist.")

    # Validate Brand ID (if provided)
    if product_data.brand_id and not db.query(models.Brand).filter(models.Brand.id == product_data.brand_id).first():
        raise HTTPException(status_code=404, detail="The specified Brand ID does not exist.")



@router.post("/", response_model=schemas.ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    product: schemas.ProductCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["admin", "manager"])),
):

    validate_product_fks(product, db)
    #Check for duplicate SKU/Barcode
    if db.query(models.Product).filter(models.Product.sku == product.sku).first():
        raise HTTPException(status_code=400, detail="A product with this SKU already exists")

    if product.barcode and db.query(models.Product).filter(models.Product.barcode == product.barcode).first():
        raise HTTPException(status_code=400, detail="A product with this Barcode already exists")

    #Save to database
    new_product = models.Product(**product.model_dump())
    db.add(new_product)
    db.commit()
    db.refresh(new_product)

    return new_product



@router.get("/", response_model=List[schemas.ProductResponse])
def get_products(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["admin", "manager", "cashier"])),
):
    # Standard server-side pagination to prevent memory crashes
    products = db.query(models.Product).offset(skip).limit(limit).all()
    return products


@router.get("/{product_id}", response_model=schemas.ProductResponse)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["admin", "manager", "cashier"])),
):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()

    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    return product



@router.put("/{product_id}", response_model=schemas.ProductResponse)
def update_product(
    product_id: int,
    product_update: schemas.ProductCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["admin", "manager"])),
):
    # 0. Check if the product we want to update actually exists
    product_query = db.query(models.Product).filter(models.Product.id == product_id)
    existing_product = product_query.first()

    if not existing_product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    validate_product_fks(product_update, db)

    #Prevent updating to an SKU that already belongs to a DIFFERENT product
    sku_conflict = db.query(models.Product).filter(
        models.Product.sku == product_update.sku,
        models.Product.id != product_id
    ).first()
    if sku_conflict:
        raise HTTPException(status_code=400, detail="Another product is already using this SKU")

    #Prevent updating to a Barcode that already belongs to a DIFFERENT product
    if product_update.barcode:
        barcode_conflict = db.query(models.Product).filter(
            models.Product.barcode == product_update.barcode,
            models.Product.id != product_id
        ).first()
        if barcode_conflict:
            raise HTTPException(status_code=400, detail="Another product is already using this Barcode")

    # 6. Apply the Update
    product_query.update(product_update.model_dump(), synchronize_session=False)
    db.commit()

    return product_query.first()

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["admin"])),
):
    product_query = db.query(models.Product).filter(models.Product.id == product_id)

    if not product_query.first():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    product_query.delete(synchronize_session=False)
    db.commit()

    return None