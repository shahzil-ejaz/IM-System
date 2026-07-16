from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional, Literal
from datetime import datetime, date
from decimal import Decimal

# ENUMS (using Literal for strict Pydantic validation)

RoleType = Literal["admin", "manager", "cashier", "self_order"]
TransactionType = Literal["sale", "purchase", "transfer_in", "transfer_out", "adjustment", "return"]
PaymentMethod = Literal["cash", "card", "split", "unpaid"]
SalesStatus = Literal["completed", "refunded"]
PurchaseStatus = Literal["pending", "paid", "returned"]

# 1. USER SCHEMAS

class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    role: RoleType = "cashier"
    is_active: bool = True

class UserCreate(UserBase):
    password: str = Field(..., min_length=8, description="Raw password, hashed before saving")

class UserResponse(UserBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# 2. INVENTORY METADATA SCHEMAS

class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class BrandBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)

class BrandCreate(BrandBase):
    pass

class BrandResponse(BrandBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class UnitBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    short_name: str = Field(..., min_length=1, max_length=10)

class UnitCreate(UnitBase):
    pass

class UnitResponse(UnitBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class WarehouseBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)

class WarehouseCreate(WarehouseBase):
    pass

class WarehouseResponse(WarehouseBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


# 3. PRODUCT & BATCH SCHEMAS

class ProductBase(BaseModel):
    sku: str = Field(..., min_length=3, max_length=50)
    barcode: Optional[str] = Field(None, max_length=100)
    name: str = Field(..., min_length=2, max_length=200)
    category_id: Optional[int] = None
    brand_id: Optional[int] = None
    unit_id: int
    tax_rate: Decimal = Field(default=Decimal("0.00"), max_digits=5, decimal_places=2, ge=Decimal("0.00"))
    min_stock_alert: int = Field(default=10, ge=0)

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class ProductBatchBase(BaseModel):
    product_id: int
    batch_number: str = Field(..., min_length=1)
    cost_price: Decimal = Field(..., max_digits=10, decimal_places=2, ge=Decimal("0.00"))
    retail_price: Decimal = Field(..., max_digits=10, decimal_places=2, ge=Decimal("0.00"))
    manufacturing_date: Optional[date] = None
    expiry_date: date

class ProductBatchCreate(ProductBatchBase):
    pass

class ProductBatchResponse(ProductBatchBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class StockTransactionBase(BaseModel):
    warehouse_id: int
    batch_id: int
    user_id: int
    quantity: int = Field(..., description="Positive for stock in, Negative for stock out")
    transaction_type: TransactionType
    reference_id: Optional[str] = None
    notes: Optional[str] = None

class StockTransactionCreate(StockTransactionBase):
    pass

class StockTransactionResponse(StockTransactionBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class StockTransactionEnriched(BaseModel):
    """Enriched view of a stock transaction with resolved names for the UI."""
    id: int
    transaction_type: TransactionType
    quantity: int
    reference_id: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    # Resolved names
    batch_number: Optional[str] = None
    product_name: Optional[str] = None
    product_sku: Optional[str] = None
    warehouse_name: Optional[str] = None
    actor_username: Optional[str] = None
    cost_price: Optional[float] = None
    retail_price: Optional[float] = None
    tax_rate: Optional[float] = None
    category_name: Optional[str] = None
    brand_name: Optional[str] = None
    # Raw IDs kept for reference
    batch_id: int
    warehouse_id: int
    user_id: int
    model_config = ConfigDict(from_attributes=True)


class SupplierBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    contact: Optional[str] = None
    whatsapp_number: Optional[str] = None

class SupplierCreate(SupplierBase):
    pass

class SupplierResponse(SupplierBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class PurchaseInvoiceBase(BaseModel):
    supplier_id: int
    invoice_number: str = Field(..., min_length=1)
    total_amount: Decimal = Field(..., max_digits=12, decimal_places=2, ge=Decimal("0.00"))
    status: PurchaseStatus = "pending"

class PurchaseInvoiceCreate(PurchaseInvoiceBase):
    pass

class PurchaseInvoiceResponse(PurchaseInvoiceBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class SalesItemCreate(BaseModel):
    batch_id: int
    quantity: int = Field(..., gt=0, description="Quantity must be greater than 0")
    # Backend calculates unit_price, tax_applied, and subtotal to prevent tampering

class SalesItemResponse(BaseModel):
    id: int
    invoice_id: int
    batch_id: int
    quantity: int
    unit_price: Decimal
    tax_applied: Decimal
    subtotal: Decimal
    model_config = ConfigDict(from_attributes=True)

class SalesInvoiceCreate(BaseModel):
    cashier_id: int
    payment_method: PaymentMethod
    discount_amount: Decimal = Field(default=Decimal("0.00"), max_digits=10, decimal_places=2, ge=Decimal("0.00"))
    amount_tendered: Optional[Decimal] = None
    change_due: Optional[Decimal] = None
    items: List[SalesItemCreate] = Field(..., min_length=1, description="At least one item required")

class SalesInvoiceResponse(BaseModel):
    id: int
    cashier_id: int
    receipt_number: str
    subtotal: Decimal
    discount_amount: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    payment_method: PaymentMethod
    amount_tendered: Optional[Decimal] = None
    change_due: Optional[Decimal] = None
    status: SalesStatus
    created_at: datetime
    items: List[SalesItemResponse] = []
    
    model_config = ConfigDict(from_attributes=True)

# The individual items arriving on the truck
class IncomingStockItem(BaseModel):
    product_id: int
    warehouse_id: int
    batch_number: str
    cost_price: Decimal = Field(..., max_digits=10, decimal_places=2)
    retail_price: Decimal = Field(..., max_digits=10, decimal_places=2)
    expiry_date: date
    quantity_received: int

# The giant payload the frontend sends to the backend
class ReceiveStockPayload(BaseModel):
    supplier_id: int
    invoice_number: str
    total_amount: Decimal = Field(..., max_digits=12, decimal_places=2)
    received_by_user_id: int
    items: List[IncomingStockItem]


# ─── AUDIT LOG ───────────────────────────────────────────────────────────────

class AuditLogResponse(BaseModel):
    id: int
    actor_id: Optional[int] = None
    actor_username: Optional[str] = None
    action: str
    resource: Optional[str] = None
    resource_id: Optional[str] = None
    detail: Optional[str] = None
    status: str
    ip_address: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# ─── SYSTEM CONFIGURATION ────────────────────────────────────────────────────

class SystemSettingsBase(BaseModel):
    key: str
    value: str

class SystemSettingsUpdate(BaseModel):
    value: str

class SystemSettingsResponse(SystemSettingsBase):
    id: int
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

