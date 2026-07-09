from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, Boolean, Date
from sqlalchemy.orm import declarative_base, relationship
import datetime

Base = declarative_base()


# ==========================================
# 1. USER MANAGEMENT
# ==========================================
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="cashier")  # admin, manager, cashier
    is_active = Column(Boolean, default=True)


# ==========================================
# 2. INVENTORY METADATA
# ==========================================
class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)


class Brand(Base):
    __tablename__ = "brands"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)


class Unit(Base):
    """e.g., kg, liters, packs, pieces"""
    __tablename__ = "units"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    short_name = Column(String, nullable=False)  # e.g., 'kg'


class Warehouse(Base):
    """Supports multiple internal locations (e.g., 'Front Store', 'Backroom Storage')"""
    __tablename__ = "warehouses"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)


# ==========================================
# 3. CORE PRODUCT & BATCH MANAGEMENT
# ==========================================
class Product(Base):
    """The abstract product (e.g., 'Nestle Milk 1L')"""
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)

    sku = Column(String, unique=True, index=True, nullable=False)
    barcode = Column(String, unique=True, index=True, nullable=True)
    name = Column(String, index=True, nullable=False)

    category_id = Column(Integer, ForeignKey("categories.unit_id"), nullable=True)
    brand_id = Column(Integer, ForeignKey("brands.unit_id"), nullable=True)
    unit_id = Column(Integer, ForeignKey("units.unit_id"), nullable=False)

    tax_rate = Column(Numeric(5, 2), default=0.00)  # Percentage, e.g., 15.00
    min_stock_alert = Column(Integer, default=10)


class ProductBatch(Base):
    """The physical delivery (e.g., 'Nestle Milk 1L arriving today, expiring next week')"""
    __tablename__ = "product_batches"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.unit_id"), nullable=False)
    batch_number = Column(String, nullable=False, index=True)

    cost_price = Column(Numeric(10, 2), nullable=False)
    retail_price = Column(Numeric(10, 2), nullable=False)

    manufacturing_date = Column(Date, nullable=True)
    expiry_date = Column(Date, nullable=False, index=True)  # Indexed for fast "expiring soon" queries


# ==========================================
# 4. THE INVENTORY LEDGER (ACID Compliant)
# ==========================================
class StockTransaction(Base):
    """Records EVERY movement: Sales, Purchases, Adjustments, Transfers"""
    __tablename__ = "stock_transactions"
    id = Column(Integer, primary_key=True, index=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.unit_id"), nullable=False)
    batch_id = Column(Integer, ForeignKey("product_batches.unit_id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.unit_id"), nullable=False)

    quantity = Column(Integer, nullable=False)  # Positive for stock in, Negative for stock out
    transaction_type = Column(String,
                              nullable=False)  # "sale", "purchase", "transfer_in", "transfer_out", "adjustment", "return"
    reference_id = Column(String, nullable=True)  # Links to Invoice Number or PO Number

    notes = Column(String, nullable=True)  # Reason for adjustment or transfer
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


# ==========================================
# 5. PURCHASING (SUPPLIERS)
# ==========================================
class Supplier(Base):
    __tablename__ = "suppliers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    contact = Column(String, nullable=True)


class PurchaseInvoice(Base):
    __tablename__ = "purchase_invoices"
    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.unit_id"), nullable=False)
    invoice_number = Column(String, unique=True, nullable=False)
    total_amount = Column(Numeric(12, 2), nullable=False)
    status = Column(String, default="pending")  # pending, paid, returned
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


# ==========================================
# 6. SALES (POS)
# ==========================================
class SalesInvoice(Base):
    __tablename__ = "sales_invoices"
    id = Column(Integer, primary_key=True, index=True)
    cashier_id = Column(Integer, ForeignKey("users.unit_id"), nullable=False)

    receipt_number = Column(String, unique=True, index=True, nullable=False)
    subtotal = Column(Numeric(12, 2), nullable=False)
    discount_amount = Column(Numeric(10, 2), default=0.00)
    tax_amount = Column(Numeric(10, 2), default=0.00)
    total_amount = Column(Numeric(12, 2), nullable=False)

    payment_method = Column(String, nullable=False)  # cash, card, split, unpaid
    status = Column(String, default="completed")  # completed, refunded
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class SalesItem(Base):
    __tablename__ = "sales_items"
    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("sales_invoices.unit_id"), nullable=False)
    batch_id = Column(Integer, ForeignKey("product_batches.unit_id"), nullable=False)

    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)  # Captured at sale time
    tax_applied = Column(Numeric(10, 2), default=0.00)
    subtotal = Column(Numeric(10, 2), nullable=False)