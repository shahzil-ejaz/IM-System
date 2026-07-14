Frontend Design & UI/UX Requirements Document (Light Mode)
1. Authentication & Role-Based Routing
The login interface operates as an intelligent gatekeeper. The user lands on a clean, distraction-free minimalist layout over a crisp, bright canvas. Upon entering credentials, the frontend processes the response token from /api/users/login, decodes the payload, and instantly routes the user to their designated dashboard.
                 [ Login Screen ]
                         │
            POST /api/users/login Success
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
     [ Cashier ]    [ Manager ]    [ Admin ]
         │              │              │
     Direct to      Direct to      Direct to
    POS Terminal   Manager Center  Admin Suite
   (No Sidebar)    (Mgmt Sidebar) (Full Sidebar)

2. The Cashier Workspace (POS Terminal)
To maximize the speed of active checkout sessions, the POS page completely eliminates the standard navigation sidebar. This expands horizontal screen real estate for direct tactile layout changes over a high-clarity, daylight-readable canvas.
50/50 Split-Screen Layout (State A)
By default, the screen splits evenly into two high-density interactive columns:
Left View (50%): Active Cart Processing
A vertical stream of currently scanned items. Each row uses crisp, high-contrast dark monospaced typography (JetBrains Mono) for the SKU, barcode, unit price, and quantities on a pure white background. This keeps figures perfectly legible under bright counter lights.
Explicit, large tap-target increment/decrement controls flank the quantity values.
Right View (50%): Dynamic Product Suggestions Panel
A modular grid displaying frequently bought items based on common purchasing workflows.
Allows cashiers to tap any suggestion item card to instantly inject it directly into the active checkout basket without requiring a physical barcode scan.
Summary Bar Placement: In this state, the monetary summary bar (Subtotal, Tax, Applied Discount, and Total Due) sits horizontally below the items row.
+-----------------------------------------------------------+
| Active Warehouse: Main | Cashier: Shahzil | [Lock/Logout] |
+---------------------------+-------------------------------+
|                           |                               |
|       ACTIVE CART         |      PRODUCT SUGGESTIONS      |
|          (50%)            |             (50%)             |
|                           |                               |
|                           |                               |
+---------------------------+-------------------------------+
| Subtotal: $0.00  | Tax: $0.00 | Total: $0.00 [CHECKOUT]   |
+-----------------------------------------------------------+

Streamlined Full-Width Layout (State B)
The cashier can click a dedicated fullscreen toggle key to hide the Suggestions Panel completely, initiating a seamless responsive layout shift:
The active cart expands to take up the majority of the screen space.
Side Panel Pivoting: The horizontal summary bar disappears from the bottom and mounts as a permanent, full-height vertical panel on the right side. This vertical configuration groups the final totals, payment method buttons (cash, card, split), and the "Process Checkout" button into a dedicated checkout column.
+---------------------------------------+-------------------+
| Active Warehouse: Main | [Logout]     | SUMMARY & ACTIONS |
+---------------------------------------+-------------------+
|                                       | Subtotal: $0.00   |
|                                       | Tax:      $0.00   |
|            EXPANDED CART              | Discount: $0.00   |
|                (75%)                  | ----------------- |
|                                       | TOTAL:    $0.00   |
|                                       |                   |
|                                       | [ CASH ] [ CARD ] |
|                                       |                   |
|                                       | [COMMIT CHECKOUT] |
+---------------------------------------+-------------------+

