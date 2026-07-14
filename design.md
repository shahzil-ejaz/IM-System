# System Design Document

This document outlines the design language, UI patterns, and structural layout rules for the Inventory Management (IM) System. The system spans multiple contexts (e.g., POS terminal, Management suite) but is unified by a shared philosophy.

## Design Philosophy

The application prioritizes **high data density, snappy tactile feedback, and spatial clarity**, taking inspiration from the Emil Kowalski philosophy of UI polish and the "anti-slop" design approach. Interactions must feel immediate, and structural elements are kept minimal to maximize data visibility.

- **High Density over Whitespace**: Enterprise software requires seeing more information at a glance. We prefer `text-xs` (12px) for general content and `text-[10px]` (10px) for headers to condense rows.
- **Micro-Animations**: Interactions provide immediate visual feedback. Buttons use a crisp, short scale effect (`active:scale-[0.97] duration-150`).
- **Physical Metaphors**: Table rows entering the view slightly scale up from `0.98` to `1` over 150ms using spring-like curves, mimicking a physical object appearing.

## Core UI Variables

### Typography
- **Headings**: `font-bold tracking-tight text-text-primary`
- **Table Headers**: `text-[10px] uppercase font-bold tracking-wider text-slate-500`. The uppercase tracking gives an authoritative and precise look.
- **Table Data**: `text-[11px]` or `text-xs` to keep rows compact. Monospaced (`font-mono`) used for IDs or metrics (SKUs, UUIDs, quantities, prices).
- **Secondary Text**: `text-xs text-text-secondary`.

### Color Palette
- **Backgrounds**: `bg-canvas` for the main app background, `bg-surface` for cards/panels.
- **Borders**: `border-border/50` for subtle dividers, `border-border` for structure.
- **Interactive**: `hover:bg-slate-50/50` for subtle hover states on table rows.
- **Status Indicators**: Pulse animations on active states (`animate-pulse bg-green-500 w-1.5 h-1.5`).

### Metrics & Spacing
- **Padding**: `p-2` or `px-3 py-2` in dense tables instead of the standard `p-4` or `p-6`.
- **Radii**: `rounded-lg` for standard components. `rounded-xl` for larger structural containers.
- **Buttons**: Heights are scaled down. `h-8` with `text-xs px-3` for general actions. Icon buttons use `h-7 w-7`.

## Page Layouts

### POS Terminal (`POSLayout.jsx`)
The POS terminal requires absolute efficiency and speed. It is optimized for touch and quick cursor movements.
- **Structure**: A dual-pane layout splitting the view between the **Product Grid (Left)** and the **Active Cart/Checkout (Right)**.
- **Header**: Contains the current cashier's badge, current time, and a synchronized status indicator. Kept vertically small to maximize screen real estate.
- **Product Grid**: A dynamic grid of items. Each card has a subtle border and scales on active press.
- **Cart Pane**: Fixed to the right side. Contains the list of added items (which slide in using Framer Motion) and the total calculation area at the bottom.
- **Checkout Action**: A large, distinct button at the absolute bottom of the right pane, stretching full width to serve as an unmissable anchor.

### Management Suite
The Management suite focuses on data review, auditing, and administrative controls.
- **Sidebar**: A compact navigation rail. Links use `text-sm` with distinct active states indicating the current view.
- **Global Table Structure**: Every view that presents lists (Audit Logs, Stock Ledger, User Center) strictly adheres to the native `<table>` standard instead of generic UI components to maintain DOM efficiency and precise CSS control.
- **Table Animations**: `<AnimatePresence>` handles row insertion/deletion, preventing layout snapping when filtering or adding records.

#### Stock Ledger View (`StockLedgerView.jsx`)
- **Header**: Title and concise subtitle. A quick-action "Record Movement" button aligned to the right.
- **Table Details**: Dense row heights. Movements are color-coded (IN vs OUT) using distinct pill badges (`text-[10px] uppercase font-bold tracking-wide`).

#### Global Audit View (`GlobalAuditView.jsx`)
- **Tabs**: Used to segment System logs, Purchases, and Admin Actions.
- **Search/Filter**: Placed below the tabs but above the table. Uses compact inputs (`h-8 text-xs`).
- **Table Details**: Includes specific columns for IP addresses and Actor IDs. Action badges use dynamic colors based on the severity of the log (e.g., `LOGIN_FAILED` in red).

#### User Control Center (`UserControlCenter.jsx`)
- **Header**: Includes an "Add User" action button.
- **Table Details**: Shows the user's role and status. Status uses the standard pulsing dot indicator for active users. The actions column contains inline toggle and delete buttons, vertically centered.

#### System Metadata (`SystemMetadata.jsx`)
- **Structure**: Split into a 1/3 settings navigation panel and a 2/3 active settings content panel.
- **Input Forms**: Forms are dense. Labels are `text-[10px] uppercase tracking-wider font-semibold`. Inputs use `h-8 text-xs`.
- **Save Actions**: Positioned contextually near the form they govern.

## Interaction Principles

1. **Active States**: Every interactive element MUST have an `active:scale-[0.97]` applied. This provides immediate, physical feedback when the user presses down, making the app feel responsive before the network request even fires.
2. **Transitions**: We use `transition-all duration-150 ease-out` almost universally. This is slightly faster than the Tailwind default, making the UI feel "snappier".
3. **Empty States**: Never show a blank table. Always display a centered message (`text-xs text-text-secondary`) indicating "Loading..." or "No records found".
4. **Modals and Overlays**: Should blur the background (`backdrop-blur-md`) to maintain focus on the floating content while keeping spatial awareness.

This design document serves as the ground truth for any new page additions. All new features must adopt the dense typography, specific padding, and tactile interaction patterns defined here.
