export interface Spec {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  sku: string;
  slug: string;
  name: string;
  category: string;
  image: string | null;
  imageUrl: string | null;
  displayImageUrl: string | null;
  tagline: string;
  description: string;
  features: string[];
  specs: Spec[];
  unit: string;
  mrp: number;
  price: number;
  discountPercent: number;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  featured: boolean;
  /** `seed` came from the original IrriKart site; `admin` was added here. */
  source: 'seed' | 'admin';
  updatedAt: string;
  // Admin-only fields.
  active: boolean;
  stockQty: number;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  blurb: string;
  image: string | null;
  imageUrl: string | null;
  sortOrder: number;
  source: 'seed' | 'admin';
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface Stats {
  totalProducts: number;
  activeProducts: number;
  adminProducts: number;
  seedProducts: number;
  outOfStock: number;
  featured: number;
  categories: number;
  inventoryValue: number;
  averagePrice: number;
  byCategory: { id: string; name: string; count: number }[];
  recentlyUpdated: Product[];
}