Core Cashier On-Screen Features
Global Scanner Hook: An event listener runs continuously in the background to catch input from hardware barcode scanners without requiring focus on a specific search bar.
Action Drawer Toggle: A clean toolbar row anchors persistent utility options directly onto the canvas:
Hold Cart / Recall: Caches the current basket array locally to clear the queue for the next customer.
Warehouse Switcher: Connects directly to /api/warehouses/ so cashiers can cross-check balances at neighboring internal locations if a batch runs empty.
Print Last Receipt: Re-triggers the print window context for the last handled transaction.
Instant Lockout Switch: Clears local state arrays and returns back to the core authentication screen.
3. Manager & Admin Command Centres
Managers and Administrators are blocked from accessing the active POS terminal checkout screen to avoid cluttered operational streams. Instead, both views utilize a collapsing left-hand sidebar layout. The items displayed within these sidebars map to their respective access scopes.
Manager Workspace Requirements
Designed for logistics managers who track incoming supply stocks, calculate batch metrics, and run manual corrections.
Manager Sidebar Functions:
Stock Ledger: Read-only historical stream of /api/stock-transactions/ with multi-filter parameters.
Procurement (Receiving Stock): The core workflow interface for processing /api/purchase-invoices/receive-stock. It features a clean ingest document table template to add incoming batches, map cost/retail prices, input expiry dates, and assign target warehouses.
Catalog & Batches: Master view of products (/api/products) and active delivery batches (/api/batches) to monitor inventory levels.
Manual Adjustments: Interface to post corrections (adjustment, transfer_in, transfer_out) into the ledger.
Destructive Control Restrictions: Managers do not have access to delete buttons or user configuration settings.
Admin Workspace Requirements
Designed for global platform supervision, user control, and data lifecycle management.
Admin Sidebar Functions:
User Control Center: Full interface access to /api/users/ to register new employees, assign system scopes (admin, manager, cashier), and toggle user activity states (is_active). Managers have no visibility into this panel.
Master System Metadata: Full access to manage global parameters across Brands, Categories, Units, and Warehouses.
Global Auditing Log: Full administrative view of all global operational logs.
Operational Rules & Destructive Actions:
Procurement: While admins retain the ability to handle arriving inventory packages via underlying API privileges, this functionality is secondary in the interface—hidden inside a nested advanced tools group to keep their workspace uncluttered.
Destructive Control Panels: Admin views explicitly render delete buttons next to database resource rows (Products, Batches, Suppliers). These buttons call the HTTP DELETE routers and feature double-check modal blockades to protect against accidental clicks.
4. Theme & Design Tokens (Light Mode)
keep it light mode but figure it out using skills
5. Reusable Component Requirements
POSCartRow
A highly virtualized table row layout container that handles item changes without dropping frames.
Displays the active batch number and expiry alert status.
Pairs with inline validation checking against active stock bounds retrieved from /api/stock-transactions/balance/.
ProductSuggestionCard
A compact card component optimized for high-density grids.
Shows the item name, immediate retail price, and a quick-add action button.
Dynamically tones down to light grey and disables interaction states if backend balance totals hit 0.
ResponsiveSummaryPanel
A layout element that changes position dynamically using CSS flexbox rules based on UI state.
State A: Renders as a wide horizontal bar layout underneath the main cart items grid.
State B: Transforms into a full-height column layout pinned along the right screen edge.
ActionSidebar
A vertical control strip featuring built-in access checking.
Evaluates the current user profile token.
Automatically filters out and strips unauthorized action elements (such as deleting an item or registering a new user) before rendering the DOM layout.
6. Micro-interactions & Animations
figure it out using skills
7. Responsive Design Strategy
The interface adapts dynamically across form factors by prioritizing specific actions based on the active device size.
Desktop Layout (Widths above 1024px): Fully expanded views. Displays deep multi-column tables, persistent primary navigation menus, and dense multi-pane interfaces simultaneously.
Tablet Layout (Widths from 768px to 1024px): Navigation sidebars automatically compress into clean iconography stripes. Tabular layouts drop secondary details (such as internal category strings or secondary brand text tags), preserving columns containing SKU IDs, active warehouse locations, and net balance counts.
Mobile Layout (Widths below 768px): The interface shifts into a single-purpose workspace.
The POS Terminal view transforms into a full-height checkout screen. Item quantities are adjusted via large tap targets or swipe-to-remove row commands. The checkout summary panel collapses into a persistent sticky drawer anchored at the bottom edge.
Ledger Views collapse detailed horizontal rows into high-density item summary cards featuring expandable action wrappers, ensuring clear control even on compact touchscreens.
Act as a Staff Frontend Architect and Principal Engineer. Your task is to implement the frontend codebase corresponding exactly to the attached "Frontend Design & UI/UX Requirements Document". 

You must treat this as enterprise-grade production software. The architecture must be highly scalable, completely modular, and defensively coded against performance drops or state leaks.

