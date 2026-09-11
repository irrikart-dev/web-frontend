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
  price: number;
  rating: number;
  reviewCount: number;
  inStock: boolean;
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
  imageUrl: string | null;
  productCount: number;
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
  categories: number;
  inventoryValue: number;
  averagePrice: number;
  byCategory: { id: string; name: string; count: number }[];
  recentlyUpdated: Product[];
}
