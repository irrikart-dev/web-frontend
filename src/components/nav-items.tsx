import type { ComponentType, SVGProps } from 'react';

import {
  IconBox,
  IconCart,
  IconChart,
  IconCog,
  IconDashboard,
  IconLayers,
  IconMegaphone,
  IconTag,
  IconUsers,
} from './icons';

export interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  /** Phase-1 scope: only built-out tabs are `false`. */
  wip: boolean;
  group: 'Catalogue' | 'Commerce' | 'Insights';
}

/**
 * Phase 1 builds out the catalogue. Every other tab is routed and reachable
 * but renders the "under development" banner, so the shape of the finished
 * dashboard is visible without shipping half-working screens.
 */
export const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: IconDashboard, wip: false, group: 'Catalogue' },
  { to: '/products', label: 'Product Catalog', icon: IconBox, wip: false, group: 'Catalogue' },
  { to: '/categories', label: 'Categories', icon: IconLayers, wip: false, group: 'Catalogue' },
  { to: '/inventory', label: 'Inventory', icon: IconTag, wip: false, group: 'Catalogue' },
  { to: '/vendors', label: 'Vendors', icon: IconUsers, wip: false, group: 'Commerce' },
  { to: '/orders', label: 'Orders', icon: IconCart, wip: true, group: 'Commerce' },
  { to: '/customers', label: 'Customers', icon: IconUsers, wip: true, group: 'Commerce' },
  { to: '/promotions', label: 'Promotions', icon: IconMegaphone, wip: true, group: 'Commerce' },
  { to: '/reports', label: 'Reports', icon: IconChart, wip: true, group: 'Insights' },
  { to: '/settings', label: 'Settings', icon: IconCog, wip: true, group: 'Insights' },
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
