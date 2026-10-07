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

export type ProductStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface Product {
  id: string;
  /** Default (first) variant — what inventory adjustments act on. */
  variantId: string | null;
  sku: string;
  slug: string;
  name: string;
  vendorId: string;
  vendor: { id: string; storeName: string; slug: string } | null;
  category: string;
  brandId: string | null;
  brandName: string | null;
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
  // Admin-only fields. Only PUBLISHED products are served to the app.
  status: ProductStatus;
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

export type OrderStatus =
  | 'PLACED'
  | 'PAYMENT_FAILED'
  | 'CONFIRMED'
  | 'PACKED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURNED';

export interface OrderSummary {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: 'ONLINE' | 'COD';
  /** Latest gateway attempt; null for COD. */
  paymentStatus: 'CREATED' | 'CAPTURED' | 'FAILED' | null;
  /** Vendor has accepted the order (required before packing). */
  accepted: boolean;
  amount: number;
  currency: string;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  variantId: string;
  productId: string;
  name: string;
  image: string | null;
  sku: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface OrderDetail extends OrderSummary {
  subtotal: number;
  discount: number;
  vendorAmount: number;
  platformAmount: number;
  acceptedAt: string | null;
  cancelledAt: string | null;
  cancelledBy: string | null;
  cancelReason: string | null;
  items: OrderItem[];
  address: {
    name: string;
    phone: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    pincode: string;
  } | null;
  /** Set on cancel responses: how the refund went (null when nothing to refund). */
  refundStatus?: string | null;
}

export interface AdminOrderSummary extends OrderSummary {
  customer: string;
  customerPhone: string | null;
  vendor: string;
}

export interface AdminOrderDetail extends OrderDetail {
  customer: { id: string; name: string; phone: string | null; email: string | null };
  vendor: { id: string; storeName: string };
  payments: {
    id: string;
    status: string;
    method: string | null;
    amount: number;
    providerOrderId: string;
    providerPaymentId: string | null;
    transferStatus: string | null;
    refunds: { id: string; status: string; amount: number; createdAt: string }[];
    createdAt: string;
  }[];
  shipment: {
    status: string;
    awbNumber: string | null;
    trackingEvents: { status: string; description: string | null; occurredAt: string }[];
  } | null;
}

export interface Paged<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}

export interface AdminPayment {
  id: string;
  orderId: string;
  orderNumber: string;
  orderStatus: OrderStatus;
  customer: string;
  vendor: string;
  amount: number;
  vendorAmount: number;
  platformAmount: number;
  status: 'CREATED' | 'CAPTURED' | 'FAILED';
  method: string | null;
  providerOrderId: string;
  providerPaymentId: string | null;
  transferId: string | null;
  transferStatus: string | null;
  refunded: number;
  needsAttention: boolean;
  createdAt: string;
}

export interface PaymentSummary {
  captured: { count: number; amount: number };
  failed: { count: number; amount: number };
  pending: { count: number; amount: number };
  refunded: number;
  transferFailed: number;
}

export interface Brand {
  id: string;
  slug: string;
  name: string;
  productCount: number;
}

export interface LedgerEntry {
  id: string;
  changeQty: number;
  reason: string;
  refType: string | null;
  refId: string | null;
  note: string | null;
  createdAt: string;
}

export const ADMIN_PERMISSIONS = ['catalog', 'inventory', 'orders', 'payments', 'vendors'] as const;
export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

export interface StaffUser {
  id: string;
  email: string | null;
  name: string | null;
  role: 'ADMIN' | 'SUB_ADMIN';
  permissions: AdminPermission[];
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
  role: 'ADMIN' | 'SUB_ADMIN' | 'VENDOR' | 'CUSTOMER';
  /** SUB_ADMIN only: the admin areas they may open. */
  permissions: AdminPermission[];
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
