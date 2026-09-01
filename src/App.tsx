import { Navigate, Route, Routes } from 'react-router-dom';

import { AdminLayout } from './components/AdminLayout';
import { UnderDevelopment } from './components/UnderDevelopment';
import { useAuth } from './lib/auth';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { ProductFormPage } from './pages/ProductFormPage';
import { ProductsPage } from './pages/ProductsPage';

/** Copy for the tabs that are routed but not built out in phase 1. */
const WIP = {
  categories: [
    'Categories',
    'Create and reorder catalogue categories, set their cover images and control which ones surface on the app home screen.',
  ],
  inventory: [
    'Inventory',
    'Stock levels per warehouse, low-stock alerts and bulk restocking. Stock quantity is editable today from the product form.',
  ],
  orders: [
    'Orders',
    'Incoming orders, payment status, packing slips and delivery tracking for every IrriKart shipment.',
  ],
  customers: [
    'Customers',
    'Farmer and dealer accounts, order history, addresses and support notes.',
  ],
  promotions: [
    'Promotions',
    'Coupon codes, seasonal campaigns and homepage banners for the app and storefront.',
  ],
  reports: [
    'Reports',
    'Revenue, best sellers, category performance and stock movement over time.',
  ],
  settings: [
    'Settings',
    'Store details, tax and shipping rules, payment gateways and admin user management.',
  ],
} as const;

export function App() {
  const { user, loading } = useAuth();

  // Hold the tree until the stored token has been checked, otherwise a
  // returning admin flashes the login screen on every refresh.
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <img src="/irrikart_logo_mark.png" alt="" className="h-10 w-10 animate-pulse" />
          <p className="text-sm text-ink-500">Loading IrriKart Admin...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/dashboard" replace />} />
      <Route element={<AdminLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/new" element={<ProductFormPage />} />
        <Route path="/products/:id" element={<ProductFormPage />} />
        {Object.entries(WIP).map(([path, [title, blurb]]) => (
          <Route
            key={path}
            path={`/${path}`}
            element={<UnderDevelopment title={title} blurb={blurb} />}
          />
        ))}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
