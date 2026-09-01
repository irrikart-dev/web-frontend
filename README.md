# IrriKart Web

React 18 + Vite + TypeScript + Tailwind v4.

Phase 1 is the **admin dashboard**: sign in, browse the catalogue, add products
and edit SKUs, pricing, stock and visibility. Everything saved here is served
by the API to the IrriKart mobile app, so a product added in this dashboard
appears in the app on its next catalogue load.

## Run

```bash
npm install
npm run dev          # http://localhost:5173
```

The backend must be running first (`cd ../backend && npm run dev`). Point the
dashboard elsewhere with `VITE_API_BASE_URL` in `.env`.

## Sign in

`admin@irrikart.in` / `Admin@123` — the phase-1 dummy admin defined in the
backend's `.env`. The credentials are also printed on the login screen; delete
that block once real accounts exist.

## Tabs

| Tab | State |
|---|---|
| Dashboard | live — catalogue counters, per-category split, recent edits |
| **Product Catalog** | **live — full add / edit / price / stock / visibility / delete** |
| Categories, Inventory, Orders, Customers, Promotions, Reports, Settings | routed, each renders the "Development under progress" banner |

The nav marks unbuilt tabs with a `Soon` chip so the finished shape of the
dashboard is visible without shipping half-working screens.

## Catalogue rules the UI enforces

- Selling price may never exceed MRP (checked on the server too).
- Products carried over from the original IrriKart site are marked
  *Original catalogue* and **cannot be deleted** — the app links to them. Set
  them Hidden instead. Their pricing, SKU and stock stay fully editable.
- A blank SKU or slug on create is generated from the product name.

## Layout

```
src/
  components/   AdminLayout (sidebar shell), icons, nav config, WIP banner
  lib/          api client + token store, auth context, types, formatters
  pages/        Login, Dashboard, Products (table), ProductForm (add/edit)
```

Brand colours in `src/index.css` mirror
`irrikart-mobile-app/lib/core/theme/tokens/color_tokens.dart` — keep the two in
step.