### 1. Architectural Mandates & Code Organization
*   **Strict Separation of Concerns:** Presentational components must strictly handle UI rendering. All stateful orchestration, data fetching side effects, business logic, and API interactions must be completely decoupled and extracted out of the main view components.
*   **Component Atomicity:** Break down UI layers into individual, reusable component files. No giant monolithic code files. If a sub-element contains standalone interactive logic or layout styling (e.g., `POSCartRow`, `ProductSuggestionCard`), it must live in its own dedicated JS/JSX file.
*   **Feature-Based Folder Structure:** Organize the codebase using a clean, domain-driven architecture:
    ├── src/
    │   ├── assets/       # Static assets
    │   ├── components/
    │   │   ├── ui/       # Generic, reusable global atomic elements (Button, Input, Modal, Dropdown)
    │   │   └── features/ # Feature-specific components (pos/, inventory/, management/, auth/)
    │   ├── hooks/        # Isolated global and feature-specific business logic/stateful custom hooks
    │   ├── services/     # Pure API integration layers mapping directly to the FastAPI endpoints
    │   ├── context/      # Light contextual state engines (AuthContext, WarehouseContext)
    │   └── theme/        # Global Light Mode tokens and design configurations

### 2. Logic Separation & Custom Hooks Strategy
*   **Custom Hooks for State & Side-Effects:** You must encapsulate complex state machines into isolated custom hooks. For example:
    *   `useScanner.js`: Handles the global background hardware barcode event listener, string parsing, and callback execution.
    *   `useCart.js`: Tracks local basket mutations, dynamic subtotal calculations, local validation against active balances, and hold/recall state logic.
    *   `useAuth.js`: Interacts with the login service, decodes JWT sub claims, parses RBAC privileges, and controls session state.
*   **Decoupled API Client Services:** Do not place inline `fetch` or `axios` operations inside your components or hooks. Create stateless API wrapper methods inside `src/services/` that handle requests/responses and export standard promise/async functions.

### 3. Strict UI, Styling & Performance Constraints
*   **Light Mode Enforcement:** Strictly consume the Light Mode design tokens detailed in the document. Implement using modern CSS/Tailwind configuration systems. The application canvas background must always stay clean (`#F8FAFC`), layouts structured with pure white surfaces (`#FFFFFF`), and typographical elements sharply defined (`#0F172A`).
*   **Performance Optimization:** The POS terminal workspace handles high-frequency reactive mutations. Implement window virtualization or strict component memoization strategies inside list wrappers (like the cart row array) to eliminate unnecessary DOM re-renders. 

### 4. Implementation Phase Order
Please generate the foundational layers of this software first. Produce clean, completely documented file layouts using modern ES6+ React conventions. Start by outputting the isolated `src/services/` API clients and core custom business logic `src/hooks/` before writing the presentational component views.

the prompt after this is for managing apis and more on the connnection of frontend to backend side and can contain errors or incomplete or wrong requests so check that before actual implementation

Frontend API Integration & Data Handling Architecture
1. Global Setup & Authentication
The backend implements standard OAuth2 Bearer token authentication using JavaScript Web Tokens (JWT). The key characteristic to note is that the login route expects request payloads formatted as Form Data (application/x-www-form-urlencoded) rather than typical JSON.
Because the backend relies on a single access token without a distinct token refresh endpoint, our global state management must proactively clear authentication contexts and redirect users to the login interface whenever a session expires.
Axios Instance Configuration
JavaScript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000',
  timeout: 10000,
});

// Request Interceptor: Inject Bearer Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Global 401 & 403 Errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status } = error.response;
      
      if (status === 401) {
        // Clear stale credentials
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_role');
        
        // Bounce user to login window cleanly
        window.location.href = '/login?error=session_expired';
      }
      
      if (status === 403) {
        console.error('Permission Denied: Insufficient user privileges.');
      }
    }
    return Promise.reject(error);
  }
);

export default api;

