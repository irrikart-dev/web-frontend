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
  { to: '/categories', label: 'Categories', icon: IconLayers, wip: true, group: 'Catalogue' },
  { to: '/inventory', label: 'Inventory', icon: IconTag, wip: true, group: 'Catalogue' },
  { to: '/orders', label: 'Orders', icon: IconCart, wip: true, group: 'Commerce' },
  { to: '/customers', label: 'Customers', icon: IconUsers, wip: true, group: 'Commerce' },
  { to: '/promotions', label: 'Promotions', icon: IconMegaphone, wip: true, group: 'Commerce' },
  { to: '/reports', label: 'Reports', icon: IconChart, wip: true, group: 'Insights' },
  { to: '/settings', label: 'Settings', icon: IconCog, wip: true, group: 'Insights' },
];

export const NAV_GROUPS = ['Catalogue', 'Commerce', 'Insights'] as const;
