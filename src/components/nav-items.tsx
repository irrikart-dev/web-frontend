import type { ComponentType, SVGProps } from 'react';

import type { AdminPermission } from '../lib/types';
import {
  IconBox,
  IconCard,
  IconCart,
  IconChart,
  IconCog,
  IconDashboard,
  IconLayers,
  IconMegaphone,
  IconShield,
  IconStar,
  IconTag,
  IconUsers,
} from './icons';

export interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  /** Only built-out tabs are `false`. */
  wip: boolean;
  group: 'Catalogue' | 'Commerce' | 'Insights';
  /** Area a SUB_ADMIN needs to see this tab; `adminOnly` = full ADMIN only. Unset = everyone. */
  permission?: AdminPermission | 'adminOnly';
}

/**
 * Every tab is routed and reachable; the ones still marked `wip` render the
 * "under development" banner, so the shape of the finished dashboard is visible
 * without shipping half-working screens.
 */
export const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: IconDashboard, wip: false, group: 'Catalogue' },
  { to: '/products', label: 'Product Catalog', icon: IconBox, wip: false, group: 'Catalogue', permission: 'catalog' },
  { to: '/categories', label: 'Categories', icon: IconLayers, wip: false, group: 'Catalogue', permission: 'catalog' },
  { to: '/brands', label: 'Brands', icon: IconStar, wip: false, group: 'Catalogue', permission: 'catalog' },
  { to: '/inventory', label: 'Inventory', icon: IconTag, wip: false, group: 'Catalogue', permission: 'inventory' },
  { to: '/vendors', label: 'Vendors', icon: IconUsers, wip: false, group: 'Commerce', permission: 'vendors' },
  { to: '/orders', label: 'Orders', icon: IconCart, wip: false, group: 'Commerce', permission: 'orders' },
  { to: '/payments', label: 'Payments', icon: IconCard, wip: false, group: 'Commerce', permission: 'payments' },
  { to: '/customers', label: 'Customers', icon: IconUsers, wip: true, group: 'Commerce', permission: 'adminOnly' },
  { to: '/promotions', label: 'Promotions', icon: IconMegaphone, wip: true, group: 'Commerce', permission: 'adminOnly' },
  { to: '/reports', label: 'Reports', icon: IconChart, wip: true, group: 'Insights', permission: 'adminOnly' },
  { to: '/staff', label: 'Staff & Roles', icon: IconShield, wip: false, group: 'Insights', permission: 'adminOnly' },
  { to: '/settings', label: 'Settings', icon: IconCog, wip: true, group: 'Insights', permission: 'adminOnly' },
];

/** What a VENDOR-role user sees instead of NAV_ITEMS — a vendor only ever manages
 * their own store, never the platform-wide admin screens. */
export const VENDOR_NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: IconDashboard, wip: false, group: 'Catalogue' },
  { to: '/products', label: 'My Products', icon: IconBox, wip: false, group: 'Catalogue' },
  { to: '/orders', label: 'My Orders', icon: IconCart, wip: false, group: 'Commerce' },
  { to: '/payouts', label: 'Payouts', icon: IconChart, wip: false, group: 'Commerce' },
];

export const NAV_GROUPS = ['Catalogue', 'Commerce', 'Insights'] as const;