2. API Endpoint Mapping
User Management & Auth
Action
Method & Route
Access Level
Request Payload
Expected Success Response (200/201)
Login User
POST /api/users/login
Public
Form Data: username, password
{"access_token": "string", "token_type": "bearer"}
Register User
POST /api/users/
Admin
JSON: {"username": "str", "role": "admin|manager|cashier", "is_active": true, "password": "str"}
{"id": 1, "username": "str", "role": "cashier", "is_active": true}
List Users
GET /api/users/
Admin, Manager
Query Params: skip (default 0), limit (default 100)
[{"id": 1, "username": "str", "role": "cashier", "is_active": true}, ...]
Current Profile
GET /api/users/me
Authenticated
None
{"id": 1, "username": "str", "role": "cashier", "is_active": true}
Get User Details
GET /api/users/{user_id}
Admin, Manager
None
{"id": 1, "username": "str", "role": "cashier", "is_active": true}
Update User
PUT /api/users/{user_id}
Admin
JSON: Full UserCreate structure
{"id": 1, "username": "str", "role": "admin", "is_active": true}
Toggle Status
PATCH /api/users/{user_id}/status
Admin
None
{"id": 1, "username": "str", "role": "cashier", "is_active": false}
Inventory Metadata
Action
Method & Route
Access Level
Request Payload
Expected Success Response (200/201/204)
Create Brand
POST /api/brands/
Admin, Manager
JSON: {"name": "string"}
{"id": 1, "name": "string"}
List Brands
GET /api/brands/
All Roles
Query Params: skip, limit
[{"id": 1, "name": "string"}]
Update Brand
PUT /api/brands/{brand_id}
Admin, Manager
JSON: {"name": "string"}
{"id": 1, "name": "string"}
Delete Brand
DELETE /api/brands/{brand_id}
Admin
None
No content (204)
Create Category
POST /api/categories/
Admin, Manager
JSON: {"name": "string"}
{"id": 1, "name": "string"}
List Categories
GET /api/categories/
All Roles
Query Params: skip, limit
[{"id": 1, "name": "string"}]
Delete Category
DELETE /api/categories/{id}
Admin
None
No content (204)
List Units
GET /api/units/
All Roles
Query Params: skip, limit
[{"id": 1, "name": "Kilos", "short_name": "kg"}]
Create Unit
POST /api/units/
Admin, Manager
JSON: {"name": "str", "short_name": "str"}
{"id": 1, "name": "str", "short_name": "str"}
List Warehouses
GET /api/warehouses/
All Roles
Query Params: skip, limit
[{"id": 1, "name": "string"}]
Create Warehouse
POST /api/warehouses/
Admin
JSON: {"name": "string"}
{"id": 1, "name": "string"}
Products & Batches
Action
Method & Route
Access Level
Request Payload
Expected Success Response (200/201)
Create Product
POST /api/products/
Admin, Manager
JSON: {"sku": "str", "barcode": "str|null", "name": "str", "category_id": 1, "brand_id": 1, "unit_id": 1, "tax_rate": 15.00, "min_stock_alert": 10}
{"id": 1, "sku": "str", "barcode": "str", "name": "str", ...}
List Products
GET /api/products/
All Roles
Query Params: skip, limit
[{"id": 1, "sku": "str", "name": "str", "unit_id": 1, ...}]
Update Product
PUT /api/products/{id}
Admin, Manager
JSON: Full ProductCreate body
{"id": 1, "sku": "updated_sku", ...}
Create Batch
POST /api/batches/
Admin, Manager
JSON: {"product_id": 1, "batch_number": "str", "cost_price": 45.00, "retail_price": 60.00, "manufacturing_date": "YYYY-MM-DD", "expiry_date": "YYYY-MM-DD"}
{"id": 1, "product_id": 1, "batch_number": "str", ...}
List All Batches
GET /api/batches/
All Roles
Query Params: skip, limit
[{"id": 1, "product_id": 1, "batch_number": "B1", ...}]
Core Operations (POS & Stock Ledger)
Action
Method & Route
Access Level
Request Payload
Expected Success Response (200/201)
POS Checkout
POST /api/sales/checkout
All Roles
JSON: {"cashier_id": 1, "payment_method": "cash|card|split|unpaid", "discount_amount": 5.00, "items": [{"batch_id": 1, "quantity": 2}]}
Full invoice object: {"id": 1, "receipt_number": "REC-XXXX", "subtotal": 120.00, "total_amount": 133.00, "items": [...]}
Receive Truck Stock
POST /api/purchase-invoices/receive-stock
Admin, Manager
JSON: {"supplier_id": 1, "invoice_number": "INV-100", "total_amount": 5000.00, "received_by_user_id": 2, "items": [{"product_id": 1, "warehouse_id": 1, "batch_number": "B9", "cost_price": 10.00, "retail_price": 15.00, "expiry_date": "YYYY-MM-DD", "quantity_received": 500}]}
{"message": "Stock successfully received and ledger updated."}
Manual Stock Adjustment
POST /api/stock-transactions/
Admin, Manager
JSON: {"warehouse_id": 1, "batch_id": 1, "user_id": 1, "quantity": -5, "transaction_type": "adjustment", "reference_id": "optional_str", "notes": "Damaged items"}
{"id": 12, "quantity": -5, "transaction_type": "adjustment", ...}
Live Batch BalanceGET /api/stock-transactions/balance/batch/{batch_id}/warehouse/{warehouse_id}All RolesNone{"batch_id": 1, "warehouse_id": 1, "current_balance": 145}Total Product BalanceGET /api/stock-transactions/balance/product/{product_id}/warehouse/{warehouse_id}All RolesNone{"product_id": 1, "warehouse_id": 1, "total_balance": 640}3. Data Fetching & State Management StrategyTo maintain UI performance and manage relational entities smoothly, we will separate client state from asynchronous server cache:Server State (TanStack Query / React Query)Because our inventory ledger runs on strict transactional entries (sales deduct stock, purchase invoices create batches), using standard client state will result in out-of-sync inventory visuals. TanStack Query will handle data arrays for us.Automated Cache Invalidation: When a cashier completes a /api/sales/checkout, the frontend must instantly trigger an invalidation of the balances cache (stock-transactions/balance/*) and the global product views.Pagination Drivers: Default data fetches will link directly to standard server-side skip and limit keys to safeguard against application performance drops when reading deep ledgers.Client UI State (Zustand)We will implement Zustand for local interface states because it operates with zero runtime overhead and bypasses complex boilerplate architectures:The POS Shopping Cart State: Houses items currently being added by the cashier at the checkout desk before committing them to the /checkout route.Active App Session State: Stores basic variables like the active user's structural authorizations (role) and current operational system scope flags.4. Error Handling & Edge CasesThe FastAPI backend issues two types of error objects. The frontend must parse them appropriately to prevent general application crashes.Case A: Standard HTTP Exceptions (400, 401, 403, 404)These errors occur during invalid logic loops—such as when the sales desk checks out an item that has insufficient quantities.Data Shape: error.response.data = { "detail": "Insufficient stock for Batch ID 2..." }Handling Strategy: Extract the explicit backend string container directly and display it as an urgent top-level warning panel or alert block using toast engines.Case B: Pydantic Validation Errors (422 Unprocessable Entity)These are triggered automatically by the backend data validator if data fields are malformed (e.g., passing a negative number into a Pydantic constraint requiring values greater than 0).Data Shape:JSON{
  "detail": [
    {
      "loc": ["body", "items", 0, "quantity"],
      "msg": "Quantity must be greater than 0",
      "type": "less_than_greater_than_error"
    }
  ]
}
Handling Strategy: Trace the array location parameters inside the error object (loc) to bind the message string context straight to the offending field element on the UI layout.5. Integration ChecklistFollow these steps in order to connect our React application layout to this functional schema layer:1.Build Global Network Configs:Prerequisite.Incorporate our configured Axios client into the root hierarchy of the directory structure. Set the system environmental context files to look safely at the production or local port deployment values.2.Wire the Authorization Controller Loop:Step 2.Construct the core interface component for our authentication layout. Map your input handling arrays to submit using the proper URL encoding rules. Store the resulting token payload variables where the interceptors can index them.3.Establish the POS Core Cache Engine:Step 3.Implement our local Zustand cart management logic layer. Create individual callback hooks capable of tracking scanned barcode variations and assigning quantitative variations inside temporary array states before running final checkouts.4.Configure Automatic Cache Pruning Rules:Step 4.Configure the invalidation routines for TanStack Query. Ensure that executing actions across incoming inventory channels or POS interfaces immediately updates the state hooks governing active inventory tables.