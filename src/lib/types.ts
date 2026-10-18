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
  deliveredAt: string | null;
  /** Last day the customer can ask for a return; null unless DELIVERED. */
  returnableUntil: string | null;
  refunds: { amount: number; status: string; reason: string | null; createdAt: string }[];
  returns: ReturnRequest[];
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

export interface Coupon {
  id: string;
  /** Stored upper-case; matched case-insensitively at checkout. */
  code: string;
  type: 'FLAT' | 'PERCENT';
  value: number;
  minCartValue: number | null;
  usageLimit: number | null;
  perUserLimit: number | null;
  expiresAt: string | null;
  active: boolean;
  createdAt: string;
  /** Live redemptions — a cancelled order gives its use back. */
  uses: number;
  uniqueCustomers: number;
  discountGiven: number;
  revenue: number;
}

export interface CustomerSummary {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  status: 'ACTIVE' | 'BLOCKED';
  createdAt: string;
  orderCount: number;
  /** Paid orders only. */
  totalSpent: number;
}

export interface CustomerDetail extends CustomerSummary {
  addresses: {
    id: string;
    name: string;
    phone: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    pincode: string;
    isDefault: boolean;
  }[];
  /** Last 20, newest first. */
  orders: { id: string; orderNumber: string; status: OrderStatus; totalAmount: number; createdAt: string; vendor: string }[];
}

export interface VendorPerformance {
  vendorId: string;
  /** Orders the vendor was responsible for: delivered + in flight + rejected + returned. */
  orders: number;
  delivered: number;
  inFlight: number;
  rejected: number;
  returned: number;
  gmv: number;
  /** Review-weighted average across the vendor's products; null with no reviews. */
  rating: number | null;
  reviewCount: number;
  /** 0–1 */
  rejectionRate: number;
  /** 0–1 */
  returnRate: number;
}

export type RfqStatus = 'NEW' | 'CONTACTED' | 'CLOSED';

/** A bulk-quote lead from the app. Staff follow up outside the dashboard. */
export interface RfqRequest {
  id: string;
  status: RfqStatus;
  quantity: number;
  requirements: string | null;
  /** Per unit, whole rupees. */
  targetPrice: number | null;
  /** Staff-only. */
  adminNote: string | null;
  createdAt: string;
  /** Null for a general request, or when the product was since deleted. */
  product: { id: string; title: string; slug: string } | null;
  customer: { name: string | null; phone: string | null; email: string | null };
}

export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

/** A product review in the moderation queue. Only APPROVED ones show in the app. */
export interface AdminReview {
  id: string;
  rating: number;
  comment: string | null;
  status: ReviewStatus;
  createdAt: string;
  product: { id: string; title: string; slug: string };
  customer: { name: string | null; phone: string | null; email: string | null };
}

/** Home-screen hero banner in the app. Lower `position` shows first. */
export interface Banner {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  link: string | null;
  imageUrl: string | null;
  position: number;
  active: boolean;
}

export type ReturnStatus = 'REQUESTED' | 'APPROVED' | 'COMPLETED' | 'REJECTED';

export interface ReturnRequest {
  id: string;
  type: 'RETURN' | 'REPLACE';
  status: ReturnStatus;
  reason: string;
  details: string | null;
  photoUrls: string[];
  /** Shown to the customer with the decision. */
  adminNote: string | null;
  refundAmount: number | null;
  /** Gateway refund outcome; `manual` for COD (pay back outside the gateway). */
  refundStatus: string | null;
  restocked: boolean;
  createdAt: string;
  resolvedAt: string | null;
  items: { orderItemId: string; quantity: number; name: string; sku: string; image: string | null }[];
}

export interface AdminReturnRequest extends ReturnRequest {
  order: {
    id: string;
    orderNumber: string;
    status: OrderStatus;
    paymentMethod: 'ONLINE' | 'COD';
    totalAmount: number;
    deliveredAt: string | null;
  };
  customer: { name: string | null; phone: string | null; email: string | null };
  /** Detail only: the returned lines' pro-rata share of what was paid. */
  suggestedRefund?: number;
}

export interface AdminRefund {
  id: string;
  razorpayRefundId: string;
  providerPaymentId: string | null;
  orderId: string;
  orderNumber: string;
  customer: string | null;
  amount: number;
  status: 'pending' | 'processed' | 'failed';
  reason: string | null;
  createdAt: string;
}

interface IssueOrder {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: 'ONLINE' | 'COD';
  totalAmount: number;
}

export interface ShippingIssues {
  /** Parcels the courier reported as RTO (coming back) or failed. */
  shipments: {
    id: string;
    status: 'RTO' | 'FAILED';
    awbNumber: string | null;
    lastEvent: { status: string; description: string | null; occurredAt: string } | null;
    order: IssueOrder;
    createdAt: string;
  }[];
  /** Paid orders whose Shiprocket booking failed — retry them. */
  unbooked: (IssueOrder & { createdAt: string })[];
}

/** An admin broadcast to every active customer. */
export interface NotificationCampaign {
  id: string;
  title: string;
  body: string;
  link: string | null;
  recipients: number;
  pushSent: number;
  pushFailed: number;
  createdAt: string;
}
