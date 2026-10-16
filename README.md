# IrriKart Web

Admin and vendor dashboard for IrriKart, plus the public legal pages (`/privacy`, `/terms`, `/refund-policy`, `/about`, `/delete-account`) linked from the app and Play Store listing.

React 18 · Vite · TypeScript · Tailwind v4 · Firebase Auth.

Full docs: [`../docs/apps/web-admin.md`](../docs/apps/web-admin.md) (pages, routes, the endpoints each one calls).

## Run

```bash
npm install
cp .env.example .env   # VITE_API_BASE_URL + Firebase web app config
npm run dev            # http://localhost:5173
```

The backend must be running (`cd ../backend && npm run dev`, default `http://localhost:4000/api/v1`). Set `VITE_API_BASE_URL` to match.

`npm run lint` type-checks; `npm run build` outputs `dist/`.

## Sign in

Firebase email/password. The account must be staff or a vendor in the backend:

- **ADMIN**: everything, including Staff, Customers and Promotions. Made with `npm run promote-admin` on the backend.
- **SUB_ADMIN**: only the areas ticked on the Staff page (catalogue, inventory, orders, payments, vendors).
- **VENDOR**: their own products, orders, payouts and performance. Added from the Vendors page.

Anyone else is turned away at login.

## Layout

```
src/
  components/   AdminLayout (sidebar shell), nav config, Modal, form helpers, order widgets
  lib/          api client, auth context + canAccess, types, formatters, cached lookups
  pages/        one file per tab; pages/legal/ for the public pages
```

Reports and Settings are still placeholders that render the "under development" banner.
