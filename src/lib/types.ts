export interface Spec {
  label: string;
  value: string;
}

export interface ProductVariant {
  id: string;
  sku: string;
  size: string | null;
  color: string | null;
  unit: string;
  price: number;
  stockQty: number;
  available: number;
}

export interface GalleryImage {
  id: string;
  url: string;
  position: number;
}

export interface Product {
  id: string;
  sku: string;
  slug: string;
  name: string;
  vendorId: string;
  vendor: { id: string; storeName: string; slug: string } | null;
  category: string;
  image: string | null;
  imageUrl: string | null;
  displayImageUrl: string | null;
  images: string[];
  galleryImages: GalleryImage[];
  videoUrl: string | null;
  variants: ProductVariant[];
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

export interface Vendor {
  id: string;
  storeName: string;
  slug: string;
  status: 'ACTIVE' | 'SUSPENDED';
  commissionPercent: number;
  legalBusinessName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  /** Created directly with Razorpay, outside this app — see backend vendors.service.js. */
  razorpayAccountId: string | null;
  /** Raw Razorpay activation_status (e.g. "activated", "under_review"), or null if unset. */
  routeStatus: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderSummary {
  id: string;
  orderNumber: string;
  status: string;
  amount: number;
  currency: string;
  createdAt: string;
}

export interface Payout {
  orderNumber: string;
  amount: number;
  status: string;
  transferId: string | null;
  transferStatus: string | null;
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
